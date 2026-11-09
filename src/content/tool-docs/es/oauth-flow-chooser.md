# Selector de flujos OAuth

La primera pregunta de toda integración de OAuth u OpenID Connect (PingFederate, PingAM, PingOne o cualquier otra) es *qué flujo*. La herramienta codifica la respuesta actual como una decisión determinista y cita el RFC que hay detrás de cada línea.

## Tres preguntas

¿Qué tipo de aplicación es (web del lado del servidor, SPA, nativa, de servicio a servicio o un dispositivo con entrada limitada)? ¿Necesita saber **quién** es el usuario (ese es el trabajo de OpenID Connect, montado sobre el mismo flujo)? ¿Necesita acceso mientras el usuario no está (tokens de actualización)?

## Las respuestas que da

Las aplicaciones de servidor, las SPA y las nativas reciben todas **authorization code**: confidencial, con un secreto, donde hay un backend, y pública **con PKCE** (RFC 7636) donde no lo hay, con la regla del navegador del sistema del RFC 8252 explicada para las nativas. De servicio a servicio recibe **client credentials** (RFC 6749 §4.4), con la nota de que ahí un token de actualización SHOULD NOT (no debería) emitirse. Los televisores y los quioscos reciben el **device grant** (RFC 8628), con su coreografía del user_code en un segundo dispositivo.

## La mitad que importa igual

Cada resultado incluye la lista de lo que hay que *evitar*: **implicit** y **ROPC (password)** quedan retirados por su nombre, según la OAuth 2.0 Security Best Current Practice (RFC 9700), con los motivos dichos sin rodeos: tokens en fragmentos, credenciales en las aplicaciones. A los clientes públicos que piden acceso sin conexión se les aplica el requisito de **rotación** de los tokens de actualización; pedir la identidad del usuario final a un flujo de máquina a máquina provoca una advertencia de contradicción en lugar de una respuesta equivocada.

Todo se decide en local; las tres respuestas no llevan ningún secreto y no se transmite nada.

## Compartir resultados

Debajo del nombre y el grant del flujo recomendado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` tus tres respuestas: el tipo de aplicación por su nombre estable (`app=spa`) y cada pregunta a la que respondiste que sí (`identity=1`, `offline=1`). No viaja nada que escribas, porque no hay nada que escribir. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que las respuestas no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra.

- **Al abrir un enlace.** Las tres respuestas sustituyen a las del formulario y la página recomienda el mismo flujo, en el navegador. Si el tipo de aplicación no es uno de los que ofrece la página, o una respuesta no es 1 ni 0, se ignora el enlace entero. En cualquier caso, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
