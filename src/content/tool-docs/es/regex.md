## Qué hace

Prueba, explica y depura una expresión regular. Escribe un patrón y algo de texto y la herramienta muestra cada coincidencia con sus grupos de captura en vivo, mientras escribes; escribe solo un patrón y lo divide en piezas anotadas para que puedas leer qué hace cada parte; y en todo momento advierte cuando un patrón corre el riesgo de sufrir backtracking catastrófico. Usa el motor de expresiones regulares de JavaScript (ECMAScript) y se ejecuta por completo en tu navegador.

## Cuatro tareas en una

La herramienta hace las cuatro cosas que de verdad quieres de un banco de pruebas de regex:

- **Probar.** Compila tu patrón y tus flags, indica cualquier error de sintaxis con palabras claras y ejecuta el patrón sobre tu entrada, devolviendo cada coincidencia con sus grupos de captura numerados y con nombre. El número de coincidencias que recoge tiene un límite, así que un patrón que coincide con una entrada enorme no puede bloquear la página.
- **Explicar.** Analiza el patrón en tokens anotados, con una etiqueta para cada cuantificador, clase de caracteres, grupo y aserción, para que puedas entender una regex sin ejecutarla de cabeza.
- **Comprobar el ReDoS.** Busca las estructuras que provocan backtracking catastrófico y te avisa de ellas.
- **Comparar variantes.** Enumera cada construcción del patrón cuya compatibilidad o significado difiere entre ECMAScript, PCRE2 (NGINX) y las Tcl Advanced Regular Expressions (iRules de BIG-IP), de forma estática, sin ejecutar el patrón en ningún sitio más que aquí. La sección Variantes, más abajo, lo explica.

## Qué es el ReDoS y por qué importa aquí

La denegación de servicio por expresiones regulares (ReDoS, Regular expression Denial of Service) se produce cuando un patrón puede hacer backtracking de un número exponencial de formas con ciertas entradas, de modo que una cadena corta hace que el motor se ejecute, en la práctica, para siempre. La forma clásica es un cuantificador aplicado a un grupo que a su vez contiene un cuantificador, como `(a+)+`, frente a una entrada que al final no coincide. Esto importa directamente en el navegador: una coincidencia de regex síncrona no se puede interrumpir, así que un patrón catastrófico colgaría la página. Por eso la herramienta limita su trabajo y además marca los patrones de riesgo, y es una advertencia real que conviene atender antes de poner en producción un patrón que se va a ejecutar sobre entradas no fiables. El [laboratorio del artículo sobre el backtracking](/learn/regex-catastrophic-backtracking#lab-regex-partitions) cuenta de cuántas formas puede dividir `(a+)+` una secuencia de letras a.

## El motor y su variante

La sintaxis de las regex varía entre lenguajes, y esta herramienta usa la variante de JavaScript que define la especificación ECMAScript, con sus flags (global, ignore-case, multiline, dotall, unicode y sticky) y su soporte de grupos con nombre y de lookarounds. Si escribes regex para JavaScript, o para cualquier cosa que comparta su semántica, lo que ves aquí es lo que obtendrás. Para cualquier otro motor, consulta Variantes, más abajo.

Debajo del patrón, un botón por flag lo añade al campo de flags o lo quita, cada uno con el nombre de su propiedad de RegExp (`g global`, `i ignoreCase`, etc.); el campo se puede seguir escribiendo a mano.

## Variantes

El probador ejecuta un solo motor, ECMAScript, pero los patrones que escriben los ingenieros de redes y de seguridad rara vez se quedan en JavaScript. Un bloque `location ~` de NGINX, una iRule de BIG-IP y una firma de un firewall de aplicaciones web (WAF, web application firewall) entregan cada uno el patrón a un motor distinto, y los mismos caracteres pueden significar allí cosas distintas. La sección **Portabilidad** lee los tokens de tu patrón y enumera cada construcción cuya compatibilidad o significado difiere entre tres variantes:

- **ECMAScript**, tal como la define la edición de 2026 de ECMA-262 (la 17.ª edición; su gramática de RegExp no cambia en el borrador de 2027), junto con el anexo para navegadores que, por ejemplo, hace de `\A` la letra A normal cuando no está activado ni el flag `u` ni el `v`.
- **PCRE2**, tal como la describe su propio manual. NGINX necesita la biblioteca PCRE para las expresiones regulares de `location` y del módulo rewrite, sus directivas `map` y `server_name` también aceptan expresiones regulares, y desde la 1.21.5 usa PCRE2, salvo que se compile con `--without-pcre2`, que selecciona la biblioteca PCRE original.
- **Tcl Advanced Regular Expressions (ARE)**, tal como las describe el manual `re_syntax` de Tcl 8.4. F5 indica que el conjunto de comandos de las iRules de BIG-IP se desarrolló a partir de la versión base 8.4.6 de Tcl (K6091), y `regexp` y `regsub` no están en su lista de comandos de Tcl deshabilitados (K36322151). Los manuales de Tcl 8.6 y 9.0 no añaden ni lookbehind ni grupos con nombre, y su `\w` también acepta los caracteres de puntuación conectora.

Cada construcción recibe una respuesta por variante: **igual** (se admite con el significado que da el título de la fila), **difiere** (se admite con otro significado u otra sintaxis, y la fila dice cómo) o **no se admite** (un error, o se lee como otra cosa, y la fila dice cuál). La sección aparece aunque tu navegador no pueda compilar el patrón, porque de lo que se trata es de poder pegar un patrón de NGINX o de iRules.

Donde viven estos patrones, otras herramientas los leen: el [comparador de location de NGINX](/tools/nginx-location-matcher) muestra qué bloque `location` selecciona un URI, el [revisor de rendimiento de iRules](/tools/f5-irules-performance-linter) señala `regexp` y `regsub` donde bastaría un comando de cadenas, y el [explicador de scripts de Expect](/tools/expect-script-explainer) lee los patrones de un script de Expect, cuyos patrones `-re` “follow the syntax defined by Tcl's regexp” (siguen la sintaxis que define el comando regexp de Tcl) (expect(1), Expect 5.45.4), así que la columna de Tcl también se les aplica.

| Construcción | ECMAScript | PCRE2 | ARE de Tcl |
|---|---|---|---|
| Lookbehind de longitud fija: `(?<=ab)`, `(?<=colour\|color)` | igual | igual: cada rama de nivel superior, de longitud fija, hasta 65.535 caracteres | no se admite: solo lookahead |
| Lookbehind variable con un máximo: `(?<=colou?r)` | igual | difiere: desde la 10.43, cada rama hasta un límite que fija el programa que llama, 255 de forma predeterminada; no se admite por encima de él ni antes de la 10.43 | no se admite |
| Lookbehind sin máximo: `(?<=\d+)` | igual | no se admite | no se admite |
| Lookahead que contiene un grupo o una referencia inversa | igual | igual | difiere: los paréntesis de dentro nunca capturan; no se admite una referencia inversa |
| Grupo con nombre `(?<name>...)` | igual, la única forma de escribirlo | igual; fuera del modo UTF, el nombre tiene que ser ASCII | no se admite |
| Grupo con nombre `(?P<name>...)` o `(?'name'...)` | no se admite | igual | no se admite |
| Referencia inversa con nombre `\k<name>` | igual | igual | no se admite |
| `\k'name'`, `\k{name}`, `\g{name}`, `\g1`, `\g{-1}`, `(?P=name)` | no se admite | igual | no se admite |
| Modificadores limitados a un grupo `(?i:...)`, `(?i-s:...)` | igual desde ECMAScript 2025, solo con las letras i, m y s | igual | no se admite |
| Opciones sueltas `(?i)`, `(?im)` | no se admite | igual | solo justo al principio; i y x significan lo mismo, m es la coincidencia sensible a los saltos de línea y s, el modo predeterminado |
| Cuantificadores posesivos `a++`, `a*+` | no se admite | igual | no se admite |
| Grupo atómico `(?>...)` | no se admite | igual | no se admite |
| `\A` | no se admite | igual | igual |
| `\Z` | no se admite | igual: el final, o antes de un salto de línea final | difiere: solo el final absoluto |
| `\z` | no se admite | igual | no se admite |
| `$` | igual: el final; con `m`, antes de los terminadores de línea | difiere: también antes de un salto de línea final, salvo que esté activado PCRE2_DOLLAR_ENDONLY | igual: el final; con `-line`, antes de cada salto de línea |
| `.` | igual: no coincide con LF, CR, U+2028 ni U+2029, salvo con `s` | difiere: no coincide con los caracteres de la convención de salto de línea (solo LF, de forma predeterminada) | difiere: coincide con el salto de línea, salvo que la coincidencia sea sensible a los saltos de línea |
| Clase POSIX `[[:alpha:]]` | no se admite | igual: ASCII salvo con PCRE2_UCP; también `ascii`, `word` y `[:^name:]` | difiere: configuración regional Unicode; doce nombres, sin negación |
| `[[:<:]]`, `[[:>:]]` | no se admite | igual, convertidos en un límite de palabra | igual, en desuso |
| `\Q...\E` | no se admite | igual | no se admite; `***=` hace literal una expresión entera |
| `\p{L}`, `\P{L}` | difiere con `u` o `v` (nombres más estrictos); no se admite sin ellos | igual: nombres flexibles y nombres de escritura sin más | no se admite |
| `\pL` | no se admite | igual | no se admite |
| Cuantificadores perezosos `*?`, `+?`, `??`, `{n,m}?` | igual | igual | difiere: reglas de preferencia por la coincidencia más larga o más corta |
| `\b` | igual: caracteres de palabra ASCII | igual: ASCII salvo con PCRE2_UCP | difiere: retroceso (backspace); el límite de palabra es `\y` |
| `\B` | igual | igual | difiere: una barra invertida; lo contrario de un límite de palabra es `\Y` |
| `\w`, `\W` | igual: ASCII | igual: ASCII salvo con PCRE2_UCP | difiere: configuración regional Unicode |
| `\D`, `\S` o `\W` dentro de corchetes | igual | igual | no se admite |
| `\m`, `\M`, `\y`, `\Y` | no se admite: letras normales en un navegador sin `u` ni `v` | no se admite: un error | igual: restricciones de palabra |
| `{,n}` | no se admite: texto literal sin `u` ni `v` | igual desde la 10.43 | no se admite: texto literal |

### Firmas de firewall de aplicaciones web

La sintaxis de firmas de F5 para las firmas de ataque y de bots de BIG-IP ASM (un manual que se aplica a BIG-IP ASM de la 14.1.0 a la 21.0.0) nombra tres opciones de regla de expresión regular. La opción `pcre` se basa en la sintaxis PCRE, pero F5 no indica qué biblioteca PCRE ni qué versión usa. La opción `re2` acepta la sintaxis de código abierto de RE2, que F5 recomienda por rendimiento, y esta vista no compara RE2. La opción `ipp`, solo para firmas de bots, usa un motor basado en Intel cuya sintaxis F5 no indica. Así que la columna de PCRE2 es la guía más cercana para la opción `pcre`, y nada más que eso.

### Lo que la vista no comprueba

Es una comparación estática de la sintaxis, no un segundo motor: nunca ejecuta tu patrón en PCRE2 ni en Tcl. No comprueba los límites de los motores (los límites de los cuantificadores, el tamaño del patrón, el límite de lookbehind más allá de su valor predeterminado de 255), el rendimiento ni el comportamiento del backtracking, las opciones que un producto activa por ti (el `~*` de NGINX, que no distingue mayúsculas de minúsculas, los modificadores de una firma, el modo UTF o UCP de PCRE2, la opción `-line` de Tcl) ni las construcciones que no están en su lista, como las llamadas a subrutinas, los condicionales, los comentarios, `\K`, `\G`, `\R`, `\X` y los escapes hexadecimales u octales. Que un patrón no tenga filas no demuestra que sea portable; solo significa que no usa nada de la lista.

## Uso

Escribe un patrón y sus flags y, opcionalmente, algo de texto con el que comparar, y lee las coincidencias en vivo, la explicación token por token, las filas de portabilidad y cualquier advertencia de backtracking. **Ejemplo de portabilidad** carga un patrón que cada variante lee de forma distinta. Todo se calcula en local.

## Compartir resultados

Debajo del texto de prueba, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el patrón, los flags y el texto de prueba tal como se escribieron, una vez que hay un patrón. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. El texto de prueba suele ser datos reales, así que la ventana emergente te pide que lo leas antes de enviar el enlace. El texto de prueba va tal como se escribió: las coincidencias son la lectura, y un valor sustituido en él coincidiría de otra forma. Antes de ofrecer un enlace, se busca en el texto una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), secciones 4.1.1 y 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1: la forma “user:password” “is deprecated”, está obsoleta), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece uno, no hay enlace: la ventana emergente indica el campo y la línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (un `password=` en una cadena de consulta, `api_key = ...`) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los tres campos se rellenan como si los escribieras, y la página explica y busca coincidencias. Un patrón que la comprobación estática marca por backtracking catastrófico sigue esperando detrás de **Ejecutar de todos modos**: un enlace nunca da ese consentimiento. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [ECMA-262, ECMAScript 2026 Language Specification (17th edition), 22.2.1 Patterns](https://tc39.es/ecma262/2026/#sec-patterns), [22.2.2 Pattern Semantics](https://tc39.es/ecma262/2026/#sec-pattern-semantics), [Annex B.1.2 Regular Expressions Patterns](https://tc39.es/ecma262/2026/#sec-regular-expressions-patterns) y la [Introduction](https://tc39.es/ecma262/2026/#sec-intro) (ECMAScript 2025 añadió los modificadores en línea) (consultado el 2026-10-26)
- [ECMA-262 draft, 22.2 RegExp Objects](https://tc39.es/ecma262/multipage/text-processing.html): la gramática de patrones del borrador de 2027 coincide con la de la edición de 2026 (consultado el 2026-10-26)
- [PCRE2 manual: pcre2pattern](https://www.pcre2.org/doc/pcre2pattern/), [pcre2syntax](https://www.pcre2.org/doc/pcre2syntax/), [pcre2api](https://www.pcre2.org/doc/pcre2api/) y [pcre2build](https://www.pcre2.org/doc/pcre2build/) (manual de la 10.50-DEV; consultado el 2026-10-26)
- [Tcl 8.4 manual: re_syntax](https://www.tcl-lang.org/man/tcl8.4/TclCmd/re_syntax.htm) y [regexp](https://www.tcl-lang.org/man/tcl8.4/TclCmd/regexp.htm); [Tcl 8.6.18: re_syntax](https://www.tcl-lang.org/man/tcl8.6/TclCmd/re_syntax.htm); [Tcl 9.0.4: re_syntax](https://www.tcl-lang.org/man/tcl9.0/TclCmd/re_syntax.html) (consultados el 2026-10-26)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) y [K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (consultados el 2026-10-26)
- [F5 BIG-IP ASM: Attack and Bot Signatures, Signature Syntax](https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-asm-attack-and-bot-signatures-14-1-0/signature-syntax.html) (se aplica a BIG-IP ASM de la 14.1.0 a la 21.0.0; consultado el 2026-10-26)
- nginx: [location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location), [map](https://nginx.org/en/docs/http/ngx_http_map_module.html#map), [Building nginx from Sources](https://nginx.org/en/docs/configure.html) y [Regular expression captures](https://nginx.org/en/docs/regex_captures.html) (consultados el 2026-10-26)
- [expect(1), Expect 5.45.4 manual source](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (consultado el 2026-10-27): los patrones de estilo regexp siguen la sintaxis que define el comando regexp de Tcl
