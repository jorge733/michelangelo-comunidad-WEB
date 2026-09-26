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

  let reader = null;
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

  // En pantallas táctiles se usa el deslizamiento nativo del navegador
  // (scroll-snap): page-flip escucha cada movimiento del dedo en toda la
  // página y puede bloquear o alterar el desplazamiento vertical.
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  function updateStatus(first, visible) {
    const total = current.paginas;
    const last = Math.min(first + visible, total);

    pageLabel.textContent = last > first + 1
      ? `Páginas ${first + 1}–${last} de ${total}`
      : `Página ${first + 1} de ${total}`;

    pageBar.style.width = `${(last / total) * 100}%`;
    prevBtn.disabled = first <= 0;
    nextBtn.disabled = last >= total;
  }

  function createPageImage(edicion, number) {
    const image = document.createElement("img");
    image.src = pagePath(edicion, number);
    image.alt = `${edicion.titulo}, página ${number}`;
    image.width = edicion.ancho;
    image.height = edicion.alto;
    image.loading = number <= 3 ? "eager" : "lazy";
    image.decoding = "async";
    image.draggable = false;
    return image;
  }

  function createFlipReader(edicion, frame) {
    const book = document.createElement("div");
    book.className = "book";
    frame.append(book);

    const pages = [];

    for (let number = 1; number <= edicion.paginas; number++) {
      const page = document.createElement("div");
      page.className = "book-page";
      if (number === 1 || number === edicion.paginas) page.dataset.density = "hard";
      page.append(createPageImage(edicion, number));
      book.append(page);
      pages.push(page);
    }

    const flip = new St.PageFlip(book, {
      width: edicion.ancho,
      height: edicion.alto,
      size: "stretch",
      minWidth: 260,
      maxWidth: 720,
      minHeight: 336,
      maxHeight: 932,
      showCover: true,
      usePortrait: true,
      maxShadowOpacity: 0.4,
      flippingTime: 800
    });

    // En horizontal se ven dos páginas a la vez, salvo la portada y una contraportada suelta.
    const report = (index) => {
      const isSpread = flip.getOrientation() === "landscape" && index > 0 && index + 1 < edicion.paginas;
      updateStatus(index, isSpread ? 2 : 1);
    };

    flip.loadFromHTML(pages);
    flip.on("flip", (event) => report(event.data));
    flip.on("changeOrientation", () => report(flip.getCurrentPageIndex()));
    report(0);

    return {
      next: () => flip.flipNext(),
      prev: () => flip.flipPrev(),
      destroy: () => flip.destroy()
    };
  }

  function createSwipeReader(edicion, frame) {
    const track = document.createElement("div");
    track.className = "page-slider";
    track.tabIndex = 0;
    track.setAttribute("aria-label", `${edicion.titulo}: desliza hacia los lados para cambiar de página`);
    track.style.setProperty("--page-ratio", `${edicion.ancho} / ${edicion.alto}`);
    frame.append(track);

    for (let number = 1; number <= edicion.paginas; number++) {
      const slide = document.createElement("figure");
      slide.className = "page-slide";
      slide.append(createPageImage(edicion, number));
      track.append(slide);
    }

    const step = () => track.firstElementChild.getBoundingClientRect().width +
      parseFloat(getComputedStyle(track).columnGap || 0);

    const report = () => {
      const size = step();
      const first = Math.round(track.scrollLeft / size);
      const visible = Math.max(1, Math.round(track.clientWidth / size));
      updateStatus(Math.min(first, edicion.paginas - 1), visible);
    };

    track.addEventListener("scroll", report, { passive: true });
    window.addEventListener("resize", report, { passive: true });
    report();

    return {
      next: () => track.scrollBy({ left: step(), behavior: "smooth" }),
      prev: () => track.scrollBy({ left: -step(), behavior: "smooth" }),
      destroy: () => {
        window.removeEventListener("resize", report);
        track.remove();
      }
    };
  }

  function buildBook(edicion) {
    reader?.destroy();
    reader = null;

    bookStage.querySelector(".book-frame")?.remove();
    bookLoading.hidden = false;

    // El marco limita el ancho del libro para que la página completa quepa
    // en la pantalla (page-flip reescribe los estilos del propio libro).
    const frame = document.createElement("div");
    frame.className = "book-frame";
    if (!isTouch) {
      frame.style.maxWidth = `max(300px, calc((100svh - 230px) * ${(2 * edicion.ancho) / edicion.alto}))`;
    }
    bookStage.append(frame);

    reader = isTouch ? createSwipeReader(edicion, frame) : createFlipReader(edicion, frame);
    bookLoading.hidden = true;
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

  prevBtn.addEventListener("click", () => reader?.prev());
  nextBtn.addEventListener("click", () => reader?.next());

  document.addEventListener("keydown", (event) => {
    if (!reader || event.target.closest("input, select, textarea")) return;
    if (event.key === "ArrowLeft") reader.prev();
    if (event.key === "ArrowRight") reader.next();
  });

  if (isTouch) {
    document.querySelector(".reader-hint").textContent = "Desliza la página hacia los lados para avanzar o retroceder.";
  }

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
