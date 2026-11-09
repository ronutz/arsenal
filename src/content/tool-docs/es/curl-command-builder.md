## Qué hace

Elige un protocolo, rellena los campos que se adaptan a él y mira cómo se arma en directo el comando `curl` exacto. Cada opción que emite el generador se explica debajo del comando, y todo lo que tiene implicaciones de seguridad lleva una advertencia: `-k`, los protocolos en claro, una contraseña puesta en la línea de comandos o el `-d` codificado como formulario que `curl` usa de forma predeterminada cuando el cuerpo parece JSON. No se ejecuta nada y nada sale del navegador.

## Los 27 protocolos

El generador cubre la lista completa de protocolos de la herramienta `curl` actual tal como la publica curl.se: DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP (protocolo ligero de acceso a directorios, Lightweight Directory Access Protocol), LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS y WSS. Al seleccionar un protocolo se abre una breve explicación: qué es, cuál es su puerto predeterminado y si funciona en claro, dentro de TLS o empieza en claro con una vía de actualización. Después, el formulario solo muestra lo que entiende ese protocolo: HTTP tiene métodos, encabezados, cuerpos y formularios; SMTP, un sobre; MQTT, un tema; FTP, listado y subida; `file://`, solo una ruta.

## Una tabla, una sola verdad

Los paneles explicativos y el ensamblador del comando leen la misma tabla de capacidades de los protocolos. Es así a propósito: el texto que te enseña qué puede hacer un protocolo y el código que construye el comando no pueden desincronizarse, porque son los mismos datos.

## Determinista por construcción

Las mismas entradas producen siempre un comando idéntico byte a byte: las opciones se emiten en un único orden canónico, y los valores se entrecomillan con el escape de comillas simples de POSIX solo cuando hace falta. Once vectores de referencia fijan este comportamiento, incluida la regla de que `-d` implica POST (así que nunca se emite un `-X POST` redundante) y la secuencia de escape `'\''`. El entrecomillado está pensado para shells POSIX; una nota en la herramienta lo indica, porque cmd.exe y PowerShell siguen otras reglas.

## La inversa del explicador

Esta herramienta escribe comandos `curl`; el [Explicador de comandos curl](/tools/curl-command-explainer) los lee. Arma un comando aquí, o pega uno allí para que te lo explique opción por opción y lo traduzca a fetch, a HTTP en bruto, a HTTPie y a requests de Python.

## Compartir resultados

Debajo del cuadro del comando, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el formulario después del `#`, cada campo con su propio nombre (un formulario no tiene un único texto que pegar), con la contraseña y todas las credenciales sustituidas por `REDACTED`, nunca tal como las escribiste. El botón está visible, pero desactivado, hasta que el formulario construye un comando. Su ventana emergente dice primero qué lleva el enlace y cuántos valores se sustituyeron, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Qué se sustituye:

- **El campo de contraseña**: el comando sigue mostrando `-u user:REDACTED`, y la advertencia sobre una contraseña en la línea de comandos se mantiene.
- **Los encabezados**, por nombre: `Authorization` y `Proxy-Authorization` conservan su esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales); Basic conserva su user-id y pierde la contraseña ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sección 2); un JWT conserva su encabezado protegido y pierde los claims y la firma ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1); `Cookie` conserva sus nombres; un encabezado con nombre de secreto (`X-API-Key`) se sustituye entero; un token dentro de cualquier otro valor también se sustituye.
- **El campo de cookies**: todos los valores ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 4.2.1). **Un campo de formulario con nombre de secreto** (`client_secret`): su valor; un campo de archivo conserva su ruta. **El cuerpo**: los miembros JSON y los parámetros `name=value` con nombre de secreto (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), secciones 2.2 y 2.3), `refresh_token`, `client_secret`, `password` y `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), secciones 2.3.1, 4.1.2, 4.3.2 y 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), sección 4.5) y cualquier nombre que termine en token, secret, password o api key).
- **El host, el proxy y la ruta**: la contraseña de un `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1; curl también lee una sin esquema) y cualquier parámetro de consulta secreto.

Todos los demás campos van tal como los escribiste; los valores predeterminados (https, GET, salida estándar, opciones desactivadas) no se incluyen en el enlace, y una tabulación escrita en un campo de una sola línea viaja como un espacio. Los vectores de compartir de la herramienta comprueban que la copia construye las mismas opciones y advertencias. Si el comando construido a partir de la copia sigue conteniendo una clave o un token que ningún nombre delata (un JWT en la ruta), no hay enlace, y la ventana emergente lo indica.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el formulario no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Se sustituye todo el formulario (un campo que el enlace no lleva se vacía) y se construye el comando; no se ejecuta ni se envía nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
