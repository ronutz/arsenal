## Qué hace la herramienta

Pega tus directivas de caché, la solicitud y la respuesta del upstream. La herramienta responde **dos preguntas distintas**: ¿se **almacenará** esta respuesta? y ¿una solicitud posterior que coincida se **servirá** desde ella? Detrás de cada respuesta está el recorrido ordenado de las reglas, más la clave de caché calculada.

Están separadas a propósito. Una respuesta puede almacenarse en caché sin ningún problema y no servirse nunca porque la clave es distinta; y una respuesta puede servirse cuando no debería porque la clave ignora algo que importaba.

## Las reglas de almacenamiento, en orden

La caché está completamente desactivada salvo que `proxy_cache` nombre una zona, que es, con mucha diferencia, el motivo más habitual por el que nunca se almacena nada. Solo se almacenan los métodos de `proxy_cache_methods`, de forma predeterminada GET y HEAD. Una respuesta que lleva `Set-Cookie` no se almacena, porque se supone que es específica del usuario. Un `Cache-Control: no-cache`, `no-store` o `private` del upstream impide el almacenamiento. Un estado sin `proxy_cache_valid` y sin encabezado de frescura no tiene un tiempo de vida con el que almacenarse. Y `proxy_no_cache` con un valor que no está vacío ni es cero impide la escritura.

## La pareja que se confunde

`proxy_no_cache` impide la **escritura**. `proxy_cache_bypass` se salta la **búsqueda** y aun así escribe el resultado. Parecen sinónimos y son opuestos justo en la mitad que importa: usar bypass donde querías no_cache llena la caché exactamente con lo que intentabas dejar fuera.

## La asimetría que provoca fugas

NGINX excluye del almacenamiento las **respuestas** con cookies. **No** impide que a las **solicitudes** con cookies se les sirva una entrada compartida.

Eso suele ser inofensivo, porque las respuestas personalizadas nunca se almacenaron, hasta que alguien añade `proxy_ignore_headers Set-Cookie` para que la caché “funcione” con un backend que pone una cookie de sesión en cada respuesta. A partir de ahí, las respuestas de cada usuario quedan bajo una clave que comparten todos los usuarios. La herramienta avisa justo de esta combinación, porque es un cambio de dos líneas que parece una mejora de rendimiento.

## Límites, sin rodeos

Un intercambio, no el ciclo de vida de la caché: ni `proxy_cache_use_stale`, ni `proxy_cache_lock`, ni revalidación, ni recuento de `min_uses`, ni tratamiento de `Vary`. La frescura se trata como presente o ausente, no se calcula, así que una entrada caducada queda fuera del alcance. Al generar la clave se sustituyen las variables habituales y cualquier otra cosa se deja tal como está escrita.

## Compartir resultados

Debajo de los dos veredictos, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` una copia del cuadro; solo lleva el cuadro tal como lo escribiste si marcas la opción que se describe más abajo. Los encabezados del intercambio son la lección y, si se pegan desde las herramientas para desarrolladores de un navegador, están vivos: los valores de las cookies suelen ser identificadores de sesión ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 8.4, consultado el 2026-11-01) y un valor de `Authorization` “consists of credentials” (consiste en credenciales) ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2, consultado el 2026-11-01). La decisión lee si esos encabezados están, nunca sus valores; solo la clave de caché generada muestra un valor, cuando la clave nombra `$cookie_<name>` o `$http_<name>` ([ngx_http_core_module, Embedded Variables](https://nginx.org/en/docs/http/ngx_http_core_module.html#variables), consultado el 2026-11-01). Así que la copia sustituye por `[redacted]` cada valor de cookie de una línea `request_header Cookie:`, el valor de la cookie de una línea `response_header Set-Cookie:` (su nombre y sus atributos se quedan), las credenciales que siguen al esquema en una línea `Authorization` o `Proxy-Authorization` (el esquema se queda) y el valor entero de un encabezado cuyo nombre parece secreto (`X-Api-Key`, `X-Auth-Token`); todos los demás bytes quedan tal como se escribieron, comentarios incluidos. Antes de ofrecer el enlace, la copia vuelve a decidirse y tiene que dar la misma decisión (almacenada, servida, el resultado de cada regla, cada advertencia); si no, no hay enlace. La clave y el paso que la cita muestran entonces `[redacted]` donde había un valor. Después se busca en la copia una credencial que siga ahí (un JWT en el URI, una clave): si aparece una, no hay enlace, y la ventana emergente indica su línea.

Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. También indica cuántos valores se sustituyeron. Si sustituyó alguno, una opción bajo su primera línea, **Incluir los valores sustituidos en el enlace**, te permite enviarlos a pesar de todo, para un intercambio escrito con valores inventados o una clave que nombra una cookie: aparece desmarcada cada vez que se abre la ventana emergente; si la marcas, el enlace lleva el cuadro tal como lo escribiste, y la ventana emergente avisa de que los valores de las cookies suelen ser sesiones vivas y los valores de `Authorization` son credenciales. La opción no se ofrece cuando una credencial ya ha impedido el enlace.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia (o, con la opción marcada, el cuadro) rellena el cuadro como lo haría un pegado, y la página decide. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
