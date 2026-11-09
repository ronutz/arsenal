## Qué hace

Pega un comando `curl` y la herramienta lo explica opción por opción y después lo traduce a otras cuatro formas: una llamada `fetch` de navegador, una solicitud HTTP en bruto, un comando de HTTPie y código de `requests` de Python. El comando se divide en tokens y se decodifica en tu navegador; nunca se envía nada ni se ejecuta ninguna solicitud.

## Un análisis, cinco vistas

Por dentro hay un solo paso: la herramienta analiza tu comando `curl` y lo convierte en un único modelo de solicitud, con el método, la URL, los encabezados, el cuerpo, la autenticación y las demás opciones. Todo lo que ves se deriva de ese modelo. Como traducir bien un comando ya exige entender cada opción, la explicación opción por opción no es más que ese mismo modelo mostrado con etiquetas, y por eso la explicación y las traducciones siempre coinciden.

## Cómo lee las opciones

Cada opción a la que curl da un argumento también lo toma aquí, tal como lo lee curl, así que un valor nunca se confunde con la URL. La lista es la propia tabla de opciones de curl ([src/tool_getparam.c](https://raw.githubusercontent.com/curl/curl/master/src/tool_getparam.c), consultado el 2026-11-01), contrastada con la [página del manual de curl](https://curl.se/docs/manpage.html) (consultada el 2026-11-01). Las opciones que dan forma a la solicitud se explican una a una; cualquier otra se nombra con su argumento. Unas pocas necesitan algo más que un nombre:

- **`--oauth2-bearer`** es la autenticación Bearer ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sección 2.1): las traducciones envían `Authorization: Bearer` y el token, salvo que haya un encabezado `Authorization` escrito con `-H`, que es el que envía curl en su lugar.
- **`-u user:password`** es la autenticación Basic, el método predeterminado de curl ([manual de curl](https://curl.se/docs/manpage.html), `--basic`, consultado el 2026-11-01): las traducciones a `fetch` y a HTTP en bruto envían `Authorization: Basic` y el Base64 de `user:password` ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sección 2, consultado el 2026-11-01), HTTPie recibe su propio `-a user:password` y `requests` de Python su propio `auth=`. Con `--digest`, HTTPie recibe `-A digest` y `requests` su `HTTPDigestAuth` ([documentación de requests](https://requests.readthedocs.io/en/latest/user/authentication/), consultada el 2026-11-01). Si solo se indica el nombre de usuario, curl pide la contraseña, así que `fetch` y HTTP en bruto no llevan ese campo y el `-a user` de HTTPie también la pide. Con `--digest`, `--ntlm`, `--negotiate`, `--anyauth` o `--aws-sigv4` no se escribe ningún campo Basic, porque esos métodos responden a un desafío o firman la solicitud. Un `Authorization` escrito con `-H`, o `--oauth2-bearer`, tiene prioridad.
- **`--json`** es, en palabras de la página del manual, un atajo de `--data-binary`, `--header "Content-Type: application/json"` y `--header "Accept: application/json"`: el cuerpo es el JSON tal como se escribió, varios fragmentos `--json` se unen sin nada entre ellos, y un encabezado escrito con `-H` sustituye al que añade `--json`.
- **`--url-query`** añade su argumento al final de la consulta de la URL, codificado como lo codifica `--data-urlencode`, o tal como está escrito si empieza por `+`; un argumento leído de un archivo (`name@file`) se nombra, pero no se puede añadir.
- **`-U` / `--proxy-user`, `-E` / `--cert`, `--proxy-cert`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword`, `--httpsig-key` y `--ftp-account`** se explican sin su secreto: se muestra el usuario, o el archivo del certificado; una contraseña, una frase de contraseña, una clave o los datos de una cuenta, no.

## Las formas que genera

- **curl explicado.** Cada opción se nombra y se describe, así que una opción desconocida deja de ser un misterio.
- **fetch.** La llamada a la Fetch API del navegador, según la semántica de MDN, lista para pegar en JavaScript.
- **HTTP en bruto.** La línea de solicitud, los encabezados y el cuerpo reales tal como irían por la red, que es la forma más clara de ver exactamente qué es una solicitud.
- **HTTPie.** El comando `http` equivalente, para quien prefiere ese cliente.
- **requests de Python.** El código equivalente con la biblioteca Requests.

## Por qué traducir en lugar de ejecutar

La herramienta nunca ejecuta la solicitud, a propósito. Es una decisión de privacidad y de seguridad: puedes decodificar y convertir un comando que lleva credenciales o apunta a un host interno sin que nada salga de tu navegador y sin desencadenar lo que haría la solicitud. Es un traductor y un explicador, no un cliente.

## Uso

Pega un comando `curl` y lee la explicación opción por opción y las cuatro traducciones. La conversión es determinista y local, así que el mismo comando produce siempre la misma salida.

La herramienta inversa es el [Traductor de solicitudes HTTP](/tools/http-request-translator): pega una solicitud en bruto y obtén un comando que se puede ejecutar. Si llegaste aquí buscándola, se trasladó al nombre que la describe.

## Compartir resultados

Debajo de la línea de solicitud, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el comando después del `#` con todas sus credenciales sustituidas por `REDACTED`, nunca tal como las escribiste: un comando curl pegado mientras depuras una API suele contener alguna, y esta página muestra en claro los valores de los encabezados, las cookies y, en la traducción a Python, la contraseña de `-u`. Su ventana emergente dice primero qué lleva el enlace y cuántos valores se sustituyeron, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Qué se sustituye, cada valor donde lo define la [página del manual de curl](https://curl.se/docs/manpage.html) (consultada el 2026-11-01) o un estándar HTTP:

- **`-u` / `--user` y `-U` / `--proxy-user`**: la contraseña (“The username and passwords are split up on the first colon”, el nombre de usuario y la contraseña se separan en el primer signo de dos puntos); el usuario se queda.
- **`--oauth2-bearer`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword` y `--ftp-account`**: el valor entero; **`--httpsig-key`** también, salvo que nombre un archivo con `@`. **`-E` / `--cert` y `--proxy-cert`**: la contraseña que va después del primer signo de dos puntos del certificado que no esté escrito como `\:`.
- **`-H` / `--header` y `--proxy-header`**, por el nombre del campo: `Authorization` y `Proxy-Authorization` conservan su esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales); Basic conserva su user-id y pierde la contraseña ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sección 2); un JWT conserva su encabezado protegido y pierde los claims y la firma ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1); una credencial AWS Signature Version 4 (`AWS4-HMAC-SHA256`) conserva su ámbito de credencial y `SignedHeaders` y pierde el ID de clave de acceso y la firma ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), consultado el 2026-11-01); `Cookie` conserva sus nombres; un campo con nombre de secreto (`X-API-Key`, `X-Auth-Token`) se sustituye entero; un token dentro de cualquier otro valor también se sustituye.
- **`-b` / `--cookie`**: todos los valores de `NAME1=VALUE1; NAME2=VALUE2` ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 4.2.1); un nombre de archivo se queda.
- **`-d` y la familia `--data`, `--json`, `--url-query` y `-F`**: los miembros JSON y los parámetros `name=value` cuyo nombre contiene un secreto: `access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), secciones 2.2 y 2.3), `refresh_token`, `client_secret`, `password` y `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), secciones 2.3.1, 4.1.2, 4.3.2 y 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), sección 4.5) y cualquier nombre que termine en token, secret, password o api key. Un `@file` se queda.
- **La URL, `--url`, `-x` / `--proxy` y `-e` / `--referer`**: la contraseña de un `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1) y los parámetros secretos de la consulta y del fragmento; de `X-Amz-Credential`, solo el ID de clave de acceso. El argumento de cualquier otra opción se lee de la misma forma, así que un `--preproxy` o un host SOCKS escrito con `user:password@` pierde la contraseña.

Un valor vacío, un marcador de posición o una variable del shell (`$TOKEN`) se quedan. Cada sustitución se escribe en su sitio, así que la copia conserva las comillas, los espacios y las continuaciones de línea de lo pegado; un valor escrito con secuencias de escape dentro se vuelve a entrecomillar entero. Los vectores de compartir de la herramienta comprueban que la página que abre el enlace lee la misma solicitud. Si queda una clave o un token donde ningún nombre lo delata (un JWT en la ruta de una URL, una clave privada), no hay enlace: la ventana emergente indica su línea, y tú pones ahí un marcador de posición y vuelves a presionar.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página la explica; no se envía ni se ejecuta nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
