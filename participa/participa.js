/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDWSpVS8It00pQXE7I541w-ywTu6mvphIM",
  authDomain: "michelangelo-comunidad.firebaseapp.com",
  projectId: "michelangelo-comunidad",
  storageBucket: "michelangelo-comunidad.firebasestorage.app",
  messagingSenderId: "1078337415782",
  appId: "1:1078337415782:web:0d83ded2c0d35157415ba7"
};

const firebaseReady = Promise.all([
  import("https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js"),
  import("https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js"),
  import("https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js"),
  import("https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js")
]).then(([firebaseApp, firestore, storageModule, authModule]) => {
  const app = firebaseApp.initializeApp(firebaseConfig);
  const db = firestore.getFirestore(app);
  const storage = storageModule.getStorage(app);
  const auth = authModule.getAuth(app);

  return {
    db,
    doc: firestore.doc,
    setDoc: firestore.setDoc,
    collection: firestore.collection,
    serverTimestamp: firestore.serverTimestamp,
    storage,
    storageRef: storageModule.ref,
    uploadBytes: storageModule.uploadBytes,
    auth,
    signInAnonymously: authModule.signInAnonymously
  };
});


/* =========================================================
   LÍMITES
========================================================= */

const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const PHOTO_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

// Los borradores viven solo en este navegador y caducan en una semana,
// para no dejar datos personales olvidados en computadores compartidos.
const DRAFT_PREFIX = "michelangelo-participa-borrador-";
const DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Campos que van en la raíz del aporte y no dentro de "detalles".
const ROOT_FIELDS = ["proposalTitle", "proposalDescription"];


/* =========================================================
   CONFIGURACIÓN DE FORMULARIOS
========================================================= */

const forms = {

  periodico: {
    label: "PERIÓDICO ESCOLAR",
    cardTitle: "Periódico",
    title: "Cuéntanos qué quieres escribir.",
    description: "Puedes proponer una noticia, entrevista, columna, reportaje u otro contenido.",
    heading: "Tu artículo o propuesta",
    help: "No es necesario que el artículo esté terminado. También puedes enviarnos solo una idea.",
    fields: [
      {
        name: "proposalTitle",
        type: "text",
        label: "Título o tema",
        required: true,
        maxlength: 200,
        full: true,
        placeholder: "Ej: ¿Qué pasa con los huertos del colegio en invierno?"
      },
      {
        name: "tipoContenido",
        type: "select",
        label: "Tipo de contenido",
        required: true,
        options: ["Noticia", "Entrevista", "Columna", "Reportaje", "Crónica", "Reseña", "Opinión", "Otro"]
      },
      {
        name: "seccion",
        type: "select",
        label: "¿De qué ámbito trata?",
        options: ["Vida escolar", "Cultura y arte", "Deportes", "Ciencia y tecnología", "Medio ambiente", "Sociedad", "Otro"]
      },
      {
        name: "etapa",
        type: "select",
        label: "¿En qué etapa está?",
        full: true,
        options: ["Es solo una idea", "Estoy comenzando a escribirlo", "Ya tengo un borrador", "Está terminado"]
      },
      {
        name: "proposalDescription",
        type: "textarea",
        label: "Cuéntanos tu propuesta",
        required: true,
        maxlength: 5000,
        placeholder: "¿De qué quieres escribir? ¿Por qué te parece interesante para la comunidad?"
      },
      {
        name: "borrador",
        type: "textarea",
        label: "Texto o borrador",
        maxlength: 20000,
        tall: true,
        hint: "Si ya empezaste a escribir, pega aquí tu texto. Puede estar incompleto."
      },
      {
        name: "fuentes",
        type: "textarea",
        label: "Fuentes o personas a entrevistar",
        maxlength: 1000,
        short: true,
        hint: "Con quién hablarías o dónde buscarías información."
      },
      {
        name: "apoyo",
        type: "choices",
        label: "¿Te gustaría recibir apoyo en algo?",
        options: ["Redacción", "Edición", "Fotografía", "Entrevistas", "Ilustración"]
      },
      {
        name: "fotos",
        type: "photos",
        label: "Fotos de apoyo",
        hint: "Si tienes fotos que acompañen el artículo, puedes adjuntar hasta 3."
      }
    ]
  },

  creacion: {
    label: "CREACIONES",
    cardTitle: "Creación",
    title: "Comparte algo que hayas creado.",
    description: "Este espacio puede reunir arte, fotografía, literatura, música y muchas otras formas de expresión.",
    heading: "Tu creación",
    help: "Cuéntanos qué hiciste y adjunta fotos o un enlace para que podamos verla.",
    fields: [
      {
        name: "proposalTitle",
        type: "text",
        label: "Nombre de tu creación",
        required: true,
        maxlength: 200,
        full: true
      },
      {
        name: "tipoCreacion",
        type: "select",
        label: "Tipo de creación",
        required: true,
        options: ["Ilustración", "Pintura", "Escultura", "Fotografía", "Poesía", "Cuento", "Texto", "Música", "Video", "Artesanía", "Otro"]
      },
      {
        name: "tecnica",
        type: "text",
        label: "Técnica o materiales",
        maxlength: 150,
        placeholder: "Ej: acuarela sobre papel"
      },
      {
        name: "contexto",
        type: "text",
        label: "¿Dónde nació?",
        maxlength: 150,
        full: true,
        placeholder: "Ej: clase de arte, proyecto personal, taller de música…"
      },
      {
        name: "proposalDescription",
        type: "textarea",
        label: "Cuéntanos sobre tu creación",
        required: true,
        maxlength: 5000,
        placeholder: "Puedes contarnos cómo nació, qué representa o cualquier cosa que quieras compartir sobre ella."
      },
      {
        name: "fotos",
        type: "photos",
        label: "Fotos de tu creación",
        hint: "Adjunta hasta 3 fotos. Si es un texto, puedes pegarlo arriba o fotografiarlo."
      },
      {
        name: "enlace",
        type: "url",
        label: "Enlace",
        maxlength: 500,
        full: true,
        placeholder: "https://",
        hint: "Para música, video o archivos grandes: YouTube, Drive, SoundCloud u otro."
      },
      {
        name: "autoria",
        type: "check",
        required: true,
        label: "Confirmo que esta creación es mía (o de las personas que indiqué como coautoras)."
      },
      {
        name: "permisoPersonas",
        type: "check",
        required: true,
        label: "Si en mi creación aparecen otras personas, cuento con su permiso para compartirla."
      }
    ]
  },

  podcast: {
    label: "MICHELANGELO PODCAST",
    cardTitle: "Podcast",
    title: "¿De qué deberíamos conversar?",
    description: "Propón un tema, una pregunta o una conversación para un próximo episodio.",
    heading: "Tu propuesta para el podcast",
    help: "No hay temas demasiado pequeños si pueden generar una buena conversación.",
    fields: [
      {
        name: "proposalTitle",
        type: "text",
        label: "Tema del episodio",
        required: true,
        maxlength: 200,
        full: true,
        placeholder: "Ej: ¿Cómo está cambiando la inteligencia artificial nuestra forma de estudiar?"
      },
      {
        name: "formato",
        type: "select",
        label: "Formato",
        options: ["Conversación", "Entrevista", "Debate", "Historia o relato", "Otro"]
      },
      {
        name: "participacion",
        type: "select",
        label: "¿Te gustaría participar?",
        options: ["Me gustaría conducirlo", "Me gustaría ser parte de la conversación", "Me gustaría ayudar en la producción", "Solo propongo el tema"]
      },
      {
        name: "proposalDescription",
        type: "textarea",
        label: "¿Por qué deberíamos hablar de esto?",
        required: true,
        maxlength: 5000
      },
      {
        name: "preguntas",
        type: "textarea",
        label: "Preguntas que te gustaría responder",
        maxlength: 2000,
        short: true,
        placeholder: "Una pregunta por línea."
      },
      {
        name: "invitados",
        type: "textarea",
        label: "¿A quién invitarías?",
        maxlength: 500,
        short: true,
        hint: "Estudiantes, profesores, apoderados o personas de fuera del colegio."
      }
    ]
  },

  idea: {
    label: "IDEAS",
    cardTitle: "Idea",
    title: "Las buenas ideas pueden empezar aquí.",
    description: "Propón algo nuevo para Michelangelo Comunidad.",
    heading: "Tu idea",
    help: "Puede ser una actividad, una nueva sección, un proyecto o algo completamente distinto.",
    fields: [
      {
        name: "proposalTitle",
        type: "text",
        label: "Ponle un nombre a tu idea",
        required: true,
        maxlength: 200,
        full: true
      },
      {
        name: "categoriaIdea",
        type: "select",
        label: "¿Qué tipo de idea es?",
        required: true,
        full: true,
        options: ["Actividad o evento", "Nueva sección del sitio", "Proyecto", "Mejora para la comunidad", "Otro"]
      },
      {
        name: "proposalDescription",
        type: "textarea",
        label: "Explícanos tu idea",
        required: true,
        maxlength: 5000,
        placeholder: "¿Qué propones? ¿Cómo podría funcionar?"
      },
      {
        name: "porQueInteresante",
        type: "textarea",
        label: "¿Por qué crees que sería interesante?",
        maxlength: 2000,
        short: true
      },
      {
        name: "recursos",
        type: "textarea",
        label: "¿Qué se necesitaría para hacerla realidad?",
        maxlength: 2000,
        short: true,
        hint: "Personas, espacios, materiales, tiempo…"
      },
      {
        name: "quiereAyudar",
        type: "check",
        label: "Me gustaría ayudar a llevar esta idea a cabo."
      }
    ]
  }

};


/* =========================================================
   RENDER DE CAMPOS
========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderLabel(field) {
  const mark = field.required
    ? " <span>*</span>"
    : ' <small class="optional">(opcional)</small>';

  return `<label for="${field.name}">${escapeHTML(field.label)}${mark}</label>`;
}

function renderHint(field) {
  return field.hint
    ? `<small class="field-hint" id="${field.name}-hint">${escapeHTML(field.hint)}</small>`
    : "";
}

function commonAttributes(field) {
  return [
    `id="${field.name}"`,
    `name="${field.name}"`,
    field.required ? "required" : "",
    field.maxlength ? `maxlength="${field.maxlength}"` : "",
    field.placeholder ? `placeholder="${escapeHTML(field.placeholder)}"` : "",
    field.hint ? `aria-describedby="${field.name}-hint"` : ""
  ].join(" ");
}

function renderField(field) {
  const width = field.full || field.type === "textarea" ? " full" : "";

  switch (field.type) {

    case "select":
      return `
        <div class="field${width}">
          ${renderLabel(field)}
          ${renderHint(field)}
          <select ${commonAttributes(field)}>
            <option value="">Selecciona una opción</option>
            ${field.options.map(option => `<option>${escapeHTML(option)}</option>`).join("")}
          </select>
        </div>`;

    case "textarea": {
      const size = field.tall ? " tall" : field.short ? " short" : "";
      return `
        <div class="field${width}">
          ${renderLabel(field)}
          ${renderHint(field)}
          <textarea class="${size.trim()}" ${commonAttributes(field)}></textarea>
          <small class="char-count" data-count-for="${field.name}">0 / ${field.maxlength.toLocaleString("es-CL")}</small>
        </div>`;
    }

    case "choices":
      return `
        <fieldset class="field full choice-group">
          <legend>${escapeHTML(field.label)} <small class="optional">(opcional)</small></legend>
          <div class="choice-list">
            ${field.options.map(option => `
              <label class="choice-pill">
                <input type="checkbox" name="${field.name}" value="${escapeHTML(option)}">
                <span>${escapeHTML(option)}</span>
              </label>`).join("")}
          </div>
        </fieldset>`;

    case "check":
      return `
        <label class="checkbox-row full${field.required ? " required-check" : ""}">
          <input type="checkbox" id="${field.name}" name="${field.name}"${field.required ? " required" : ""}>
          <span class="custom-checkbox"></span>
          <span>${escapeHTML(field.label)}${field.required ? " <em>*</em>" : ""}</span>
        </label>`;

    case "photos":
      return `
        <div class="file-field full">
          <label for="${field.name}">${escapeHTML(field.label)} <small class="optional">(opcional)</small></label>
          <p>${escapeHTML(field.hint)} Formatos JPG, PNG o WebP de hasta 10 MB cada una.
          Solo el equipo editorial podrá verlas antes de cualquier publicación.</p>
          <label class="file-drop" for="${field.name}">
            <strong>＋ Elegir fotos</strong>
            <span data-photo-counter>0 de ${MAX_PHOTOS} fotos</span>
          </label>
          <input class="visually-hidden" type="file" id="${field.name}" name="${field.name}"
            accept="image/jpeg,image/png,image/webp" multiple>
          <ul class="photo-previews" data-photo-previews></ul>
          <small class="field-error" data-photo-error hidden></small>
        </div>`;

    default:
      return `
        <div class="field${width}">
          ${renderLabel(field)}
          ${renderHint(field)}
          <input type="${field.type === "url" ? "url" : "text"}" ${commonAttributes(field)}${field.type === "url" ? ' inputmode="url"' : ""}>
        </div>`;

  }
}


document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     ELEMENTOS
  ======================================================= */

  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  const categoryCards = document.querySelectorAll(".category-card");
  const formSection = document.getElementById("formSection");
  const closeForm = document.getElementById("closeForm");
  const form = document.getElementById("participationForm");
  const formLabel = document.getElementById("formLabel");
  const formTitle = document.getElementById("formTitle");
  const formDescription = document.getElementById("formDescription");
  const contentHeading = document.getElementById("contentHeading");
  const contentHelp = document.getElementById("contentHelp");
  const dynamicFields = document.getElementById("dynamicFields");
  const submissionType = document.getElementById("submissionType");
  const errorMessage = document.getElementById("errorMessage");
  const successScreen = document.getElementById("successScreen");
  const successSummary = document.getElementById("successSummary");
  const newSubmission = document.getElementById("newSubmission");
  const currentYear = document.getElementById("currentYear");
  const draftNotice = document.getElementById("draftNotice");
  const draftNoticeText = document.getElementById("draftNoticeText");
  const discardDraft = document.getElementById("discardDraft");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector("span");

  let selectedPhotos = [];
  let draftTimer = null;


  /* =======================================================
     AÑO
  ======================================================= */

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }


  /* =======================================================
     MENÚ MÓVIL
  ======================================================= */

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("active");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }


  /* =======================================================
     ABRIR Y CERRAR FORMULARIO
  ======================================================= */

  function markSelectedCard(type) {
    categoryCards.forEach(card => {
      const selected = card.dataset.category === type;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function openForm(type, { scroll = true } = {}) {
    const config = forms[type];

    if (!config) {
      return;
    }

    form.reset();
    clearErrors();
    selectedPhotos = [];

    submissionType.value = type;
    formLabel.textContent = config.label;
    formTitle.textContent = config.title;
    formDescription.textContent = config.description;
    contentHeading.textContent = config.heading;
    contentHelp.textContent = config.help;
    dynamicFields.innerHTML = `<div class="fields-grid">${config.fields.map(renderField).join("")}</div>`;

    restoreDraft(type);
    updateAllCounters();
    renderPhotoPreviews();
    markSelectedCard(type);

    successScreen.classList.remove("active");
    successScreen.setAttribute("aria-hidden", "true");
    formSection.classList.add("active");
    formSection.setAttribute("aria-hidden", "false");

    if (scroll) {
      setTimeout(() => {
        formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  function closeCurrentForm() {
    saveDraft();
    formSection.classList.remove("active");
    formSection.setAttribute("aria-hidden", "true");
    markSelectedCard(null);

    document.getElementById("participar").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  categoryCards.forEach(card => {
    card.setAttribute("aria-pressed", "false");
    card.addEventListener("click", () => openForm(card.dataset.category));
  });

  if (closeForm) {
    closeForm.addEventListener("click", closeCurrentForm);
  }

  // Enlace directo a un formulario: /participa/?tipo=podcast
  const requestedType = new URLSearchParams(window.location.search).get("tipo");

  if (forms[requestedType]) {
    openForm(requestedType);
  }


  /* =======================================================
     CONTADORES DE CARACTERES
  ======================================================= */

  function updateCounter(textarea) {
    const counter = form.querySelector(`[data-count-for="${textarea.name}"]`);

    if (!counter) {
      return;
    }

    const max = Number(textarea.maxLength);
    const length = textarea.value.length;

    counter.textContent = `${length.toLocaleString("es-CL")} / ${max.toLocaleString("es-CL")}`;
    counter.classList.toggle("near-limit", length > max * 0.9);
  }

  function updateAllCounters() {
    form.querySelectorAll("textarea[maxlength]").forEach(updateCounter);
  }


  /* =======================================================
     FOTOS
  ======================================================= */

  function formatSize(bytes) {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function showPhotoError(message) {
    const photoError = form.querySelector("[data-photo-error]");

    if (!photoError) {
      return;
    }

    photoError.textContent = message;
    photoError.hidden = !message;
  }

  function renderPhotoPreviews() {
    const list = form.querySelector("[data-photo-previews]");
    const counter = form.querySelector("[data-photo-counter]");

    if (!list) {
      return;
    }

    list.querySelectorAll("img").forEach(image => URL.revokeObjectURL(image.src));
    list.innerHTML = "";

    selectedPhotos.forEach((file, index) => {
      const item = document.createElement("li");
      const image = document.createElement("img");
      const info = document.createElement("span");
      const remove = document.createElement("button");

      image.src = URL.createObjectURL(file);
      image.alt = "";
      info.textContent = `${file.name} · ${formatSize(file.size)}`;
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Quitar ${file.name}`);
      remove.addEventListener("click", () => {
        selectedPhotos.splice(index, 1);
        showPhotoError("");
        renderPhotoPreviews();
      });

      item.append(image, info, remove);
      list.append(item);
    });

    if (counter) {
      counter.textContent = `${selectedPhotos.length} de ${MAX_PHOTOS} fotos`;
    }
  }

  function addPhotos(files) {
    const rejected = [];

    for (const file of files) {
      if (!PHOTO_EXTENSIONS[file.type] || file.size > MAX_PHOTO_SIZE) {
        rejected.push(`${file.name} no es JPG, PNG o WebP de hasta 10 MB.`);
        continue;
      }

      if (selectedPhotos.length >= MAX_PHOTOS) {
        rejected.push(`Puedes adjuntar como máximo ${MAX_PHOTOS} fotos.`);
        break;
      }

      selectedPhotos.push(file);
    }

    showPhotoError(rejected.join(" "));
    renderPhotoPreviews();
  }


  /* =======================================================
     BORRADOR AUTOMÁTICO
  ======================================================= */

  function readDraft(type) {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_PREFIX + type) || "null");

      if (!draft || Date.now() - draft.savedAt > DRAFT_MAX_AGE) {
        localStorage.removeItem(DRAFT_PREFIX + type);
        return null;
      }

      return draft;
    } catch (error) {
      return null;
    }
  }

  function clearDraft(type) {
    try {
      localStorage.removeItem(DRAFT_PREFIX + type);
    } catch (error) {
      // Sin almacenamiento disponible no hay nada que borrar.
    }
  }

  function saveDraft() {
    const type = submissionType.value;

    if (!type || !formSection.classList.contains("active")) {
      return;
    }

    const values = {};
    let hasContent = false;

    Array.from(form.elements).forEach(element => {
      if (!element.name || ["file", "hidden", "submit"].includes(element.type) || element.name === "confirmSubmission") {
        return;
      }

      if (element.type === "checkbox") {
        values[element.name] = values[element.name] || [];
        if (element.checked) {
          values[element.name].push(element.value);
          hasContent = true;
        }
        return;
      }

      values[element.name] = element.value;
      hasContent = hasContent || element.value.trim() !== "";
    });

    try {
      if (hasContent) {
        localStorage.setItem(DRAFT_PREFIX + type, JSON.stringify({ savedAt: Date.now(), values }));
      } else {
        localStorage.removeItem(DRAFT_PREFIX + type);
      }
    } catch (error) {
      // Navegación privada o almacenamiento bloqueado: el formulario sigue funcionando.
    }
  }

  function restoreDraft(type) {
    const draft = readDraft(type);

    draftNotice.hidden = !draft;

    if (!draft) {
      return;
    }

    Array.from(form.elements).forEach(element => {
      const value = draft.values[element.name];

      if (value === undefined || element.type === "file") {
        return;
      }

      if (element.type === "checkbox") {
        element.checked = Array.isArray(value) && value.includes(element.value);
      } else {
        element.value = value;
      }
    });

    const savedAt = new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(draft.savedAt));

    draftNoticeText.textContent =
      `Recuperamos lo que habías escrito (${savedAt}). Las fotos no se guardan: vuelve a adjuntarlas.`;
  }

  discardDraft.addEventListener("click", () => {
    const type = submissionType.value;
    clearDraft(type);
    openForm(type, { scroll: false });
    draftNotice.hidden = true;
  });

  form.addEventListener("input", event => {
    if (event.target.matches("textarea[maxlength]")) {
      updateCounter(event.target);
    }

    if (event.target.classList.contains("invalid") || event.target.closest(".invalid")) {
      clearFieldError(event.target);
    }

    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 400);
  });

  form.addEventListener("change", event => {
    if (event.target.type === "file") {
      addPhotos(Array.from(event.target.files || []));
      event.target.value = "";
      return;
    }

    if (event.target.type === "checkbox") {
      clearFieldError(event.target);
    }

    saveDraft();
  });

  window.addEventListener("pagehide", saveDraft);


  /* =======================================================
     VALIDACIÓN
  ======================================================= */

  function getErrorElement(control) {
    const container = control.closest(".field");

    if (!container) {
      return null;
    }

    let error = container.querySelector(":scope > .field-error");

    if (!error) {
      error = document.createElement("small");
      error.className = "field-error";
      error.id = `${control.id}-error`;
      container.append(error);
    }

    return error;
  }

  function setFieldError(control, message) {
    const row = control.closest(".checkbox-row");

    if (row) {
      row.classList.add("invalid");
      return;
    }

    control.classList.add("invalid");
    control.setAttribute("aria-invalid", "true");

    const error = getErrorElement(control);

    if (error) {
      error.textContent = message;
      error.hidden = false;
      control.setAttribute("aria-errormessage", error.id);
    }
  }

  function clearFieldError(control) {
    const row = control.closest(".checkbox-row");

    if (row) {
      row.classList.remove("invalid");
      return;
    }

    control.classList.remove("invalid");
    control.removeAttribute("aria-invalid");

    const error = getErrorElement(control);

    if (error) {
      error.hidden = true;
    }
  }

  function clearErrors() {
    form.querySelectorAll(".invalid").forEach(element => element.classList.remove("invalid"));
    form.querySelectorAll("[aria-invalid]").forEach(element => element.removeAttribute("aria-invalid"));
    form.querySelectorAll(".field .field-error").forEach(element => {
      element.hidden = true;
    });

    errorMessage.classList.remove("active");
    errorMessage.textContent = "";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (error) {
      return false;
    }
  }

  function validateForm() {
    clearErrors();

    const problems = [];

    form.querySelectorAll("input, select, textarea").forEach(control => {
      if (!control.name || control.type === "file" || control.type === "hidden") {
        return;
      }

      const value = control.type === "checkbox" ? "" : control.value.trim();

      if (control.required && control.type === "checkbox" && !control.checked) {
        setFieldError(control, "");
        problems.push(control);
        return;
      }

      if (control.required && control.type !== "checkbox" && !value) {
        setFieldError(control, "Este campo es obligatorio.");
        problems.push(control);
        return;
      }

      if (value && control.type === "email" && !isValidEmail(value)) {
        setFieldError(control, "Revisa que el correo esté bien escrito.");
        problems.push(control);
        return;
      }

      if (value && control.type === "url" && !isValidUrl(value)) {
        setFieldError(control, "El enlace debe comenzar con https://");
        problems.push(control);
      }
    });

    if (problems.length) {
      errorMessage.textContent = problems.length === 1
        ? "Revisa el campo marcado antes de continuar."
        : `Revisa los ${problems.length} campos marcados antes de continuar.`;
      errorMessage.classList.add("active");
      problems[0].focus({ preventScroll: true });
      problems[0].closest(".field, .checkbox-row").scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return problems.length === 0;
  }


  /* =======================================================
     ENVÍO A FIREBASE
  ======================================================= */

  function buildDetails(type, formData) {
    const details = {};
    const coauthors = String(formData.get("coauthors") || "").trim();

    if (coauthors) {
      details.coautores = coauthors;
    }

    forms[type].fields.forEach(field => {
      if (ROOT_FIELDS.includes(field.name) || field.type === "photos") {
        return;
      }

      if (field.type === "choices") {
        const values = formData.getAll(field.name).map(String);
        if (values.length) {
          details[field.name] = values;
        }
        return;
      }

      if (field.type === "check") {
        details[field.name] = formData.has(field.name);
        return;
      }

      const value = String(formData.get(field.name) || "").trim();

      if (value) {
        details[field.name] = value;
      }
    });

    return details;
  }

  function wantsToParticipate(type, details) {
    if (type === "podcast") {
      return Boolean(details.participacion) && details.participacion !== "Solo propongo el tema";
    }

    if (type === "idea") {
      return details.quiereAyudar === true;
    }

    return false;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const originalLabel = submitLabel.textContent;
    submitButton.disabled = true;
    submitLabel.textContent = "Enviando…";

    try {
      const {
        db,
        doc,
        setDoc,
        collection,
        serverTimestamp,
        storage,
        storageRef,
        uploadBytes,
        auth,
        signInAnonymously
      } = await firebaseReady;

      const formData = new FormData(form);
      const type = submissionType.value;
      const title = String(formData.get("proposalTitle") || "").trim();
      const details = buildDetails(type, formData);
      const aporteReference = doc(collection(db, "aportes"));

      if (selectedPhotos.length) {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }

        details.archivos = [];

        for (const [index, file] of selectedPhotos.entries()) {
          submitLabel.textContent = `Subiendo foto ${index + 1} de ${selectedPhotos.length}…`;

          const path = `aportes/${aporteReference.id}/fotografias/foto-${index + 1}.${PHOTO_EXTENSIONS[file.type]}`;

          await uploadBytes(storageRef(storage, path), file, { contentType: file.type });

          details.archivos.push({
            ruta: path,
            nombre: file.name,
            tipo: file.type,
            tamano: file.size
          });
        }

        // Studio y Creaciones usan "archivo" como imagen principal.
        details.archivo = details.archivos[0];
        submitLabel.textContent = "Enviando…";
      }

      // Solo registramos el aporte cuando sus fotos privadas ya se cargaron.
      await setDoc(aporteReference, {
        tipo: type,
        nombre: String(formData.get("studentName") || "").trim() || "Estudiante",
        curso: String(formData.get("course") || "").trim() || "Sin especificar",
        contacto: String(formData.get("contactEmail") || "").trim(),
        anonimoPublicamente: formData.has("anonymousPublic"),
        titulo: title,
        descripcion: String(formData.get("proposalDescription") || "").trim(),
        detalles: details,
        quiereParticipar: wantsToParticipate(type, details),
        estado: "pendiente",
        creadoEn: serverTimestamp()
      });

      clearDraft(type);
      clearTimeout(draftTimer);

      successSummary.textContent = `“${title}” · ${forms[type].cardTitle}`;

      formSection.classList.remove("active");
      formSection.setAttribute("aria-hidden", "true");
      successScreen.classList.add("active");
      successScreen.setAttribute("aria-hidden", "false");
      successScreen.scrollIntoView({ behavior: "smooth", block: "start" });

      form.reset();
      selectedPhotos = [];
      markSelectedCard(null);

    } catch (error) {
      console.error("Error al enviar el aporte:", error);

      errorMessage.textContent =
        "No pudimos enviar tu propuesta. Revisa tu conexión e inténtalo nuevamente: lo que escribiste sigue guardado.";
      errorMessage.classList.add("active");
      errorMessage.scrollIntoView({ behavior: "smooth", block: "center" });

    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = originalLabel;
    }
  });


  /* =======================================================
     NUEVA PROPUESTA
  ======================================================= */

  if (newSubmission) {
    newSubmission.addEventListener("click", () => {
      successScreen.classList.remove("active");
      successScreen.setAttribute("aria-hidden", "true");

      form.reset();
      submissionType.value = "";
      dynamicFields.innerHTML = "";

      document.getElementById("participar").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

});
