## Qué hace

Un texto puede contener mucho más de lo que muestra. Un espacio de ancho cero se queda entre dos letras sin dejar rastro, un carácter de sustitución de derecha a izquierda (right-to-left override) hace que una línea de código se muestre en un orden distinto del que lee el compilador, una “а” cirílica pasa por una “a” latina, y un separador de línea empieza una línea nueva en tu editor, pero no en tu analizador. El inspector muestra lo que hay de verdad, punto de código a punto de código.

Tiene cuatro modos:

- **Inspeccionar un texto** cuenta el texto, dice si hay algo que merezca una revisión, lista lo que encontró por tipo, marca los controles bidireccionales que quedan sin cerrar al final de una línea y las palabras que mezclan escrituras, dibuja el texto en el orden en que está guardado con cada carácter oculto como una etiqueta, lista todos los puntos de código, ofrece una copia limpia y escribe el texto como secuencias de escape en ocho lenguajes.
- **Un punto de código** acepta un punto de código en cualquier notación (`U+00E9`, `é`, `0xE9`, `&eacute;`, `\u00e9`, `zero width space`, `BOM`) y muestra su nombre y sus alias, sus propiedades, sus codificaciones, sus secuencias de escape y lo que conviene saber de él.
- **Buscar por nombre** lista los puntos de código cuyo nombre o alias tiene palabras que empiezan por las palabras que escribes.
- **Normalizar** muestra un texto en NFC, NFD, NFKC y NFKD con los puntos de código y los bytes UTF-8 de cada forma, y lo compara con un segundo texto en cada una de las formas.

## Qué indica en un texto

| Hallazgo | Qué es | Por qué importa |
|---|---|---|
| Control bidireccional | Uno de los doce caracteres Bidi_Control (LRM, RLM, ALM, LRE, RLE, LRO, RLO, PDF, LRI, RLI, FSI, PDI) | Cambia el orden en que se muestra el texto que lo rodea; es la clase de ataque Trojan Source (CVE-2021-42574) |
| Sin cerrar al final de la línea | Una incrustación (embedding), una sustitución (override) o un aislamiento (isolate) sin PDF ni PDI antes de que acabe la línea | Todo lo que va detrás en esa línea puede mostrarse en un orden distinto del orden en que se lee |
| Invisible | Default_Ignorable_Code_Point: los caracteres de ancho cero, la BOM, los selectores de variación, las etiquetas (tags) | No se dibuja, pero las comparaciones de cadenas, las longitudes y los hashes lo ven |
| Control | Un código de control distinto de TAB, LF y CR | No es texto; las herramientas lo descartan, muestran un recuadro o se detienen |
| Salto de línea distinto de LF o CR | VT, FF, NEL (U+0085), LINE SEPARATOR (U+2028), PARAGRAPH SEPARATOR (U+2029) | Un editor y un lenguaje pueden no coincidir en dónde acaba una línea (UTS #55, suplantación mediante saltos de línea) |
| Sustituto suelto, no carácter | Puntos de código que no son caracteres | No son válidos en UTF-8 (los sustitutos) o nunca se pensaron para el intercambio (los no caracteres) |
| Uso privado, sin asignar | Sin significado público, o todavía sin carácter | Las fuentes y los sistemas difieren, o el texto viene de un Unicode más reciente que el tuyo |
| Carácter de sustitución | U+FFFD | Suele marcar un error de decodificación anterior |
| Espacio, comilla o guion no ASCII | Los espacios de no separación y otros espacios, las comillas tipográficas, la semirraya y la raya, el signo menos | Parecen ASCII; los analizadores y las comparaciones no se ponen de acuerdo |
| Confundible con ASCII | Un carácter que UTS #39 asigna a un prototipo ASCII | Imitaciones: la а cirílica por la a, la ο griega por la o |
| ASCII estilizado | Un carácter cuya descomposición de compatibilidad es ASCII | Letras de ancho completo, ligaduras y similares |
| Palabra que mezcla escrituras | Una palabra cuyas letras no comparten ningún sistema de escritura | `pаypal` con una а cirílica; el japonés que mezcla Han, Hiragana y Katakana no se marca |

La detección de mezcla de escrituras sigue UTS #39: el conjunto de escrituras aumentado (augmented script set) de cada carácter es su Script_Extensions más los sistemas de escritura que combinan escrituras (Han añade Hanb, Hntl, Jpan y Kore; Hiragana y Katakana añaden Jpan; Hangul añade Kore; Bopomofo añade Hanb; Latin añade Hntl), un carácter Common o Inherited coincide con cualquier escritura, y una palabra es mixta cuando la intersección de esos conjuntos para todos sus caracteres está vacía.

## El texto, en el orden en que está guardado

El panel que lo revela dibuja el texto de izquierda a derecha en el orden de la memoria, con la sustitución bidireccional desactivada para el propio panel, así que ningún control del texto puede reordenar lo que ves. Cada carácter que merece una revisión se convierte en una etiqueta con su punto de código; las etiquetas rojas cambian el significado o el orden, y las ámbar imitan algo. Pasa el cursor por encima de una etiqueta, o ponle el foco, para ver su nombre.

## Limpieza

La copia limpia puede quitar los caracteres invisibles y bidireccionales, sustituir los espacios no ASCII por SPACE (y LINE SEPARATOR, PARAGRAPH SEPARATOR y NEL por LF), convertir las comillas y los guiones tipográficos en `'`, `"` y `-` y, si lo pides, sustituir las imitaciones por el ASCII que imitan. Esta última opción está desactivada de forma predeterminada, porque también cambia palabras auténticas en cirílico, en griego y en otras escrituras.

## Secuencias de escape

El texto entero puede escribirse en JSON, JavaScript, Python, HTML, CSS, una URL, una cadena `u8` de C o una palabra entre comillas de Tcl (iRules). Cada forma escapa los caracteres que reserva su lenguaje y todo lo que queda fuera del ASCII imprimible. Cuando se creó esta herramienta, cada forma de 4000 puntos de código repartidos por los diecisiete planos, y de dos textos de prueba de estrés, se decodificó de vuelta con el propio lenguaje (CPython, Node, GCC, Tcl 8.4.6 y Chromium para HTML y CSS), y todos volvieron sin cambios.

Algunas formas no pueden contener todos los caracteres, y la herramienta lo dice en lugar de escribir algo incorrecto:

- **Tcl 8.4 y las iRules** no tienen secuencia de escape para un carácter más allá de U+FFFF: `\u` admite como máximo cuatro dígitos hexadecimales, y el intérprete de Tcl 8.4.6 lee los cuatro bytes UTF-8 de ese carácter como cuatro caracteres distintos.
- **HTML** no puede llevar un sustituto suelto, y una referencia de U+0080 a U+009F da otro carácter: 27 de esas 32 referencias se leen como Windows-1252 (`&#x85;` son unos puntos suspensivos), así que la herramienta escribe esos caracteres tal cual.
- **CSS** convierte en U+FFFD un 0 o un sustituto escapados.
- **En C**, los nombres de carácter universales (universal character names) no pueden nombrar un carácter por debajo de U+00A0 distinto de `$`, `@` y `` ` ``, ni un sustituto; en su lugar, la herramienta escribe en octal los bytes UTF-8 de U+0080 a U+009F.
- **Las URL** codifican por porcentaje los bytes UTF-8, que un sustituto suelto no tiene.

## Un punto de código

- **Nombre.** La propiedad Name; para un control, su primer alias formal (los controles no tienen nombre); para cualquier otra cosa sin nombre, su etiqueta de punto de código, como `<surrogate-D800>` o `<reserved-0378>`.
- **Alias.** Cada alias formal con su tipo: corrección, nombre de control, alternativo, ficticio o abreviatura (`BOM` y `ZWNBSP` para U+FEFF).
- **Propiedades.** General_Category, Block, Script y Script_Extensions, y la versión de Unicode que lo añadió.
- **Codificaciones.** Los bytes UTF-8, las unidades de código UTF-16 (un par sustituto más allá de U+FFFF) y UTF-32.
- **Secuencias de escape y referencias.** Las ocho formas anteriores para este punto de código, más las referencias HTML decimal, hexadecimal y con nombre, con una nota cuando una referencia no devuelve este punto de código.

## Normalización

El mismo texto visible puede guardarse como secuencias distintas de puntos de código: é como U+00E9, o como e seguida de U+0301 COMBINING ACUTE ACCENT. El modo **Normalizar** muestra un texto en las cuatro formas de normalización de UAX #15, cada una con sus puntos de código, sus bytes UTF-8 y si difiere del texto tal como se escribió: NFD (descomposición canónica), NFC (descomposición canónica y después composición canónica), NFKD (descomposición de compatibilidad) y NFKC (descomposición de compatibilidad y después composición canónica).

NFC y NFD conservan los caracteres de compatibilidad, como la ligadura ﬁ (U+FB01) y las letras de ancho completo; NFKC y NFKD los sustituyen por sus equivalentes simples, lo que, como advierte UAX #15, puede borrar distinciones que importan, así que las formas K son para cuando borrarlas es precisamente la intención. Los singletons como U+212B ANGSTROM SIGN y U+2126 OHM SIGN no sobreviven a ninguna forma, y las marcas combinantes se ponen en orden canónico, así que A, U+030A, U+0323 se convierte en U+1EA0 U+030A en NFC.

Escribe un segundo texto en **Comparar con** y la herramienta dice si los dos son iguales tal como se escribieron y en cada forma: idénticos, canónicamente equivalentes (iguales en NFC y en NFD), iguales solo en NFKC y NFKD, o distintos en todas las formas. De eso se trata, de normalizar los dos lados a una misma forma antes de compararlos; el [artículo sobre la normalización Unicode](/learn/unicode-normalisation) explica por qué.

Las formas las calcula `String.prototype.normalize` (ECMA-262, sección 22.1.3.15) con las tablas Unicode del motor de JavaScript que ejecuta la herramienta: en esta página, tu navegador. Esas tablas pueden ser más antiguas que los datos 18.0.0 que usan los demás modos. La política de estabilidad de Unicode garantiza que un texto formado por caracteres que un motor conoce se normaliza con el mismo resultado en todas las versiones posteriores, así que la única diferencia que puede introducir un motor más antiguo es dejar pasar sin cambios un carácter más reciente que sus tablas. De cada texto se leen como máximo sus primeros 1000 puntos de código.

## Compartir resultados

Debajo de la primera respuesta del modo en uso, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro de ese modo tal como lo escribiste y las opciones propias del modo. El nombre del cuadro indica el modo: `text` para Inspeccionar un texto, con las cuatro opciones de limpieza (`invisible`, `spaces`, `punct`, `fold`) y `escape`, el lenguaje en el que se escribe el texto; `cp` para Un punto de código; `query` para Buscar por nombre; `norm` para Normalizar, con `compare` cuando se escribió un segundo texto. Una opción con su valor predeterminado no se incluye. Los caracteres ocultos, como los controles bidireccionales y los espacios de ancho cero, viajan exactamente como son. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16 384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Se establece el modo, su cuadro se rellena como lo haría un pegado, se establecen sus opciones y la página calcula (la tabla de nombres se carga en la página, como con un pegado). Dos cuadros a la vez, una opción que pertenece a otro modo, un valor que la página no ofrece o un cuadro más largo que su campo hacen que se ignore el enlace entero. En cualquier caso, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
- **Enlaces desde la tabla ASCII.** Un punto de código que llega como `#input=` sigue abriendo Un punto de código exactamente igual que antes; Compartir resultados usa nombres propios, así que los dos nunca se mezclan.

## Límites

- Las columnas se cuentan en puntos de código, y las posiciones también. Los editores pueden contar en su lugar unidades UTF-16 o caracteres tal como los percibe el usuario.
- La detección de mezcla de escrituras funciona palabra por palabra; no comprueba identificadores completos a través de la puntuación, y no decide si una mezcla es legítima.
- Los datos de confundibles cubren los caracteres que parecen texto ASCII. Los confundibles entre dos escrituras no ASCII quedan fuera del alcance.
- La herramienta muestra la visión de Unicode 18.0.0. Un sistema con datos más antiguos puede no conocer los caracteres añadidos desde entonces (en la 18.0 llegaron 13.007).
- La normalización usa la versión de Unicode del motor de JavaScript que la ejecuta, no la 18.0.0: mira Normalización, más arriba.

## Fuentes

- [Unicode Character Database 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/): UnicodeData.txt, DerivedName.txt, NameAliases.txt, PropList.txt, DerivedCoreProperties.txt, Blocks.txt, DerivedAge.txt, Scripts.txt, ScriptExtensions.txt, LineBreak.txt, PropertyValueAliases.txt (consultado el 2026-10-03)
- [UTS #39: Unicode Security Mechanisms (18.0.0) y confusables.txt](https://www.unicode.org/reports/tr39/) (consultado el 2026-10-03)
- [UTS #55: Unicode Source Code Handling](https://www.unicode.org/reports/tr55/) (consultado el 2026-10-03)
- [UAX #9: Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/) (consultado el 2026-10-03)
- [UAX #44: Unicode Character Database](https://www.unicode.org/reports/tr44/) (consultado el 2026-10-03)
- [The Unicode Standard 18.0.0, capítulos 3, 4, 5 y 23](https://www.unicode.org/versions/Unicode18.0.0/) (consultado el 2026-10-03)
- [NVD: CVE-2021-42574](https://nvd.nist.gov/vuln/detail/CVE-2021-42574) (consultado el 2026-10-03)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (consultado el 2026-10-03)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (consultado el 2026-10-03)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (consultado el 2026-10-03)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (consultado el 2026-10-03)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (consultado el 2026-10-03)
- [ISO/IEC 9899:2011, borrador del comité N1570 (C11), 6.4.3](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (consultado el 2026-10-03)
- [Tcl 8.4 manual: Tcl](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consultado el 2026-10-03)
- [WHATWG HTML: parsing (numeric character references)](https://html.spec.whatwg.org/multipage/parsing.html) (consultado el 2026-10-03)
- [WHATWG HTML: named character references](https://html.spec.whatwg.org/entities.json) (consultado el 2026-10-03)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-03); sección 3.5 (consultada el 2026-10-27): el fragmento, que lleva los valores de un enlace de Compartir resultados
- [UAX #15: Unicode Normalization Forms, revisión 58 (Unicode 18.0.0)](https://www.unicode.org/reports/tr15/) (consultado el 2026-10-26)
- [Unicode Character Encoding Stability Policies: Normalization Stability](https://www.unicode.org/policies/stability_policy.html) (consultado el 2026-10-26)
- [ECMA-262: String.prototype.normalize, sección 22.1.3.15](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize) (consultado el 2026-10-26)
