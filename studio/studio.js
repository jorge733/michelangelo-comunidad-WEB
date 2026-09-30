document.addEventListener("DOMContentLoaded", async () => {

  /* =====================================================
     FIREBASE
  ====================================================== */

  const firebaseConfig = {
    apiKey: "AIzaSyDWSpVS8It00pQXE7I541w-ywTu6mvphIM",
    authDomain: "michelangelo-comunidad.firebaseapp.com",
    projectId: "michelangelo-comunidad",
    storageBucket: "michelangelo-comunidad.firebasestorage.app",
    messagingSenderId: "1078337415782",
    appId: "1:1078337415782:web:0d83ded2c0d35157415ba7"
  };

  let auth;
  let db;
  let storage;
  let fb;

  try {
    const [appModule, authModule, firestoreModule, storageModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js")
    ]);

    const firebaseApp = appModule.initializeApp(firebaseConfig);

    auth = authModule.getAuth(firebaseApp);
    db = firestoreModule.getFirestore(firebaseApp);
    storage = storageModule.getStorage(firebaseApp);

    fb = {
      signInWithEmailAndPassword: authModule.signInWithEmailAndPassword,
      onAuthStateChanged: authModule.onAuthStateChanged,
      signOut: authModule.signOut,
      collection: firestoreModule.collection,
      addDoc: firestoreModule.addDoc,
      onSnapshot: firestoreModule.onSnapshot,
      query: firestoreModule.query,
      where: firestoreModule.where,
      doc: firestoreModule.doc,
      updateDoc: firestoreModule.updateDoc,
      setDoc: firestoreModule.setDoc,
      deleteDoc: firestoreModule.deleteDoc,
      serverTimestamp: firestoreModule.serverTimestamp,
      storageRef: storageModule.ref,
      getDownloadURL: storageModule.getDownloadURL,
      uploadBytesResumable: storageModule.uploadBytesResumable
    };

  } catch (error) {
    console.error("No fue posible cargar Firebase:", error);

    const loginErrorElement = document.getElementById("loginError");

    if (loginErrorElement) {
      loginErrorElement.textContent =
        "No fue posible conectar Michelangelo Studio con Firebase. Revisa tu conexión a internet e inténtalo nuevamente.";
      loginErrorElement.classList.add("active");
    }

    return;
  }


  /* =====================================================
     DATOS
  ====================================================== */

  let submissions = [];
  let visibleSubmissions = [];
  let publishedCreations = new Set();

  let currentFilter = "todos";
  let currentStatus = "todos";
  let currentSubmissionId = null;
  let renderedModalId = null;
  let noteDirty = false;
  let lastFocusedElement = null;

  let unsubscribeSubmissions = null;
  let unsubscribePublications = null;
  let unsubscribeCalendar = null;
  let unsubscribeTeam = null;
  let unsubscribeRole = null;

  let currentRole = null;
  let currentView = "inbox";
  let teamMembers = [];


  /* =====================================================
     CONFIG
  ====================================================== */

  const typeInfo = {
    periodico: { label: "PERIÓDICO", icon: "✎", title: "Aportes para el periódico" },
    creacion: { label: "CREACIÓN", icon: "◇", title: "Creaciones" },
    podcast: { label: "PODCAST", icon: "◉", title: "Propuestas para el podcast" },
    idea: { label: "IDEA", icon: "✦", title: "Ideas para la comunidad" }
  };

  const statusInfo = {
    pendiente: { label: "PENDIENTE", plural: "Pendientes" },
    revision: { label: "EN REVISIÓN", plural: "En revisión" },
    aprobado: { label: "APROBADO", plural: "Aprobados" },
    rechazado: { label: "RECHAZADO", plural: "Rechazados" }
  };

  // Vistas de Studio que ve cada rol. Deben coincidir con firestore.rules
  // y storage.rules, que son las que realmente protegen los datos.
  const roleInfo = {
    admin: {
      label: "Administración",
      help: "Todo Studio, y además administra el equipo y sus roles.",
      views: ["inbox", "video", "centro", "calendario", "equipo"]
    },
    editorial: {
      label: "Equipo editorial",
      help: "Revisa los aportes de Participa y publica en Creaciones.",
      views: ["inbox"]
    },
    centro: {
      label: "Centro de Estudiantes",
      help: "Publica comunicados y administra el calendario de actividades.",
      views: ["centro", "calendario"]
    },
    audiovisual: {
      label: "Audiovisual",
      help: "Publica videos en Vida Michelangelo.",
      views: ["video"]
    }
  };

  // Etiquetas legibles para los campos de "detalles". Incluye los nombres
  // antiguos para que los aportes previos se sigan mostrando bien.
  const detailLabels = {
    coautores: "Participan también",
    tipoContenido: "Tipo de contenido",
    articleType: "Tipo de contenido",
    seccion: "Ámbito",
    etapa: "Etapa",
    articleStatus: "Etapa",
    fuentes: "Fuentes o entrevistas",
    apoyo: "Pide apoyo en",
    tipoCreacion: "Tipo de creación",
    creationType: "Tipo de creación",
    tecnica: "Técnica o materiales",
    contexto: "Dónde nació",
    enlace: "Enlace",
    autoria: "Confirma autoría",
    permisoPersonas: "Permiso de quienes aparecen",
    formato: "Formato",
    participacion: "Participación",
    preguntas: "Preguntas propuestas",
    invitados: "Invitados sugeridos",
    categoriaIdea: "Tipo de idea",
    porQueInteresante: "Por qué sería interesante",
    ideaReason: "Por qué sería interesante",
    recursos: "Qué se necesitaría",
    quiereAyudar: "Quiere ayudar a realizarla"
  };

  const hiddenDetails = ["borrador", "archivo", "archivos"];


  /* =====================================================
     DOM
  ====================================================== */

  const $ = id => document.getElementById(id);

  const loginScreen = $("loginScreen");
  const studioShell = $("studioShell");
  const loginForm = $("loginForm");
  const loginEmail = $("loginEmail");
  const loginPassword = $("loginPassword");
  const togglePassword = $("togglePassword");
  const loginError = $("loginError");
  const loginButton = $("loginButton");
  const logoutButton = $("logoutButton");
  const sidebarUser = $("sidebarUser");
  const sidebarRole = $("sidebarRole");
  const navGroupLabels = document.querySelectorAll("[data-nav-group]");
  const editorAvatar = $("editorAvatar");

  const inboxView = $("inboxView");
  const videoView = $("videoView");
  const studioLoading = $("studioLoading");
  const submissionList = $("submissionList");
  const emptyState = $("emptyState");
  const clearFiltersButton = $("clearFilters");
  const searchInput = $("searchInput");
  const statusFilter = $("statusFilter");
  const sortOrder = $("sortOrder");
  const exportButton = $("exportButton");
  const filters = document.querySelectorAll(".filter");
  const navItems = document.querySelectorAll(".nav-item");
  const statCards = document.querySelectorAll(".stat-card");
  const pendingBadges = document.querySelectorAll("[data-pending-count]");
  const listTitle = $("listTitle");
  const visibleCount = $("visibleCount");
  const totalCount = $("totalCount");
  const pendingCount = $("pendingCount");
  const reviewCount = $("reviewCount");
  const approvedCount = $("approvedCount");
  const sidebar = $("sidebar");
  const mobileMenu = $("mobileMenu");

  const modalOverlay = $("modalOverlay");
  const modal = modalOverlay.querySelector(".modal");
  const modalClose = $("modalClose");
  const modalPrev = $("modalPrev");
  const modalNext = $("modalNext");
  const modalPosition = $("modalPosition");
  const modalType = $("modalType");
  const modalStatus = $("modalStatus");
  const modalAnonymousFlag = $("modalAnonymousFlag");
  const modalTitle = $("modalTitle");
  const modalAuthor = $("modalAuthor");
  const modalDate = $("modalDate");
  const modalPrivacy = $("modalPrivacy");
  const modalContact = $("modalContact");
  const modalDescription = $("modalDescription");
  const modalExtra = $("modalExtra");
  const modalExtraBlock = $("modalExtraBlock");
  const modalDraftBlock = $("modalDraftBlock");
  const modalDraft = $("modalDraft");
  const copyDraft = $("copyDraft");
  const modalAttachmentBlock = $("modalAttachmentBlock");
  const modalAttachments = $("modalAttachments");
  const statusButtons = document.querySelectorAll(".status-actions button");
  const statusHelp = $("statusHelp");
  const publishCreationButton = $("publishCreationButton");
  const editorialNote = $("editorialNote");
  const noteHelp = $("noteHelp");
  const saveNoteButton = $("saveNoteButton");

  const videoPublishForm = $("videoPublishForm");
  const videoTitle = $("videoTitle");
  const videoDescription = $("videoDescription");
  const videoFile = $("videoFile");
  const videoFileInfo = $("videoFileInfo");
  const videoProgress = $("videoProgress");
  const videoProgressBar = $("videoProgressBar");
  const videoProgressText = $("videoProgressText");
  const videoPublishButton = $("videoPublishButton");
  const videoPublishMessage = $("videoPublishMessage");

  const centerView = $("centerView");
  const centerPublishForm = $("centerPublishForm");
  const centerTitle = $("centerTitle");
  const centerText = $("centerText");
  const centerSignature = $("centerSignature");
  const centerPublishButton = $("centerPublishButton");
  const centerPublishMessage = $("centerPublishMessage");

  const calendarView = $("calendarView");
  const calendarPublishForm = $("calendarPublishForm");
  const calendarTitle = $("calendarTitle");
  const calendarDate = $("calendarDate");
  const calendarTime = $("calendarTime");
  const calendarPlace = $("calendarPlace");
  const calendarDescription = $("calendarDescription");
  const calendarPublishButton = $("calendarPublishButton");
  const calendarPublishMessage = $("calendarPublishMessage");
  const calendarManagerList = $("calendarManagerList");

  const teamView = $("teamView");
  const teamAddForm = $("teamAddForm");
  const teamUid = $("teamUid");
  const teamEmail = $("teamEmail");
  const teamRole = $("teamRole");
  const teamAddButton = $("teamAddButton");
  const teamAddMessage = $("teamAddMessage");
  const teamList = $("teamList");
  const teamRolesHelp = $("teamRolesHelp");


  /* =====================================================
     UTILIDADES
  ====================================================== */

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toMillis(timestamp) {
    if (!timestamp) return 0;
    if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
    if (timestamp.seconds) return timestamp.seconds * 1000;
    return 0;
  }

  function formatDate(ms, withTime = false) {
    if (!ms) return "Fecha no disponible";

    return new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
    }).format(new Date(ms));
  }

  function formatRelative(ms) {
    if (!ms) return "Sin fecha";

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const days = Math.floor((startOfToday.getTime() - ms) / 86400000) + 1;

    if (ms >= startOfToday.getTime()) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} días`;

    return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(ms));
  }

  function formatSize(bytes) {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function isSafeUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (error) {
      return false;
    }
  }

  function formatDetailValue(value) {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "boolean") return value ? "Sí" : "No";
    return String(value ?? "");
  }

  function getAttachments(data) {
    const details = data.detalles || {};

    if (Array.isArray(details.archivos) && details.archivos.length) {
      return details.archivos.filter(file => file?.ruta);
    }

    return details.archivo?.ruta ? [details.archivo] : [];
  }

  function getDetailRows(data) {
    const details = data.detalles || {};
    const rows = Object.entries(details)
      .filter(([key, value]) => !hiddenDetails.includes(key) && value !== "" && value !== null)
      .map(([key, value]) => ({ key, label: detailLabels[key] || key, value }));

    // Aportes anteriores al formulario actual solo guardaban la casilla.
    if ((data.tipo === "podcast" && !details.participacion) || (data.tipo === "idea" && details.quiereAyudar === undefined)) {
      rows.push({
        key: "quiereParticipar",
        label: "Quiere participar",
        value: Boolean(data.quiereParticipar)
      });
    }

    return rows;
  }

  function firestoreToSubmission(firestoreDoc) {
    const data = firestoreDoc.data();
    const createdMs = toMillis(data.creadoEn);

    return {
      id: firestoreDoc.id,
      raw: data,
      type: typeInfo[data.tipo] ? data.tipo : "idea",
      title: data.titulo || "Sin título",
      realName: data.nombre || "Sin nombre",
      course: data.curso || "Curso no indicado",
      contact: data.contacto || "",
      description: data.descripcion || "",
      draft: data.detalles?.borrador || "",
      details: getDetailRows(data),
      attachments: getAttachments(data),
      anonymous: Boolean(data.anonimoPublicamente),
      status: statusInfo[data.estado] ? data.estado : "pendiente",
      note: data.notaEditorial || "",
      updatedBy: data.actualizadoPor || "",
      updatedMs: toMillis(data.actualizadoEn),
      createdMs
    };
  }


  /* =====================================================
     AUTENTICACIÓN
  ====================================================== */

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.add("active");
  }

  function clearLoginError() {
    loginError.textContent = "";
    loginError.classList.remove("active");
  }

  function getFirebaseAuthMessage(error) {
    switch (error?.code || "") {
      case "auth/invalid-email":
        return "El correo electrónico no es válido.";
      case "auth/invalid-credential":
        return "El correo o la contraseña no son correctos.";
      case "auth/user-disabled":
        return "Esta cuenta se encuentra deshabilitada.";
      case "auth/too-many-requests":
        return "Se realizaron demasiados intentos. Espera un momento antes de volver a intentarlo.";
      case "auth/network-request-failed":
        return "No fue posible conectarse con Firebase. Revisa tu conexión a internet.";
      default:
        return "No fue posible iniciar sesión. Revisa tus datos e inténtalo nuevamente.";
    }
  }

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearLoginError();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showLoginError("Ingresa tu correo electrónico y contraseña.");
      return;
    }

    loginButton.disabled = true;
    loginButton.innerHTML = `Ingresando... <span>→</span>`;

    try {
      await fb.signInWithEmailAndPassword(auth, email, password);
      loginPassword.value = "";
      setPasswordVisible(false);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      showLoginError(getFirebaseAuthMessage(error));
    } finally {
      loginButton.disabled = false;
      loginButton.innerHTML = `Entrar a Studio <span>→</span>`;
    }
  });

  function setPasswordVisible(visible) {
    loginPassword.type = visible ? "text" : "password";
    togglePassword.textContent = visible ? "Ocultar" : "Mostrar";
    togglePassword.setAttribute("aria-pressed", visible ? "true" : "false");
    togglePassword.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
  }

  togglePassword.addEventListener("click", () => {
    setPasswordVisible(loginPassword.type === "password");
    loginPassword.focus();
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await fb.signOut(auth);
    } catch (error) {
      console.error("No fue posible cerrar sesión:", error);
    }
  });

  fb.onAuthStateChanged(auth, user => {
    // Las sesiones anónimas del formulario público no dan acceso a Studio.
    if (user && !user.isAnonymous) {
      subscribeToOwnRole(user);
    } else {
      showLogin();
      stopListeners();
    }
  });

  function denyAccess(message) {
    showLoginError(message);
    fb.signOut(auth).catch(error => console.error("No fue posible cerrar sesión:", error));
  }

  // Escucha el documento de la propia cuenta en /editores, así un cambio de
  // rol hecho por Administración se aplica sin volver a iniciar sesión.
  function subscribeToOwnRole(user) {
    stopListener("role");

    unsubscribeRole = fb.onSnapshot(
      fb.doc(db, "editores", user.uid),
      snapshot => {
        if (!snapshot.exists()) {
          denyAccess("Tu cuenta no tiene acceso a Studio. Pide a Administración que te lo dé.");
          return;
        }

        const data = snapshot.data();
        // Igual que las reglas: sin campo «rol» la cuenta es Administración.
        const role = data.rol === undefined ? "admin" : data.rol;

        if (!roleInfo[role]) {
          denyAccess("Tu cuenta no tiene un rol válido en Studio. Pide a Administración que lo revise.");
          return;
        }

        if (user.email && data.correo !== user.email) {
          fb.updateDoc(snapshot.ref, { correo: user.email })
            .catch(error => console.error("No fue posible registrar el correo:", error));
        }

        applyRole(role, user);
      },
      error => {
        console.error("Error leyendo el rol:", error);
        denyAccess("No fue posible comprobar tu acceso a Studio. Inténtalo nuevamente.");
      }
    );
  }

  function can(view) {
    return Boolean(currentRole && roleInfo[currentRole].views.includes(view));
  }

  function applyRole(role, user) {
    if (role === currentRole) return;

    currentRole = role;
    showStudio(user);

    navItems.forEach(button => {
      button.hidden = !can(button.dataset.view || "inbox");
    });

    navGroupLabels.forEach(label => {
      const group = label.dataset.navGroup;
      label.hidden = group === "bandeja" ? !can("inbox")
        : group === "publicar" ? !["video", "centro", "calendario"].some(can)
        : !can("equipo");
    });

    if (can("inbox")) {
      subscribeToSubmissions();
      subscribeToPublications();
    } else {
      stopListener("submissions");
      stopListener("publications");
      submissions = [];

      if (modalOverlay.classList.contains("active")) {
        noteDirty = false;
        closeModal();
      }
    }

    if (can("calendario")) subscribeToCalendar();
    else stopListener("calendar");

    if (can("equipo")) subscribeToTeam();
    else stopListener("team");

    showView(can(currentView) ? currentView : roleInfo[role].views[0]);
  }

  function showStudio(user) {
    loginScreen.hidden = true;
    studioShell.hidden = false;

    const email = user.email || "Usuario autorizado";

    sidebarUser.textContent = email;
    sidebarRole.textContent = roleInfo[currentRole]?.label || "";
    editorAvatar.textContent = email.charAt(0).toUpperCase() || "M";
    editorAvatar.title = `${email} · ${roleInfo[currentRole]?.label || ""}`;

    clearLoginError();
  }

  function showLogin() {
    studioShell.hidden = true;
    loginScreen.hidden = false;

    currentRole = null;
    currentView = "inbox";
    submissions = [];
    teamMembers = [];
    publishedCreations = new Set();

    if (modalOverlay.classList.contains("active")) {
      noteDirty = false;
      closeModal();
    }

    updateStats();
    renderSubmissions();
  }


  /* =====================================================
     FIRESTORE
  ====================================================== */

  function subscribeToSubmissions() {
    stopListener("submissions");

    studioLoading.hidden = false;
    submissionList.innerHTML = "";
    emptyState.classList.remove("active");

    unsubscribeSubmissions = fb.onSnapshot(
      fb.collection(db, "aportes"),
      snapshot => {
        submissions = snapshot.docs.map(firestoreToSubmission);
        studioLoading.hidden = true;

        updateStats();
        renderSubmissions();

        if (currentSubmissionId) {
          const current = submissions.find(item => item.id === currentSubmissionId);
          if (current) populateModal(current);
        }
      },
      error => {
        console.error("Error leyendo aportes:", error);
        studioLoading.hidden = true;
        submissionList.innerHTML = `
          <div class="list-error">
            No fue posible cargar los aportes. Revisa la conexión con Firebase
            y que tu cuenta esté autorizada como editora.
          </div>`;
      }
    );
  }

  // Las publicaciones son públicas; las escuchamos para saber qué
  // creaciones ya están en la sección Creaciones.
  function subscribeToPublications() {
    stopListener("publications");

    unsubscribePublications = fb.onSnapshot(
      fb.query(fb.collection(db, "publicaciones"), fb.where("seccion", "==", "creaciones")),
      snapshot => {
        publishedCreations = new Set(snapshot.docs.map(item => item.data().aporteId).filter(Boolean));
        renderSubmissions();

        const current = submissions.find(item => item.id === currentSubmissionId);
        if (current) updatePublishButton(current);
      },
      error => console.error("Error leyendo publicaciones:", error)
    );
  }

  function stopListener(name) {
    if (name === "submissions" && typeof unsubscribeSubmissions === "function") {
      unsubscribeSubmissions();
      unsubscribeSubmissions = null;
    }

    if (name === "publications" && typeof unsubscribePublications === "function") {
      unsubscribePublications();
      unsubscribePublications = null;
    }

    if (name === "calendar" && typeof unsubscribeCalendar === "function") {
      unsubscribeCalendar();
      unsubscribeCalendar = null;
    }

    if (name === "team" && typeof unsubscribeTeam === "function") {
      unsubscribeTeam();
      unsubscribeTeam = null;
    }

    if (name === "role" && typeof unsubscribeRole === "function") {
      unsubscribeRole();
      unsubscribeRole = null;
    }
  }

  function stopListeners() {
    stopListener("submissions");
    stopListener("publications");
    stopListener("calendar");
    stopListener("team");
    stopListener("role");
  }

  function editorStamp() {
    return {
      actualizadoEn: fb.serverTimestamp(),
      actualizadoPor: auth.currentUser?.email || ""
    };
  }


  /* =====================================================
     FILTRADO
  ====================================================== */

  function getFilteredSubmissions() {
    const search = searchInput.value.trim().toLowerCase();

    const results = submissions.filter(item => {
      if (currentFilter !== "todos" && item.type !== currentFilter) return false;
      if (currentStatus !== "todos" && item.status !== currentStatus) return false;
      if (!search) return true;

      return [
        item.title,
        item.realName,
        item.course,
        item.contact,
        item.description,
        item.draft,
        item.note,
        typeInfo[item.type].label,
        ...item.details.map(detail => formatDetailValue(detail.value))
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

    const direction = sortOrder.value === "antiguos" ? 1 : -1;

    return results.sort((a, b) => direction * (a.createdMs - b.createdMs));
  }


  /* =====================================================
     CONTADORES
  ====================================================== */

  function updateStats() {
    const countStatus = status => submissions.filter(item => item.status === status).length;

    totalCount.textContent = submissions.length;
    pendingCount.textContent = countStatus("pendiente");
    reviewCount.textContent = countStatus("revision");
    approvedCount.textContent = countStatus("aprobado");

    pendingBadges.forEach(badge => {
      const type = badge.dataset.pendingCount;
      const count = submissions.filter(item =>
        item.status === "pendiente" && (type === "todos" || item.type === type)
      ).length;

      badge.textContent = count || "";
      badge.title = count ? `${count} pendientes` : "";
    });
  }


  /* =====================================================
     RENDER
  ====================================================== */

  function renderSubmissions() {
    visibleSubmissions = getFilteredSubmissions();
    submissionList.innerHTML = "";

    visibleCount.textContent =
      `${visibleSubmissions.length} ${visibleSubmissions.length === 1 ? "resultado" : "resultados"}`;

    const hasFilters = currentFilter !== "todos" || currentStatus !== "todos" || searchInput.value.trim();
    clearFiltersButton.hidden = !hasFilters;

    if (visibleSubmissions.length === 0) {
      emptyState.classList.toggle("active", studioLoading.hidden);
      return;
    }

    emptyState.classList.remove("active");

    const fragment = document.createDocumentFragment();

    visibleSubmissions.forEach(item => {
      const type = typeInfo[item.type];
      const article = document.createElement("article");
      const chips = [];

      if (item.attachments.length) {
        chips.push(`${item.attachments.length} ${item.attachments.length === 1 ? "foto" : "fotos"}`);
      }
      if (item.draft) chips.push("Incluye texto");
      if (item.contact) chips.push("Con correo");
      if (item.note) chips.push("Con nota");
      if (publishedCreations.has(item.id)) chips.push("Publicada");

      article.className = `submission-card${item.status === "pendiente" ? " is-pending" : ""}`;
      article.dataset.id = item.id;
      article.tabIndex = 0;
      article.setAttribute("role", "button");
      article.setAttribute("aria-label", `Abrir aporte: ${item.title}`);

      article.innerHTML = `
        <div class="submission-type">
          <span class="type-badge type-${item.type}">${type.icon} ${type.label}</span>
          <small title="${escapeHTML(formatDate(item.createdMs, true))}">${escapeHTML(formatRelative(item.createdMs))}</small>
        </div>

        <div class="submission-content">
          <h4>${escapeHTML(item.title)}</h4>
          <p>
            ${escapeHTML(item.realName)} · ${escapeHTML(item.course)}
            ${item.anonymous ? '<span class="anon-mark">· pide anonimato</span>' : ""}
          </p>
          ${item.description ? `<p class="submission-excerpt">${escapeHTML(item.description.slice(0, 180))}${item.description.length > 180 ? "…" : ""}</p>` : ""}
          ${chips.length ? `<div class="submission-chips">${chips.map(chip => `<span>${escapeHTML(chip)}</span>`).join("")}</div>` : ""}
        </div>

        <div class="submission-status">
          <span class="status-badge status-${item.status}">${statusInfo[item.status].label}</span>
        </div>

        <div class="open-arrow" aria-hidden="true">→</div>
      `;

      fragment.append(article);
    });

    submissionList.append(fragment);
  }

  submissionList.addEventListener("click", event => {
    const card = event.target.closest(".submission-card");
    if (card) openSubmission(card.dataset.id);
  });

  submissionList.addEventListener("keydown", event => {
    const card = event.target.closest(".submission-card");

    if (card && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openSubmission(card.dataset.id);
    }
  });


  /* =====================================================
     FILTROS Y VISTAS
  ====================================================== */

  function updateListTitle() {
    const base = currentFilter === "todos" ? "Todos los aportes" : typeInfo[currentFilter].title;

    listTitle.textContent = currentStatus === "todos"
      ? base
      : `${base} · ${statusInfo[currentStatus].plural}`;
  }

  function showView(view) {
    if (!can(view)) return;

    currentView = view;
    inboxView.hidden = view !== "inbox";
    videoView.hidden = view !== "video";
    centerView.hidden = view !== "centro";
    calendarView.hidden = view !== "calendario";
    teamView.hidden = view !== "equipo";

    navItems.forEach(button => {
      const active = view === "inbox"
        ? button.dataset.filter === currentFilter
        : button.dataset.view === view;

      button.classList.toggle("active", active);
    });

    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setFilter(filter) {
    currentFilter = typeInfo[filter] ? filter : "todos";

    filters.forEach(button => {
      button.classList.toggle("active", button.dataset.filter === currentFilter);
    });

    updateListTitle();
    renderSubmissions();
  }

  function setStatus(status) {
    currentStatus = statusInfo[status] ? status : "todos";
    statusFilter.value = currentStatus;

    statCards.forEach(card => {
      card.classList.toggle("active", card.dataset.statusFilter === currentStatus);
    });

    updateListTitle();
    renderSubmissions();
  }

  filters.forEach(button => {
    button.addEventListener("click", () => {
      setFilter(button.dataset.filter);
      navItems.forEach(item => {
        item.classList.toggle("active", item.dataset.filter === currentFilter);
      });
    });
  });

  navItems.forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.view) {
        showView(button.dataset.view);
        return;
      }

      setFilter(button.dataset.filter);
      showView("inbox");
    });
  });

  statCards.forEach(card => {
    card.addEventListener("click", () => setStatus(card.dataset.statusFilter));
  });

  statusFilter.addEventListener("change", () => setStatus(statusFilter.value));
  sortOrder.addEventListener("change", renderSubmissions);
  searchInput.addEventListener("input", renderSubmissions);

  clearFiltersButton.addEventListener("click", () => {
    searchInput.value = "";
    setFilter("todos");
    setStatus("todos");
    navItems.forEach(item => {
      item.classList.toggle("active", item.dataset.filter === "todos");
    });
  });


  /* =====================================================
     EXPORTAR CSV
  ====================================================== */

  function csvCell(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
  }

  exportButton.addEventListener("click", () => {
    const header = [
      "Fecha", "Tipo", "Estado", "Título", "Nombre", "Curso", "Correo",
      "Pide anonimato", "Propuesta", "Detalles", "Fotos", "Nota interna"
    ];

    const rows = visibleSubmissions.map(item => [
      formatDate(item.createdMs, true),
      typeInfo[item.type].label,
      statusInfo[item.status].label,
      item.title,
      item.realName,
      item.course,
      item.contact,
      item.anonymous ? "Sí" : "No",
      item.description,
      item.details.map(detail => `${detail.label}: ${formatDetailValue(detail.value)}`).join(" | "),
      item.attachments.length,
      item.note
    ]);

    // Punto y coma y BOM para que Excel en español lo abra correctamente.
    const csv = "﻿" + [header, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = `aportes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });


  /* =====================================================
     MODAL
  ====================================================== */

  function confirmDiscardNote() {
    return !noteDirty || window.confirm("Tienes una nota interna sin guardar. ¿Quieres descartarla?");
  }

  function openSubmission(id) {
    const item = submissions.find(submission => submission.id === id);

    if (!item || (currentSubmissionId && currentSubmissionId !== id && !confirmDiscardNote())) {
      return;
    }

    if (!modalOverlay.classList.contains("active")) {
      lastFocusedElement = document.activeElement;
    }

    currentSubmissionId = id;
    noteDirty = false;

    populateModal(item);

    modalOverlay.classList.add("active");
    modalOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.scrollTop = 0;
    modalClose.focus({ preventScroll: true });
  }

  function populateModal(item) {
    const type = typeInfo[item.type];
    const isNewItem = renderedModalId !== item.id;

    modalType.textContent = `${type.icon} ${type.label}`;
    modalType.className = `type-badge type-${item.type}`;
    modalStatus.textContent = statusInfo[item.status].label;
    modalStatus.className = `status-badge status-${item.status}`;
    modalAnonymousFlag.hidden = !item.anonymous;

    modalTitle.textContent = item.title;
    modalAuthor.textContent = `${item.realName} · ${item.course}`;

    modalDate.textContent = formatDate(item.createdMs, true);
    modalPrivacy.textContent = item.anonymous ? "Publicar como «Anónimo»" : "Puede aparecer su nombre";

    modalContact.innerHTML = item.contact
      ? `<a class="text-link" href="mailto:${encodeURIComponent(item.contact).replace("%40", "@")}">${escapeHTML(item.contact)}</a>`
      : "No dejó correo";

    modalDescription.textContent = item.description || "Sin descripción.";

    modalExtraBlock.hidden = item.details.length === 0;
    modalExtra.innerHTML = item.details.map(detail => {
      const value = formatDetailValue(detail.value);
      const content = detail.key === "enlace" && isSafeUrl(value)
        ? `<a class="text-link" href="${escapeHTML(value)}" target="_blank" rel="noopener noreferrer">${escapeHTML(value)}</a>`
        : escapeHTML(value);

      return `<div><dt>${escapeHTML(detail.label)}</dt><dd>${content}</dd></div>`;
    }).join("");

    modalDraftBlock.hidden = !item.draft;
    modalDraft.textContent = item.draft;

    statusButtons.forEach(button => {
      button.classList.toggle("active", button.dataset.status === item.status);
      button.setAttribute("aria-pressed", button.dataset.status === item.status ? "true" : "false");
    });

    updatePublishButton(item);
    updateModalNavigation();

    // Estos elementos solo se reconstruyen al cambiar de aporte, para que
    // una actualización en vivo no borre lo que se está escribiendo.
    if (isNewItem) {
      renderedModalId = item.id;
      editorialNote.value = item.note;
      statusHelp.textContent = item.updatedBy
        ? `Último cambio por ${item.updatedBy}${item.updatedMs ? `, ${formatDate(item.updatedMs, true)}` : ""}.`
        : "Los cambios de estado se guardan automáticamente en Michelangelo Comunidad.";
      noteHelp.textContent = "Solo la ve el equipo editorial.";
      loadAttachments(item);
    } else if (!noteDirty) {
      editorialNote.value = item.note;
    }
  }

  function loadAttachments(item) {
    modalAttachmentBlock.hidden = item.attachments.length === 0;
    modalAttachments.innerHTML = "";

    item.attachments.forEach(file => {
      const figure = document.createElement("figure");
      const link = document.createElement("a");
      const caption = document.createElement("figcaption");

      link.className = "attachment-thumb is-loading";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Cargando…";
      caption.textContent = [file.nombre, file.tamano ? formatSize(file.tamano) : ""].filter(Boolean).join(" · ");

      figure.append(link, caption);
      modalAttachments.append(figure);

      fb.getDownloadURL(fb.storageRef(storage, file.ruta))
        .then(url => {
          if (renderedModalId !== item.id) return;

          const image = document.createElement("img");
          image.src = url;
          image.alt = file.nombre ? `Foto adjunta: ${file.nombre}` : "Foto adjunta";
          image.loading = "lazy";

          link.href = url;
          link.textContent = "";
          link.classList.remove("is-loading");
          link.append(image);
        })
        .catch(error => {
          console.error("No fue posible cargar el adjunto:", error);
          if (renderedModalId !== item.id) return;
          link.classList.remove("is-loading");
          link.textContent = "No fue posible abrir la foto.";
        });
    });
  }

  function updatePublishButton(item) {
    const canPublish = item.type === "creacion" && item.status === "aprobado";
    const published = publishedCreations.has(item.id);

    publishCreationButton.hidden = !canPublish && !published;
    publishCreationButton.disabled = published;
    publishCreationButton.textContent = published ? "✓ Publicada en Creaciones" : "Publicar en Creaciones";
  }

  function updateModalNavigation() {
    const index = visibleSubmissions.findIndex(item => item.id === currentSubmissionId);

    modalPrev.disabled = index <= 0;
    modalNext.disabled = index === -1 || index >= visibleSubmissions.length - 1;
    modalPosition.textContent = index === -1 ? "" : `${index + 1} de ${visibleSubmissions.length}`;
  }

  function moveInModal(step) {
    const index = visibleSubmissions.findIndex(item => item.id === currentSubmissionId);
    const next = visibleSubmissions[index + step];

    if (index !== -1 && next) {
      openSubmission(next.id);
    }
  }

  function closeModal() {
    if (!confirmDiscardNote()) {
      return;
    }

    modalOverlay.classList.remove("active");
    modalOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    currentSubmissionId = null;
    renderedModalId = null;
    noteDirty = false;

    if (lastFocusedElement && document.contains(lastFocusedElement)) {
      lastFocusedElement.focus({ preventScroll: true });
    } else {
      const card = submissionList.querySelector(".submission-card");
      if (card) card.focus({ preventScroll: true });
    }
  }

  modalClose.addEventListener("click", closeModal);
  modalPrev.addEventListener("click", () => moveInModal(-1));
  modalNext.addEventListener("click", () => moveInModal(1));

  modalOverlay.addEventListener("click", event => {
    if (event.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", event => {
    if (!modalOverlay.classList.contains("active")) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    const typing = event.target instanceof Element && event.target.matches("textarea, input, select");

    if (!typing && event.key === "ArrowLeft") moveInModal(-1);
    if (!typing && event.key === "ArrowRight") moveInModal(1);

    // Mantiene el foco dentro del diálogo.
    if (event.key === "Tab") {
      const focusable = Array.from(
        modal.querySelectorAll("button:not([disabled]):not([hidden]), a[href], textarea")
      ).filter(element => element.offsetParent !== null);

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  copyDraft.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(modalDraft.textContent);
      copyDraft.textContent = "Texto copiado ✓";
    } catch (error) {
      copyDraft.textContent = "No se pudo copiar";
    }

    setTimeout(() => {
      copyDraft.textContent = "Copiar texto";
    }, 2000);
  });


  /* =====================================================
     CAMBIAR ESTADO Y NOTA — FIRESTORE
  ====================================================== */

  statusButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const item = submissions.find(submission => submission.id === currentSubmissionId);
      const newStatus = button.dataset.status;

      if (!item || !statusInfo[newStatus] || item.status === newStatus) {
        return;
      }

      statusButtons.forEach(statusButton => {
        statusButton.disabled = true;
      });
      statusHelp.textContent = "Guardando cambio...";

      try {
        await fb.updateDoc(fb.doc(db, "aportes", item.id), {
          estado: newStatus,
          ...editorStamp()
        });

        statusHelp.textContent = `Estado cambiado a «${statusInfo[newStatus].label.toLowerCase()}».`;

      } catch (error) {
        console.error("Error actualizando estado:", error);
        statusHelp.textContent = "No fue posible guardar el cambio. Inténtalo nuevamente.";

      } finally {
        statusButtons.forEach(statusButton => {
          statusButton.disabled = false;
        });
      }
    });
  });

  editorialNote.addEventListener("input", () => {
    noteDirty = true;
    noteHelp.textContent = "Cambios sin guardar.";
  });

  editorialNote.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      saveNoteButton.click();
    }
  });

  saveNoteButton.addEventListener("click", async () => {
    if (!currentSubmissionId) return;

    saveNoteButton.disabled = true;
    noteHelp.textContent = "Guardando nota...";

    try {
      await fb.updateDoc(fb.doc(db, "aportes", currentSubmissionId), {
        notaEditorial: editorialNote.value.trim(),
        ...editorStamp()
      });

      noteDirty = false;
      noteHelp.textContent = "Nota guardada ✓";

    } catch (error) {
      console.error("Error guardando la nota:", error);
      noteHelp.textContent = "No fue posible guardar la nota. Inténtalo nuevamente.";

    } finally {
      saveNoteButton.disabled = false;
    }
  });


  /* =====================================================
     PUBLICAR CREACIÓN
  ====================================================== */

  publishCreationButton.addEventListener("click", async () => {
    const item = submissions.find(submission => submission.id === currentSubmissionId);

    if (!item || item.type !== "creacion" || item.status !== "aprobado" || publishedCreations.has(item.id)) {
      return;
    }

    const author = item.anonymous ? "Anónimo" : item.realName;

    if (!window.confirm(`Se publicará «${item.title}» en Creaciones con autoría «${author}». ¿Continuar?`)) {
      return;
    }

    publishCreationButton.disabled = true;
    publishCreationButton.textContent = "Publicando...";

    try {
      const attachment = item.attachments[0] || null;
      const imageUrl = attachment
        ? await fb.getDownloadURL(fb.storageRef(storage, attachment.ruta))
        : null;

      await fb.addDoc(fb.collection(db, "publicaciones"), {
        seccion: "creaciones",
        aporteId: item.id,
        titulo: item.title,
        descripcion: item.description,
        autor: author,
        archivo: attachment,
        imagenUrl: imageUrl,
        publicadoEn: fb.serverTimestamp()
      });

      publishedCreations.add(item.id);
      statusHelp.textContent = "Creación publicada correctamente.";

    } catch (error) {
      console.error("No fue posible publicar la creación:", error);
      statusHelp.textContent = "No fue posible publicar la creación. Inténtalo nuevamente.";

    } finally {
      updatePublishButton(item);
      renderSubmissions();
    }
  });


  /* =====================================================
     PUBLICAR VIDEO
  ====================================================== */

  const VIDEO_TYPES = { "video/mp4": "mp4", "video/webm": "webm" };
  const VIDEO_MAX_SIZE = 250 * 1024 * 1024;

  function isValidVideo(file) {
    return file && VIDEO_TYPES[file.type] && file.size <= VIDEO_MAX_SIZE;
  }

  videoFile.addEventListener("change", () => {
    const file = videoFile.files?.[0];

    videoFileInfo.hidden = !file;
    videoFileInfo.classList.toggle("is-error", Boolean(file) && !isValidVideo(file));

    if (file) {
      videoFileInfo.textContent = isValidVideo(file)
        ? `${file.name} · ${formatSize(file.size)}`
        : `${file.name} no es un MP4 o WebM de hasta 250 MB (${formatSize(file.size)}).`;
    }
  });

  videoPublishForm.addEventListener("submit", async event => {
    event.preventDefault();

    const file = videoFile.files?.[0];

    if (!isValidVideo(file)) {
      videoPublishMessage.textContent = "Selecciona un video MP4 o WebM de hasta 250 MB.";
      return;
    }

    videoPublishButton.disabled = true;
    videoPublishButton.textContent = "Subiendo video…";
    videoPublishMessage.textContent = "La carga puede tardar unos minutos. No cierres esta página.";
    videoProgress.hidden = false;
    videoProgressBar.style.width = "0%";
    videoProgressText.textContent = "0%";

    try {
      const objectId = fb.doc(fb.collection(db, "publicaciones")).id;
      const path = `publicaciones/${objectId}/videos/video.${VIDEO_TYPES[file.type]}`;
      const videoReference = fb.storageRef(storage, path);

      await new Promise((resolve, reject) => {
        fb.uploadBytesResumable(videoReference, file, { contentType: file.type }).on(
          "state_changed",
          snapshot => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            videoProgressBar.style.width = `${percent}%`;
            videoProgressText.textContent =
              `${percent}% · ${formatSize(snapshot.bytesTransferred)} de ${formatSize(snapshot.totalBytes)}`;
          },
          reject,
          resolve
        );
      });

      const videoUrl = await fb.getDownloadURL(videoReference);

      await fb.addDoc(fb.collection(db, "publicaciones"), {
        seccion: "vida",
        titulo: videoTitle.value.trim(),
        descripcion: videoDescription.value.trim(),
        autor: "Michelangelo Comunidad",
        archivo: { ruta: path, nombre: file.name, tipo: file.type, tamano: file.size },
        videoUrl,
        publicadoEn: fb.serverTimestamp()
      });

      videoPublishForm.reset();
      videoFileInfo.hidden = true;
      videoProgress.hidden = true;
      videoPublishMessage.innerHTML =
        'Video publicado correctamente. <a class="text-link" href="../vida/" target="_blank" rel="noopener">Ver en Vida Michelangelo →</a>';

    } catch (error) {
      console.error("No fue posible publicar el video:", error);
      videoPublishMessage.textContent = "No fue posible publicar el video. Revisa la conexión e inténtalo nuevamente.";

    } finally {
      videoPublishButton.disabled = false;
      videoPublishButton.textContent = "Publicar video";
    }
  });

  /* =====================================================
     PUBLICAR COMUNICADO DEL CENTRO DE ESTUDIANTES
  ====================================================== */

  centerPublishForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = centerTitle.value.trim();
    const text = centerText.value.trim();
    const signature = centerSignature.value.trim() || "Centro de Estudiantes Michelangelo";

    if (!title || !text) {
      centerPublishMessage.textContent = "Escribe un título y el texto del comunicado.";
      return;
    }

    if (!window.confirm(`Se publicará «${title}» en la página del Centro de Estudiantes. ¿Continuar?`)) {
      return;
    }

    centerPublishButton.disabled = true;
    centerPublishButton.textContent = "Publicando…";
    centerPublishMessage.textContent = "";

    try {
      await fb.addDoc(fb.collection(db, "publicaciones"), {
        seccion: "centro",
        titulo: title,
        descripcion: text,
        autor: signature,
        publicadoEn: fb.serverTimestamp()
      });

      centerPublishForm.reset();
      centerPublishMessage.innerHTML =
        'Comunicado publicado correctamente. <a class="text-link" href="../centro-estudiantes/#comunicados" target="_blank" rel="noopener">Ver en Centro de Estudiantes →</a>';

    } catch (error) {
      console.error("No fue posible publicar el comunicado:", error);
      centerPublishMessage.textContent = "No fue posible publicar el comunicado. Revisa la conexión e inténtalo nuevamente.";

    } finally {
      centerPublishButton.disabled = false;
      centerPublishButton.textContent = "Publicar comunicado";
    }
  });

  /* =====================================================
     CALENDARIO DE ACTIVIDADES
  ====================================================== */

  // Fecha local en formato AAAA-MM-DD, igual que se guarda cada actividad.
  function localToday() {
    const now = new Date();
    const pad = value => String(value).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function formatActivityDate(value) {
    const [year, month, day] = value.split("-").map(Number);

    return new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(year, month - 1, day));
  }

  function renderCalendarManager(activities) {
    calendarManagerList.replaceChildren();

    if (!activities.length) {
      const empty = document.createElement("li");
      empty.className = "is-empty";
      empty.textContent = "No hay actividades próximas en el calendario.";
      calendarManagerList.append(empty);
      return;
    }

    for (const activity of activities) {
      const row = document.createElement("li");
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      const meta = document.createElement("small");
      const remove = document.createElement("button");

      title.textContent = activity.titulo;
      meta.textContent = [
        formatActivityDate(activity.fecha),
        activity.hora && `${activity.hora} h`,
        activity.lugar
      ].filter(Boolean).join(" · ");

      remove.type = "button";
      remove.className = "calendar-remove";
      remove.textContent = "Quitar";

      remove.addEventListener("click", async () => {
        if (!window.confirm(`Se quitará «${activity.titulo}» del calendario. ¿Continuar?`)) return;

        remove.disabled = true;

        try {
          await fb.updateDoc(fb.doc(db, "publicaciones", activity.id), {
            oculto: true,
            ...editorStamp()
          });
        } catch (error) {
          console.error("No fue posible quitar la actividad:", error);
          remove.disabled = false;
          window.alert("No fue posible quitar la actividad. Inténtalo nuevamente.");
        }
      });

      copy.append(title, meta);
      row.append(copy, remove);
      calendarManagerList.append(row);
    }
  }

  function subscribeToCalendar() {
    stopListener("calendar");

    unsubscribeCalendar = fb.onSnapshot(
      fb.query(fb.collection(db, "publicaciones"), fb.where("seccion", "==", "calendario")),
      snapshot => {
        const today = localToday();
        const activities = snapshot.docs
          .map(item => ({ id: item.id, ...item.data() }))
          .filter(item => !item.oculto && typeof item.fecha === "string" && item.fecha >= today)
          .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || "").localeCompare(b.hora || ""));

        renderCalendarManager(activities);
      },
      error => console.error("Error leyendo el calendario:", error)
    );
  }

  calendarPublishForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = calendarTitle.value.trim();
    const date = calendarDate.value;

    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      calendarPublishMessage.textContent = "Escribe el nombre de la actividad y elige una fecha.";
      return;
    }

    if (date < localToday() &&
        !window.confirm("La fecha elegida ya pasó, así que la actividad quedará en «actividades pasadas». ¿Continuar?")) {
      return;
    }

    calendarPublishButton.disabled = true;
    calendarPublishButton.textContent = "Agregando…";
    calendarPublishMessage.textContent = "";

    try {
      await fb.addDoc(fb.collection(db, "publicaciones"), {
        seccion: "calendario",
        titulo: title,
        descripcion: calendarDescription.value.trim(),
        autor: "Centro de Estudiantes Michelangelo",
        fecha: date,
        hora: calendarTime.value,
        lugar: calendarPlace.value.trim(),
        publicadoEn: fb.serverTimestamp()
      });

      calendarPublishForm.reset();
      calendarPublishMessage.innerHTML =
        'Actividad agregada. <a class="text-link" href="../centro-estudiantes/#calendario" target="_blank" rel="noopener">Ver el calendario →</a>';

    } catch (error) {
      console.error("No fue posible agregar la actividad:", error);
      calendarPublishMessage.textContent = "No fue posible agregar la actividad. Revisa la conexión e inténtalo nuevamente.";

    } finally {
      calendarPublishButton.disabled = false;
      calendarPublishButton.textContent = "Agregar actividad";
    }
  });

  /* =====================================================
     EQUIPO Y ROLES
  ====================================================== */

  const roleOptions = Object.entries(roleInfo)
    .map(([value, info]) => `<option value="${value}">${escapeHTML(info.label)}</option>`)
    .join("");

  teamRole.innerHTML = roleOptions;
  teamRole.value = "editorial";

  teamRolesHelp.innerHTML = Object.values(roleInfo)
    .map(info => `<div><dt>${escapeHTML(info.label)}</dt><dd>${escapeHTML(info.help)}</dd></div>`)
    .join("");

  // Guarda la cuenta completa: así también se limpian campos antiguos que
  // las reglas ya no aceptan en /editores.
  function saveMember(uid, role, email) {
    return fb.setDoc(fb.doc(db, "editores", uid), {
      rol: role,
      correo: email,
      ...editorStamp()
    });
  }

  function renderTeam() {
    teamList.replaceChildren();

    if (!teamMembers.length) {
      const empty = document.createElement("li");
      empty.className = "is-empty";
      empty.textContent = "Todavía no hay cuentas registradas.";
      teamList.append(empty);
      return;
    }

    for (const member of teamMembers) {
      const isSelf = member.uid === auth.currentUser?.uid;
      const row = document.createElement("li");
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      const meta = document.createElement("small");
      const actions = document.createElement("div");
      const select = document.createElement("select");

      title.textContent = member.correo || "Correo aún no registrado";
      meta.textContent = [
        `UID ${member.uid}`,
        member.actualizadoPor && `último cambio por ${member.actualizadoPor}`
      ].filter(Boolean).join(" · ");

      select.className = "team-role-select";
      select.innerHTML = roleOptions;
      select.value = member.rol;
      select.disabled = isSelf;
      select.setAttribute("aria-label", `Rol de ${member.correo || member.uid}`);

      select.addEventListener("change", async () => {
        const label = roleInfo[select.value].label;

        if (!window.confirm(`${member.correo || member.uid} pasará a tener el rol «${label}». ¿Continuar?`)) {
          select.value = member.rol;
          return;
        }

        select.disabled = true;

        try {
          await saveMember(member.uid, select.value, member.correo);
        } catch (error) {
          console.error("No fue posible cambiar el rol:", error);
          select.value = member.rol;
          window.alert("No fue posible cambiar el rol. Inténtalo nuevamente.");
        } finally {
          select.disabled = false;
        }
      });

      actions.className = "team-actions";
      actions.append(select);

      if (isSelf) {
        const self = document.createElement("span");
        self.className = "team-self";
        self.textContent = "Tu cuenta";
        actions.append(self);
      } else {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "calendar-remove";
        remove.textContent = "Quitar acceso";

        remove.addEventListener("click", async () => {
          if (!window.confirm(`${member.correo || member.uid} ya no podrá entrar a Studio. La cuenta seguirá existiendo en Firebase. ¿Continuar?`)) return;

          remove.disabled = true;

          try {
            await fb.deleteDoc(fb.doc(db, "editores", member.uid));
          } catch (error) {
            console.error("No fue posible quitar el acceso:", error);
            remove.disabled = false;
            window.alert("No fue posible quitar el acceso. Inténtalo nuevamente.");
          }
        });

        actions.append(remove);
      }

      copy.append(title, meta);
      row.append(copy, actions);
      teamList.append(row);
    }
  }

  function subscribeToTeam() {
    stopListener("team");

    unsubscribeTeam = fb.onSnapshot(
      fb.collection(db, "editores"),
      snapshot => {
        const order = Object.keys(roleInfo);

        teamMembers = snapshot.docs
          .map(item => {
            const data = item.data();
            return {
              uid: item.id,
              rol: data.rol === undefined ? "admin" : data.rol,
              correo: data.correo || "",
              actualizadoPor: data.actualizadoPor || ""
            };
          })
          .filter(member => roleInfo[member.rol])
          .sort((a, b) =>
            order.indexOf(a.rol) - order.indexOf(b.rol) || a.correo.localeCompare(b.correo)
          );

        renderTeam();
      },
      error => console.error("Error leyendo el equipo:", error)
    );
  }

  teamAddForm.addEventListener("submit", async event => {
    event.preventDefault();

    const uid = teamUid.value.trim();
    const email = teamEmail.value.trim();
    const role = teamRole.value;

    if (!/^[A-Za-z0-9_-]{10,128}$/.test(uid)) {
      teamAddMessage.textContent = "El UID no parece válido. Cópialo tal cual desde Firebase Console → Authentication.";
      return;
    }

    if (!email || !roleInfo[role]) {
      teamAddMessage.textContent = "Escribe el correo de la cuenta y elige un rol.";
      return;
    }

    if (teamMembers.some(member => member.uid === uid)) {
      teamAddMessage.textContent = "Esa cuenta ya tiene acceso. Cambia su rol desde la lista.";
      return;
    }

    teamAddButton.disabled = true;
    teamAddButton.textContent = "Guardando…";
    teamAddMessage.textContent = "";

    try {
      await saveMember(uid, role, email);
      teamAddForm.reset();
      teamRole.value = "editorial";
      teamAddMessage.textContent = `Listo: ${email} ya puede entrar a Studio como «${roleInfo[role].label}».`;

    } catch (error) {
      console.error("No fue posible dar acceso:", error);
      teamAddMessage.textContent = "No fue posible dar acceso. Revisa la conexión e inténtalo nuevamente.";

    } finally {
      teamAddButton.disabled = false;
      teamAddButton.textContent = "Dar acceso";
    }
  });

  window.addEventListener("beforeunload", event => {
    if (videoPublishButton.disabled || centerPublishButton.disabled || calendarPublishButton.disabled || noteDirty) {
      event.preventDefault();
    }
  });


  /* =====================================================
     MENÚ MÓVIL
  ====================================================== */

  function closeSidebar() {
    sidebar.classList.remove("active");
    mobileMenu.setAttribute("aria-expanded", "false");
  }

  mobileMenu.addEventListener("click", () => {
    const open = sidebar.classList.toggle("active");
    mobileMenu.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", event => {
    if (
      window.innerWidth <= 800 &&
      sidebar.classList.contains("active") &&
      !sidebar.contains(event.target) &&
      !mobileMenu.contains(event.target)
    ) {
      closeSidebar();
    }
  });


  /* =====================================================
     INICIO
  ====================================================== */

  studioLoading.hidden = true;
  updateStats();
  renderSubmissions();

});
