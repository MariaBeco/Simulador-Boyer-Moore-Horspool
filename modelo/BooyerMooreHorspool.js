class BooyerMooreHorspool{
    #patron;
    #m;
    #tabla;

    constructor(patron) {
        if (!patron || patron.length === 0) {
        throw new Error("El patrón no puede estar vacío");
        }
        this.#patron = patron;
        this.#m = patron.length;          
        this.#tabla = this.#construirTabla();
    }
    #construirTabla() {
        const S = new Array(256);
        for (let i = 0; i < 256; i++) {
            S[i] = this.#m;
        }

        for (let j = 0; j < this.#m - 1; j++) {
            S[this.#patron.charCodeAt(j)] = this.#m - 1 - j;
        }
        return S;
    }

    #salto(caracter) {
        const codigo = caracter.charCodeAt(0);
        const salto = this.#tabla[codigo];
        if (salto === undefined) {
        return this.#m;
        }
        return salto;
    }

    buscar(texto) {
    const P = this.#patron;
    const T = texto;
    const m = this.#m;
    const n = T.length;
    const posiciones = [];
 
    let i = 0;
    while (i <= n - m) {
      let j = m - 1;
      while (j >= 0 && P[j] === T[i + j]) {
        j--;
      }
      if (j < 0) {
        posiciones.push(i);
      }
      const next = T[i + m - 1];
      i += this.#salto(next);
    }
 
    return posiciones;
  }

  obtenerTabla() {
    const filas = [];
    for (let j = 0; j < this.#m; j++) {
      const c = this.#patron[j];
      const yaEsta = filas.some(fila => fila.caracter === c);
      if (!yaEsta) {
        filas.push({ caracter: c, salto: this.#salto(c) });
      }
    }
    return { filas: filas, otros: this.#m };
  }

}
