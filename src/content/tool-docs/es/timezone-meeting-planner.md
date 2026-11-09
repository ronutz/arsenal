## Qué hace

Dale un instante de reunión (con Z o un desfase explícito, porque una hora de reunión sin él es ambigua) y una lista de zonas horarias IANA, una por línea. La herramienta lee ese único instante en cada zona: fecha y hora locales, día de la semana, el desfase respecto a UTC que indica tzdata para esa fecha, el cambio de fecha respecto a la primera zona y un indicador de horario laboral. Los datos de zonas son la propia base de datos IANA de tu navegador, la misma que mantiene al día el sistema operativo.

## Lo que marcan los indicadores

El horario laboral se marca de 09:00 a 17:59 en hora local, de lunes a viernes: el margen convencional, dicho a las claras en lugar de escondido. Una columna de cambio de fecha señala a los asistentes que están en otra fecha del calendario, la clásica sorpresa de que Tokio se conecta “mañana”, que conviene decir claramente en la invitación.

## Por qué importa la fecha

El horario de verano (DST, daylight saving time) es lo que digan las reglas de la zona para esa fecha concreta: Berlín está en UTC+2 en julio y en UTC+1 en enero; São Paulo está en UTC−3 todo el año desde que Brasil abolió el DST en 2019. Planificar con una fecha real es precisamente de lo que se trata.

Debajo del instante, un selector de fecha y hora lo establece sin escribir: al elegir se conservan los segundos y el desfase del campo, y se escribe Z (UTC) si no tenía ninguno. Debajo de las zonas, una lista con todas las zonas IANA que conoce el navegador añade la elegida como una línea nueva.

## Compartir resultados

Debajo de la tabla, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el instante de la reunión y las zonas, una por línea, tal como se escribieron, una vez que la página tiene un plan. Las lecturas locales se calculan con los datos de zonas horarias del navegador que abre el enlace, que son los que la página usa siempre. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El instante y las zonas se rellenan como si los escribieras, y la página planifica. Tienen que estar los dos; si no, se ignora el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
