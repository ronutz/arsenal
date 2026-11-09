## Qué hace

Escribe una marca de tiempo Unix o una fecha ISO-8601 y lee el mismo instante en todas las formas habituales. Cuando escribes un número, la herramienta detecta su unidad (segundos, milisegundos, microsegundos o nanosegundos) por su magnitud, así que puedes pegar un valor de casi cualquier sistema sin decir en qué unidad está. Después muestra el instante como un desglose de calendario en UTC, una cadena ISO-8601, una marca de tiempo RFC 3339, el formato de fecha de HTTP y la propia marca de tiempo en las cuatro unidades. Todo se calcula en tu navegador.

## Qué significa el tiempo Unix

El tiempo Unix, definido por POSIX, es el número de segundos transcurridos desde la época (1970-01-01 00:00:00 UTC), sin contar los segundos intercalares. Cada sistema lo guarda con una resolución distinta: el Unix clásico y la mayoría de las API usan segundos; JavaScript y muchas bases de datos, milisegundos; algunas interfaces de trazas y del kernel, microsegundos o nanosegundos. Como esas magnitudes se diferencian aproximadamente en un factor de mil, la unidad se puede deducir del número de dígitos, que es lo que hace la detección automática.

## Los formatos que produce

- **Desglose de calendario en UTC**: el año, el mes, el día y la hora del día en UTC.
- **ISO 8601 y RFC 3339**: el formato de marca de tiempo de internet, por ejemplo `2026-07-01T20:00:00Z`.
- **Fecha HTTP**: la forma IMF-fixdate que se usa en los encabezados HTTP (RFC 9110, sección 5.6.7), por ejemplo `Wed, 01 Jul 2026 20:00:00 GMT`.
- **Las cuatro unidades**: el mismo instante expresado en segundos, milisegundos, microsegundos y nanosegundos.

## Rango y determinismo

Las fechas se tratan dentro del rango que puede representar un valor de fecha de JavaScript, unos 273.000 años antes y después de la época (un límite de 8,64 x 10^15 milisegundos a cada lado). La conversión es una función pura del valor de entrada y nunca lee el reloj actual, así que una marca de tiempo dada se muestra siempre igual. Una comodidad del tipo “en relación con ahora” necesita forzosamente el reloj real, así que vive en la interfaz de la herramienta y no en este núcleo determinista.

## Uso

Escribe una marca de tiempo Unix como `1751400000` (un valor de diez dígitos, así que se lee como segundos) o `1751400000000` (trece dígitos, se lee como milisegundos), o una fecha ISO-8601 como `2026-07-01T20:00:00Z`, y lee a la vez todas las formas equivalentes.

## Compartir resultados

Debajo del titular, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la marca de tiempo o la fecha tal como se escribió, una vez que la página la ha leído. La línea que dice cuánto tiempo hace del instante, o cuánto falta, sale del reloj de quien abre el enlace, como ocurriría con un pegado; las conversiones son las mismas en todas partes. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El valor rellena el cuadro como lo haría un pegado y la página lo convierte. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
