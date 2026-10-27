// app.js
// Controlador: lee lo que escribe el usuario, usa la clase Horspool
// y muestra los resultados en la página.

// 1. Referencias a los elementos del HTML
const campoTexto = document.getElementById("texto");
const campoPatron = document.getElementById("patron");
const btnBuscar = document.getElementById("btnBuscar");
const mensajeError = document.getElementById("mensajeError");
const cuerpoTabla = document.getElementById("cuerpoTabla");
const cantidad = document.getElementById("cantidad");
const posiciones = document.getElementById("posiciones");

// 2. Cuando se hace clic en el botón, se ejecuta buscar()
btnBuscar.addEventListener("click", buscar);

function buscar() {
  limpiarResultados();

  const texto = campoTexto.value;
  const patron = campoPatron.value;

  if (texto === "") {
    mensajeError.textContent = "Escriba un texto";
    return;
  }

  let horspool;
  try {
    horspool = new BooyerMooreHorspool(patron);
  } catch (error) {
    mensajeError.textContent = error.message;
    return;
  }

  mostrarTabla(horspool.obtenerTabla());

  const encontradas = horspool.buscar(texto);
  mostrarResultado(encontradas);
}

// 3. Pintar la tabla de saltos
function mostrarTabla(tabla) {
  for (const fila of tabla.filas) {
    agregarFila(fila.caracter, fila.salto);
  }
  agregarFila("Otros", tabla.otros);
}

function agregarFila(caracter, salto) {
  const tr = document.createElement("tr");

  const celdaCaracter = document.createElement("td");
  celdaCaracter.textContent = caracter;

  const celdaSalto = document.createElement("td");
  celdaSalto.textContent = salto;

  tr.appendChild(celdaCaracter);
  tr.appendChild(celdaSalto);
  cuerpoTabla.appendChild(tr);
}

// 4. Mostrar cuántas veces aparece el patrón
function mostrarResultado(encontradas) {
  cantidad.textContent = "El patrón aparece " + encontradas.length + " veces";

  if (encontradas.length > 0) {
    posiciones.textContent = "Posiciones: " + encontradas.join(", ");
  }
}

// 5. Borrar lo de la búsqueda anterior
function limpiarResultados() {
  mensajeError.textContent = "";
  cuerpoTabla.innerHTML = "";
  cantidad.textContent = "";
  posiciones.textContent = "";
}