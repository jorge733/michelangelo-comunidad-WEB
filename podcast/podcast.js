document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     AÑO
  ======================================================= */

  const currentYear =
    document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  /* =======================================================
     MENÚ MÓVIL
  ======================================================= */

  const menuToggle =
    document.getElementById("menuToggle");

  const mainNav =
    document.getElementById("mainNav");


  if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", () => {

      const isOpen =
        mainNav.classList.toggle("active");

      menuToggle.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );

    });


    const links =
      mainNav.querySelectorAll("a");


    links.forEach((link) => {

      link.addEventListener("click", () => {

        mainNav.classList.remove("active");

        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );

      });

    });

  }


  /* =======================================================
     REVEAL
  ======================================================= */

  const elements =
    document.querySelectorAll(
      ".spotify-wrapper, " +
      ".about-heading, " +
      ".about-text, " +
      ".principle, " +
      ".voices-visual, " +
      ".voices-content"
    );


  if ("IntersectionObserver" in window) {

    elements.forEach((element) => {
      element.classList.add("reveal");
    });


    const observer =
      new IntersectionObserver(

        (entries) => {

          entries.forEach((entry) => {

            if (entry.isIntersecting) {

              entry.target.classList.add(
                "visible"
              );

              observer.unobserve(
                entry.target
              );

            }

          });

        },

        {
          threshold: 0.12
        }

      );


    elements.forEach((element) => {
      observer.observe(element);
    });

  }

});