// pdf.js
// Descarga un PDF (con jsPDF) con el texto y las coincidencias subrayadas.
// Usa Courier, en la que todas las letras miden lo mismo.
const ExportadorPDF = (function () {
  const ANCHO = 595, ALTO = 842, MARGEN = 50; // A4 en puntos
  const LETRA = 10, ANCHO_LETRA = 6, RENGLON = 15;
  const COLUMNAS = Math.floor((ANCHO - 2 * MARGEN) / ANCHO_LETRA);
  const RENGLONES = Math.floor((ALTO - 2 * MARGEN) / RENGLON);
  const MAX_POSICIONES = 500;
  const ESPECIALES = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ"; // admitidos por la fuente fuera de Latin-1

  function admitir(c) {
    const codigo = c.charCodeAt(0);
    const latino = (codigo >= 32 && codigo < 127) || (codigo >= 160 && codigo < 256);
    return latino || ESPECIALES.includes(c) ? c : "?";
  }

  // Convierte una cadena en renglones { texto, marcas, negrita }
  function partir(cadena, marcado, negrita) {
    const renglones = [];
    let letras = "", marcas = [];
    function cerrar() {
      renglones.push({ texto: letras, marcas, negrita });
      letras = "";
      marcas = [];
    }
    for (let k = 0; k < cadena.length; k++) {
      const c = cadena[k];
      if (c === "\n") { cerrar(); continue; }
      for (const letra of c === "\t" ? "    " : admitir(c)) {
        if (letras.length === COLUMNAS) cerrar();
        letras += letra;
        marcas.push(Boolean(marcado && marcado[k]));
      }
    }
    cerrar();
    return renglones;
  }

  // Marca cada carácter cubierto por alguna coincidencia (admite traslapes)
  function cubiertos(texto, m, posiciones) {
    const marcado = new Uint8Array(texto.length);
    for (const p of posiciones) marcado.fill(1, p, p + m);
    return marcado;
  }

  function construirRenglones(datos) {
    const total = datos.posiciones.length;
    let lista = datos.posiciones.slice(0, MAX_POSICIONES).join(", ") || "ninguna";
    if (total > MAX_POSICIONES) lista += "... (se muestran las primeras " + MAX_POSICIONES + ")";

    const todo = datos.texto + datos.patron + datos.archivo;
    let sinSoporte = false;
    for (const c of todo) {
      if (c !== "\n" && c !== "\t" && c !== "?" && admitir(c) === "?") { sinSoporte = true; break; }
    }
    return [].concat(
      partir("Simulador Boyer-Moore-Horspool", null, true),
      datos.archivo ? partir("Archivo: " + datos.archivo) : [],
      partir("Patrón: " + datos.patron),
      partir("Coincidencias: " + total),
      // Se corta en los espacios para no partir los números
      partir(("Posiciones: " + lista).replace(new RegExp("(.{1," + COLUMNAS + "})(?: |$)", "g"), "$1\n").trimEnd()),
      sinSoporte ? partir("Nota: los caracteres no admitidos por la fuente se muestran como ?") : [],
      partir(""),
      partir("Texto con las coincidencias subrayadas", null, true),
      partir(datos.texto, cubiertos(datos.texto, datos.patron.length, datos.posiciones))
    );
  }

  function dibujarRenglon(doc, r, y) {
    if (r.texto !== "") {
      doc.setFont("courier", r.negrita ? "bold" : "normal");
      doc.text(r.texto, MARGEN, y);
    }
    for (let k = 0; k < r.marcas.length; k++) {
      if (!r.marcas[k]) continue;
      const inicio = k;
      while (k < r.marcas.length && r.marcas[k]) k++;
      doc.line(MARGEN + inicio * ANCHO_LETRA, y + 3, MARGEN + k * ANCHO_LETRA, y + 3);
    }
  }

  function construir(datos) {
    const renglones = construirRenglones(datos);
    const paginas = Math.ceil(renglones.length / RENGLONES);
    const doc = new jspdf.jsPDF({ unit: "pt", format: [ANCHO, ALTO], compress: true });

    for (let p = 0; p < paginas; p++) {
      if (p > 0) doc.addPage();
      doc.setFontSize(LETRA);
      doc.setDrawColor(21, 128, 61);
      doc.setLineWidth(1.5);
      renglones.slice(p * RENGLONES, (p + 1) * RENGLONES).forEach((r, k) => {
        dibujarRenglon(doc, r, MARGEN + LETRA + k * RENGLON);
      });
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.text("Página " + (p + 1) + " de " + paginas, MARGEN, ALTO - 25);
    }
    return doc;
  }

  let ultima = null;
  document.addEventListener("busqueda", (e) => { ultima = e.detail; });
  document.getElementById("btnPDF").addEventListener("click", () => {
    if (!ultima) return;
    try {
      construir(ultima).save((ultima.archivo || "texto").replace(/\.txt$/i, "") + "-coincidencias.pdf");
    } catch (error) {
      console.error(error);
      document.getElementById("mensajeError").textContent = "No se pudo generar el PDF";
    }
  });

  return { construir };
})();
