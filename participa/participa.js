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
  import("https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js")
]).then(([firebaseApp, firestore]) => {
  const app = firebaseApp.initializeApp(firebaseConfig);
  const db = firestore.getFirestore(app);

  return {
    db,
    addDoc: firestore.addDoc,
    collection: firestore.collection,
    serverTimestamp: firestore.serverTimestamp
  };
});


document.addEventListener("DOMContentLoaded", () => {



  /* =======================================================

     ELEMENTOS

  ======================================================= */



  const menuToggle =

    document.getElementById("menuToggle");



  const mainNav =

    document.getElementById("mainNav");



  const categoryCards =

    document.querySelectorAll(".category-card");



  const formSection =

    document.getElementById("formSection");



  const closeForm =

    document.getElementById("closeForm");



  const form =

    document.getElementById("participationForm");



  const formLabel =

    document.getElementById("formLabel");



  const formTitle =

    document.getElementById("formTitle");



  const formDescription =

    document.getElementById("formDescription");



  const contentHeading =

    document.getElementById("contentHeading");



  const contentHelp =

    document.getElementById("contentHelp");



  const dynamicFields =

    document.getElementById("dynamicFields");



  const submissionType =

    document.getElementById("submissionType");



  const errorMessage =

    document.getElementById("errorMessage");



  const successScreen =

    document.getElementById("successScreen");



  const newSubmission =

    document.getElementById("newSubmission");



  const currentYear =

    document.getElementById("currentYear");





  /* =======================================================

     AÑO

  ======================================================= */



  if (currentYear) {

    currentYear.textContent =

      new Date().getFullYear();

  }





  /* =======================================================

     MENÚ MÓVIL

  ======================================================= */



  if (menuToggle && mainNav) {



    menuToggle.addEventListener("click", () => {



      const open =

        mainNav.classList.toggle("active");



      menuToggle.setAttribute(

        "aria-expanded",

        open ? "true" : "false"

      );



    });





    mainNav

      .querySelectorAll("a")

      .forEach((link) => {



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

     CONFIGURACIÓN DE FORMULARIOS

  ======================================================= */



  const forms = {



    periodico: {



      label: "PERIÓDICO ESCOLAR",



      title:

        "Cuéntanos qué quieres escribir.",



      description:

        "Puedes proponer una noticia, entrevista, columna, reportaje u otro contenido.",



      heading:

        "Tu artículo o propuesta",



      help:

        "No es necesario que el artículo esté terminado. También puedes enviarnos una idea.",



      html: `

        <div class="fields-grid">



          <div class="field full">



            <label for="proposalTitle">

              Título o tema

              <span>*</span>

            </label>



            <input

              type="text"

              id="proposalTitle"

              name="proposalTitle"

              required

            >



          </div>





          <div class="field">



            <label for="articleType">

              Tipo de contenido

            </label>



            <select

              id="articleType"

              name="articleType"

            >

              <option value="">

                Selecciona una opción

              </option>



              <option>Noticia</option>

              <option>Entrevista</option>

              <option>Columna</option>

              <option>Reportaje</option>

              <option>Reseña</option>

              <option>Opinión</option>

              <option>Otro</option>

            </select>



          </div>





          <div class="field">



            <label for="articleStatus">

              ¿En qué etapa está?

            </label>



            <select

              id="articleStatus"

              name="articleStatus"

            >

              <option value="">

                Selecciona

              </option>



              <option>Es solo una idea</option>

              <option>Estoy comenzando a escribirlo</option>

              <option>Ya tengo un borrador</option>

              <option>Está terminado</option>

            </select>



          </div>





          <div class="field full">



            <label for="proposalDescription">

              Cuéntanos tu propuesta

              <span>*</span>

            </label>



            <textarea

              id="proposalDescription"

              name="proposalDescription"

              required

              placeholder="¿De qué quieres escribir? ¿Por qué te parece interesante?"

            ></textarea>



          </div>



        </div>

      `



    },





    creacion: {



      label: "CREACIONES",



      title:

        "Comparte algo que hayas creado.",



      description:

        "Este espacio puede reunir arte, fotografía, literatura, música y muchas otras formas de expresión.",



      heading:

        "Tu creación",



      help:

        "Cuéntanos qué hiciste y, si corresponde, selecciona el archivo.",



      html: `

        <div class="fields-grid">



          <div class="field full">



            <label for="proposalTitle">

              Nombre de tu creación

              <span>*</span>

            </label>



            <input

              type="text"

              id="proposalTitle"

              name="proposalTitle"

              required

            >



          </div>





          <div class="field">



            <label for="creationType">

              Tipo de creación

              <span>*</span>

            </label>



            <select

              id="creationType"

              name="creationType"

              required

            >

              <option value="">

                Selecciona

              </option>



              <option>Ilustración</option>

              <option>Pintura</option>

              <option>Fotografía</option>

              <option>Poesía</option>

              <option>Cuento</option>

              <option>Texto</option>

              <option>Música</option>

              <option>Video</option>

              <option>Otro</option>

            </select>



          </div>





          <div class="field full">



            <label for="proposalDescription">

              Cuéntanos sobre tu creación

              <span>*</span>

            </label>



            <textarea

              id="proposalDescription"

              name="proposalDescription"

              required

              placeholder="Puedes contarnos cómo nació, qué representa o cualquier cosa que quieras compartir sobre ella."

            ></textarea>



          </div>



        </div>





        <div class="file-field">



          <label for="creationFile">

            Adjuntar creación

          </label>



          <p>

            Esta opción se habilitará completamente

            cuando conectemos el almacenamiento del sitio.

          </p>



          <input

            type="file"

            id="creationFile"

            name="creationFile"

            accept="image/*,audio/*,video/*,.pdf,.doc,.docx"

          >



        </div>

      `



    },





    podcast: {



      label: "MICHELANGELO PODCAST",



      title:

        "¿De qué deberíamos conversar?",



      description:

        "Propón un tema, una pregunta o una conversación para un próximo episodio.",



      heading:

        "Tu propuesta para el podcast",



      help:

        "No hay temas demasiado pequeños si pueden generar una buena conversación.",



      html: `

        <div class="fields-grid">



          <div class="field full">



            <label for="proposalTitle">

              Tema del episodio

              <span>*</span>

            </label>



            <input

              type="text"

              id="proposalTitle"

              name="proposalTitle"

              required

              placeholder="Ej: ¿Cómo está cambiando la inteligencia artificial nuestra forma de estudiar?"

            >



          </div>





          <div class="field full">



            <label for="proposalDescription">

              ¿Por qué deberíamos hablar de esto?

              <span>*</span>

            </label>



            <textarea

              id="proposalDescription"

              name="proposalDescription"

              required

            ></textarea>



          </div>



        </div>





        <label class="checkbox-row">



          <input

            type="checkbox"

            id="wantsToParticipate"

            name="wantsToParticipate"

          >



          <span class="custom-checkbox"></span>



          <span>

            Me gustaría participar en la conversación

            si este tema se convierte en un episodio.

          </span>



        </label>

      `



    },





    idea: {



      label: "IDEAS",



      title:

        "Las buenas ideas pueden empezar aquí.",



      description:

        "Propón algo nuevo para Michelangelo Comunidad.",



      heading:

        "Tu idea",



      help:

        "Puede ser una actividad, una nueva sección, un proyecto o algo completamente distinto.",



      html: `

        <div class="fields-grid">



          <div class="field full">



            <label for="proposalTitle">

              Ponle un nombre a tu idea

              <span>*</span>

            </label>



            <input

              type="text"

              id="proposalTitle"

              name="proposalTitle"

              required

            >



          </div>





          <div class="field full">



            <label for="proposalDescription">

              Explícanos tu idea

              <span>*</span>

            </label>



            <textarea

              id="proposalDescription"

              name="proposalDescription"

              required

              placeholder="¿Qué propones? ¿Cómo podría funcionar?"

            ></textarea>



          </div>





          <div class="field full">



            <label for="ideaReason">

              ¿Por qué crees que sería interesante?

            </label>



            <textarea

              id="ideaReason"

              name="ideaReason"

            ></textarea>



          </div>



        </div>

      `



    }



  };





  /* =======================================================

     ABRIR FORMULARIO

  ======================================================= */



  function openForm(type) {



    const config = forms[type];



    if (!config) {

      return;

    }





    form.reset();



    clearErrors();





    submissionType.value =

      type;



    formLabel.textContent =

      config.label;



    formTitle.textContent =

      config.title;



    formDescription.textContent =

      config.description;



    contentHeading.textContent =

      config.heading;



    contentHelp.textContent =

      config.help;



    dynamicFields.innerHTML =

      config.html;





    successScreen.classList.remove(

      "active"

    );



    successScreen.setAttribute(

      "aria-hidden",

      "true"

    );





    formSection.classList.add(

      "active"

    );



    formSection.setAttribute(

      "aria-hidden",

      "false"

    );





    setTimeout(() => {



      formSection.scrollIntoView({

        behavior: "smooth",

        block: "start"

      });



    }, 50);



  }





  /* =======================================================

     CERRAR FORMULARIO

  ======================================================= */



  function closeCurrentForm() {



    formSection.classList.remove(

      "active"

    );



    formSection.setAttribute(

      "aria-hidden",

      "true"

    );





    document

      .getElementById("participar")

      .scrollIntoView({

        behavior: "smooth",

        block: "start"

      });



  }





  /* =======================================================

     TARJETAS

  ======================================================= */



  categoryCards.forEach((card) => {



    card.addEventListener("click", () => {



      const type =

        card.dataset.category;



      openForm(type);



    });



  });





  if (closeForm) {



    closeForm.addEventListener(

      "click",

      closeCurrentForm

    );



  }





  /* =======================================================

     VALIDACIÓN

  ======================================================= */



  function clearErrors() {



    if (!form) {

      return;

    }



    form

      .querySelectorAll(".invalid")

      .forEach((element) => {



        element.classList.remove(

          "invalid"

        );



      });





    errorMessage.classList.remove(

      "active"

    );



    errorMessage.textContent = "";



  }





  function validateForm() {



    clearErrors();



    const requiredFields =

      form.querySelectorAll("[required]");



    let valid = true;





    requiredFields.forEach((field) => {



      if (

        field.type === "checkbox" &&

        !field.checked

      ) {



        valid = false;



        return;



      }





      if (

        field.type !== "checkbox" &&

        !field.value.trim()

      ) {



        valid = false;



        field.classList.add(

          "invalid"

        );



      }



    });





    if (!valid) {



      errorMessage.textContent =

        "Revisa los campos obligatorios antes de continuar.";



      errorMessage.classList.add(

        "active"

      );



    }





    return valid;



  }





  /* =======================================================
     ENVÍO A FIREBASE
  ======================================================= */

  function getFormValue(formData, names) {
    for (const name of names) {
      const value = formData.get(name);
      if (value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
    return "";
  }


  function getCheckboxValue(names) {
    for (const name of names) {
      const element =
        form.elements[name] ||
        document.getElementById(name);

      if (element && element.type === "checkbox") {
        return element.checked;
      }
    }
    return false;
  }


  function buildDetails(type, formData) {
    const details = {};

    if (type === "periodico") {
      details.tipoContenido =
        getFormValue(formData, ["articleType"]);

      details.etapa =
        getFormValue(formData, ["articleStatus"]);
    }

    if (type === "creacion") {
      details.tipoCreacion =
        getFormValue(formData, ["creationType"]);

      // El archivo se conectará después con Firebase Storage.
    }

    if (type === "idea") {
      details.porQueInteresante =
        getFormValue(formData, ["ideaReason"]);
    }

    return details;
  }


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      const submitButton =
        form.querySelector('button[type="submit"]');

      const originalButtonText =
        submitButton
          ? submitButton.textContent
          : "";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";
      }

      clearErrors();

      try {
        const {
          db,
          addDoc,
          collection,
          serverTimestamp
        } = await firebaseReady;

        const formData = new FormData(form);
        const type = submissionType.value;

        const name =
          getFormValue(formData, [
            "studentName",
            "student_name",
            "name",
            "nombre"
          ]);

        const course =
          getFormValue(formData, [
            "studentCourse",
            "student_course",
            "course",
            "curso"
          ]);

        const anonymous =
          getCheckboxValue([
            "anonymousPublic",
            "anonymous_public",
            "anonymous",
            "anonimo",
            "publishAnonymously"
          ]);

        const wantsToParticipate =
          getCheckboxValue([
            "wantsToParticipate"
          ]);

        const title =
          getFormValue(
            formData,
            ["proposalTitle"]
          );

        const description =
          getFormValue(
            formData,
            ["proposalDescription"]
          );

        const details =
          buildDetails(type, formData);

        const aporte = {
          tipo: type,
          nombre: name || "Estudiante",
          curso: course || "Sin especificar",
          anonimoPublicamente: anonymous,
          titulo: title,
          descripcion: description,
          detalles: details,
          quiereParticipar: wantsToParticipate,
          estado: "pendiente",
          creadoEn: serverTimestamp()
        };

        await addDoc(
          collection(db, "aportes"),
          aporte
        );

        formSection.classList.remove("active");

        formSection.setAttribute(
          "aria-hidden",
          "true"
        );

        successScreen.classList.add("active");

        successScreen.setAttribute(
          "aria-hidden",
          "false"
        );

        successScreen.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        form.reset();

      } catch (error) {
        console.error(
          "Error al enviar el aporte:",
          error
        );

        errorMessage.textContent =
          "No pudimos enviar tu propuesta. Inténtalo nuevamente en unos momentos.";

        errorMessage.classList.add("active");

        errorMessage.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent =
            originalButtonText;
        }
      }

    }
  );


  /* =======================================================

     NUEVA PROPUESTA

  ======================================================= */



  if (newSubmission) {



    newSubmission.addEventListener(

      "click",

      () => {



        successScreen.classList.remove(

          "active"

        );



        successScreen.setAttribute(

          "aria-hidden",

          "true"

        );





        form.reset();



        dynamicFields.innerHTML = "";





        document

          .getElementById("participar")

          .scrollIntoView({

            behavior: "smooth",

            block: "start"

          });



      }

    );



  }



});