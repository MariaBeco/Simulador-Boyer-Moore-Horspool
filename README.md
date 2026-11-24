# Simulador Boyer-Moore-Horspool

Página web que muestra paso a paso cómo el algoritmo Boyer-Moore-Horspool busca un patrón dentro de un texto.

## Autores

| Nombre | Correo | Código |
|---|---|---|
| Sara Jaimes Castañeda | sarajc@ufps.edu.co | 1152502 |
| Maria Fernanda Becerra Coronel | mariafernandabeco@ufps.edu.co | 1152509 |

- **Materia:** Análisis de Algoritmos
- **Profesor:** PhD. Marco Antonio Adarme Jaimes
- **Carrera:** Ingeniería de Sistemas
- **Universidad:** Universidad Francisco de Paula Santander
- **Localización:** Cúcuta, Norte de Santander, Colombia
- **Fecha:** Segundo semestre - 2026

## Método

El algoritmo busca todas las apariciones de un **patrón** `P` (de longitud `m`) dentro de un **texto** `T` (de longitud `n`). Compara de derecha a izquierda y usa una **tabla de saltos** `S` para avanzar varias posiciones cuando es posible.

### 1. Construir la tabla de saltos

La tabla indica cuántas posiciones avanza el patrón según el carácter del texto que queda arriba de su última casilla.

1. Se asigna a todos los caracteres el salto máximo, `m`. Este valor queda para los que no están en el patrón (en el simulador, la fila «Otros»).
2. Se recorre el patrón de izquierda a derecha, desde `j = 0` hasta `j = m - 2`. El último carácter no se incluye, porque su salto sería 0 y el patrón no avanzaría.
3. A cada carácter se le asigna su distancia hasta el final del patrón: `S[P[j]] = m - 1 - j`
4. Si un carácter se repite, el valor nuevo reemplaza al anterior. Así queda el salto más corto, que evita saltarse una coincidencia.

Ejemplo con el patrón `ABRA` (`m = 4`):

| j | Carácter | Cálculo | Salto |
|---|---|---|---|
| 0 | A | 4 - 1 - 0 | 3 |
| 1 | B | 4 - 1 - 1 | 2 |
| 2 | R | 4 - 1 - 2 | 1 |
| – | Otros | m | 4 |

La última `A` no se usa, por eso el salto de `A` es 3.

### 2. Buscar en el texto

1. Se alinea el patrón con el inicio del texto: `i = 0`
2. Se compara de derecha a izquierda, desde `j = m - 1`, mientras `P[j] == T[i + j]`
3. Si todos los caracteres coinciden (`j < 0`), se guarda la posición `i`.
4. Haya coincidencia o no, se salta según el **carácter ancla**, que es el último de la ventana: `i = i + S[T[i + m - 1]]`
5. Se repite desde el paso 2 mientras `i <= n - m`

El resultado es la lista de posiciones encontradas, o una lista vacía si el patrón no aparece.

## Requisitos para usarlo

- Tener un navegador web actualizado (Chrome, Edge, Firefox o similar) con JavaScript activado.
- Descargar o clonar **todo** el proyecto, conservando sus carpetas:

  ```bash
  git clone https://github.com/MariaBeco/Simulador-Boyer-Moore-Horspool.git
  ```

- Abrir `index.html` en el navegador.

No requiere instalar nada más: Tailwind CSS ya está compilado en `css/` y la librería jsPDF 4.2.1 está incluida en `lib/`. Después de descargarlo, funciona sin internet.

Para ver el PDF se necesita un lector de PDF; el navegador también sirve.

## Tamaños y límites

| Elemento | Límite o tamaño |
|---|---|
| Texto (escrito o desde archivo) | Máximo 2.000 caracteres |
| Archivo de entrada | Solo `.txt`, máximo 500 KB (y 2.000 caracteres) |
| Patrón | De 1 a 100 caracteres, sin superar la longitud del texto |
| PDF descargado | Hoja A4; entre 3 KB y 20 KB en las pruebas, según el texto |
| Posiciones listadas en el PDF | Primeras 500 |

El PDF muestra `?` en lugar de emojis y de alfabetos no latinos.

## Requerimientos no funcionales

- **Rendimiento:** la búsqueda y la preparación del recorrido deben tardar menos de 1 segundo con el texto máximo. En la prueba con 2.000 letras iguales y un patrón de 100 tardó cerca de 0,2 s.
- **Usabilidad:** los errores de entrada se explican con mensajes en español, y el recorrido se controla con botones o con el teclado (flechas y barra espaciadora).
- **Adaptabilidad:** la página se adapta a computador y celular (desde 375 px de ancho) sin desplazamiento horizontal.
- **Disponibilidad:** funciona sin internet y sin servidor.
- **Privacidad:** el texto y los archivos se procesan en el navegador y no se envían a ningún servidor.
- **Compatibilidad:** funciona en navegadores actuales y lee archivos UTF-8, UTF-16 (con BOM) y Windows-1252, conservando tildes y ñ.
- **Fiabilidad:** valida los datos antes de buscar y no recorta el texto sin avisar.
- **Mantenibilidad:** el código está separado en modelo, vista y controlador.
