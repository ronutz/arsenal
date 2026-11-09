## Qué hace

Indica una serie de modelos o el nombre de un sistema operativo y la herramienta te dice qué nombre corresponde, en qué versiones llegó el cambio de nombre y qué trae consigo esa serie en concreto. Las dos parejas de nombres se muestran **antes de cualquier entrada**, porque quien llega aquí después de que un documento dijera una palabra y su switch otra necesita la respuesta de inmediato.

## El cambio de nombre, en una línea cada uno

- **ExtremeXOS (EXOS) → Switch Engine**, desde la 31.6
- **VOSS → Fabric Engine**, desde la 8.6

Los dos se aplican **solo al hardware Universal**: 4120, 4220, 5320, 5420, 5520, 5720, 7520, 7720. Todo lo demás conserva los nombres originales, y **los nombres de archivo de las imágenes y los menús de arranque también los siguen usando**, así que un menú de arranque que ofrece cambiar el sistema operativo “to VOSS” (a VOSS) en un switch Fabric Engine no es un error ni una versión desfasada.

## La advertencia que da siempre

**Cambiar de persona (el sistema operativo que ejecuta el switch) borra la configuración.** En palabras de la propia Extreme, cambiar el sistema operativo de red borra todos los archivos de configuración, la información de depuración, los logs, los eventos y las estadísticas del anterior. **Es una reconstrucción, no una migración**, y la herramienta lo dice en cada consulta, no solo cuando reconoce un modelo.

También advierte de que, en la pregunta del arranque, Switch Engine se elige respondiendo que no: ante “Would you like to change the switch OS to VOSS? [y/N/q]” ([notas de la versión de Switch Engine 33.1.100](https://documentation.extremenetworks.com/release_notes/SwitchEngine/33.1.100/GUID-EEE4A4A1-99DC-4691-B6B5-F88A6FA8042F.shtml), consultadas el 2026-11-09), **“N” mantiene Switch Engine, “y” pasa a Fabric Engine**.

## Salvedades por serie que muestra

- **7520**: el apilamiento funciona con Switch Engine y **no** con Fabric Engine. Si el diseño necesita apilamiento, la elección de persona ya está hecha.
- **5420 y 5520**: actualizar a Switch Engine 31.6 **cambia el SysObjectID de SNMP**, así que el monitoreo que identifica el dispositivo por ese valor deja de reconocerlo, sin que nada parezca ir mal desde la consola.
- **Los mínimos de Fabric Engine varían**: 8.6 en el 5320, el 5420 y el 5520; 8.7 en el 5720.

## Lo que no hace

Trabaja por series y no por números de pieza individuales, a propósito: la cuestión del nombre se responde por serie, y una tabla de SKU quedaría desfasada antes de resultar útil. No conoce tu inventario ni las versiones que tienes instaladas.

## Compartir resultados

Debajo de la respuesta, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la serie de modelos o el nombre del sistema operativo tal como se escribió (`input`), y nada más. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Las dos parejas de nombres y la lista de familias son la propia página, así que no van en el enlace.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el nombre no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El nombre rellena el cuadro como lo haría la escritura y la página busca su correspondencia; no se envía nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
