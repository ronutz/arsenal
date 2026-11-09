## Qué hace

Dos modos de aritmética exacta de tiempos. Entre dos instantes: el intervalo con signo, desglosado empezando por la unidad mayor (semanas, días, horas, minutos, segundos) y totalizado por completo en cada unidad, con la duración ISO 8601 canónica. Instante más o menos una duración: la marca de tiempo resultante. Las duraciones se leen en ISO 8601 (P1DT2H30M, PT90M, P1W) o en notación abreviada (1d 2h 30m; 90min). Todo se calcula sobre la línea de tiempo UTC en tu navegador.

## Qué rechaza, y por qué

Sumar “un mes” es aritmética de calendario: un mes tiene de 28 a 31 días y un año, 365 o 366, así que P1M no tiene una duración exacta única. La herramienta rechaza los meses y los años con esa explicación, en lugar de elegir una convención sin decir nada. Aquí un día son exactamente 24 horas y una semana, exactamente 7 días: tiempo exacto, y así se indica.

## Desfases

Una marca de tiempo sin desfase se lee como UTC, y la suposición se indica. Añade Z o un desfase explícito (por ejemplo, -03:00) y la respuesta nunca dependerá del equipo en el que se ejecute la herramienta.

Debajo de cada instante, un selector de fecha y hora lo establece sin escribir. Al elegir se conservan los segundos y el desfase que ya tenía el campo, y se escribe Z (UTC) si no tenía ninguno; un desfase distinto de Z, o una fecha sola, se siguen escribiendo a mano.

## Compartir resultados

Debajo del resultado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el modo y sus campos, una vez que la página tiene un resultado: los dos instantes, para el intervalo entre ellos, o el inicio, la duración y si se suma o se resta. Los campos del otro modo no van en el enlace. Ni los instantes ni las duraciones identifican nada tuyo. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** Se elige el modo, sus campos se rellenan como si los escribieras y la página calcula; los campos del otro modo conservan lo que tenías. Un modo o una operación desconocidos, un campo que falta o un campo del otro modo hacen que se ignore el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
