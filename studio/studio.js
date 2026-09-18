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


  let firebaseApp;
  let auth;
  let db;

  let signInWithEmailAndPassword;
  let onAuthStateChanged;
  let signOut;

  let collection;
  let onSnapshot;
  let doc;
  let updateDoc;


  try {

    const firebaseAppModule = await import(
      "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js"
    );

    const firebaseAuthModule = await import(
      "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js"
    );

    const firebaseFirestoreModule = await import(
      "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js"
    );


    firebaseApp =
      firebaseAppModule.initializeApp(firebaseConfig);


    auth =
      firebaseAuthModule.getAuth(firebaseApp);


    db =
      firebaseFirestoreModule.getFirestore(firebaseApp);


    signInWithEmailAndPassword =
      firebaseAuthModule.signInWithEmailAndPassword;

    onAuthStateChanged =
      firebaseAuthModule.onAuthStateChanged;

    signOut =
      firebaseAuthModule.signOut;


    collection =
      firebaseFirestoreModule.collection;

    onSnapshot =
      firebaseFirestoreModule.onSnapshot;

    doc =
      firebaseFirestoreModule.doc;

    updateDoc =
      firebaseFirestoreModule.updateDoc;


  } catch (error) {

    console.error(
      "No fue posible cargar Firebase:",
      error
    );

    showFatalLoginError(
      "No fue posible conectar Michelangelo Studio con Firebase. Revisa tu conexión a internet e inténtalo nuevamente."
    );

    return;

  }



  /* =====================================================
     DATOS
  ====================================================== */

  let submissions = [];

  let currentFilter = "todos";

  let currentSubmissionId = null;

  let unsubscribeSubmissions = null;



  /* =====================================================
     CONFIG
  ====================================================== */

  const typeInfo = {

    periodico: {
      label: "PERIÓDICO",
      icon: "✎"
    },

    creacion: {
      label: "CREACIÓN",
      icon: "◇"
    },

    podcast: {
      label: "PODCAST",
      icon: "◉"
    },

    idea: {
      label: "IDEA",
      icon: "✦"
    }

  };


  const statusInfo = {

    pendiente: "PENDIENTE",

    revision: "EN REVISIÓN",

    aprobado: "APROBADO",

    rechazado: "RECHAZADO"

  };



  /* =====================================================
     DOM — LOGIN
  ====================================================== */

  const loginScreen =
    document.getElementById("loginScreen");

  const studioShell =
    document.getElementById("studioShell");

  const loginForm =
    document.getElementById("loginForm");

  const loginEmail =
    document.getElementById("loginEmail");

  const loginPassword =
    document.getElementById("loginPassword");

  const loginError =
    document.getElementById("loginError");

  const loginButton =
    document.getElementById("loginButton");

  const logoutButton =
    document.getElementById("logoutButton");

  const sidebarUser =
    document.getElementById("sidebarUser");

  const editorAvatar =
    document.getElementById("editorAvatar");

  const studioLoading =
    document.getElementById("studioLoading");



  /* =====================================================
     DOM — STUDIO
  ====================================================== */

  const submissionList =
    document.getElementById("submissionList");

  const emptyState =
    document.getElementById("emptyState");

  const searchInput =
    document.getElementById("searchInput");

  const filters =
    document.querySelectorAll(".filter");

  const navItems =
    document.querySelectorAll(".nav-item");

  const listTitle =
    document.getElementById("listTitle");

  const visibleCount =
    document.getElementById("visibleCount");

  const totalCount =
    document.getElementById("totalCount");

  const pendingCount =
    document.getElementById("pendingCount");

  const reviewCount =
    document.getElementById("reviewCount");

  const approvedCount =
    document.getElementById("approvedCount");

  const modalOverlay =
    document.getElementById("modalOverlay");

  const modalClose =
    document.getElementById("modalClose");

  const modalType =
    document.getElementById("modalType");

  const modalStatus =
    document.getElementById("modalStatus");

  const modalTitle =
    document.getElementById("modalTitle");

  const modalAuthor =
    document.getElementById("modalAuthor");

  const modalDescription =
    document.getElementById("modalDescription");

  const modalExtra =
    document.getElementById("modalExtra");

  const modalExtraBlock =
    document.getElementById("modalExtraBlock");

  const modalDate =
    document.getElementById("modalDate");

  const modalPrivacy =
    document.getElementById("modalPrivacy");

  const statusButtons =
    document.querySelectorAll(
      ".status-actions button"
    );

  const sidebar =
    document.getElementById("sidebar");

  const mobileMenu =
    document.getElementById("mobileMenu");

  const statusHelp =
    document.getElementById("statusHelp");



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



  function normalizeStatus(status) {

    if (statusInfo[status]) {
      return status;
    }

    return "pendiente";

  }



  function formatDate(timestamp) {

    if (!timestamp) {
      return "Fecha no disponible";
    }


    try {

      let date;


      if (
        typeof timestamp.toDate === "function"
      ) {

        date = timestamp.toDate();

      } else if (
        timestamp.seconds
      ) {

        date =
          new Date(timestamp.seconds * 1000);

      } else {

        date =
          new Date(timestamp);

      }


      if (
        Number.isNaN(date.getTime())
      ) {

        return "Fecha no disponible";

      }


      return new Intl.DateTimeFormat(
        "es-CL",
        {
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      ).format(date);


    } catch (error) {

      return "Fecha no disponible";

    }

  }



  function buildExtra(data) {

    const parts = [];

    const details =
      data.detalles || {};


    if (details.articleType) {

      parts.push(
        `Tipo de contenido: ${details.articleType}`
      );

    }


    if (details.articleStatus) {

      parts.push(
        `Estado del contenido: ${details.articleStatus}`
      );

    }


    if (details.creationType) {

      parts.push(
        `Tipo de creación: ${details.creationType}`
      );

    }


    if (details.ideaReason) {

      parts.push(
        `Motivación: ${details.ideaReason}`
      );

    }


    if (data.tipo === "podcast") {

      parts.push(
        data.quiereParticipar
          ? "Indicó que le gustaría participar en la conversación."
          : "No indicó interés en participar directamente."
      );

    }


    return parts.join("\n");

  }



  function firestoreToSubmission(
    firestoreDoc
  ) {

    const data =
      firestoreDoc.data();


    return {

      id:
        firestoreDoc.id,

      type:
        data.tipo || "idea",

      title:
        data.titulo || "Sin título",

      name:
        data.anonimoPublicamente
          ? "Anónimo"
          : data.nombre || "Sin nombre",

      realName:
        data.nombre || "Sin nombre",

      course:
        data.curso || "Curso no indicado",

      description:
        data.descripcion || "",

      extra:
        buildExtra(data),

      anonymous:
        Boolean(
          data.anonimoPublicamente
        ),

      wantsToParticipate:
        Boolean(
          data.quiereParticipar
        ),

      status:
        normalizeStatus(
          data.estado
        ),

      date:
        formatDate(
          data.creadoEn
        ),

      createdAt:
        data.creadoEn || null

    };

  }



  function showLoginError(message) {

    loginError.textContent =
      message;

    loginError.classList.add(
      "active"
    );

  }



  function clearLoginError() {

    loginError.textContent = "";

    loginError.classList.remove(
      "active"
    );

  }



  function showFatalLoginError(message) {
    const loginErrorElement =
      document.getElementById("loginError");

    if (!loginErrorElement) {
      return;
    }
    loginErrorElement.textContent = message;
    loginErrorElement.classList.add("active");

  }



  function getFirebaseAuthMessage(error) {

    const code =
      error?.code || "";


    switch (code) {

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



  /* =====================================================
     AUTHENTICATION
  ====================================================== */

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      clearLoginError();


      const email =
        loginEmail.value
          .trim();

      const password =
        loginPassword.value;


      if (!email || !password) {

        showLoginError(
          "Ingresa tu correo electrónico y contraseña."
        );

        return;

      }


      loginButton.disabled = true;

      loginButton.innerHTML =
        `Ingresando... <span>→</span>`;


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        loginPassword.value = "";


      } catch (error) {

        console.error(
          "Error al iniciar sesión:",
          error
        );


        showLoginError(
          getFirebaseAuthMessage(error)
        );


      } finally {

        loginButton.disabled = false;

        loginButton.innerHTML =
          `Entrar a Studio <span>→</span>`;

      }

    }

  );



  logoutButton.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          "No fue posible cerrar sesión:",
          error
        );

      }

    }

  );



  onAuthStateChanged(
    auth,
    user => {

      if (user) {

        showStudio(user);

        subscribeToSubmissions();

      } else {

        showLogin();

        stopSubmissionsListener();

      }

    }

  );



  function showStudio(user) {

    loginScreen.hidden = true;

    studioShell.hidden = false;


    const email =
      user.email || "Usuario autorizado";


    sidebarUser.textContent =
      email;


    const firstCharacter =
      email
        .charAt(0)
        .toUpperCase();


    editorAvatar.textContent =
      firstCharacter || "M";


    clearLoginError();

  }



  function showLogin() {

    studioShell.hidden = true;

    loginScreen.hidden = false;


    submissions = [];

    currentSubmissionId = null;


    updateStats();

    renderSubmissions();


    if (modalOverlay) {

      modalOverlay.classList.remove(
        "active"
      );

      modalOverlay.setAttribute(
        "aria-hidden",
        "true"
      );

    }


    document.body.style.overflow = "";

  }



  /* =====================================================
     FIRESTORE — APORTES
  ====================================================== */

  function subscribeToSubmissions() {

    stopSubmissionsListener();


    studioLoading.hidden = false;

    submissionList.innerHTML = "";

    emptyState.classList.remove(
      "active"
    );


    const aportesCollection =
      collection(
        db,
        "aportes"
      );


    unsubscribeSubmissions =
      onSnapshot(

        aportesCollection,

        snapshot => {

          submissions =
            snapshot.docs.map(
              firestoreToSubmission
            );


          submissions.sort(
            (a, b) => {

              const getMilliseconds =
                value => {

                  if (!value) {
                    return 0;
                  }

                  if (
                    typeof value.toMillis ===
                    "function"
                  ) {

                    return value.toMillis();

                  }

                  if (value.seconds) {

                    return (
                      value.seconds * 1000
                    );

                  }

                  return 0;

                };


              return (
                getMilliseconds(
                  b.createdAt
                ) -
                getMilliseconds(
                  a.createdAt
                )
              );

            }
          );


          studioLoading.hidden = true;


          updateStats();

          renderSubmissions();


          if (
            currentSubmissionId
          ) {

            const current =
              submissions.find(
                item =>
                  item.id ===
                  currentSubmissionId
              );


            if (current) {

              populateModal(
                current
              );

            }

          }

        },

        error => {

          console.error(
            "Error leyendo aportes:",
            error
          );


          studioLoading.hidden = true;

          submissionList.innerHTML = `
            <div style="
              padding: 45px 20px;
              border-top: 1px solid var(--border);
              color: var(--terracotta);
              font-size: .8rem;
            ">
              No fue posible cargar los aportes.
              Revisa la conexión con Firebase.
            </div>
          `;

        }

      );

  }



  function stopSubmissionsListener() {

    if (
      typeof unsubscribeSubmissions ===
      "function"
    ) {

      unsubscribeSubmissions();

      unsubscribeSubmissions = null;

    }

  }



  /* =====================================================
     FILTRADO
  ====================================================== */

  function getFilteredSubmissions() {

    const search =
      searchInput.value
        .trim()
        .toLowerCase();


    return submissions.filter(
      item => {

        const matchesType =
          currentFilter === "todos" ||
          item.type === currentFilter;


        const type =
          typeInfo[item.type];


        const searchableText = [

          item.title,

          item.name,

          item.realName,

          item.course,

          item.description,

          type
            ? type.label
            : item.type

        ]
          .join(" ")
          .toLowerCase();


        const matchesSearch =
          !search ||
          searchableText.includes(
            search
          );


        return (
          matchesType &&
          matchesSearch
        );

      }
    );

  }



  /* =====================================================
     CONTADORES
  ====================================================== */

  function updateStats() {

    totalCount.textContent =
      submissions.length;


    pendingCount.textContent =
      submissions.filter(
        item =>
          item.status ===
          "pendiente"
      ).length;


    reviewCount.textContent =
      submissions.filter(
        item =>
          item.status ===
          "revision"
      ).length;


    approvedCount.textContent =
      submissions.filter(
        item =>
          item.status ===
          "aprobado"
      ).length;

  }



  /* =====================================================
     RENDER
  ====================================================== */

  function renderSubmissions() {

    const results =
      getFilteredSubmissions();


    submissionList.innerHTML = "";


    visibleCount.textContent =
      `${results.length} ${
        results.length === 1
          ? "resultado"
          : "resultados"
      }`;


    if (
      results.length === 0
    ) {

      if (
        studioLoading.hidden
      ) {

        emptyState.classList.add(
          "active"
        );

      }

      return;

    }


    emptyState.classList.remove(
      "active"
    );


    results.forEach(
      item => {

        const type =
          typeInfo[item.type] ||
          typeInfo.idea;


        const article =
          document.createElement(
            "article"
          );


        article.className =
          "submission-card";


        article.dataset.id =
          item.id;


        article.innerHTML = `

          <div class="submission-type">

            <span
              class="type-badge type-${escapeHTML(item.type)}"
            >
              ${type.icon}
              ${type.label}
            </span>

            <small>
              ${escapeHTML(item.date)}
            </small>

          </div>


          <div class="submission-content">

            <h4>
              ${escapeHTML(item.title)}
            </h4>

            <p>
              ${escapeHTML(item.name)}
              ·
              ${escapeHTML(item.course)}
            </p>

          </div>


          <div class="submission-status">

            <span
              class="status-badge status-${escapeHTML(item.status)}"
            >
              ${statusInfo[item.status]}
            </span>

          </div>


          <div class="open-arrow">
            →
          </div>

        `;


        article.addEventListener(
          "click",
          () =>
            openSubmission(
              item.id
            )
        );


        submissionList.appendChild(
          article
        );

      }
    );

  }



  /* =====================================================
     FILTROS
  ====================================================== */

  function setFilter(filter) {

    currentFilter = filter;


    filters.forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.filter ===
            filter
        );

      }
    );


    navItems.forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.filter ===
            filter
        );

      }
    );


    const titles = {

      todos:
        "Todos los aportes",

      periodico:
        "Aportes para el periódico",

      creacion:
        "Creaciones",

      podcast:
        "Propuestas para el podcast",

      idea:
        "Ideas para la comunidad"

    };


    listTitle.textContent =
      titles[filter] ||
      titles.todos;


    renderSubmissions();


    if (
      window.innerWidth <= 800
    ) {

      sidebar.classList.remove(
        "active"
      );

    }

  }



  filters.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          setFilter(
            button.dataset.filter
          );

        }
      );

    }
  );



  navItems.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          setFilter(
            button.dataset.filter
          );

        }
      );

    }
  );



  searchInput.addEventListener(
    "input",
    renderSubmissions
  );



  /* =====================================================
     MODAL
  ====================================================== */

  function openSubmission(id) {

    const item =
      submissions.find(
        submission =>
          submission.id === id
      );


    if (!item) {
      return;
    }


    currentSubmissionId =
      id;


    populateModal(item);


    modalOverlay.classList.add(
      "active"
    );


    modalOverlay.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.style.overflow =
      "hidden";

  }



  function populateModal(item) {

    const type =
      typeInfo[item.type] ||
      typeInfo.idea;


    modalType.textContent =
      `${type.icon} ${type.label}`;


    modalType.className =
      `type-badge type-${item.type}`;


    modalStatus.textContent =
      statusInfo[item.status];


    modalStatus.className =
      `status-badge status-${item.status}`;


    modalTitle.textContent =
      item.title;


    modalAuthor.textContent =
      `${item.name} · ${item.course}`;


    modalDescription.textContent =
      item.description;


    if (item.extra) {

      modalExtraBlock.style.display =
        "block";

      modalExtra.textContent =
        item.extra;

    } else {

      modalExtraBlock.style.display =
        "none";

      modalExtra.textContent = "";

    }


    modalDate.textContent =
      item.date;


    modalPrivacy.textContent =
      item.anonymous
        ? "Publicar de forma anónima"
        : "Puede aparecer su nombre";


    statusButtons.forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.status ===
            item.status
        );

      }
    );

  }



  function closeModal() {

    modalOverlay.classList.remove(
      "active"
    );


    modalOverlay.setAttribute(
      "aria-hidden",
      "true"
    );


    document.body.style.overflow = "";


    currentSubmissionId = null;

  }



  modalClose.addEventListener(
    "click",
    closeModal
  );



  modalOverlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        modalOverlay
      ) {

        closeModal();

      }

    }
  );



  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        modalOverlay.classList.contains(
          "active"
        )
      ) {

        closeModal();

      }

    }
  );



  /* =====================================================
     CAMBIAR ESTADO — FIRESTORE
  ====================================================== */

  statusButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        async () => {

          if (
            !currentSubmissionId
          ) {

            return;

          }


          const newStatus =
            button.dataset.status;


          if (
            !statusInfo[newStatus]
          ) {

            return;

          }


          const item =
            submissions.find(
              submission =>
                submission.id ===
                currentSubmissionId
            );


          if (!item) {
            return;
          }


          const oldStatus =
            item.status;


          statusButtons.forEach(
            statusButton => {

              statusButton.disabled =
                true;

            }
          );


          if (statusHelp) {

            statusHelp.textContent =
              "Guardando cambio...";

          }


          try {

            const documentReference =
              doc(
                db,
                "aportes",
                currentSubmissionId
              );


            await updateDoc(
              documentReference,
              {
                estado:
                  newStatus
              }
            );


            item.status =
              newStatus;


            modalStatus.textContent =
              statusInfo[newStatus];


            modalStatus.className =
              `status-badge status-${newStatus}`;


            statusButtons.forEach(
              statusButton => {

                statusButton.classList.toggle(
                  "active",
                  statusButton.dataset.status ===
                    newStatus
                );

              }
            );


            updateStats();

            renderSubmissions();


            if (statusHelp) {

              statusHelp.textContent =
                "Cambio guardado correctamente en Michelangelo Comunidad.";

            }


          } catch (error) {

            console.error(
              "Error actualizando estado:",
              error
            );


            item.status =
              oldStatus;


            if (statusHelp) {

              statusHelp.textContent =
                "No fue posible guardar el cambio. Inténtalo nuevamente.";

            }

          } finally {

            statusButtons.forEach(
              statusButton => {

                statusButton.disabled =
                  false;

              }
            );

          }

        }
      );

    }
  );



  /* =====================================================
     MOBILE SIDEBAR
  ====================================================== */

  mobileMenu.addEventListener(
    "click",
    () => {

      sidebar.classList.toggle(
        "active"
      );

    }
  );



  document.addEventListener(
    "click",
    event => {

      if (
        window.innerWidth <= 800 &&
        sidebar.classList.contains(
          "active"
        ) &&
        !sidebar.contains(
          event.target
        ) &&
        !mobileMenu.contains(
          event.target
        )
      ) {

        sidebar.classList.remove(
          "active"
        );

      }

    }
  );



  /* =====================================================
     INICIO
  ====================================================== */

  studioLoading.hidden = true;

  updateStats();

  renderSubmissions();

});
