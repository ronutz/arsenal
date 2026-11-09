## Qué hace

Pega una respuesta HTTP en bruto y la herramienta califica su postura de seguridad: los encabezados de seguridad que define (y los que le faltan), los flags de sus cookies y su política entre orígenes. Cada hallazgo se comprueba con el estándar correspondiente y con las recomendaciones de OWASP Secure Headers, y el resultado es un desglose con calificación sobre el que puedes actuar. Se ejecuta por completo en tu navegador.

## Los encabezados que comprueba

La seguridad de los navegadores modernos es, en gran parte, algo que se activa explícitamente con encabezados de respuesta, y la herramienta examina los que importan:

- **Strict-Transport-Security** (HSTS, RFC 6797) indica al navegador que use solo HTTPS; la herramienta lee su `max-age` y su `includeSubDomains`.
- **Content-Security-Policy** (CSP Level 3) restringe de dónde pueden venir los scripts, los estilos y los marcos, y es la defensa más fuerte contra el cross-site scripting; la herramienta señala las palabras clave que la debilitan, como `unsafe-inline`.
- **X-Content-Type-Options: nosniff** impide que el navegador adivine los tipos de contenido, y **X-Frame-Options** (o el `frame-ancestors` de CSP) protege contra el clickjacking.
- **Referrer-Policy** y **Permissions-Policy** controlan lo que la página filtra en el encabezado Referer y qué funciones del navegador puede usar.
- Las **políticas entre orígenes** (COOP, COEP, CORP), que rigen el aislamiento entre orígenes.

## Las cookies y sus flags

La seguridad de una cookie está en sus atributos, y la herramienta los comprueba con la especificación vigente de las cookies (RFC 6265bis): **Secure** (solo se envía por HTTPS), **HttpOnly** (oculta a JavaScript, lo que dificulta el robo mediante cross-site scripting) y **SameSite** (que limita el envío entre sitios y mitiga el CSRF). También reconoce los prefijos de nombre `__Host-` y `__Secure-`, que imponen algunas de esas propiedades a través del propio nombre.

## Cómo se lee la calificación

La calificación sirve para priorizar: no solo te dice lo que está presente, sino lo que falta o es débil, y por qué importa cada encabezado, para que corrijas primero las carencias de mayor impacto. Las comprobaciones siguen el conjunto que recomienda OWASP y las especificaciones subyacentes, no la opinión de una herramienta concreta.

## Uso

Pega una respuesta HTTP, con sus encabezados, y lee el análisis calificado de encabezados, cookies y política entre orígenes. El análisis es determinista y local, así que puedes ejecutarlo sin riesgo sobre una respuesta capturada de cualquier sitio.

## Compartir resultados

Debajo de la calificación, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` una copia de la respuesta; solo lleva la respuesta tal como se pegó si marcas la opción que se describe más abajo. Una respuesta pegada lleva cookies, cuyos valores suelen ser identificadores de sesión ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 8.4, consultado el 2026-11-01), y encabezados que esta página nunca lee, como un `Location` con un código de autorización en su cadena de consulta ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sección 4.1.2, consultado el 2026-11-01). La página califica los encabezados de seguridad que conoce y el nombre y los atributos de cada cookie, nunca el valor de una cookie. Así que la copia conserva la línea de estado y cada línea de encabezado por su nombre, los valores de los encabezados que la página califica tal como se analizaron, y cada `Set-Cookie` con su nombre y sus atributos; el valor de cada cookie, y el de cualquier otro encabezado, pasa a ser `[redacted]`. Antes de ofrecer el enlace, la copia se vuelve a calificar y tiene que dar el mismo informe, y pasa por la comprobación del sitio que busca credenciales que sigan en un valor calificado. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. La ventana emergente también indica cuántos valores se sustituyeron. Si sustituyó alguno, una opción bajo su primera línea, **Incluir en el enlace los valores ocultados**, te permite enviarlos de todos modos: aparece desmarcada cada vez que se abre la ventana emergente; si la marcas, el enlace lleva la respuesta tal como se pegó, con todos los valores incluidos, y la ventana emergente lo indica y advierte que los valores de las cookies suelen ser sesiones activas y que otros encabezados pueden contener tokens, así que el enlace es para alguien a quien le enseñarías la respuesta. La opción no se ofrece cuando una credencial en un valor calificado ya ha bloqueado el enlace.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página la califica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
