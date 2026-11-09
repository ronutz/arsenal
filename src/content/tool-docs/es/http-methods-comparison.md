## Qué hace

Introduce de uno a cuatro nombres de métodos del protocolo de transferencia de hipertexto (HTTP, Hypertext Transfer Protocol) y la herramienta devuelve los datos de cada uno en el plano del protocolo: si es seguro, idempotente y almacenable en caché, cuál es la semántica del cuerpo de su solicitud, si el uso compartido de recursos entre orígenes (CORS, Cross-Origin Resource Sharing) permite a los navegadores enviarlo sin preflight (la solicitud OPTIONS con la que un navegador pide permiso antes de cualquier solicitud entre orígenes que no sea simple), si los formularios HTML pueden producirlo de forma declarativa y qué RFC lo define. Si pides dos o más (“get vs query”), también nombra exactamente las propiedades en las que difieren. La tabla cubre los nueve métodos básicos del RFC 9110, PATCH (RFC 5789), el trío de WebDAV PROPFIND, REPORT y SEARCH, y la fila estrella: QUERY, registrado por el RFC 10008 en junio de 2026, el primer método HTTP nuevo desde PATCH en 2010.

Debajo del campo, un botón por cada método de la tabla lo añade a la línea o lo quita, así que una comparación se arma sin escribir; con cuatro nombrados, los demás esperan.

## El vocabulario, con precisión

Seguro significa que el cliente no pide ningún cambio de estado; idempotente significa que repetir la solicitud idéntica deja el servidor en el mismo estado, y eso es lo que hace legítimos los reintentos automáticos. Las dos son promesas sobre la intención registradas en la IANA: una caché, un proxy o una capa de reintentos genéricos pueden actuar según ellas sin saber nada de tu API. Ninguna dice nada sobre la carga útil (payload): el cuerpo de un QUERY puede llevar el mismo intento de inyección que el de un POST, y por eso la nota final de la herramienta insiste en inspeccionar QUERY como si fuera un POST.

La posibilidad de almacenar en caché tiene tres valores honestos en la tabla: GET y HEAD son la pareja almacenable en caché; las respuestas a POST y a PATCH solo lo son cuando hay información de frescura explícita (en la práctica, casi nunca); QUERY es almacenable en caché desde su propia definición, con el requisito del RFC 10008 de que la clave de caché incorpore el contenido de la solicitud: el mecanismo que hace almacenable en caché una solicitud que lleva cuerpo, y el punto exacto en el que una implementación de caché descuidada se convierte en envenenamiento de caché.

La semántica del cuerpo de la solicitud separa cuatro casos que el ecosistema confunde una y otra vez: cuerpos que son lo esencial (POST, PUT, PATCH, QUERY, el trío de WebDAV); cuerpos sin semántica definida que los servidores pueden rechazar sin más (GET, HEAD, DELETE: el RFC 9110 lo dice expresamente); cuerpos permitidos pero sin significado (OPTIONS); y cuerpos prohibidos (CONNECT, TRACE).

## Por qué QUERY es la fila interesante

QUERY es el término medio que faltaba y que la tabla deja a la vista: seguro, idempotente y almacenable en caché como GET, con cuerpo como POST. Existe porque GET obliga a meter las consultas en la URL (límites de longitud, problemas de codificación, filtraciones en los logs y en el Referer), mientras que POST /search engaña a la infraestructura: nada en el protocolo lo marca como de solo lectura, así que nada en medio puede almacenarlo en caché ni reintentarlo. La comparación “post vs query” muestra cinco propiedades que cambian a la vez; “get vs query” muestra las tres que importan para adoptarlo: el cuerpo, el preflight de CORS (QUERY no está en la safelist) y los formularios HTML (un formulario con method="query" recurre hoy a GET y descarta el cuerpo).

## Ejemplos resueltos

`query` a secas da la fila completa del RFC 10008. `get vs query` responde a la pregunta clásica con tres diferencias. `post,query` cuenta la historia de la migración: cinco cambios. `put delete` muestra la pareja que es idempotente sin ser segura. `trace` y `connect` muestran los dos métodos que tienen prohibido el cuerpo. `search` cuenta la historia del nombre: los primeros borradores de QUERY se llamaban SEARCH hasta el cambio de nombre de 2021.

## Compartir resultados

Debajo de los paneles, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la línea tal como se escribió, y nada más: de uno a cuatro nombres de métodos, que no dicen nada de ti. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Los enlaces del Decodificador de mensajes HTTP que pasan un método a esta página usan el mismo `#input=` y rellenan el campo de la misma forma.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la línea no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La línea rellena el campo como lo haría la escritura y la página compara los métodos; no se envía nada a ningún sitio. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Procedencia

Cada valor de seguro e idempotente es la propia columna del registro de métodos HTTP de la IANA, contrastada con el RFC 9110 §9.3, el RFC 10008, el RFC 5789 y las especificaciones de WebDAV (RFC 4918, 3253, 5323); la pertenencia a la safelist de CORS sigue la especificación Fetch del WHATWG, y la situación de los formularios, el debate abierto en el HTML del WHATWG. Todas las fuentes se consultaron el 2026-07-20. La herramienta incluye 19 vectores de referencia que fijan cada fila, así que cualquier deriva en la tabla rompe la compilación.
