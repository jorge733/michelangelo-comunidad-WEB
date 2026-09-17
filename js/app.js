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

    });


    const navLinks = mainNav.querySelectorAll("a");

    navLinks.forEach((link) => {

      link.addEventListener("click", () => {

        mainNav.classList.remove("active");

        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );

      });

    });

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