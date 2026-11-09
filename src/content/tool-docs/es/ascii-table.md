## Qué hace

ASCII tiene 128 códigos, del 0 al 127, y casi siempre se necesita uno solo cada vez: el código de un carácter, el carácter que hay detrás de un código o la forma de escribirlo en un archivo de configuración, en una cadena JSON o en una iRule. El explorador responde a esas preguntas para cada código, y te dice claramente cuando lo que tienes entre manos no es ASCII en absoluto.

Tiene cuatro partes:

- **Consulta** lee un código en cualquier notación y muestra todo sobre él: los números, los bits, los nombres, para qué se definió el código en 1968 y qué hace Linux con él hoy, cómo escribirlo en siete sitios distintos y qué lenguajes lo consideran espacio en blanco.
- **La tabla** dispone los 128 códigos como los dibuja el RFC 20, ocho columnas por dieciséis filas, o en forma de lista. Elige cualquier código para verlo en la consulta.
- **De texto a códigos** toma un texto pegado y muestra el código de cada carácter, y lista por su nombre todo lo que queda fuera de ASCII, con el motivo por el que puede dar problemas.
- **Comparación de espacios en blanco** enfrenta los diez códigos que podrían ser espacio en blanco con siete definiciones que no se ponen de acuerdo sobre ellos.

## Qué lee el cuadro de consulta

| Escribes | Se lee como |
|---|---|
| `A` | el propio carácter (también vale entre comillas, `'A'`) |
| `65` | decimal |
| `0x41`, `41h`, `x41` | hexadecimal |
| `0o101` | octal |
| `1000001`, `00100101` | siete u ocho dígitos binarios, leídos como bits |
| `0b1000001` | binario con su prefijo |
| `4/1` | columna/fila del RFC 20: columna 4, fila 1 |
| `U+0041` | notación Unicode |
| `&#65;`, `&#x41;`, `&excl;` | referencias HTML numéricas y con nombre |
| `%41` | codificación por porcentaje |
| `\x41`, `\101`, `\n`, `\u0041`, `\u{1F600}` | secuencias de escape con barra invertida |
| `^A`, `^[`, `^?` | notación con circunflejo (caret notation) |
| `NUL`, `LF`, `line feed`, `Reverse Slant` | abreviaturas y nombres del RFC 20, de Unicode 1.0 y del Unicode actual |
| `en dash`, `minus sign` | cualquier nombre o alias Unicode (con coincidencia flexible: se ignoran las mayúsculas y minúsculas, los espacios, los guiones bajos y los guiones intermedios, como dice la regla UAX44-LM2 del UAX #44) |

Siete u ocho dígitos binarios por sí solos se leen como bits, porque eso es lo que casi siempre es una cadena de ceros y unos de esa longitud. Un número decimal más largo, como `1000`, se lee como decimal y cae fuera de ASCII.

## Lectura de un código

- **Números.** Decimal, hexadecimal, octal, los siete bits y el byte completo. El bit superior del byte es 0: el RFC 20 colocó el ASCII de 7 bits “in an 8 bit byte whose high order bit is always 0” (en un byte de 8 bits cuyo bit de orden superior es siempre 0).
- **Columna/fila.** El RFC 20 designa cada posición por su columna y su fila: `K` es `4/11`. La columna son los bits b7 b6 b5 y la fila, b4 b3 b2 b1, así que 4/11 es 100 1011.
- **Invertir un bit.** Cada uno de los siete bits es un botón que lo invierte y salta al resultado. Dos de ellos explican casi toda la tabla: b6 (32) es la única diferencia entre mayúsculas y minúsculas, y b7 (64) separa un control del carácter con el que se empareja en la notación con circunflejo (`A` y `^A`, `[` y `^[`, que es ESC).
- **Nombres.** El nombre Unicode actual, el nombre de Unicode 1.0 cuando es distinto (`BACKSLASH`, `SPACING UNDERSCORE`), el nombre del RFC 20 (`Reverse Slant`, `Underline`, `Overline`) y sus alternativas. Los controles no tienen nombre Unicode: su propiedad Name está vacía, y se nombran con alias formales tomados de la ISO 6429 (`LINE FEED`, `NEW LINE`, `END OF LINE`, abreviados `LF`, `NL`, `EOL`). La tabla del RFC 20 llama `EM` al código 25; la primera abreviatura de Unicode para él es `EOM`.
- **Categoría y clase.** La General_Category de la Unicode Character Database y, para los controles, la clase del RFC 20: control de comunicación (CC, communication control), efector de formato (FE, format effector) o separador de información (IS, information separator).
- **Notas.** La nota 3 del RFC 20 marca once posiciones (`#` `@` `[` `\` `]` `^` `` ` `` `{` `|` `}` `~`) que no deberían usarse en el intercambio internacional sin un acuerdo previo; la nota 4 permite que el signo de la libra esterlina ocupe el lugar de `#`.
- **Para qué servía y qué hace hoy.** Para cada control, un resumen de la definición del RFC 20 y, cuando Linux le da una función, esa función: Ctrl-C (ETX) interrumpe, Ctrl-D (EOT) termina la entrada, Ctrl-S y Ctrl-Q (DC3, DC1) detienen y reanudan la salida, Ctrl-Z (SUB) suspende, y ESC inicia una secuencia de escape en la consola de Linux. Todo ello sale de las páginas de manual de Linux termios(3) y console_codes(4).
- **Cómo escribirlo.** La forma de literal de cadena en C, JSON, JavaScript, Python y Tcl (iRules), las referencias HTML y la forma URL con su clase según el RFC 3986. Cuando un lenguaje tiene una trampa, le sigue una nota breve (ver más abajo).
- **¿Espacio en blanco?** Sí o no según cada una de las siete definiciones.
- **Relaciones.** La notación con circunflejo, la otra caja (mayúscula o minúscula), el valor de un dígito y los caracteres ASCII que UTS #39 considera confundibles con él (`1`, `I`, `l` y `|` comparten un prototipo; `0` y `O` comparten otro).

## Las trampas que evitan los escapes

- **Los escapes hexadecimales de C no se detienen tras dos dígitos.** `"\x1Bfoo"` sigue leyendo dígitos hexadecimales, así que la herramienta escribe los controles de C en octal (`\033`), que se detiene a los tres dígitos.
- **Tcl 8.4, y por tanto las iRules, solo conserva los dos últimos dígitos hexadecimales de `\x`.** `"\x1Bfoo"` lee `\x1Bf` y conserva `Bf`: el resultado es el byte 0xBF seguido de `oo`, no ESC y `foo`. La herramienta también escribe en octal los controles de Tcl. Esto se ejecutó en Tcl 8.4.6.
- **JSON debe escapar la comilla, la barra invertida (reverse solidus) y los controles del 0 al 31**, y puede dejar DEL tal cual (RFC 8259, sección 7).
- **En JavaScript, `\0` solo significa NUL si no le sigue ningún dígito.**
- **HTML convierte `&#0;` en U+FFFD**, el carácter de sustitución, y trata las referencias a la mayoría de los controles como errores de análisis (el analizador de WHATWG).

## Cuando no es ASCII

Un valor por encima de 127 se identifica por su nombre, con el número de bytes UTF-8 que necesita y el tipo de problema que puede causar: invisible, un espacio que no es el espacio ASCII, una comilla tipográfica, un guion que no es el guion-menos (hyphen-minus) o un carácter cuya forma de compatibilidad es ASCII. Cuando UTS #39 lo da como confundible con texto ASCII, la herramienta dice con cuál y te ofrece el carácter ASCII que probablemente querías.

Dos casos son tan frecuentes que tienen su propio valor predefinido. `&minus;` es U+2212 MINUS SIGN y `&tilde;` es U+02DC SMALL TILDE: ninguno de los dos es ASCII, y el guion-menos (45) y la virgulilla (tilde, 126) de ASCII no tienen ninguna referencia con nombre. Escribe `&#45;` y `&#126;`, o los propios caracteres. Algunas tablas ASCII publicadas ponen `&minus;` y `&tilde;` junto a 45 y 126; la lista de referencias con nombre de WHATWG, no.

Para cada propiedad de un punto de código fuera de ASCII, el resultado enlaza con el [Inspector de Unicode](/tools/unicode-inspector).

## El cuadro de texto

Pega una línea de una configuración, de una iRule o de un correo. Cada carácter aparece como una celda con su código (hexadecimal para ASCII, el punto de código para todo lo demás), y todo lo que queda fuera de ASCII se lista con su posición, sus bytes UTF-8, su nombre y el motivo por el que puede dar problemas. Se leen hasta 2000 caracteres.

## Cómo se comprobó

Cada escape, cada referencia y cada respuesta sobre espacios en blanco de los 128 códigos se ejecutó en las implementaciones reales el 3 de octubre de 2026, y todas coinciden con la herramienta: literales de cadena en CPython 3.11, Node 22, GCC (C11) y Tcl 8.4.6; referencias HTML (decimales, hexadecimales y con nombre) en Chromium; espacios en blanco con `isspace()` de C, `str.isspace()` de Python, `\s` y `trim()` de JavaScript, un analizador JSON estricto, el analizador de comandos de Tcl 8.4.6 y la propia división del DOM por espacios en blanco ASCII. Cada celda de la tabla de códigos del RFC 20 se comparó con los datos de la herramienta. Los nombres Unicode se comprobaron contra el archivo de datos de Unicode 18.0.0 para cada uno de los 1 114 112 puntos de código.

## Compartir resultados

Debajo de la respuesta de la consulta, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el valor del cuadro de consulta tal como lo escribiste: `/tools/ascii-table#input=%26tilde%3B`. El cuadro De texto a códigos es otra parte de la página y no se lleva. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el valor no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** El cuadro de consulta admite 200 caracteres, muy por debajo de los 16 384 que el sitio permite después del `#`.
- **Al abrir un enlace.** El enlace tiene la forma `#input=` que ya usan los enlaces del Inspector de Unicode para abrir aquí un código, así que abrirlo funciona exactamente como esos enlaces de siempre: el valor rellena el cuadro, la página lo lee y se queda en la dirección hasta que cambias o borras el cuadro.

## Límites

- Aquí, ASCII es el código de 7 bits. Los códigos del 128 al 255 pertenecen al juego de caracteres de 8 bits que use cada sistema (Latin-1, Windows-1252, una página de códigos de DOS); el explorador no intenta adivinar cuál.
- El comportamiento del terminal es el de Linux, según sus páginas de manual. Otros sistemas pueden asignar las teclas de control de otra forma.
- El cuadro de consulta lee un valor cada vez. Para texto, usa el cuadro de texto o el [Inspector de Unicode](/tools/unicode-inspector).

## Fuentes

- [RFC 20: ASCII format for Network Interchange (1969), reproducing USAS X3.4-1968](https://www.rfc-editor.org/rfc/rfc20) (consultado el 2026-10-03)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/18.0.0/ucd/UnicodeData.txt) (consultado el 2026-10-03)
- [Unicode Character Database 18.0.0: NameAliases.txt](https://www.unicode.org/Public/18.0.0/ucd/NameAliases.txt) (consultado el 2026-10-03)
- [Unicode Character Database 18.0.0: DerivedName.txt](https://www.unicode.org/Public/18.0.0/ucd/extracted/DerivedName.txt) (consultado el 2026-10-03)
- [The Unicode Standard 18.0.0, chapter 4: Character Properties (the Name property)](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-4/) (consultado el 2026-10-03)
- [UAX #44: Unicode Character Database (UAX44-LM2, General_Category values)](https://www.unicode.org/reports/tr44/) (consultado el 2026-10-03)
- [UTS #39: Unicode Security Mechanisms, confusables.txt 18.0.0](https://www.unicode.org/Public/18.0.0/security/confusables.txt) (consultado el 2026-10-03)
- [WHATWG HTML: named character references (entities.json)](https://html.spec.whatwg.org/entities.json) (consultado el 2026-10-03)
- [WHATWG HTML: parsing (numeric character reference end state)](https://html.spec.whatwg.org/multipage/parsing.html) (consultado el 2026-10-03)
- [WHATWG Infra: ASCII whitespace](https://infra.spec.whatwg.org/) (consultado el 2026-10-03)
- [ISO/IEC 9899:2011 committee draft N1570 (C11)](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (consultado el 2026-10-03)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (consultado el 2026-10-03)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (consultado el 2026-10-03)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (consultado el 2026-10-03)
- [Tcl 8.4 manual: Tcl (backslash substitution)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consultado el 2026-10-03)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-03); sección 3.5 (consultada el 2026-10-27): el fragmento, que lleva los valores de un enlace de Compartir resultados
- [RFC 5234: ABNF (core rules)](https://www.rfc-editor.org/rfc/rfc5234) (consultado el 2026-10-03)
- [RFC 5321: SMTP (lines end with CR LF)](https://www.rfc-editor.org/rfc/rfc5321) (consultado el 2026-10-03)
- [RFC 9112: HTTP/1.1 (message format)](https://www.rfc-editor.org/rfc/rfc9112) (consultado el 2026-10-03)
- [POSIX.1-2024: Definitions (line, newline)](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html) (consultado el 2026-10-03)
- [Linux manual page termios(3)](https://man7.org/linux/man-pages/man3/termios.3.html) (consultado el 2026-10-03)
- [Linux manual page console_codes(4)](https://man7.org/linux/man-pages/man4/console_codes.4.html) (consultado el 2026-10-03)
