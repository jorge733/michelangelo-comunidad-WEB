/* =========================================================
   MICHELANGELO COMUNIDAD
   app.js
========================================================= */

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
