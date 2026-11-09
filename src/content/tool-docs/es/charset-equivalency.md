## Qué hace

Un byte no significa nada hasta que alguien dice en qué juego de caracteres (charset) está. `E9` es é en windows-1252, Ú en IBM 850 y Z en EBCDIC, y en UTF-8 no es un carácter, solo el primer byte de uno. La herramienta muestra el mismo texto y los mismos bytes en catorce juegos de caracteres a la vez, decodifica los bytes exactamente como lo hace un navegador y deshace el daño cuando un texto se leyó con el juego equivocado.

Tiene tres modos:

- **Texto a bytes** escribe un texto en un juego de caracteres, en seis notaciones, carácter por carácter, y dice qué pasó con cada carácter que ese juego no puede representar. Luego muestra el mismo texto en todos los juegos y cómo se leen esos bytes en cada uno de ellos: el mojibake que produce cada suposición equivocada.
- **Bytes a texto** lee bytes escritos en hexadecimal o pegados de un volcado hexadecimal, como secuencias de escape, como %XX o en Base64, los decodifica con el juego de caracteres que elijas o con el que detecte, y enumera cada secuencia que tuvo que sustituir, con el motivo. También muestra qué hace cada juego de caracteres con esos mismos bytes.
- **Reparar mojibake** toma un texto ilegible, como `cafÃ©`, encuentra el juego de caracteres que lo leyó mal y aquel en el que estaban de verdad los bytes, y devuelve el original, con los pasos y la solidez de las pruebas.

## Los catorce juegos de caracteres

| Juego de caracteres | Bytes por carácter | Qué hace un navegador con él |
|---|---|---|
| UTF-8 | De 1 a 4 | Lo decodifica; el WHATWG Encoding Standard lo exige para el contenido nuevo |
| UTF-16LE, UTF-16BE | 2 o 4 | Decodifica ambos (“utf-16” es una etiqueta de UTF-16LE); nunca los codifica |
| UTF-32LE, UTF-32BE | 4 | No lo admite |
| US-ASCII | 1 (siete bits) | Las etiquetas “ascii” y “us-ascii” significan windows-1252 |
| ISO-8859-1 (Latin-1) | 1 | Las etiquetas “iso-8859-1” y “latin1” significan windows-1252 |
| windows-1252 | 1 | Lo decodifica |
| ISO-8859-15 (Latin-9) | 1 | Lo decodifica |
| Mac OS Roman | 1 | Lo decodifica (etiqueta “macintosh”) |
| IBM 437 (DOS, EE. UU.) | 1 | No lo admite |
| IBM 850 (DOS, Europa occidental) | 1 | No lo admite |
| IBM 037 e IBM 500 (EBCDIC) | 1 | No lo admite |

Las tablas de windows-1252, ISO-8859-15 y Mac OS Roman son los índices del WHATWG Encoding Standard, así que coinciden con lo que decodifica un navegador. Las tablas de IBM son las tablas de correspondencia de fabricantes que el Unicode Consortium tiene archivadas, que el Consortium conserva “only for historical and archival purposes” (solo con fines históricos y de archivo) y sin garantía de que coincidan con una plataforma concreta. Cada tabla se comparó byte a byte con los códecs de CPython 3.11 y con el iconv de glibc 2.39 el 2026-10-03. Las diferencias:

- **windows-1252, bytes 0x81, 0x8D, 0x8F, 0x90 y 0x9D.** El estándar del WHATWG los asigna a los controles C1 U+0081, U+008D, U+008F, U+0090 y U+009D; la tabla de Microsoft, CPython e iconv los dejan sin definir. La herramienta sigue el estándar del WHATWG, de modo que todos los bytes se decodifican y la decodificación nunca pierde información.
- **Mac OS Roman en iconv.** glibc asigna 0xC6 a U+0394 y 0xF0 a U+E01E, donde la tabla de Apple y el estándar del WHATWG tienen U+2206 y U+F8FF.

## Decodificar como lo hace un navegador

Los decodificadores de UTF-8 y UTF-16 siguen paso a paso el WHATWG Encoding Standard. Cuando una secuencia está mal formada, un único U+FFFD sustituye su subparte máxima (maximal subpart): la serie más larga de bytes que todavía podría haber empezado un carácter bien formado, o un solo byte. El Unicode Standard describe la misma práctica en la sección 3.9.6, y sus tablas 3-8 a 3-11 están entre los ejemplos predefinidos. Cada secuencia sustituida lleva su nombre:

| Motivo | Bytes UTF-8 | Qué significa |
|---|---|---|
| Byte de continuación suelto | De 80 a BF donde empieza un carácter | falta su primer byte, o los datos no son UTF-8 |
| C0 o C1 | C0, C1 | solo podría empezar una forma de dos bytes de un carácter ASCII |
| De F5 a FF | De F5 a FF | nunca aparece en UTF-8 |
| Forma sobrelarga (overlong) | E0 80-9F, F0 80-8F | una forma más larga de un punto de código que tiene una más corta |
| Sustituto (surrogate) | ED A0-BF | de U+D800 a U+DFFF, que UTF-8 no puede transportar |
| Más allá de U+10FFFF | F4 90-BF | después del último punto de código |
| Cortada | un byte inicial y después otra cosa | los bytes leídos hasta ese momento se convierten en un U+FFFD |

UTF-16 sustituye los sustitutos sin pareja y un byte impar sobrante; UTF-32, que los navegadores no decodifican, sigue las definiciones D99 y D100 del Unicode Standard y sustituye cada unidad de cuatro bytes que sea un sustituto o esté más allá de U+10FFFF.

**Marcas de orden de bytes.** Con “Dejar que una marca de orden de bytes decida el juego de caracteres” activada (la opción predeterminada), los datos que empiezan por EF BB BF, FE FF o FF FE se decodifican como UTF-8, UTF-16BE o UTF-16LE, sea cual sea el juego de caracteres que elegiste, y la marca no forma parte del texto: el estándar del WHATWG considera la marca más fiable que una etiqueta. La herramienta también reconoce las marcas de UTF-32 00 00 FE FF y FF FE 00 00, que un navegador no reconoce: este toma el FF FE de FF FE 00 00 por la marca de UTF-16LE y decodifica el resto como UTF-16LE (Chromium 141, medido el 2026-10-03).

**Detectar.** Con el juego de caracteres en Detectar, la herramienta dice por qué eligió uno: una marca de orden de bytes; todos los bytes son ASCII (en ese caso, todos los juegos compatibles con ASCII leen el mismo texto); UTF-8 bien formado con caracteres fuera de ASCII; bytes cero donde los pone un texto ASCII en UTF-16 o UTF-32; o el patrón de EBCDIC (0x40 frecuente, sin espacios ASCII, la mayoría de los bytes por encima de 0x80). Si no, dice que no hay una única respuesta, y la respuesta es la tabla de lecturas.

## Lectura de bytes desde el cuadro

| Formato | Ejemplo |
|---|---|
| Hexadecimal, con cualquier separador, con o sin 0x o \x | `C3 A9`, `c3a9`, `0xC3, 0xA9`, `{ 0xC3, 0xA9 }` |
| Un volcado hexadecimal | la salida de `hexdump -C`, `xxd` u `od -Ax -tx1`: se omiten los desplazamientos y la columna ASCII |
| Secuencias de escape | `\xC3\xA9`, `b'caf\xc3\xa9'` (Python), `caf\303\251` (así entrecomilla git los nombres de archivo) |
| Codificación por porcentaje | `caf%C3%A9`, leída como la lee el WHATWG URL Standard: un % que no va seguido de dos dígitos hexadecimales sigue siendo un % |
| Base64 | alfabeto estándar o seguro para URL, relleno opcional |

Un volcado hexadecimal se reconoce cuando cada línea empieza por un desplazamiento y los desplazamientos avanzan según el ancho de línea, de modo que la columna ASCII nunca se lee como bytes, aunque por casualidad parezca hexadecimal.

## Escritura de bytes

Las seis notaciones: pares hexadecimales; el formato de `hexdump -C`; un array de C; un literal bytes de Python (exactamente como lo escribe `repr()` de Python); Base64 (RFC 4648, sección 4); y codificación por porcentaje que deja tal cual los caracteres no reservados del RFC 3986. Cada una se comparó con su referencia: `hexdump -C` de util-linux, `repr()` de CPython, `base64` y `urllib.parse.quote`.

**Los caracteres que un juego no puede representar** se escriben como `?` (lo que hace la mayoría de los conversores), como una referencia HTML decimal del tipo `&#8364;` (lo que hace un navegador cuando se envía un formulario en ese juego de caracteres: el modo de error “html” del estándar del WHATWG, que el servidor no puede distinguir de alguien que escribe esos caracteres) o no se escriben (modo estricto).

## Reparación del mojibake

El mojibake es reversible cuando el juego de caracteres equivocado no perdió nada: se vuelve a codificar el texto ilegible con el juego que lo leyó mal y se decodifican los bytes con el correcto. La herramienta lo intenta en dos niveles:

1. **UTF-8 leído como un juego de un solo byte** (windows-1252, ISO-8859-1, ISO-8859-15, Mac OS Roman, IBM 437, IBM 850). Al deshacerlo debe salir UTF-8 bien formado, algo que los bytes fuera de ASCII rara vez forman por casualidad: es una prueba sólida. Hasta tres rondas deshacen un texto que se leyó mal más de una vez (`Ã¢â‚¬â„¢` es ’ leído mal dos veces).
2. **Un juego de un solo byte leído como otro**, como un archivo IBM 850 mostrado como windows-1252 (`a‡Æo` por ação) o EBCDIC mostrado como Latin-1. En estos juegos todos los bytes se decodifican, así que la herramienta solo se queda con una lectura cuando puntúa mejor en una medida de mojibake (los pares que deja UTF-8, símbolos dentro de palabras, mayúsculas dentro de palabras en minúsculas, controles, caracteres de dibujo de cuadros, palabras que mezclan escrituras) y marca la prueba como más débil.

Cuando un byte se perdió por el camino (a menudo el último byte de ” o de ™, que windows-1252 convierte en un control invisible), una pasada tolerante recupera el resto y marca cada carácter perdido con U+FFFD. **Verlo ilegible** pasa a Texto a bytes con el texto reparado, y la tabla de lectura muestra exactamente cómo se estropeó.

Comprobado el 2026-10-03: de 106 muestras de mojibake creadas a partir de quince textos (UTF-8 leído mal como cinco juegos de caracteres, leído mal dos veces, IBM 850 y windows-1252 leídos el uno como el otro, EBCDIC leído como Latin-1), 104 se recuperaron exactamente, y los quince textos originales se dejaron intactos. Los dos fallos son cortos: AÇÃO en EBCDIC leído como Latin-1 (`ÁhfÖ`), donde otra lectura queda primera, y Ça va en windows-1252 leído como IBM 850 (`Ãa va`), que se deja como está. De 12.087 textos correctos (párrafos de los artículos de Learn del sitio en inglés y portugués, más dieciséis frases en otros idiomas, escrituras y conjuntos de símbolos), a ninguno se le ofreció una reparación.

## Compartir resultados

Debajo de la primera respuesta del modo en uso, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro de ese modo tal como lo escribiste y las elecciones propias del modo. El nombre del cuadro indica el modo, así que el enlace abre exactamente el modo en el que estabas: `text` para Texto a bytes, con `charset`, `policy`, `bom` y `style` (la notación de los bytes); `bytes` para Bytes a texto, con `format`, `charset` y `sniff` (si decide una marca de orden de bytes); `garbled` para Reparar mojibake. Las elecciones que están en su valor predeterminado no se incluyen. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Se establece el modo, su cuadro se rellena como lo haría un pegado, se establecen sus elecciones y la página calcula. Dos cuadros a la vez, una elección que pertenece a otro modo o un valor que la página no ofrece hacen que se ignore el enlace entero. En ambos casos, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
- **Por qué no `#input=`.** Un valor entregado como `#input=` sigue abriendo el modo al que se parece, exactamente igual que antes. Compartir no usa esa forma, porque el aspecto puede engañar: un texto como `cafe` también se lee como dos bytes hexadecimales.

## Límites

- La reparación trabaja sobre el texto completo. Un texto que mezcla caracteres correctos con caracteres ilegibles se deja intacto: pega la parte ilegible sola.
- Los bytes que se sustituyeron por `?` o U+FFFD, o que se descartaron, no se pueden recuperar; la reparación indica cuántos caracteres se perdieron.
- La detección y el segundo nivel de reparación son heurísticas. Las pruebas sólidas vienen de las marcas de orden de bytes y del UTF-8 bien formado; todo lo demás se marca como más débil.
- Solo los catorce juegos de caracteres anteriores. No se incluyen los juegos multibyte de Asia oriental (Shift_JIS, GBK, Big5, EUC-KR).
- Se decodifican hasta 64 KiB de bytes y se codifican 20.000 caracteres de una vez; las tablas muestran las primeras 2000 filas; la reparación examina los primeros 2000 caracteres.

## Fuentes

- [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/): los decodificadores de UTF-8 y UTF-16, la detección por BOM, el decodificador y el codificador de un solo byte, las etiquetas, los modos de error; estándar vivo actualizado por última vez el 21 de mayo de 2026 (consultado el 2026-10-03)
- [WHATWG indexes: windows-1252](https://encoding.spec.whatwg.org/index-windows-1252.txt), [ISO-8859-15](https://encoding.spec.whatwg.org/index-iso-8859-15.txt), [macintosh](https://encoding.spec.whatwg.org/index-macintosh.txt) (consultado el 2026-10-03)
- [The Unicode Standard 18.0.0, chapter 3: Conformance](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-3/): tabla 3-7, sección 3.9.6 y tablas 3-8 a 3-11, definiciones D95 a D100 (consultado el 2026-10-03)
- [Unicode FAQ: UTF-8, UTF-16, UTF-32 & BOM](https://www.unicode.org/faq/utf_bom.html) (consultado el 2026-10-03)
- [Unicode mapping tables](https://www.unicode.org/Public/MAPPINGS/): [ReadMe](https://www.unicode.org/Public/MAPPINGS/ReadMe.txt), [CP437](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP437.TXT), [CP850](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP850.TXT), [CP037](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP037.TXT), [CP500](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP500.TXT), [CP1252](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP1252.TXT), [8859-1](https://www.unicode.org/Public/MAPPINGS/ISO8859/8859-1.TXT), [Apple ROMAN](https://www.unicode.org/Public/MAPPINGS/VENDORS/APPLE/ROMAN.TXT) (consultado el 2026-10-03)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (consultado el 2026-10-03)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (consultado el 2026-10-03)
- [RFC 4648: Base16, Base32 and Base64](https://www.rfc-editor.org/rfc/rfc4648) (consultado el 2026-10-03)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-03); sección 3.5 (consultado el 2026-10-27): el fragmento, que lleva los valores de un enlace de Compartir resultados
- [WHATWG URL Standard: percent-decode](https://url.spec.whatwg.org/) (consultado el 2026-10-03)
