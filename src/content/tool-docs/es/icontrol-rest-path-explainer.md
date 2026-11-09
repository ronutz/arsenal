## Qué hace

Pega una URL de iControl REST y la herramienta la decodifica: el módulo de TMOS, la colección, la ruta de partición y carpeta codificada con virgulillas (tildes) junto con su equivalente en `tmsh`, cualquier subcolección, como los miembros de un pool, y las opciones de consulta. Solo analiza el texto de la URL: no se descarga nada y nada sale del navegador.

## La virgulilla

`/mgmt/tm/ltm/pool/~Common~apps~web_pool` apunta a `/Common/apps/web_pool`. La virgulilla es un separador de carpetas, y se usa porque **una URL ya usa la barra para su propia estructura**. La herramienta muestra siempre la forma de `tmsh` junto a las partes decodificadas, porque es la forma que ya conoce la mayoría de quienes la leen.

## El detalle de la partición que provoca errores 404

Un nombre escrito sin partición se resuelve **en la partición actual de quien hace la llamada**. La misma solicitud puede funcionar para un administrador y devolver 404 a otro, sin que haya nada mal en ninguno de los dos casos. La herramienta lo indica siempre que el nombre del objeto no está calificado.

## Opciones de consulta

`$select`, `$filter`, `$top`, `$skip`, `expandSubcollections`, `options` y `ver` se explican una a una. La que conviene conocer es **`expandSubcollections`**: sin ella, un pool vuelve sin miembros, que es la sorpresa más habitual de esta API.

## Lo que no va a hacer

La tabla de módulos es finita. Si una ruta usa un módulo que la herramienta no conoce, decodifica la estructura y **dice que el módulo no se reconoce en lugar de describirlo a ciegas**. No valida nada contra un dispositivo y no puede decirte si el objeto existe.

## Compartir resultados

Debajo del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la ruta con cualquier credencial que contenga sustituida, nunca tal como se escribió. Su ventana emergente dice primero qué lleva el enlace y cuántos valores se sustituyeron, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

- **Un token de autenticación en la ruta** se enmascara conservando su forma (las mayúsculas pasan a ser `X`, las minúsculas `x` y los dígitos `0`), así que la página lo sigue leyendo como el objeto al que apuntaba. La propia guía de F5 amplía un token con `PATCH /mgmt/shared/authz/tokens/{{ bigip_auth_token }}` ([AS3, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), consultado el 2026-10-27), lo que pone el propio token en la ruta.
- **Una contraseña antes del host** (`https://user:password@host/...`) pasa a ser `[redacted]`: el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1 (consultado el 2026-10-27), dice que las aplicaciones “should not render as clear text any data after the first colon” (no deberían mostrar en claro ningún dato posterior a los primeros dos puntos) de un userinfo.
- **Un encabezado `X-F5-Auth-Token` o `Authorization`** pegado con la ruta pierde sus credenciales, que pasan a ser `[redacted]` (la misma guía envía el token en `X-F5-Auth-Token`; [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2).

El host, el módulo, la colección, los nombres de los objetos y las opciones de consulta van tal como se escribieron; los vectores de compartición de la herramienta comprueban que la página que recibe el enlace lee las mismas partes. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página la decodifica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## La herramienta complementaria

El Explicador de rutas RESTCONF de F5OS decodifica la capa de plataforma que hay debajo de un tenant, que usa RESTCONF sobre YANG en lugar de este modelo de objetos. Las dos API no se parecen en nada porque proceden de tradiciones distintas, no de versiones distintas.
