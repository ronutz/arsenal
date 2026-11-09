## Qué hace

Lee HTML (un documento entero o un fragmento) con el mismo analizador que la especificación exige a los navegadores y muestra lo que sale: el árbol (cada elemento, nodo de texto y comentario, con sangría según su profundidad y con la línea de su etiqueta), los elementos que el analizador creó sin etiqueta, las etiquetas de cierre que añadió, los elementos de formato que dividió, el contenido que sacó de una tabla, el modo del documento (no-quirks, limited-quirks o quirks), el DOCTYPE, el título, el idioma y la codificación que declara el documento, cada error de análisis con el código del propio estándar, su línea y su columna, el esquema de encabezados y una lista de hallazgos sobre estructura y accesibilidad, cada uno ligado a una frase del HTML Standard o de WCAG 2.2. También cuenta lo que se habría ejecutado y no se ejecutó: elementos script, gestores de eventos en línea, URL javascript:, elementos style, iframes.

El analizador es parse5, el analizador HTML conforme a la especificación que usan jsdom, Cheerio y el compilador de Angular, ejecutado con las posiciones en el código fuente y el callback de errores de análisis activados, y con el indicador de scripting desactivado (como analiza DOMParser). No se ejecuta, no se descarga y no se renderiza nada. La API alojada ejecuta el mismo código y devuelve el mismo árbol.

## Cómo se lee el árbol

- Un **punto** en el margen de las líneas marca un nodo sin posición en el código fuente: lo creó el analizador. El estándar: “Omitting an element's start tag in the situations described below does not mean the element is not present; it is implied, but it is still there.” (omitir la etiqueta de apertura de un elemento en los casos descritos no significa que el elemento no esté; está implícito, pero sigue ahí). Los habituales son html, head, body y tbody.
- **cierre añadido** marca un elemento cuya etiqueta de cierre no está en el código fuente. El estándar lo permite en 19 elementos (13.1.2.4 Optional tags: html, head, body, li, dt, dd, p, rt, rp, optgroup, option, colgroup, caption, thead, tbody, tfoot, tr, td, th); en cualquier otro significa que faltaba la etiqueta de cierre o que otra etiqueta de cierre lo cerró antes, y el hallazgo D13 dice cuál.
- **pieza n** marca el resultado del algoritmo adoption agency: cuando una etiqueta de cierre cierra un elemento de formato (a, b, i, em, strong, font, small, s, u, code, nobr, big, tt, strike) que no es el elemento abierto más interno, el analizador lo cierra y vuelve a abrir una copia alrededor de lo que sigue, así que un elemento del código fuente se convierte en varios (hallazgo D14).
- **movido** marca el foster parenting: el texto o los elementos escritos dentro de una tabla donde solo pueden aparecer partes de tabla se insertan antes de la tabla (hallazgo D15).
- **vacío** marca los 13 elementos que nunca tienen etiqueta de cierre (area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr). En ellos, una barra final es “unnecessary and has no effect of any kind” (innecesaria y sin ningún efecto); en cualquier otro elemento HTML es un error de análisis y el elemento sigue abierto.

## Los errores de análisis

El estándar define con exactitud el tratamiento de errores, así que un documento con errores sigue teniendo un único árbol exacto: “Parse errors are only errors with the syntax of HTML.” (los errores de análisis son solo errores de sintaxis de HTML). Su tabla de errores con nombre (13.2.2) tiene 52 códigos, cada uno con una descripción no normativa; la página cita la descripción junto a cada error. Los errores de construcción del árbol (una etiqueta de cierre suelta, elementos que quedan abiertos al final, un segundo body) se describen en la prosa del estándar sin códigos; parse5 les da nombre por su cuenta (missing-doctype, end-tag-without-matching-open-element, open-elements-left-after-eof y nueve más), y la página indica qué autoridad dio nombre a cada código.

## Los hallazgos

D1, sin DOCTYPE, y D2, un DOCTYPE heredado (modo quirks); D3, sin lang en la raíz (WCAG 3.1.1); D4, el título ausente, repetido o vacío (modelo de contenido de head, WCAG 2.4.2); D5, la declaración de codificación de caracteres ausente, más allá de los primeros 1024 bytes o distinta de UTF-8; D6, img sin alt, y D7, img con un alt vacío (WCAG 1.1.1 y las reglas de texto alternativo del estándar); D8, un enlace o un botón formado solo por imágenes sin texto alternativo; D9, saltos de nivel en los encabezados y un h1 ausente (4.3.11: “less than, equal to, or 1 greater”, menor, igual o mayor en 1); D10, id duplicados; D11 y D12, los elementos y atributos obsoletos de la sección 16.2, cada uno con el consejo de sustitución del estándar; de D13 a D16, lo que reparó el analizador; D17, un control etiquetable sin etiqueta; D18, lo que no se ejecutó; D19, encabezados vacíos (WCAG 2.4.6); D20, los elementos que creó el analizador.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el HTML tal como se pegó: el árbol, los errores de análisis y los hallazgos dependen de cada uno de sus caracteres, así que no se puede sustituir nada sin cambiar la lectura. Su ventana emergente dice primero qué lleva el enlace, después muestra una advertencia propia (el HTML pegado puede nombrar hosts y rutas internos) y luego ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. La opción “Mostrar los valores de atributo completos” no se lleva.

Una página guardada desde una sesión iniciada puede seguir llevando una credencial, así que antes de ofrecer un enlace el texto pasa por la comprobación de secretos del sitio. Si un valor es un secreto por su formato, no hay enlace, y la ventana emergente indica su línea: una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), secciones 10 y 11), un JWS o un JWE ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), sección 7.1, la serialización que usan los JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), credenciales de Authorization escritas como línea de encabezado ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1) o un ID de clave de acceso de AWS. Sustitúyelo por un marcador de posición y vuelve a presionar. Un valor cuyo nombre solo parece el de un secreto (un miembro JSON como `apiToken`) sigue teniendo enlace, y la línea de advertencia indica su línea para que la revises antes.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el HTML no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El HTML sustituye el contenido del cuadro como lo haría un pegado y la página lo analiza; no se ejecuta, no se descarga y no se renderiza nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Límites

- parse5 8.0.1 implementa el estándar tal como estaba cuando se publicó. No incluye la tokenización de instrucciones de procesamiento que el estándar añadió en 2026: `<?…>` se indica con el nombre anterior, unexpected-question-mark-instead-of-tag-name, y se convierte en un comentario, que es también lo que hace el estándar actual con un destino xml.
- Los hallazgos leen la estructura, no el significado: si un texto alternativo es bueno, si un encabezado describe su sección o si una etiqueta lang es correcta no son preguntas que pueda responder un analizador. headingoffset y headingreset no se aplican al esquema.
- La lista del árbol se detiene en 2000 nodos (los recuentos lo cubren todo); se rechazan las entradas de más de 200.000 caracteres.

## Fuentes

- [HTML Living Standard, 13 The HTML syntax: 13.2.2 Parse errors](https://html.spec.whatwg.org/multipage/parsing.html#parse-errors) (consultado el 2026-10-05)
- [HTML Living Standard, 4.3.11 Headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines) (consultado el 2026-10-05)
- [HTML Living Standard, 16.2 Non-conforming features](https://html.spec.whatwg.org/multipage/obsolete.html#non-conforming-features) (consultado el 2026-10-05)
- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (consultado el 2026-10-05)
- [parse5](https://github.com/inikulin/parse5) (consultado el 2026-10-05)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-11-01): sección 3.5, el fragmento, que usa un enlace de Compartir resultados
