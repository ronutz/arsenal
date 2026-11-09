## Qué hace

Pega un documento XML y la herramienta te dice primero si está bien formado. Si no lo está, obtienes la línea, la columna (contada en caracteres), un código de error estable, un mensaje en lenguaje llano que nombra la regla y su sección en la Recomendación XML 1.0, y la línea que falla con un circunflejo (^) bajo la columna. Si está bien formado, te lo devuelve con formato legible, con dos espacios, cuatro espacios o una tabulación por nivel, o minificado, conservando o descartando los comentarios. Todo se ejecuta en tu navegador.

Sus reglas proceden de la Recomendación del W3C [Extensible Markup Language (XML) 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/) del 26 de noviembre de 2008. Está junto al [Formateador y validador de JSON](/tools/json-formatter) y al [Conversor JSON ↔ YAML](/tools/json-yaml-convert). El [Decodificador de XML](/tools/xml-decoder) es otra herramienta: lee la estructura de un documento y su superficie de ataque (DOCTYPE, entidades externas, expansión de entidades) y no lo reescribe.

## Qué comprueba el veredicto

Estas reglas, todas de la Recomendación, deciden aquí si un documento está bien formado:

- **Un solo elemento raíz** (sección 2.1): exactamente un elemento en el nivel superior; antes y después de él, solo comentarios, instrucciones de procesamiento y espacios en blanco.
- **Caracteres permitidos** (sección 2.2): el tabulador, el salto de línea (line feed), el retorno de carro y los rangos de Unicode de la producción `Char`. Un carácter de control como U+0001, un sustituto suelto (surrogate), U+FFFE o U+FFFF se rechaza dondequiera que aparezca.
- **Nombres** (sección 2.3): los nombres de elementos y atributos, los destinos de las instrucciones de procesamiento y los nombres de entidad siguen la producción `Name`, incluidas las letras fuera de ASCII.
- **Datos de caracteres** (sección 2.4): `&` y `<` nunca aparecen sueltos en el texto, y la secuencia `]]>` nunca aparece en el texto.
- **Comentarios** (sección 2.5): ningún `--` dentro y ningún `--->` al final.
- **Instrucciones de procesamiento** (sección 2.6): un nombre de destino y después un espacio en blanco o `?>`; el destino nunca es `xml`, con ninguna combinación de mayúsculas y minúsculas.
- **Secciones CDATA** (sección 2.7): terminan en el primer `]]>` y solo aparecen dentro de un elemento.
- **La declaración XML** (sección 2.8): solo al principio del todo, sin nada delante, y con la forma `<?xml version="1.x" encoding="..." standalone="..."?>`, con encoding y standalone opcionales y en ese orden.
- **La declaración de tipo de documento** (sección 2.8): una sola vez, antes del elemento raíz, con un nombre, un identificador `SYSTEM` o `PUBLIC` opcional (un identificador público solo usa los caracteres que permite la producción [13]) y un subconjunto interno opcional que solo contiene declaraciones de marcado, comentarios, instrucciones de procesamiento, referencias a entidades de parámetro y espacios en blanco, sin ninguna referencia a una entidad de parámetro dentro de una declaración (la regla PEs in Internal Subset). Las declaraciones de entidad del subconjunto interno se comprueban según su gramática (sección 4.2).
- **Etiquetas y atributos** (sección 3.1): etiquetas de apertura, de cierre y de elemento vacío; cada etiqueta de cierre coincide con el elemento abierto (Element Type Match); ningún atributo aparece dos veces en una etiqueta (Unique Att Spec); cada valor de atributo va entre comillas y no contiene `<`.
- **Referencias** (sección 4.1): cada `&` inicia una referencia bien formada; una referencia de carácter nombra un carácter permitido; una referencia de entidad nombra una entidad declarada cuando se aplica la regla Entity Declared, es decir, sin DTD, con solo un subconjunto interno y sin referencias a entidades de parámetro, o con `standalone="yes"`. Sin una declaración, solo existen `&amp;`, `&lt;`, `&gt;`, `&apos;` y `&quot;`, así que se rechazan los nombres de HTML como `&nbsp;`. Se rechaza una referencia a una entidad declarada con `NDATA` (Parsed Entity), y también una referencia directa a una entidad externa dentro de un valor de atributo (No External Entity References).

Lo que **no** comprueba, sin rodeos:

- **La validez.** Si el documento sigue una DTD, un XML Schema o cualquier otro esquema es otra cuestión; esta herramienta solo comprueba que esté bien formado.
- **La gramática interna de las declaraciones `<!ELEMENT`, `<!ATTLIST` y `<!NOTATION`**, ni nada de una DTD externa, que nunca se lee.
- **Las reglas que necesitan el texto de sustitución de una entidad**, porque nunca se expande ninguna: una referencia indirecta a una entidad externa en un valor de atributo, un `<` que llega a un valor de atributo a través de una entidad, la recursión entre entidades y que el propio texto de sustitución esté bien formado.
- **Los nombres cuando el DOCTYPE apunta a otra parte.** Cuando el DOCTYPE nombra una DTD externa o el subconjunto interno usa entidades de parámetro (y la declaración no dice `standalone="yes"`), un nombre de entidad puede estar declarado donde esta herramienta nunca lee, así que se aceptan los nombres desconocidos y una nota lo indica.
- **Los espacios de nombres.** Los prefijos se conservan como parte de los nombres; que cada prefijo esté declarado es una regla de otra Recomendación, Namespaces in XML, no de XML 1.0, y no se comprueba.
- **La declaración de codificación.** Lo que pegas ya es texto, así que el nombre de la codificación se conserva tal como está escrito y no se compara con nada.

## Qué significa aquí “no significativo”

La sección 2.10 de la Recomendación dice que un procesador XML “MUST always pass all characters in a document that are not markup through to the application” (debe pasar siempre a la aplicación todos los caracteres del documento que no son marcado). Los espacios en blanco de un documento son datos salvo que algo diga lo contrario. Por eso un formateador tiene que decidir qué espacios en blanco puede tratar como maquetación, y este lo decide de forma restrictiva:

- **El único texto que cambia son los espacios en blanco entre elementos**: un nodo de texto formado solo por espacios, tabulaciones y saltos de línea, dentro de un elemento que tiene al menos un elemento hijo y no contiene otros datos de caracteres. El modo Legible sustituye cada uno de esos nodos por un salto de línea y la sangría de la línea siguiente; el modo Minificado lo elimina. Los espacios en blanco fuera del elemento raíz son marcado según la sección 2.4, así que se maquetan igual.
- **El contenido mixto nunca se toca.** La sección 3.2.2 dice que un elemento tiene contenido mixto cuando “may contain character data, optionally interspersed with child elements” (puede contener datos de caracteres, intercalados opcionalmente con elementos hijos). Cuando un elemento contiene texto que no son espacios en blanco, cualquier referencia de carácter o de entidad, o una sección CDATA, todo su contenido, incluidos los elementos hijos, se copia exactamente como está escrito: insertar ahí un salto de línea cambiaría el texto.
- **Se respeta `xml:space="preserve"`.** La sección 2.10 define el atributo especial `xml:space` con los valores `default` y `preserve`; `preserve` indica que las aplicaciones deberían conservar todos los espacios en blanco, y esa intención se aplica a todos los elementos interiores, “unless overridden with another instance of the xml:space attribute” (salvo que otra instancia del atributo xml:space la anule). El contenido bajo `preserve` se copia tal como está escrito, y un elemento interior con `xml:space="default"` vuelve a formatearse. Cualquier otro valor es un error del que la Recomendación permite recuperarse a un procesador ignorando el atributo; esta herramienta lo ignora al dar formato, lo conserva tal como está escrito y añade una nota.
- **Un elemento sin elementos hijos conserva su contenido tal como está escrito**, aunque ese contenido sean solo espacios en blanco, o espacios en blanco y comentarios. `<a>   </a>` se queda como `<a>   </a>`, y con los comentarios descartados, un `<a>` que contiene un comentario entre dos saltos de línea conserva los dos saltos de línea.

**Un esquema todavía puede dar significado a esos espacios en blanco.** Sin leer una DTD o un esquema, un analizador no puede saber si un elemento tiene contenido de elementos o contenido mixto; la sección 2.10 solo pide a un procesador validador que indique a la aplicación qué espacios en blanco aparecen en contenido de elementos. Un esquema que declare un elemento como texto podría hacer que incluso los espacios en blanco entre sus hijos formaran parte de su valor. Si a quien consume tu documento le importa, conserva el original.

## Lo que se conserva exactamente como está escrito

- El texto, las secciones CDATA, los comentarios (salvo que los descartes) y las instrucciones de procesamiento, carácter por carácter.
- La declaración XML, tal como se escribió, comillas incluidas.
- Cada valor de atributo entre sus comillas, con el tipo de comillas con que se escribió: las simples siguen siendo simples y las dobles, dobles. Solo se ordenan los espacios en blanco dentro de una etiqueta: un espacio antes de cada atributo, ninguno alrededor de `=` y ninguno antes de `>` o `/>`.
- Las etiquetas de elemento vacío siguen siendo etiquetas de elemento vacío (`<b/>`), y una etiqueta de apertura seguida de una de cierre se queda así (`<c></c>`).
- Las referencias de carácter (`&#169;`, `&#x2122;`) y las referencias de entidad (`&amp;`, `&org;`) se copian tal como están escritas; nunca se sustituyen por los caracteres que representan.
- El DOCTYPE, con su subconjunto interno, se copia como texto, saltos de línea incluidos.

Hay dos cambios que se hacen siempre, y el resultado lo indica cuando ocurren: se quita una marca de orden de bytes (U+FEFF) al principio, y un retorno de carro seguido de un salto de línea (line feed), o un retorno de carro solo, se lee como un salto de línea, algo que la sección 2.11 exige a todo procesador XML. La salida termina sin un salto de línea final.

## Seguridad: no se expande nada, no se descarga nada

La herramienta nunca expande una entidad, nunca lee una DTD externa y nunca descarga un identificador `SYSTEM` o `PUBLIC`: el DOCTYPE se conserva como texto, y lo único que aprende de un subconjunto interno es qué entidades generales se declaran y cómo. Por eso, aquí un documento preparado para un ataque de entidad externa XML o de expansión de entidades no es más que texto. La entrada está limitada a 2.000.000 caracteres y a 1000 niveles de anidamiento, y el analizador lee el texto una sola vez, así que un documento hostil no puede colgar la página. El Decodificador de XML tampoco expande nada, pero indica qué le haría un documento así a un analizador que sí expande entidades: señala las entidades externas, las entidades de parámetro y las entidades que hacen referencia a otras entidades.

## Documentos firmados

No vuelvas a formatear un documento firmado, como una aserción SAML firmada. Para validar una referencia, el verificador obtiene los datos firmados, aplica las transformaciones de la firma, calcula el resumen (digest) del resultado y lo compara con el valor del resumen que figura en la firma; cualquier discrepancia hace fallar la validación ([XML Signature 1.1, sección 3.2.1](https://www.w3.org/TR/xmldsig-core1/)). La especificación central de SAML dice que una implementación SHOULD (debería) usar Exclusive XML Canonicalization, tanto para la información firmada como en forma de transformación ([SAML 2.0 core, sección 5.4.3](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf)). La canonicalización exclusiva trata los espacios en blanco como lo hace Canonical XML ([Exclusive XML Canonicalization, secciones 1.1 y 3](https://www.w3.org/TR/xml-exc-c14n/)), y Canonical XML conserva “all whitespace in character content” (todos los espacios en blanco del contenido de caracteres), incluidos los espacios en blanco entre etiquetas ([Canonical XML 1.1, sección 1.1 y ejemplo 3.2](https://www.w3.org/TR/xml-c14n/)). Por eso, volver a sangrar un documento firmado cambia el resumen, y la firma deja de verificarse. Leer una copia formateada no es ningún problema; reenviarla, sí. Para leer qué afirma un mensaje SAML, y si está firmado y cómo, usa el [Decodificador de SAML](/tools/saml-decoder).

## Opciones

- **Modo.** Legible pone cada hijo de un elemento con contenido de elementos en su propia línea, con un nivel más de sangría que su padre, y la etiqueta de cierre vuelve al nivel del padre. Minificado quita esos mismos espacios en blanco y no añade ninguno.
- **Sangría.** Dos espacios, cuatro espacios o una tabulación por nivel (solo en el modo Legible).
- **Conservar comentarios.** Activada de forma predeterminada. Desactivada, se omiten todos los comentarios, dentro y fuera de la raíz, y los recuentos indican cuántos.

## Códigos de error

| Código | Significado | Sección |
|---|---|---|
| `empty` | Solo espacios en blanco (lo muestra la API; la página simplemente espera) | |
| `too-large` | Más de 2.000.000 caracteres | |
| `too-deep` | Más de 1000 elementos anidados | |
| `illegal-character` | Un carácter fuera de `Char` | 2.2 |
| `bad-xml-declaration` | Una declaración XML mal formada, o `<?XML` al principio | 2.8 |
| `misplaced-xml-declaration` | Una declaración XML en cualquier lugar que no sea el principio del todo | 2.6, 2.8 |
| `bad-pi` | Una instrucción de procesamiento sin un destino válido | 2.6 |
| `unterminated-pi` | Falta `?>` | 2.6 |
| `unterminated-comment` | Falta `-->` | 2.5 |
| `comment-double-hyphen` | `--` dentro de un comentario, o `--->` | 2.5 |
| `unterminated-cdata` | Falta `]]>` | 2.7 |
| `cdata-outside-root` | Una sección CDATA fuera de todo elemento | 2.7 |
| `bad-doctype` | Un DOCTYPE mal formado | 2.8 |
| `unterminated-doctype` | Un DOCTYPE que nunca se cierra | 2.8 |
| `bad-internal-subset` | En el subconjunto interno, algo que no son declaraciones, comentarios, instrucciones de procesamiento, referencias a entidades de parámetro ni espacios en blanco; ahí, una referencia a una entidad de parámetro dentro de una declaración, o una declaración de entidad mal formada | 2.8, 4.2 |
| `misplaced-doctype` | Un DOCTYPE después de que empiece la raíz, o un segundo DOCTYPE | 2.8 |
| `unknown-markup` | Un `<!` que no inicia un comentario, ni una sección CDATA, ni el DOCTYPE | |
| `bad-start-tag` | Una etiqueta de apertura sin un nombre válido, o con un carácter suelto dentro | 3.1 |
| `bad-attribute` | Sin `=`, sin comillas o sin espacio en blanco antes de un atributo | 3.1 |
| `duplicate-attribute` | El mismo atributo dos veces en una etiqueta | 3.1 |
| `lt-in-attribute` | Un `<` dentro de un valor de atributo | 3.1 |
| `unterminated-tag` | La entrada termina dentro de una etiqueta | 3.1 |
| `bad-end-tag` | Algo que no es espacio en blanco entre el nombre de una etiqueta de cierre y su `>` | 3.1 |
| `mismatched-end-tag` | Una etiqueta de cierre que no coincide con el elemento abierto | 3.1 |
| `unexpected-end-tag` | Una etiqueta de cierre sin ningún elemento abierto | 3.1 |
| `unclosed-element` | Un elemento que nunca se cierra (se indica donde se abre) | 3.1 |
| `bad-reference` | Un `&` que no va seguido de una referencia bien formada | 2.4, 4.1 |
| `illegal-char-reference` | Una referencia de carácter a un carácter fuera de `Char` | 4.1 |
| `undeclared-entity` | Una referencia a una entidad no declarada, cuando se aplica Entity Declared | 4.1 |
| `unparsed-entity-reference` | Una referencia a una entidad declarada con `NDATA` | 4.1 |
| `external-entity-in-attribute` | Una referencia directa a una entidad externa en un valor de atributo | 3.1 |
| `cdata-end-in-text` | `]]>` en el texto | 2.4 |
| `text-outside-root` | Texto antes o después del elemento raíz | 2.1, 2.8 |
| `multiple-roots` | Un segundo elemento de nivel superior | 2.1 |
| `no-root` | Ningún elemento | 2.1 |

## Ejemplos resueltos

- **El botón Ejemplo**: una Response al estilo de SAML 2.0 en una sola línea, tal como llega de un binding, con los espacios de nombres `samlp` y `saml`, un código de estado `Success` y un NameID `emailAddress` (los nombres del estándar [OASIS SAML 2.0 core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf); el mensaje no está firmado). Con formato legible y dos espacios, ocupa 18 líneas; al minificar esas líneas se recupera la línea única, byte por byte. El `&amp;` de `<saml:AttributeValue>admin &amp; auditor</saml:AttributeValue>` se queda como `&amp;`.
- **Contenido mixto**: en `<para>Use <code>--force</code> only when <emphasis>all</emphasis> nodes agree.</para>` no se vuelve a sangrar nada, y un `<para>` cuyo texto ocupa tres líneas conserva sus saltos de línea, sus espacios y la posición de su etiqueta de cierre.
- **`xml:space`**: bajo `<poem xml:space="preserve">` se quedan el salto de línea y los tres espacios antes del segundo `<line>`; dentro de `<listing xml:space="preserve">`, un hijo `<meta xml:space="default">` con dos elementos hijos se vuelve a maquetar.
- **CDATA, comentarios, instrucciones de procesamiento**: `<step id="1"><![CDATA[if (a < b && c) { go(); }]]></step>` se queda en una línea, tal como está escrito; `<?xml-stylesheet type="text/xsl" href="view.xsl"?>` es una instrucción de procesamiento (su destino empieza por `xml-`, que no es el `xml` reservado) y se conserva; `<step id='2'>` conserva sus comillas simples.
- **Un DOCTYPE con referencias**: `<from>&org;</from>` conserva `&org;` (declarada en el subconjunto interno, nunca expandida), `<sign>&#169; 2026 &#x2122;</sign>` conserva las dos referencias de carácter, y `<to   lang = "pt-BR" >` pasa a ser `<to lang="pt-BR">`.
- **Rechazos**: `<a>AT&T</a>` se detiene en la línea 1, columna 6, con `bad-reference`; `<a>&nbsp;</a>`, con `undeclared-entity`; un salto de línea antes de `<?xml version="1.0"?>`, con `misplaced-xml-declaration` en la línea 2, columna 1.

## Procedencia

El motor hace una sola pasada sobre el texto con una pila explícita de elementos, sin reloj, sin red y sin aleatoriedad. Incluye vectores de referencia (el conjunto `xml-formatter-golden-2026-10-26`): 20 documentos aceptados cuya salida está fijada byte por byte, escritos a mano a partir de las reglas anteriores antes de ejecutar el motor, y 42 rechazos fijados por código, línea y columna, al menos uno por cada código de error. Además, en cada documento aceptado se comprueban dos propiedades: volver a formatear la salida no cambia nada, y minificar la salida da el mismo texto que minificar la entrada. Durante el desarrollo, los veredictos se compararon con los del analizador Expat 2.6.1 que incluye Python 3.13, en unos 500.000 documentos generados, y coincidieron en todos salvo en un tipo de caso: Expat acepta un número de versión que no es “1.” seguido de dígitos, como `"10"` o `"2.0"`, algo que la producción [26] de la Recomendación (`'1.' [0-9]+`) no permite. La página de erratas de la Recomendación se consultó el mismo día: su corrección propuesta S01 reformula los nombres reservados y declara prohibido el destino `xml`, que la producción [17] ya excluye, y E01 añade una nota sobre la normalización de Unicode; ninguna de las dos cambia una regla que aplique el motor.

## API

El mismo motor responde a la operación `/api/v1/xml-formatter` de la API HTTP del sitio, descrita en el contrato OpenAPI de la [página de la API](/api); el contrato también indica si este sitio sirve la API.

- **Solicitud.** El documento XML como texto, en el cuerpo de un POST o en el parámetro de consulta `input` de un GET. La API aplica las opciones predeterminadas: legible, dos espacios, comentarios conservados.
- **Respuesta.** `ok`; si está bien formado, `output` y `stats` (`elements`, `attributes`, `comments`, `commentsDropped`, `cdataSections`, `processingInstructions`, `maxDepth`, `mixedContentElements`, `preserveElements`, `insignificantWhitespaceNodes`); si no, `error`, con `code`, un `message` en inglés, `line`, `column`, `offset`, `excerpt`, `excerptColumn` y `params`. Las dos llevan `notes` (`bom-removed`, `line-endings-normalised`, `doctype-kept`, `entities-unchecked`, `xml-space-invalid`) y las `options` aplicadas. Un documento mal formado es una respuesta normal con `ok` igual a false, no un error HTTP.

## Compartir resultados

Debajo del veredicto (o debajo de la línea que falla, que también es el veredicto), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el documento tal como se pegó y las tres opciones elegidas (legible o minificado, la sangría, los comentarios conservados o descartados). Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. El XML puede llevar tokens, hosts internos y nombres de personas, así que la ventana emergente te pide que lo leas antes de enviar el enlace. Antes de ofrecer un enlace, se busca en el texto una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con un valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), secciones 4.1.1 y 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1: la forma “user:password” “is deprecated”, está obsoleta), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece una de ellas, no hay enlace: la ventana emergente indica su línea, y tú la sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (un elemento `password`, un atributo `apiKey`) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo. Cuentan como credenciales dos lugares más, como en el Decodificador de XML: el `Password` de un `UsernameToken` de WS-Security ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html): “provides password information (or equivalent such as a hash)”, proporciona información de la contraseña o un equivalente, como un hash) y una aserción SAML firmada o cifrada. El Ejemplo de la página, una Response al estilo de SAML sin firmar, no contiene ninguna de las dos cosas y sí tiene enlace.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro y las opciones quedan como las habrías elegido tú, y la página lo comprueba y le da formato, en local: no se expande ninguna entidad ni se descarga nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [W3C, Extensible Markup Language (XML) 1.0 (Fifth Edition), W3C Recommendation 26 November 2008](https://www.w3.org/TR/xml/) (consultado el 2026-10-26): secciones 2.1 a 2.11, 3.1, 3.2.2, 4.1 y 4.2; [erratas](https://www.w3.org/XML/xml-V10-5e-errata) (consultado el 2026-10-26)
- [W3C, Canonical XML Version 1.1, W3C Recommendation 2 May 2008](https://www.w3.org/TR/xml-c14n/) (consultado el 2026-10-26; esta dirección sirve ahora la versión 1.1): sección 1.1 y ejemplo 3.2
- [W3C, Exclusive XML Canonicalization Version 1.0, W3C Recommendation 18 July 2002](https://www.w3.org/TR/xml-exc-c14n/) (consultado el 2026-10-26): secciones 1.1 y 3
- [W3C, XML Signature Syntax and Processing Version 1.1, W3C Recommendation 11 April 2013](https://www.w3.org/TR/xmldsig-core1/) (consultado el 2026-10-26): sección 3.2.1
- [OASIS, Assertions and Protocols for the OASIS Security Assertion Markup Language (SAML) V2.0, OASIS Standard, 15 March 2005](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) (consultado el 2026-10-26): sección 5.4.3, y los nombres de los espacios de nombres, el código de estado Success y el formato de NameID emailAddress que usa el Ejemplo
