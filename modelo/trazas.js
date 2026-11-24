// trazas.js (modelo)
// Reconstruye cada intento de la búsqueda con la tabla de saltos del modelo.
// Una traza = una alineación del patrón:
//   i: inicio de la ventana · comps: comparaciones hechas · coincide
//   c: carácter ancla (último de la ventana) · s: salto · enTabla
//   encAntes: coincidencias encontradas antes de este intento
function construirTrazas(T, P, tabla) {
  const n = T.length;
  const m = P.length;
  const saltos = new Map(tabla.filas.map(f => [f.caracter, f.salto]));
  const trazas = [];
  let encAntes = 0;
  let i = 0;

  while (i <= n - m) {
    // Se compara de derecha a izquierda
    let j = m - 1;
    while (j >= 0 && P[j] === T[i + j]) j--;

    const coincide = j < 0;
    const comps = coincide ? m : m - j;
    const c = T[i + m - 1];
    const enTabla = saltos.has(c);
    const s = enTabla ? saltos.get(c) : tabla.otros;
    trazas.push({ i, comps, coincide, c, s, enTabla, encAntes });

    if (coincide) encAntes++;
    i += s;
  }
  return trazas;
}
