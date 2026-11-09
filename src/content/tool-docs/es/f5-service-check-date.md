## Qué hace

Dale a la herramienta una versión de BIG-IP y te devuelve la fecha de comprobación de servicio (Service Check Date) mínima que debe llevar la licencia de esa versión; dale una fecha de comprobación de servicio y te devuelve la versión más reciente a la que puedes actualizar, junto con las ramas más recientes a las que aún no puedes llegar y la fecha que necesita cada una. Es una consulta en los dos sentidos sobre una copia incorporada de la tabla License Check Date que publica F5, y se ejecuta por completo en tu navegador.

## Las dos fechas con las que trabaja

Cada versión de BIG-IP lleva una **License Check Date** (fecha de comprobación de licencia) fija: la fecha de comprobación de servicio mínima que debe tener una licencia para que se permita arrancar esa versión. Cada licencia lleva una **Service Check Date**: la más antigua entre la fecha de su última activación y la fecha en que vence su contrato de servicio. Cuando actualizas a una nueva versión mayor o menor, el sistema compara las dos, y si la Service Check Date de la licencia es anterior a la License Check Date de la versión, el sistema actualizado arranca, pero no carga su configuración hasta que se reactiva la licencia. La herramienta codifica la tabla License Check Date de F5 (del K7727) y hace esa comparación por ti, en cualquiera de los dos sentidos.

Las fechas se manejan en el formato exacto que BIG-IP escribe en `bigip.license`, los ocho dígitos `yyyymmdd` (así que `20230208` es el 8 de febrero de 2023), y también se muestran en formato ISO. La comparación es pura aritmética de fechas, sin ningún reloj de por medio: tanto la fecha de la versión como la fecha de comprobación de servicio son entradas, así que las mismas entradas dan siempre la misma respuesta.

## Ejemplos resueltos

Introduce una versión y obtén su mínimo. `17.1.3` se resuelve en la rama `17.1.x` e indica una fecha de comprobación de servicio mínima de `2023-02-08` (`20230208`); `21.1` indica `2026-04-15`; `16.1.x` indica `2021-06-11`.

Introduce una fecha de comprobación de servicio y obtén tu techo. Una fecha de comprobación de servicio de `2023-06-15` llega hasta `17.1.x` como rama más reciente, e indica las ramas a las que aún no puedes llegar: `17.5.x` (necesita `2025-02-12`), `21.0.x` (necesita `2025-10-29`) y `21.1.x` (necesita `2026-04-15`). Una fecha reciente como `2026-05-01` llega a la rama más reciente sin nada bloqueado; una fecha más antigua que toda la tabla no llega a nada, la señal de que hay que reactivar la licencia antes de cualquier actualización.

## Solo se controlan las actualizaciones de versión mayor y menor

La comprobación se aplica a una actualización de versión (upgrade), que F5 define como un cambio en el primer o en el segundo número de versión. El paso entre versiones de mantenimiento o de punto dentro de la misma rama es una actualización dentro de la rama (update), y no desencadena ninguna verificación de la fecha de comprobación de servicio. Por eso la herramienta trabaja con la granularidad major.minor: en cuanto tu fecha de comprobación de servicio es lo bastante reciente para llegar a `17.1.x`, lo es para todas las versiones de mantenimiento y de punto de esa rama. Así que la respuesta para `17.1.0`, `17.1.3` y `17.1.x` es la misma fecha única.

## Uso

Escribe una versión de BIG-IP (`17.1.3`, `21.1`, `16.1.x`) o una fecha de comprobación de servicio (`20230611`, `2023-06-11` o `2023/06/11`); la herramienta detecta cuál diste y responde en consecuencia. Sin teclado, usa los dos controles que hay debajo del campo: el selector de fecha lo rellena con una fecha de comprobación de servicio en formato `yyyy-mm-dd`, y la lista de versiones contiene cada fila de la tabla K7727 que incluye la herramienta, con la etiqueta del propio F5, y rellena el campo con una versión que cubre esa fila (`17.1.x` para una rama, la primera versión de un rango como `10.2.2 - 10.2.4`). Cualquiera de los dos rellena el campo exactamente como si lo escribieras. Como esto codifica documentación del fabricante y no un estándar fijo, y F5 añade una fila con cada versión, confirma cualquier valor con el K7727 de F5 o con el `/etc/version_date` del sistema de destino antes de una actualización en producción.

## Pegar una licencia o una salida de tmsh

Puedes pegar el contenido completo de `/config/bigip.license`, cualquier fragmento suyo o la salida de `tmsh show sys license`; la herramienta encuentra la línea de la fecha de comprobación de servicio y responde a la misma pregunta sobre a qué versiones puedes actualizar. Se reconocen las dos formas de línea publicadas: la del archivo, `Service check date : 20151008` (con espacios flexibles alrededor de los dos puntos), y la de tmsh, `Service Check Date 2016/08/18`. Una licencia lleva exactamente una línea así, de modo que gana la primera coincidencia, y la línea encontrada se muestra para que puedas confirmar que se tomó el valor correcto. Todo lo demás de lo pegado se ignora y, como siempre, nada sale de tu navegador.

## Compartir resultados

Debajo de la respuesta, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la versión o la fecha tal como se escribió o, si pegaste una licencia o una salida de `tmsh show sys license`, solo la línea de la fecha de comprobación de servicio que la página leyó de ella (la que te muestra, como `Service check date : 20230611`), nunca la licencia. Su ventana emergente dice primero qué lleva el enlace, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Una licencia contiene la registration key, y la referencia de tmsh de F5 ([sys license](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_license.html), consultada el 2026-10-27) dice que, después de una revocación, “the registration key may subsequently be re-used to relicense this or another VE instance” (la registration key se puede volver a usar después para licenciar de nuevo esta u otra instancia de VE). Con esa línea basta: la página que recibe el enlace lee de ella la misma fecha y muestra la misma línea. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el valor no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Una línea, muy por debajo de los 16.384 caracteres que el sitio admite después del `#`.
- **Al abrir un enlace.** El valor rellena el campo como si lo escribieras y la página responde. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
