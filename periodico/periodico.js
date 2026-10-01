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
  const soundBtn = document.getElementById("soundBtn");

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
    `/periodico/ediciones/${edicion.id}/pagina-${String(number).padStart(2, "0")}.jpg`;

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

  // En pantallas táctiles page-flip no recibe los toques: su manejo escucha
  // cada movimiento del dedo en toda la página y altera el desplazamiento
  // vertical. Aquí solo se detectan deslizamientos horizontales y toques
  // sobre el libro; el desplazamiento vertical queda en manos del navegador.
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

  function attachTouchGestures(target, reader) {
    let start = null;

    target.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) {
        start = null;
        return;
      }
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }, { passive: true });

    target.addEventListener("touchend", (event) => {
      if (!start) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const isTap = Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - start.time < 350;
      start = null;

      // Deslizamiento claramente horizontal: como pasar la hoja con el dedo.
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) reader.next();
        else reader.prev();
        return;
      }

      // Toque: mitad derecha avanza, mitad izquierda retrocede.
      if (isTap) {
        const bounds = target.getBoundingClientRect();
        if (touch.clientX - bounds.left > bounds.width / 2) reader.next();
        else reader.prev();
      }
    }, { passive: true });

    target.addEventListener("touchcancel", () => (start = null), { passive: true });
  }

  // Algunos navegadores móviles desplazan la página mientras se dibuja el giro.
  // Si el sitio se movió sin que la persona estuviera tocando la pantalla,
  // al terminar el giro se vuelve a la posición en que estaba.
  let isTouching = false;
  let scrollBeforeFlip = null;

  document.addEventListener("touchstart", () => (isTouching = true), { passive: true, capture: true });
  ["touchend", "touchcancel"].forEach((type) =>
    document.addEventListener(type, () => (isTouching = false), { passive: true, capture: true })
  );

  function rememberScroll() {
    scrollBeforeFlip = window.scrollY;
  }

  function restoreScroll() {
    if (scrollBeforeFlip === null) return;
    const target = scrollBeforeFlip;
    scrollBeforeFlip = null;
    if (!isTouching && Math.abs(window.scrollY - target) > 40) {
      window.scrollTo({ top: target, behavior: "instant" });
    }
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
      useMouseEvents: !isTouch,
      maxShadowOpacity: 0.4,
      flippingTime: isTouch ? 650 : 800
    });

    // En horizontal se ven dos páginas a la vez, salvo la portada y una contraportada suelta.
    const report = (index) => {
      const isSpread = flip.getOrientation() === "landscape" && index > 0 && index + 1 < edicion.paginas;
      updateStatus(index, isSpread ? 2 : 1);
    };

    flip.loadFromHTML(pages);
    flip.on("flip", (event) => report(event.data));
    flip.on("changeOrientation", () => report(flip.getCurrentPageIndex()));
    flip.on("changeState", (event) => {
      if (event.data === "flipping") {
        playPageSound();
        rememberScroll();
      }
      if (event.data === "read") restoreScroll();
    });
    report(0);

    const reader = {
      next: () => flip.flipNext("bottom"),
      prev: () => flip.flipPrev("bottom"),
      destroy: () => flip.destroy()
    };

    if (isTouch) attachTouchGestures(frame, reader);

    return reader;
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
    frame.style.maxWidth = `max(300px, calc((100svh - 230px) * ${(2 * edicion.ancho) / edicion.alto}))`;
    bookStage.append(frame);

    reader = createFlipReader(edicion, frame);
    bookLoading.hidden = true;
  }


  /* =========================
     SONIDO
  ========================== */

  const SOUND_KEY = "periodico-sonido";
  const SOUND_VOLUME = 0.35;

  // iOS ignora el volumen de los elementos <audio>, así que el sonido se
  // reproduce con Web Audio y un control de ganancia. El contexto se crea con
  // el primer toque o clic, como exigen los navegadores móviles.
  const pageSound = new Audio("/periodico/pasar-pagina.mp3");
  pageSound.preload = "auto";
  pageSound.volume = SOUND_VOLUME;

  let audioContext = null;
  let soundBuffer = null;

  function initAudio() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (audioContext || !Context) return;

    audioContext = new Context();
    fetch("/periodico/pasar-pagina.mp3")
      .then((response) => response.arrayBuffer())
      .then((data) => audioContext.decodeAudioData(data))
      .then((buffer) => (soundBuffer = buffer))
      .catch(() => {});
  }

  ["pointerdown", "touchstart", "keydown"].forEach((type) =>
    document.addEventListener(type, initAudio, { once: true, passive: true })
  );

  let soundOn = true;
  try {
    soundOn = localStorage.getItem(SOUND_KEY) !== "off";
  } catch {}

  function renderSoundButton() {
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    soundBtn.textContent = soundOn ? "🔊 Sonido" : "🔇 Sin sonido";
  }

  function playPageSound() {
    if (!soundOn) return;

    try {
      if (audioContext && soundBuffer) {
        if (audioContext.state === "suspended") audioContext.resume();

        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        source.buffer = soundBuffer;
        gain.gain.value = SOUND_VOLUME;
        source.connect(gain).connect(audioContext.destination);
        source.start();
        return;
      }

      pageSound.currentTime = 0;
      pageSound.play().catch(() => {});
    } catch {}
  }

  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    try {
      localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off");
    } catch {}
    renderSoundButton();
  });

  renderSoundButton();

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
    document.querySelector(".reader-hint").textContent = "Desliza la página hacia los lados o toca su borde derecho o izquierdo.";
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
