// trazas.js (vista)
// Tabla de trazas, paginada de a 50 intentos.
const VistaTrazas = (function () {
  const POR_PAGINA = 50;

  const cuerpo = document.getElementById("cuerpoTrazas");
  const paginaTexto = document.getElementById("paginaTrazas");
  const btnAntes = document.getElementById("trazasAntes");
  const btnDespues = document.getElementById("trazasDespues");
  const contenedor = document.getElementById("contenedorTrazas");

  let trazas = [];
  let patron = "";
  let alElegir = null;
  let pagina = 0;
  let activa = -1;

  function mostrar(datos, lista, elegir) {
    patron = datos.patron;
    trazas = lista;
    alElegir = elegir;
    activa = -1;
    pagina = 0;
    dibujar();
  }

  function dibujar() {
    const total = Math.ceil(trazas.length / POR_PAGINA);
    const desde = pagina * POR_PAGINA;
    cuerpo.innerHTML = "";
    trazas.slice(desde, desde + POR_PAGINA).forEach((t, k) => cuerpo.appendChild(crearFila(t, desde + k)));
    paginaTexto.textContent = "Página " + (pagina + 1) + " de " + total + " · Intentos: " + trazas.length;
    btnAntes.disabled = pagina === 0;
    btnDespues.disabled = pagina >= total - 1;
    contenedor.scrollTop = 0;
    marcar();
  }

  function crearFila(t, indice) {
    const m = patron.length;
    const tr = document.createElement("tr");
    tr.dataset.indice = indice;

    agregar(tr, indice + 1);
    agregar(tr, "[" + t.i + ", " + (t.i + m - 1) + "]");
    agregar(tr, visible(t.c) + (t.enTabla ? "" : " (Otros)"));
    agregar(tr, "i = " + t.i + " + " + t.s + " = " + (t.i + t.s));
    agregar(tr, t.coincide ? "Coincide" : "No coincide").className = t.coincide ? "traza-ok" : "traza-no";

    tr.classList.add("traza-clic");
    tr.addEventListener("click", () => alElegir(indice));
    return tr;
  }

  function agregar(tr, contenido) {
    const td = document.createElement("td");
    td.textContent = contenido;
    tr.appendChild(td);
    return td;
  }

  // Resalta la fila del intento que se está animando (-1 = ninguna)
  function activar(indice) {
    activa = indice;
    const nueva = Math.floor(indice / POR_PAGINA);
    if (indice >= 0 && nueva !== pagina) {
      pagina = nueva;
      dibujar();
    } else {
      marcar();
    }
  }

  function marcar() {
    const encabezado = 40;
    for (const tr of cuerpo.children) {
      const es = Number(tr.dataset.indice) === activa;
      tr.classList.toggle("traza-activa", es);
      if (!es) continue;
      // Se desplaza solo la tabla, no la página
      const abajo = tr.offsetTop + tr.offsetHeight;
      if (tr.offsetTop - encabezado < contenedor.scrollTop) contenedor.scrollTop = tr.offsetTop - encabezado;
      else if (abajo > contenedor.scrollTop + contenedor.clientHeight) contenedor.scrollTop = abajo - contenedor.clientHeight;
    }
  }

  // Espacios y saltos de línea se muestran con un símbolo
  function visible(c) {
    if (c === " ") return "␣";
    if (c === "\n") return "↵";
    if (c === "\t") return "⇥";
    return c;
  }

  btnAntes.addEventListener("click", () => { pagina--; dibujar(); });
  btnDespues.addEventListener("click", () => { pagina++; dibujar(); });

  return { mostrar, activar, visible };
})();
