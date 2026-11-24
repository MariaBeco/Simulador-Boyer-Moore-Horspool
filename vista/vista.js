// vista.js
// Vista: anima paso a paso cómo el patrón se desplaza y salta sobre el texto.
// Usa las trazas del modelo para mostrar cada comparación y cada salto.
// Va dentro de una función para no chocar con los nombres de app.js.

(function () {
  // 1. Referencias a los elementos del HTML
  const tablaSaltos = document.getElementById("cuerpoTabla");

  const simulacion = document.getElementById("simulacion");
  const pista = document.getElementById("pista");
  const lienzo = document.getElementById("lienzo");
  const filaIndices = document.getElementById("filaIndices");
  const filaTexto = document.getElementById("filaTexto");
  const filaPatron = document.getElementById("filaPatron");
  const flechaSalto = document.getElementById("flechaSalto");
  const etiquetaSalto = document.getElementById("etiquetaSalto");
  const contadorPaso = document.getElementById("contadorPaso");

  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnAnterior = document.getElementById("btnAnterior");
  const btnReproducir = document.getElementById("btnReproducir");
  const btnSiguiente = document.getElementById("btnSiguiente");

  const PASO_PX = 44; // ancho de casilla (40px) + separación (4px)
  const DEMORA = 700; // ms por paso

  // Estado de la animación
  let texto = "";
  let patron = "";
  let posiciones = [];
  let trazas = [];
  let pasos = [];
  let actual = 0;
  let temporizador = null;

  // 2. El controlador avisa cuando hay una búsqueda nueva (o null si se limpió)
  document.addEventListener("busqueda", (e) => preparar(e.detail));

  function preparar(datos) {
    pausar();
    if (!datos) {
      simulacion.classList.add("hidden");
      return;
    }

    patron = datos.patron;
    posiciones = datos.posiciones;
    texto = datos.texto;
    trazas = construirTrazas(datos.texto, patron, datos.tabla);

    // Comprobación: las trazas deben encontrar lo mismo que el modelo
    const deTrazas = trazas.filter(t => t.coincide).map(t => t.i);
    if (deTrazas.join(",") !== posiciones.join(",")) {
      console.warn("Las trazas y el modelo no coinciden");
    }

    pasos = construirPasos(trazas);

    simulacion.classList.remove("hidden");
    dibujarPista();
    VistaTrazas.mostrar(datos, trazas, (indice) => {
      pausar();
      irA(pasos.findIndex(p => p.tipo === "salto" && p.indice === indice));
    });
    irA(0);
  }

  // 3. Lista de pasos: cada comparación, cada salto y el final.
  // El detalle se calcula al mostrar el paso, para no ocupar memoria de más.
  function construirPasos(lista) {
    const salida = [];
    lista.forEach((t, indice) => {
      for (let k = 0; k < t.comps; k++) salida.push({ tipo: "comparar", indice: indice, k: k });
      salida.push({ tipo: "salto", indice: indice });
    });
    salida.push({ tipo: "fin", indice: lista.length });
    return salida;
  }

  function detalle(paso) {
    const m = patron.length;
    if (paso.tipo === "fin") {
      const t = trazas[paso.indice - 1];
      return {
        tipo: "fin", indice: -1, i: t.i + t.s, comparados: [],
        encontradas: posiciones.slice(0, t.encAntes + (t.coincide ? 1 : 0))
      };
    }
    const t = trazas[paso.indice];
    const hechas = paso.tipo === "salto" ? t.comps : paso.k + 1;
    const comparados = [];
    for (let k = 0; k < hechas; k++) {
      comparados.push({ j: m - 1 - k, ok: k < t.comps - 1 || t.coincide });
    }
    const yaCuenta = paso.tipo === "salto" && t.coincide;
    return {
      tipo: paso.tipo, indice: paso.indice, i: t.i, j: m - hechas, c: t.c, s: t.s, enTabla: t.enTabla,
      comparados: comparados,
      encontradas: posiciones.slice(0, t.encAntes + (yaCuenta ? 1 : 0))
    };
  }

  // 4. Dibujar las casillas del texto y del patrón
  function dibujarPista() {
    const m = patron.length;
    const ultimoI = detalle(pasos[pasos.length - 1]).i;
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
      casilla.textContent = VistaTrazas.visible(texto[k]);
      filaTexto.appendChild(casilla);
    }

    for (let j = 0; j < m; j++) {
      const casilla = document.createElement("div");
      casilla.className = "celda flex items-center justify-center rounded-lg font-mono text-lg font-bold shadow-sm transition-all duration-300";
      casilla.textContent = VistaTrazas.visible(patron[j]);
      filaPatron.appendChild(casilla);
    }
  }

  // 5. Mostrar un paso concreto
  function irA(indice) {
    actual = Math.max(0, Math.min(indice, pasos.length - 1));
    const paso = detalle(pasos[actual]);
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
        if (estado[j] === true) clases = "casilla-ok";
        if (estado[j] === false) clases = "casilla-no";
      }
      if (paso.tipo === "salto" && j === m - 1) {
        clases += " casilla-ancla";
      }
      casillasTexto[k].className =
        "celda relative flex items-center justify-center rounded-lg font-mono text-lg font-semibold transition-all duration-300 " + clases +
        (enEncontrada.has(k) ? " casilla-encontrada" : "");
    }

    // Casillas del patrón
    const casillasPatron = filaPatron.children;
    for (let j = 0; j < m; j++) {
      let clases = "bg-white text-red-700 ring-2 ring-inset ring-red-600";
      if (estado[j] === true) clases = "casilla-ok";
      if (estado[j] === false) clases = "casilla-no animate-pulse";
      if (paso.tipo === "fin") clases = "bg-neutral-300 text-neutral-500";
      if (paso.tipo === "comparar" && j === paso.j) clases += " casilla-activa";
      casillasPatron[j].className =
        "celda flex items-center justify-center rounded-lg font-mono text-lg font-bold shadow-sm transition-all duration-300 " + clases;
    }

    dibujarFlecha(paso);
    resaltarTabla(paso);
    VistaTrazas.activar(paso.indice);

    contadorPaso.textContent = "Paso " + (actual + 1) + " de " + pasos.length;
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

  // Desplaza la pista para que el patrón siempre se vea
  function seguirConLaVista(paso) {
    const centro = (paso.i + patron.length / 2) * PASO_PX;
    pista.scrollTo({ left: centro - pista.clientWidth / 2, behavior: "smooth" });
  }

  // 6. Controles de reproducción
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
    }, DEMORA);
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

  // 7. Encabezado: al bajar, aparece la barra con el logo pequeño de la universidad
  const encabezado = document.getElementById("encabezado");
  const barraCompacta = document.getElementById("barraCompacta");
  new IntersectionObserver((entradas) => {
    barraCompacta.classList.toggle("-translate-y-full", entradas[0].isIntersecting);
    barraCompacta.classList.toggle("opacity-0", entradas[0].isIntersecting);
  }).observe(encabezado.firstElementChild); // la franja blanca con los logos
})();
