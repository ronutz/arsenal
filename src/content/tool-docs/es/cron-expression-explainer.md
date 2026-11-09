# Explicador de expresiones cron

Pega una programación de crontab de cinco campos, o una de las macros `@`, y la herramienta te la lee: cada campo explicado en lenguaje llano con el conjunto exacto de valores con los que coincide, las cinco próximas ejecuciones y las trampas del dialecto señaladas mientras escribes.

## Los cinco campos

`minute hour day-of-month month day-of-week`, con rangos `a-b`, listas `a,b`, pasos `*/n` y `a-b/n`, y nombres (`JAN`–`DEC`, `SUN`–`SAT`). Las macros `@` (`@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` y compañía) se expanden a sus formas de cinco campos; `@reboot` no tiene ninguna programación, y la herramienta lo dice en lugar de inventarse una.

## Las trampas que señala

La gorda: cuando el día del mes **y** el día de la semana están restringidos a la vez, cron ejecuta el comando cuando coincide **cualquiera** de los dos: un OR, no el AND que espera casi todo el mundo. Además: `0` y `7` son ambos domingo; un paso que no divide su intervalo en partes iguales da la vuelta de forma irregular (`*/7` en los minutos termina en 56 y luego salta a 0); los nombres dentro de rangos con paso han sido históricamente poco fiables entre implementaciones; y una entrada de seis campos se reconoce como el dialecto con segundos de Quartz y se nombra como tal.

## Sobre las horas proyectadas

cron evalúa las programaciones en la hora **local** del daemon. Las ejecuciones que se muestran se calculan sobre la hora del reloj de tu navegador en el instante actual, sin aplicar ninguna base de datos de zonas horarias, con el mismo motor determinista que los vectores de referencia fijan contra un instante de referencia congelado.

Todo se ejecuta en local; la programación nunca sale de la página. Se basa en `crontab(5)` y en la especificación POSIX.

## Compartir resultados

Encima de los paneles de los campos, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la programación tal como la escribiste, una vez que la página la ha leído. La página solo lee una programación, cinco campos de tiempo o una @macro: una línea de crontab con su comando se rechaza (el número de campos no es el correcto), así que un comando, y cualquier contraseña o token escritos en él, nunca van en un enlace. Las próximas ejecuciones se calculan con el reloj de quien abra el enlace. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** La programación rellena el cuadro como lo haría un pegado y la página la explica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
