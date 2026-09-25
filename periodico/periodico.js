/* =========================================================
   MICHELANGELO COMUNIDAD
   periodico.js — Lector del Periódico Escolar
========================================================= */

(() => {
  const ediciones = window.EDICIONES || [];

  const bookStage = document.getElementById("bookStage");
  const bookLoading = document.getElementById("bookLoading");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageLabel = document.getElementById("pageLabel");
  const pageBar = document.getElementById("pageBar");
  const readerShell = document.getElementById("readerShell");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const editionSelect = document.getElementById("editionSelect");
  const editionSelectWrap = document.getElementById("editionSelectWrap");

  let pageFlip = null;
  let current = null;

  if (!ediciones.length) {
    bookLoading.textContent = "Pronto publicaremos la primera edición.";
    [prevBtn, nextBtn, fullscreenBtn].forEach((button) => (button.disabled = true));
    return;
  }


  /* =========================
     UTILIDADES
  ========================== */

  const pagePath = (edicion, number) =>
    `ediciones/${edicion.id}/pagina-${String(number).padStart(2, "0")}.jpg`;

  const setText = (id, text) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  };

  const setPdf = (id, url) => {
    const link = document.getElementById(id);
    if (!link) return;
    link.hidden = !url;
    if (url) link.href = url;
  };


  /* =========================
     INTRODUCCIÓN
  ========================== */

  function renderIntro(edicion) {
    setText("editionTitle", edicion.titulo);
    setText("editionDetails", [edicion.fecha, `${edicion.paginas} páginas`].filter(Boolean).join(" · "));
    setText("readerTitle", edicion.titulo);
    setPdf("introPdf", edicion.pdf);
    setPdf("readerPdf", edicion.pdf);

    const cover = document.getElementById("coverImage");
    cover.src = pagePath(edicion, 1);
    cover.alt = `Portada: ${edicion.titulo}`;
    cover.width = edicion.ancho;
    cover.height = edicion.alto;
  }


  /* =========================
     LECTOR
  ========================== */

  function updateStatus(index) {
    const total = current.paginas;
    // En horizontal se ven dos páginas a la vez, salvo la portada y una contraportada suelta.
    const isSpread = pageFlip.getOrientation() === "landscape" && index > 0 && index + 1 < total;
    const lastVisible = index + (isSpread ? 2 : 1);

    pageLabel.textContent = isSpread
      ? `Páginas ${index + 1}–${lastVisible} de ${total}`
      : `Página ${index + 1} de ${total}`;

    pageBar.style.width = `${(lastVisible / total) * 100}%`;
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = lastVisible >= total;
  }

  function buildBook(edicion) {
    if (pageFlip) {
      pageFlip.destroy();
      pageFlip = null;
    }

    bookStage.querySelector(".book-frame")?.remove();
    bookLoading.hidden = false;

    // El marco limita el ancho del libro abierto para que la página completa
    // quepa en la pantalla (page-flip reescribe los estilos del propio libro).
    const frame = document.createElement("div");
    frame.className = "book-frame";
    frame.style.maxWidth = `max(300px, calc((100svh - 230px) * ${(2 * edicion.ancho) / edicion.alto}))`;

    const book = document.createElement("div");
    book.className = "book";
    frame.append(book);
    bookStage.append(frame);

    const pages = [];

    for (let number = 1; number <= edicion.paginas; number++) {
      const page = document.createElement("div");
      page.className = "book-page";
      if (number === 1 || number === edicion.paginas) page.dataset.density = "hard";

      const image = document.createElement("img");
      image.src = pagePath(edicion, number);
      image.alt = `${edicion.titulo}, página ${number}`;
      image.loading = number <= 3 ? "eager" : "lazy";
      image.decoding = "async";
      image.draggable = false;

      page.append(image);
      book.append(page);
      pages.push(page);
    }

    pageFlip = new St.PageFlip(book, {
      width: edicion.ancho,
      height: edicion.alto,
      size: "stretch",
      minWidth: 260,
      maxWidth: 720,
      minHeight: 336,
      maxHeight: 932,
      showCover: true,
      usePortrait: true,
      mobileScrollSupport: true,
      maxShadowOpacity: 0.4,
      flippingTime: 800
    });

    pageFlip.loadFromHTML(pages);
    pageFlip.on("flip", (event) => updateStatus(event.data));
    pageFlip.on("changeOrientation", () => updateStatus(pageFlip.getCurrentPageIndex()));

    bookLoading.hidden = true;
    updateStatus(0);
  }

  function openEdition(id, { updateUrl = false } = {}) {
    current = ediciones.find((edicion) => edicion.id === id) || ediciones[0];
    editionSelect.value = current.id;

    renderIntro(current);
    buildBook(current);

    if (updateUrl) {
      const url = new URL(location.href);
      if (current.id === ediciones[0].id) url.searchParams.delete("edicion");
      else url.searchParams.set("edicion", current.id);
      history.replaceState(null, "", url);
    }
  }


  /* =========================
     SELECTOR DE EDICIONES
  ========================== */

  if (ediciones.length > 1) {
    editionSelectWrap.hidden = false;

    ediciones.forEach((edicion) => {
      const option = document.createElement("option");
      option.value = edicion.id;
      option.textContent = [edicion.titulo, edicion.fecha].filter(Boolean).join(" · ");
      editionSelect.append(option);
    });

    editionSelect.addEventListener("change", () =>
      openEdition(editionSelect.value, { updateUrl: true })
    );
  }


  /* =========================
     CONTROLES
  ========================== */

  prevBtn.addEventListener("click", () => pageFlip?.flipPrev());
  nextBtn.addEventListener("click", () => pageFlip?.flipNext());

  document.addEventListener("keydown", (event) => {
    if (!pageFlip || event.target.closest("input, select, textarea")) return;
    if (event.key === "ArrowLeft") pageFlip.flipPrev();
    if (event.key === "ArrowRight") pageFlip.flipNext();
  });

  if (!document.fullscreenEnabled) {
    fullscreenBtn.hidden = true;
  }

  fullscreenBtn.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else readerShell.requestFullscreen();
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenBtn.textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
  });


  /* =========================
     INICIO
  ========================== */

  openEdition(new URLSearchParams(location.search).get("edicion"));
})();
