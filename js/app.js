/* =========================================================
   MICHELANGELO COMUNIDAD
   app.js
========================================================= */

// Raíz del sitio, calculada desde este archivo (js/app.js), para que los
// enlaces funcionen igual desde la portada y desde cualquier sección.
const siteRoot = new URL("../", document.currentScript?.src || window.location.href);

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     AÑO AUTOMÁTICO
  ========================== */

  const currentYear = document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }


  /* =========================
     MENÚ MÓVIL
  ========================== */

  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", () => {

      const isOpen = mainNav.classList.toggle("active");

      menuToggle.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );

      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"
      );

    });


    const navLinks = mainNav.querySelectorAll("a");

    navLinks.forEach((link) => {

      link.addEventListener("click", () => {

        mainNav.classList.remove("active");

        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        menuToggle.setAttribute("aria-label", "Abrir menú de navegación");

      });

    });

  }

  /* =========================
     SUBMENÚ "COMUNIDAD"
  ========================== */

  const navGroups = document.querySelectorAll(".nav-group");

  const setGroupOpen = (group, open) => {
    group.classList.toggle("open", open);
    group.querySelector(".nav-group-toggle")?.setAttribute("aria-expanded", open ? "true" : "false");
  };

  navGroups.forEach((group) => {
    const toggle = group.querySelector(".nav-group-toggle");

    toggle?.addEventListener("click", () => {
      setGroupOpen(group, !group.classList.contains("open"));
    });

    // Al salir con el teclado del submenú, se cierra solo.
    group.addEventListener("focusout", (event) => {
      if (!group.contains(event.relatedTarget) && window.innerWidth > 950) {
        setGroupOpen(group, false);
      }
    });
  });

  document.addEventListener("click", (event) => {
    navGroups.forEach((group) => {
      if (!group.contains(event.target) && window.innerWidth > 950) {
        setGroupOpen(group, false);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    const openGroup = document.querySelector(".nav-group.open");

    if (event.key === "Escape" && openGroup && window.innerWidth > 950) {
      setGroupOpen(openGroup, false);
      openGroup.querySelector(".nav-group-toggle")?.focus();
      return;
    }

    if (event.key === "Escape" && mainNav?.classList.contains("active")) {
      mainNav.classList.remove("active");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.setAttribute("aria-label", "Abrir menú de navegación");
      menuToggle?.focus();
    }
  });


  /* =========================
     BIENVENIDA (PRIMERA VISITA)
  ========================== */

  // Se muestra una sola vez por navegador. Con #bienvenida en la dirección
  // se puede volver a ver en cualquier momento.
  const WELCOME_KEY = "michelangelo-bienvenida-vista";

  const readWelcomeSeen = () => {
    try {
      return localStorage.getItem(WELCOME_KEY) === "1";
    } catch {
      return false;
    }
  };

  const markWelcomeSeen = () => {
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      // Sin almacenamiento disponible: se mostrará en la próxima visita.
    }
  };

  const showWelcome = () => {
    const previousFocus = document.activeElement;
    const overlay = document.createElement("div");

    overlay.className = "welcome-overlay";
    overlay.innerHTML = `
      <div class="welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="welcomeTitle" aria-describedby="welcomeLead">
        <button class="welcome-close" type="button" aria-label="Cerrar bienvenida">×</button>

        <p class="welcome-eyebrow">BIENVENIDA</p>

        <h2 id="welcomeTitle">Esto es <em>Michelangelo Comunidad.</em></h2>

        <p class="welcome-lead" id="welcomeLead">
          Un espacio creado por estudiantes del Colegio Waldorf Michelangelo
          para compartir lo que pensamos, creamos y vivimos.
        </p>

        <ul class="welcome-list">
          <li><span aria-hidden="true">📰</span><div><strong>Periódico</strong>Noticias, entrevistas, opiniones y creaciones de la comunidad escolar: arte, fotografía, literatura y música. Cualquier estudiante puede participar enviando un artículo, una creación o una idea.</div></li>
          <li><span aria-hidden="true">🎙️</span><div><strong>Podcast</strong>Conversaciones sobre lo que nos interesa, hechas por estudiantes.</div></li>
          <li><span aria-hidden="true">🌱</span><div><strong>Comunidad</strong>Vida Michelangelo y los lineamientos para participar y publicar.</div></li>
          <li><span aria-hidden="true">🤝</span><div><strong>Organización Estudiantil</strong>El Centro de Estudiantes recién está naciendo: para partir, somos una Organización Estudiantil que escucha, propone y organiza, con su calendario de actividades.</div></li>
        </ul>

        <div class="welcome-actions">
          <button class="button button-primary welcome-start" type="button">Comenzar a explorar</button>
          <a class="button button-secondary" href="${new URL("participa/", siteRoot).href}">Quiero participar</a>
        </div>
      </div>`;

    const dialog = overlay.querySelector(".welcome-dialog");
    const focusable = () => dialog.querySelectorAll("button, a[href]");

    const close = () => {
      overlay.classList.add("closing");
      document.body.classList.remove("welcome-open");
      document.removeEventListener("keydown", onKeydown, true);
      setTimeout(() => overlay.remove(), 250);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };

    // Esc cierra; Tab queda dentro de la ventana mientras está abierta.
    const onKeydown = event => {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    overlay.querySelector(".welcome-close").addEventListener("click", close);
    overlay.querySelector(".welcome-start").addEventListener("click", close);
    overlay.addEventListener("click", event => {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", onKeydown, true);

    document.body.append(overlay);
    document.body.classList.add("welcome-open");
    overlay.querySelector(".welcome-start").focus({ preventScroll: true });

    markWelcomeSeen();
  };

  if (window.location.hash === "#bienvenida" || !readWelcomeSeen()) {
    showWelcome();
  }


  /* =========================
     ANIMACIONES AL APARECER
  ========================== */

  const animatedElements = document.querySelectorAll(
    ".project-card, .creation-category, .feature-text, .podcast-visual, .life-visual"
  );


  if ("IntersectionObserver" in window) {

    animatedElements.forEach((element) => {
      element.classList.add("reveal");
    });


    const observer = new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (entry.isIntersecting) {

            entry.target.classList.add("visible");

            observer.unobserve(entry.target);

          }

        });

      },
      {
        threshold: 0.12
      }
    );


    animatedElements.forEach((element) => {
      observer.observe(element);
    });

  }

});
