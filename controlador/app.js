// app.js
// Controlador: recibe el texto (escrito o desde un archivo), valida los datos, usa el modelo
// y avisa a las vistas con el evento "busqueda".

// Límites (se pueden cambiar aquí)
const LIMITES = {
  bytesArchivo: 500 * 1024, // 500 KB
  caracteresTexto: 2000,
  caracteresPatron: 100
};

// 1. Referencias a los elementos del HTML
const campoArchivo = document.getElementById("archivo");
const campoTexto = document.getElementById("texto");
const panelEscribir = document.getElementById("panelEscribir");
const panelArchivo = document.getElementById("panelArchivo");
const infoArchivo = document.getElementById("infoArchivo");
const contadorTexto = document.getElementById("contadorTexto");
const campoPatron = document.getElementById("patron");
const btnBuscar = document.getElementById("btnBuscar");
const mensajeError = document.getElementById("mensajeError");
const cuerpoTabla = document.getElementById("cuerpoTabla");
const cantidad = document.getElementById("cantidad");
const posiciones = document.getElementById("posiciones");
const resumen = document.getElementById("resumen");
const ayudaInicial = document.getElementById("ayudaInicial");

let modo = "escribir"; // "escribir" o "archivo"
let textoArchivo = ""; // contenido del último archivo válido
let nombreArchivo = "";
let errorArchivo = ""; // motivo por el que se rechazó el último archivo
let cargaActual = 0; // evita que una lectura vieja pise a una nueva

// 2. Recibir el texto: escrito o desde un archivo, según el modo elegido
for (const opcion of document.querySelectorAll('input[name="modo"]')) {
  opcion.addEventListener("change", () => cambiarModo(opcion.value));
}
campoArchivo.addEventListener("change", cargarArchivo);
campoTexto.addEventListener("input", contarCaracteres);
btnBuscar.addEventListener("click", buscar);
contarCaracteres();
mostrarInfoArchivo();

// Cada modo conserva su propio texto
function cambiarModo(nuevo) {
  modo = nuevo;
  panelEscribir.hidden = modo !== "escribir";
  panelArchivo.hidden = modo !== "archivo";
  limpiarResultados();
}

function mostrarInfoArchivo() {
  infoArchivo.textContent = textoArchivo === ""
    ? "Máximo " + numero(LIMITES.caracteresTexto) + " caracteres."
    : "Archivo cargado: " + numero(textoArchivo.length) + " caracteres.";
}

function contarCaracteres() {
  const n = campoTexto.value.length;
  contadorTexto.textContent = numero(n) + " / " + numero(LIMITES.caracteresTexto) + " caracteres";
  contadorTexto.classList.toggle("contador-excedido", n > LIMITES.caracteresTexto);
}

async function cargarArchivo() {
  const archivo = campoArchivo.files[0];
  if (!archivo) return;

  const carga = ++cargaActual;
  limpiarResultados();
  textoArchivo = "";
  nombreArchivo = "";
  errorArchivo = "";
  mostrarInfoArchivo();

  try {
    const texto = await leerTexto(archivo);
    if (carga !== cargaActual) return;
    textoArchivo = texto;
    nombreArchivo = archivo.name;
    mostrarInfoArchivo();
  } catch (error) {
    if (carga !== cargaActual) return;
    campoArchivo.value = ""; // permite volver a elegir el mismo archivo ya corregido
    errorArchivo = error.message;
    if (modo === "archivo") mensajeError.textContent = errorArchivo;
  }
}

async function leerTexto(archivo) {
  if (!/\.txt$/i.test(archivo.name)) throw new Error("El archivo debe ser de tipo .txt");
  if (archivo.size === 0) throw new Error("El archivo está vacío");
  if (archivo.size > LIMITES.bytesArchivo) {
    throw new Error("El archivo supera el máximo de " + LIMITES.bytesArchivo / 1024 + " KB");
  }

  let bytes;
  try {
    bytes = new Uint8Array(await archivo.arrayBuffer());
  } catch (error) {
    throw new Error("No se pudo leer el archivo");
  }
  const texto = decodificar(bytes).replace(/\r\n?/g, "\n");

  if (texto === "") throw new Error("El archivo está vacío");
  if (texto.includes("\0")) throw new Error("El archivo no contiene texto válido");
  if (texto.length > LIMITES.caracteresTexto) throw new Error(textoLargo(texto));
  return texto;
}

function textoLargo(texto) {
  return "El texto tiene " + numero(texto.length) + " caracteres y el máximo es " +
    numero(LIMITES.caracteresTexto) + ". Borre " + numero(texto.length - LIMITES.caracteresTexto) + " para poder buscar";
}

// UTF-16 si trae marca, luego UTF-8 y, si no es válido, Windows-1252
function decodificar(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

function numero(n) {
  return n.toLocaleString("es-CO");
}

// Validar los datos y ejecutar la búsqueda
function validar(texto, patron) {
  if (texto === "" && modo === "archivo") return errorArchivo || "Suba un archivo .txt";
  if (texto === "") return "Escriba el texto";
  if (texto.length > LIMITES.caracteresTexto) return textoLargo(texto);
  if (patron === "") return "El patrón no puede estar vacío";
  if (patron.length > LIMITES.caracteresPatron) {
    return "El patrón no puede tener más de " + LIMITES.caracteresPatron + " caracteres";
  }
  if (patron.length > texto.length) return "El patrón no puede ser más largo que el texto";
  return "";
}

function buscar() {
  limpiarResultados();

  const texto = modo === "archivo" ? textoArchivo : campoTexto.value;
  const patron = campoPatron.value;
  const error = validar(texto, patron);
  if (error !== "") {
    mensajeError.textContent = error;
    return;
  }

  const horspool = new BooyerMooreHorspool(patron);
  const tabla = horspool.obtenerTabla();
  const encontradas = horspool.buscar(texto);

  mostrarTabla(tabla);
  mostrarResultado(patron, encontradas);
  avisar({ texto, patron, tabla, posiciones: encontradas, archivo: modo === "archivo" ? nombreArchivo : "" });
}

// Las vistas reciben los datos de la búsqueda, o null si no hay
function avisar(datos) {
  document.dispatchEvent(new CustomEvent("busqueda", { detail: datos }));
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
function mostrarResultado(patron, encontradas) {
  const n = encontradas.length;
  cantidad.textContent = n === 0
    ? "El patrón «" + patron + "» no aparece en el texto (0 coincidencias)"
    : "Se " + (n === 1 ? "encontró 1 coincidencia" : "encontraron " + numero(n) + " coincidencias") + " de «" + patron + "»";
  posiciones.textContent = n === 0 ? "" : "Posiciones: " + encontradas.join(", ");
  resumen.hidden = false;
  ayudaInicial.hidden = true;
}

// 5. Borrar lo de la búsqueda anterior
function limpiarResultados() {
  mensajeError.textContent = "";
  cuerpoTabla.innerHTML = "";
  cantidad.textContent = "";
  posiciones.textContent = "";
  resumen.hidden = true;
  ayudaInicial.hidden = false;
  avisar(null);
}