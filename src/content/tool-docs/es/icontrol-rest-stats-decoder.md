## Qué hace

Pega una respuesta de estadísticas de iControl REST y la herramienta la aplana en una línea por estadística. Desenvuelve los envoltorios `entries`, `nestedStats`, `value` y `description`, reduce las claves de URL a los objetos que nombran y agrupa el resultado por objeto. Es una transformación puramente local: no se descarga nada y nada sale del navegador.

## Por qué hay que aplanar la respuesta

Una carga útil de estadísticas de BIG-IP envuelve cada hoja en `value` o `description`, cada nivel en `entries` y `nestedStats`, y usa una URL completa como clave del objeto exterior. Tres envoltorios alrededor de un número. La forma se describe a sí misma más que ser retorcida, pero no se lee de un vistazo, y un pool con sus miembros puede anidarse cuatro niveles.

## La división en 64 bits, que es lo que importa

F5 divide los contadores grandes en las mitades `.high` y `.low` porque los números JSON no pueden llevar con seguridad un entero de 64 bits. `serverside.bitsIn.high = 3` y `serverside.bitsIn.low = 1000000` **no son dos estadísticas**: son un único contador cuyo valor es `(high << 32) + low`, es decir, 12.885.901.888.

**La herramienta las combina y marca los valores combinados**, para que puedas comprobar la aritmética en lugar de fiarte de ella. Un aplanador que muestre las mitades por separado se quedará corto, sin avisar, en tus contadores con más actividad.

## Totales, no tasas

Cada contador es un total desde el último restablecimiento, y la carga útil no lleva ningún intervalo. **Una sola muestra no puede dar una tasa.** La herramienta lo dice en cada decodificación, porque representar un contador en lugar de su derivada es una forma habitual de construir un panel que sube sin parar.

## Lo que no va a hacer

No interpreta las estadísticas y no conoce tu intervalo de sondeo. Rechaza una respuesta de configuración con un mensaje claro en lugar de producir una salida vacía, porque la ausencia de un objeto `entries` es el indicio fiable.

## Compartir resultados

Debajo del texto aplanado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la respuesta de estadísticas tal como se pegó. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Una respuesta de estadísticas contiene contadores y los objetos a los que pertenecen, no una credencial: iControl REST lleva el token en el encabezado `X-F5-Auth-Token` de la solicitud ([guía de AS3 de F5, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), consultado el 2026-10-27). Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la respuesta no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; las estadísticas de una colección pueden pasar de ahí, y entonces la ventana emergente indica la longitud de lo compartido en lugar de ofrecer un enlace.
- **Al abrir un enlace.** El JSON rellena el cuadro como lo haría un pegado y la página lo aplana. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
