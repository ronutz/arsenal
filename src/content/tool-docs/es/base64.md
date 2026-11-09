## Qué hace

Es un códec en ambos sentidos para cinco codificaciones de texto. Escribe un texto y devuelve a la vez sus formas en Base64, Base64 seguro para URL, Base32, hexadecimal y codificación por porcentaje; pega una cadena codificada y la decodifica de vuelta a texto. La decodificación es tolerante: acepta que falte el relleno (padding) y que haya espacios en blanco sueltos, y cuando el flujo de bytes decodificado no es texto UTF-8 válido, el resultado se marca como binario en lugar de mostrarse como caracteres rotos. Todo se ejecuta en tu navegador; no se sube nada.

## Las cinco codificaciones

Las cinco convierten entre texto (como bytes) y una representación segura en ASCII, y cada una la define un estándar:

- **Base64** (RFC 4648, sección 4) usa el alfabeto `A-Z a-z 0-9 + /` y rellena con `=`. Aumenta el tamaño de los datos en aproximadamente un tercio y es la codificación de las credenciales HTTP Basic, `base64(user:password)`, definidas en el RFC 7617.
- **Base64 seguro para URL** (RFC 4648, sección 5) cambia `+` y `/` por `-` y `_` y suele quitar el relleno `=`, de modo que la cadena es segura dentro de URL y nombres de archivo. Es la codificación de cada segmento de un JWT.
- **Base32** (RFC 4648, sección 6) usa `A-Z 2-7` y rellena con `=`. No distingue mayúsculas de minúsculas y evita los caracteres que se confunden fácilmente, por eso aparece en sitios como los secretos TOTP.
- **Hexadecimal (Base16)** (RFC 4648, sección 8) usa `0-9 A-F`, dos caracteres por byte.
- **Codificación por porcentaje** (RFC 3986, sección 2) deja tal cual el conjunto de caracteres no reservados (`A-Z a-z 0-9 - . _ ~`) y codifica cualquier otro byte como `%XX`. Es la codificación de URL.

## Relleno, espacios en blanco y resultados binarios

Base64 y Base32 se rellenan normalmente con `=` hasta completar un número entero de bloques, pero en la práctica las cadenas suelen llegar sin el relleno o con saltos de línea insertados, así que el decodificador acepta ambas cosas. Cuando decodificas un valor cuyos bytes no forman texto UTF-8 válido (un blob comprimido, una imagen, una clave en bruto), la herramienta te dice que el resultado es binario en lugar de mostrarlo como texto roto, para que sepas que la decodificación funcionó aunque el contenido no sea legible.

## Ejemplos resueltos

- El texto `hello` se convierte en Base64 `aGVsbG8=`, en Base64 seguro para URL `aGVsbG8`, en Base32 `NBSWY3DP`, en hexadecimal `68656c6c6f` y en codificación por porcentaje `hello` (todos sus caracteres son no reservados).
- Decodificar el valor Base64 `dXNlcjpwYXNz`, una credencial HTTP Basic típica, devuelve `user:pass`.

## Uso

Escribe un texto para ver las cinco codificaciones una al lado de otra, o pega un valor codificado para decodificarlo. Como el códec es una función pura de su entrada, el mismo texto produce siempre la misma salida.

## Compartir resultados

Debajo de la salida, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el texto del cuadro tal como lo escribiste, con el sentido, el códec y el número de capas cuando no son los predeterminados (Codificar, Base64, una capa): `/tools/base64#text=dXNlcjpwYXNz&direction=decode`. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

El texto codificado suele esconder una credencial: HTTP Basic envía `user:password` en Base64 ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sección 2, consultado el 2026-10-27). Por eso la ventana emergente añade una línea de precaución propia de esta herramienta antes de que copies nada. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Se establecen el sentido, el códec y las capas, y el texto rellena el cuadro como lo haría un pegado; la página calcula todas las codificaciones como siempre. Un sentido o un códec que la página no ofrece, o un número de capas fuera del rango de 1 a 3, hace que se ignore el enlace entero. En ambos casos, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
- **Enlaces desde otras páginas.** Un valor entregado como `#input=` sigue rellenando el cuadro exactamente igual que antes. Compartir resultados usa nombres propios (`text`, `direction`, `codec`, `layers`), así que los dos nunca se mezclan.
