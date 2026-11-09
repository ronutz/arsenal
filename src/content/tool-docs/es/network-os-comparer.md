## Qué hace

Catorce sistemas operativos de red (IOS, IOS XE, IOS XR, NX-OS, Junos, Junos Evolved, EOS, TMOS, F5OS, EXOS, VOSS, FortiOS, PAN-OS y Gaia), cada uno con su linaje, sobre qué se ejecuta, cómo comparten el estado sus componentes, dónde se separan el control y el reenvío, cómo se aplican los cambios y lo que cuesta una actualización.

**Elige uno para ver su perfil completo. Elige dos para verlos eje por eje**, con una nota en cada eje que explica por qué ese eje predice algo.

## El eje que más importa

**Cómo se comparte el estado** predice el comportamiento ante fallos mejor que cualquier otra cosa:

- **Memoria compartida**: un fallo se propaga. El IOS clásico lo ejecuta todo en un único espacio de direcciones, sin protección de memoria.
- **Paso de mensajes**: un fallo queda contenido. IOS XR reinicia el proceso.
- **Un almacén de estado**: un proceso reiniciado **retoma** su trabajo en lugar de reconstruirlo. SysDB de Arista y el almacén de datos distribuido de Junos Evolved funcionan así, y el de Evolved sobrevive a que el proceso vuelva en otro nodo.

El segundo eje es **inmediato frente a candidato y commit**. Inmediato significa que un error está en producción al momento. Con commit, un error es una edición abandonada: la diferencia entre un incidente y una tarde de trabajo.

## Cada entrada enumera sus puntos débiles

**Un vector de referencia comprueba que ninguna entrada tenga menos de dos.** Una entrada sin ningún costo es un anuncio, y quien la lea haría bien en desconfiar del resto de la tabla. Eso incluye las plataformas que enseña el autor de este sitio y para las que está autorizado.

La misma auditoría comprueba que cada entrada tenga linaje, al menos dos puntos fuertes y una idea distintiva con suficiente sustancia para decir algo; en la primera ejecución detectó un campo pobre.

## Qué no hace

No es una matriz de funciones ni una guía de compra. No sigue las versiones actuales, a propósito: **las versiones cambian y la arquitectura no**, y una tabla que quedara desfasada cada trimestre sería peor que ninguna tabla.

Tampoco puede decirte cuál comprar. Lo que sí puede decirte es qué hará cada uno cuando algo se rompa, que es una pregunta más duradera.

## Compartir resultados

Debajo de los datos del perfil, o debajo del título de la comparación, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los sistemas que elegiste, por sus identificadores: `os` siempre (para que el enlace conserve su significado si cambia el sistema inicial) y `with` cuando se elige un segundo sistema. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la elección no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Al abrir un enlace.** Se establecen las dos listas desplegables y la página muestra el perfil o la comparación, igual que al elegirlos. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
