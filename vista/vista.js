// vista.js
// Vista: anima paso a paso cómo el patrón se desplaza y salta sobre el texto.
// el modelo (obtenerTabla) para reconstruir cada comparación y cada salto.
// Va dentro de una función para no chocar con los nombres de app.js.

(function () {
  // 1. Referencias a los elementos del HTML
  const entradaTexto = document.getElementById("texto");
  const entradaPatron = document.getElementById("patron");
  const botonBuscar = document.getElementById("btnBuscar");
  const textoError = document.getElementById("mensajeError");
  const tablaSaltos = document.getElementById("cuerpoTabla");

  const simulacion = document.getElementById("simulacion");
  const pista = document.getElementById("pista");
  const lienzo = document.getElementById("lienzo");
  const filaIndices = document.getElementById("filaIndices");
  const filaTexto = document.getElementById("filaTexto");
  const filaPatron = document.getElementById("filaPatron");
  const flechaSalto = document.getElementById("flechaSalto");
  const etiquetaSalto = document.getElementById("etiquetaSalto");
  const explicacion = document.getElementById("explicacion");
  const contadorPaso = document.getElementById("contadorPaso");
  const historial = document.getElementById("historial");

  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnAnterior = document.getElementById("btnAnterior");
  const btnReproducir = document.getElementById("btnReproducir");
  const btnSiguiente = document.getElementById("btnSiguiente");
  const velocidad = document.getElementById("velocidad");

  const statIntentos = document.getElementById("statIntentos");
  const statComparaciones = document.getElementById("statComparaciones");
  const statEncontradas = document.getElementById("statEncontradas");

  const PASO_PX = 44; // ancho de casilla (40px) + separación (4px)
  const DEMORAS = [1400, 1000, 700, 400, 180]; // ms por paso según la velocidad

  // Estado de la animación
  let texto = "";
  let patron = "";
  let pasos = [];
  let actual = 0;
  let temporizador = null;

  // 2. Se ejecuta después del controlador, en el mismo clic
  botonBuscar.addEventListener("click", preparar);

  function preparar() {
    pausar();

    // Si el controlador mostró un error, no hay nada que animar
    if (textoError.textContent !== "") {
      simulacion.classList.add("hidden");
      return;
    }

    texto = entradaTexto.value;
    patron = entradaPatron.value;

    const horspool = new BooyerMooreHorspool(patron);
    pasos = construirPasos(texto, patron, horspool.obtenerTabla());

    // Comprobación: la animación debe encontrar lo mismo que el modelo
    const ultimo = pasos[pasos.length - 1];
    const delModelo = horspool.buscar(texto);
    if (ultimo.encontradas.join(",") !== delModelo.join(",")) {
      console.warn("La vista y el modelo no coinciden", ultimo.encontradas, delModelo);
    }

    dibujarPista();
    dibujarHistorial();
    simulacion.classList.remove("hidden");
    irA(0);
  }

  // 3. Reconstruir la búsqueda como una lista de pasos
  function construirPasos(T, P, tabla) {
    const n = T.length;
    const m = P.length;
    const lista = [];
    const encontradas = [];
    let comparaciones = 0;
    let intentos = 0;

    function saltoDe(c) {
      const fila = tabla.filas.find(f => f.caracter === c);
      return fila ? fila.salto : tabla.otros;
    }

    let i = 0;
    while (i <= n - m) {
      intentos++;
      const comparados = [];
      let j = m - 1;

      // Se compara de derecha a izquierda
      while (j >= 0) {
        const ok = P[j] === T[i + j];
        comparaciones++;
        comparados.push({ j: j, ok: ok });
        lista.push({
          tipo: "comparar", i: i, j: j, ok: ok,
          comparados: comparados.slice(),
          encontradas: encontradas.slice(),
          intentos: intentos, comparaciones: comparaciones
        });
        if (!ok) break;
        j--;
      }

      const coincide = j < 0;
      if (coincide) encontradas.push(i);

      // Salto según el carácter del texto bajo el último del patrón
      const c = T[i + m - 1];
      const enTabla = tabla.filas.some(f => f.caracter === c);
      const s = saltoDe(c);
      lista.push({
        tipo: "salto", i: i, c: c, s: s, enTabla: enTabla, coincide: coincide,
        comparados: comparados.slice(),
        encontradas: encontradas.slice(),
        intentos: intentos, comparaciones: comparaciones
      });
      i += s;
    }

    lista.push({
      tipo: "fin", i: i, comparados: [],
      encontradas: encontradas.slice(),
      intentos: intentos, comparaciones: comparaciones
    });
    return lista;
  }

  // 4. Dibujar las casillas del texto y del patrón
  function dibujarPista() {
    const m = patron.length;
    const ultimoI = pasos[pasos.length - 1].i;
    const columnas = Math.max(texto.length, ultimoI + m);
    lienzo.style.width = columnas * PASO_PX + "px";

    filaIndices.innerHTML = "";
    filaTexto.innerHTML = "";
    filaPatron.innerHTML = "";

    for (let k = 0; k < texto.length; k++) {
      const indice = document.createElement("div");
      indice.className = "celda flex h-4 items-end justify-center";
      indice.style.height = "16px";
      indice.textContent = k;
      filaIndices.appendChild(indice);

      const casilla = document.createElement("div");
      casilla.className = "celda relative flex items-center justify-center rounded-lg font-mono text-lg font-semibold transition-all duration-300";
      casilla.textContent = visible(texto[k]);
      filaTexto.appendChild(casilla);
    }

    for (let j = 0; j < m; j++) {
      const casilla = document.createElement("div");
      casilla.className = "celda flex items-center justify-center rounded-lg font-mono text-lg font-bold shadow-sm transition-all duration-300";
      casilla.textContent = visible(patron[j]);
      filaPatron.appendChild(casilla);
    }
  }

  // Espacios y saltos de línea se muestran con un símbolo
  function visible(c) {
    if (c === " ") return "␣";
    if (c === "\n") return "↵";
    if (c === "\t") return "⇥";
    return c;
  }

  // 5. Mostrar un paso concreto
  function irA(indice) {
    actual = Math.max(0, Math.min(indice, pasos.length - 1));
    const paso = pasos[actual];
    const m = patron.length;
    const i = paso.i;

    // Mover el patrón a su posición
    filaPatron.style.transform = "translateX(" + i * PASO_PX + "px)";

    // Estado de cada comparación del patrón: j -> true/false
    const estado = {};
    for (const comp of paso.comparados) estado[comp.j] = comp.ok;

    // Casillas del texto
    const enEncontrada = new Set();
    for (const p of paso.encontradas) {
      for (let k = p; k < p + m; k++) enEncontrada.add(k);
    }
    const casillasTexto = filaTexto.children;
    for (let k = 0; k < casillasTexto.length; k++) {
      const j = k - i;
      const enVentana = paso.tipo !== "fin" && j >= 0 && j < m;
      let clases = "bg-white text-neutral-700 ring-1 ring-neutral-200";
      if (enVentana) {
        clases = "bg-red-50 text-red-900 ring-1 ring-red-300";
        if (estado[j] === true) clases = "bg-red-600 text-white ring-0";
        if (estado[j] === false) clases = "bg-neutral-800 text-white ring-0";
      }
      if (paso.tipo === "salto" && j === m - 1) {
        clases += " outline outline-4 outline-red-300 -tranneutral-y-1";
      }
      casillasTexto[k].className =
        "celda relative flex items-center justify-center rounded-lg font-mono text-lg font-semibold transition-all duration-300 " + clases +
        (enEncontrada.has(k) ? " border-b-4 border-red-600" : "");
    }

    // Casillas del patrón
    const casillasPatron = filaPatron.children;
    for (let j = 0; j < m; j++) {
      let clases = "bg-white text-red-700 ring-2 ring-inset ring-red-600";
      if (estado[j] === true) clases = "bg-red-600 text-white";
      if (estado[j] === false) clases = "bg-neutral-800 text-white animate-pulse";
      if (paso.tipo === "fin") clases = "bg-neutral-300 text-neutral-500";
      if (paso.tipo === "comparar" && j === paso.j) clases += " -tranneutral-y-1 scale-110";
      casillasPatron[j].className =
        "celda flex items-center justify-center rounded-lg font-mono text-lg font-bold shadow-sm transition-all duration-300 " + clases;
    }

    dibujarFlecha(paso);
    resaltarTabla(paso);
    explicacion.innerHTML = explicar(paso);
    actualizarHistorial(paso);

    contadorPaso.textContent = "Paso " + (actual + 1) + " de " + pasos.length;
    statIntentos.textContent = paso.intentos;
    statComparaciones.textContent = paso.comparaciones;
    statEncontradas.textContent = paso.encontradas.length;

    btnAnterior.disabled = actual === 0;
    btnSiguiente.disabled = actual === pasos.length - 1;

    seguirConLaVista(paso);
  }

  // Flecha punteada que muestra el tamaño del salto
  function dibujarFlecha(paso) {
    if (paso.tipo !== "salto") {
      flechaSalto.style.opacity = "0";
      return;
    }
    flechaSalto.style.left = (paso.i * PASO_PX + 20) + "px";
    flechaSalto.style.width = (paso.s * PASO_PX) + "px";
    flechaSalto.style.opacity = "1";
    etiquetaSalto.textContent = "salto +" + paso.s;
  }

  // Resaltar en la tabla del controlador la fila usada para saltar
  function resaltarTabla(paso) {
    for (const tr of tablaSaltos.children) {
      tr.classList.remove("bg-red-100", "font-bold", "text-red-800");
    }
    if (paso.tipo !== "salto") return;

    for (const tr of tablaSaltos.children) {
      const caracter = tr.firstChild.textContent;
      const esLaFila = paso.enTabla ? caracter === paso.c : caracter === "Otros";
      if (esLaFila) tr.classList.add("bg-red-100", "font-bold", "text-red-800");
    }
  }

  function letra(c) {
    return '<code class="rounded bg-white px-1.5 py-0.5 font-bold ring-1 ring-neutral-200">' + escapar(visible(c)) + "</code>";
  }

  function escapar(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Texto que explica lo que pasa en el paso actual
  function explicar(paso) {
    const m = patron.length;
    if (paso.tipo === "comparar") {
      const k = paso.i + paso.j;
      const inicio = paso.j === m - 1
        ? "<p class='mb-1 font-semibold text-red-700'>Patrón alineado en la posición " + paso.i + ". Se compara de derecha a izquierda.</p>"
        : "";
      if (paso.ok) {
        return inicio + "P[" + paso.j + "] = " + letra(patron[paso.j]) + " coincide con T[" + k + "] = " + letra(texto[k]) +
          ' <span class="font-semibold text-red-700">✓</span>';
      }
      return inicio + "P[" + paso.j + "] = " + letra(patron[paso.j]) + " es distinto de T[" + k + "] = " + letra(texto[k]) +
        ' <span class="font-semibold text-neutral-900">✗ no coincide</span>, se deja de comparar.';
    }

    if (paso.tipo === "salto") {
      const k = paso.i + m - 1;
      const resultado = paso.coincide
        ? "<p class='mb-1 font-semibold text-red-700'>¡Patrón encontrado en la posición " + paso.i + "!</p>"
        : "";
      const fila = paso.enTabla ? "el carácter " + letra(paso.c) : letra(paso.c) + " no está en el patrón (fila <b>Otros</b>)";
      return resultado + "El carácter del texto bajo el último del patrón es T[" + k + "] = " + letra(paso.c) +
        ". En la tabla, " + fila + " da un salto de <b>" + paso.s + "</b>, así que el patrón pasa de la posición " +
        paso.i + " a la <b>" + (paso.i + paso.s) + "</b>.";
    }

    const total = paso.encontradas.length;
    return "<p class='mb-1 font-semibold text-red-700'>Búsqueda terminada.</p>" +
      "El patrón quedaría en la posición " + paso.i + ", pero ya no cabe en el texto (" +
      paso.i + " + " + m + " &gt; " + texto.length + "). " +
      (total > 0
        ? "Se encontró <b>" + total + "</b> " + (total === 1 ? "vez" : "veces") + ", en: <b>" + paso.encontradas.join(", ") + "</b>."
        : "El patrón <b>no aparece</b> en el texto.") +
      " Se hicieron " + paso.comparaciones + " comparaciones en " + paso.intentos + " alineaciones.";
  }

  // 6. Historial: una línea por cada salto
  function dibujarHistorial() {
    historial.innerHTML = "";
    pasos.forEach((paso, indice) => {
      if (paso.tipo !== "salto") return;
      const li = document.createElement("li");
      li.dataset.paso = indice;
      li.className = "cursor-pointer rounded-lg px-3 py-1.5 transition hover:bg-neutral-100";
      li.innerHTML =
        '<span class="font-mono text-neutral-400">i=' + paso.i + "</span> " +
        (paso.coincide
          ? '<span class="font-semibold text-red-700">coincide</span>'
          : '<span class="text-neutral-700">falla</span>') +
        " · " + letra(paso.c) + " → salto <b>+" + paso.s + "</b>";
      li.addEventListener("click", () => { pausar(); irA(indice); });
      historial.appendChild(li);
    });
  }

  function actualizarHistorial(paso) {
    for (const li of historial.children) {
      const p = pasos[li.dataset.paso];
      const activo = p.i === paso.i && paso.tipo !== "fin";
      li.classList.toggle("bg-red-100", activo);
      li.classList.toggle("opacity-40", !activo && Number(li.dataset.paso) > actual);
    }
  }

  // Desplaza la pista para que el patrón siempre se vea
  function seguirConLaVista(paso) {
    const centro = (paso.i + patron.length / 2) * PASO_PX;
    pista.scrollTo({ left: centro - pista.clientWidth / 2, behavior: "smooth" });
  }

  // 7. Controles de reproducción
  const ICONO_PLAY = '<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4v12l9-6z"/></svg>';
  const ICONO_PAUSA = '<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5 4h4v12H5zM11 4h4v12h-4z"/></svg>';

  function reproducir() {
    if (actual === pasos.length - 1) irA(0);
    btnReproducir.innerHTML = ICONO_PAUSA + "Pausar";
    avanzar();
  }

  function avanzar() {
    temporizador = setTimeout(() => {
      irA(actual + 1);
      if (actual < pasos.length - 1) avanzar();
      else pausar();
    }, DEMORAS[velocidad.value - 1]);
  }

  function pausar() {
    clearTimeout(temporizador);
    temporizador = null;
    btnReproducir.innerHTML = ICONO_PLAY + "Reproducir";
  }

  btnReproducir.addEventListener("click", () => (temporizador ? pausar() : reproducir()));
  btnSiguiente.addEventListener("click", () => { pausar(); irA(actual + 1); });
  btnAnterior.addEventListener("click", () => { pausar(); irA(actual - 1); });
  btnReiniciar.addEventListener("click", () => { pausar(); irA(0); });

  // Atajos de teclado (solo si no se está escribiendo)
  document.addEventListener("keydown", (e) => {
    if (simulacion.classList.contains("hidden")) return;
    const etiqueta = e.target.tagName;
    if (etiqueta === "TEXTAREA" || etiqueta === "INPUT" || etiqueta === "BUTTON") return;
    if (e.key === "ArrowRight") { pausar(); irA(actual + 1); }
    if (e.key === "ArrowLeft") { pausar(); irA(actual - 1); }
    if (e.key === " ") { e.preventDefault(); btnReproducir.click(); }
  });

  // 8. Encabezado: al bajar, aparece la barra con el logo pequeño de la universidad
  const encabezado = document.getElementById("encabezado");
  const barraCompacta = document.getElementById("barraCompacta");
  new IntersectionObserver((entradas) => {
    barraCompacta.classList.toggle("-translate-y-full", entradas[0].isIntersecting);
    barraCompacta.classList.toggle("opacity-0", entradas[0].isIntersecting);
  }).observe(encabezado.firstElementChild); // la franja blanca con los logos

  // Mostrar el ejemplo al abrir la página
  botonBuscar.click();
})();
