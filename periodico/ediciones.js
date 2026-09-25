/* =========================================================
   MICHELANGELO COMUNIDAD
   ediciones.js — Ediciones del Periódico Escolar

   Para publicar una edición nueva:
   1. Crea la carpeta periodico/ediciones/<id>/ con las páginas
      en JPG: pagina-01.jpg, pagina-02.jpg, ...
   2. Agrega la edición AL INICIO de esta lista (la primera es
      la que se muestra por defecto).
========================================================= */

window.EDICIONES = [
  {
    id: "edicion-prueba",
    titulo: "Edición de prueba",
    fecha: "2026",
    descripcion:
      "Once páginas creadas por la comunidad escolar para probar el lector digital del periódico.",
    paginas: 11,
    // Tamaño de las imágenes de página, en píxeles.
    ancho: 1020,
    alto: 1320,
    pdf: "https://periodicoescolarmichelangelo.vercel.app/assets/edicion-prueba/edicion-de-prueba.pdf"
  }
];
