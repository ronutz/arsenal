## Qué hace la herramienta

Pega las líneas `location` de un bloque server más una línea `request <uri>`, y el comparador ejecuta delante de ti el algoritmo de selección documentado de NGINX. Nombra el bloque ganador y muestra el recorrido completo: qué ocurrió en cada paso y por qué, incluidos los pasos que no decidieron nada. Se admite una cadena de consulta en la línea de la solicitud; queda fuera de la comparación y solo alimenta las variables `$arg_<name>`.

## La regla que existe para enseñar

**NGINX no elige el primer bloque location que coincide, ni tampoco el último.** Primero prueba una coincidencia exacta y se detiene si la encuentra. Después revisa todos los bloques de prefijo y recuerda la coincidencia **más larga**, no la primera. Si ese prefijo lleva `^~`, gana de inmediato. Si no, se prueban las expresiones regulares **por orden en el archivo**, y la primera que coincide gana, por encima del prefijo recordado. A partir de nginx 1.31.5, si no coincide ninguna regex, se prueban por orden en el archivo los bloques con predicado (`location $variable`), y gana el primero cuya variable no esté vacía ni valga `0`. Solo si nada coincide en esas dos rondas gana, al final, el prefijo.

El orden en el archivo solo decide las rondas de expresiones regulares y de predicados, y por eso leer una configuración de arriba abajo te lleva activamente a equivocarte sobre el resultado.

## Los dos resultados que se aprenden por las malas

Un bloque de prefijo `/images/` pierde frente a un bloque `~ \.(gif|jpg|png)$` escrito debajo, porque las regex se prueban después de la ronda de prefijos y le ganan. El bloque de aspecto más específico, escrito primero, queda por debajo, y es así a propósito.

Y `^~` no significa “más prioridad”: significa **detenerse antes de las expresiones regulares** (y, a partir de 1.31.5, también antes de los bloques con predicado). Precisamente por eso arregla el caso anterior.

El mismo orden decide qué bloque entrega una URL `.php` a PHP-FPM; [PHP-FPM y FastCGI](/learn/php-fpm-and-fastcgi) explica lo que pasa entre NGINX y PHP a partir de ahí.

## Qué más indica

Junto al recorrido, la herramienta inspecciona la propia configuración: los bloques de prefijo de los que podría apoderarse una expresión regular (con la corrección `^~` indicada), los bloques location duplicados, la ausencia de un `location /` que lo recoja todo, la versión de nginx que necesita un bloque con predicado y cualquier predicado cuya variable no tenga valor.

## Límites, sin rodeos

Un solo bloque server: sin selección por `server_name` y sin comparación del puerto de escucha. Los patrones `~` y `~*` se compilan como expresiones regulares de JavaScript; PCRE y JS coinciden en la sintaxis que se usa en los bloques location habituales, pero son motores distintos, así que, para cualquier cosa exótica, fíate del propio NGINX. La vista de portabilidad de la [Caja de herramientas de regex](/tools/regex) enumera, construcción por construcción, dónde PCRE2 y JavaScript leen un patrón de forma distinta. Sin `rewrite`, `try_files` ni redirecciones internas: esto responde qué bloque se selecciona, no qué hace la solicitud completa. El URI se compara tal como está escrito, porque NGINX decodifica antes de comparar, y hacer la mitad de eso aquí sería peor que no hacer nada. Las variables no se evalúan: un predicado `$arg_<name>` lee la cadena de consulta, cualquier otra variable toma el valor que le des en una línea `variable $name value`, y una variable no declarada cuenta como vacía, así que su predicado no coincide.

## Compartir resultados

Debajo del ganador, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como lo escribiste, una vez que la página tiene un recorrido. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. La gramática acepta líneas location, líneas `variable` y la línea `request`, nada más, así que no puede colarse ninguna otra directiva; pero una línea de solicitud puede llevar una cadena de consulta y una línea `variable`, un valor. Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 8.4: los servidores “commonly store a nonce (or ‘session identifier’) in a cookie”, suelen guardar en una cookie un nonce o identificador de sesión), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (un miembro JSON `token`, un `token=` en una cadena de consulta) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado, y la página hace el recorrido. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [Documentación de NGINX, ngx_http_core_module, location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location) (consultado el 2026-10-26): el orden de selección, `^~` saltándose las expresiones regulares y los bloques con predicado, la regla de los predicados y el ejemplo resuelto (configuraciones de la A a la F) que reproducen las pruebas de la herramienta
- [Documentación de NGINX, How nginx processes a request](https://nginx.org/en/docs/http/request_processing.html) (consultado el 2026-10-26): los bloques location solo comprueban la parte URI de la línea de solicitud, sin argumentos
- [Registro de cambios de NGINX (CHANGES), nginx 1.31.5, 02 Sep 2026](https://nginx.org/en/CHANGES) (consultado el 2026-10-26): “Feature: predicate locations”
