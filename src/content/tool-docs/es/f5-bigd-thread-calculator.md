## Qué hace

BIG-IP 21.1 reconstruyó bigd, el daemon de los monitores de estado, como una única instancia multihilo capaz de atender hasta 15.000 monitores del plano de control, y documentó con exactitud cómo se deriva el número automático de hilos a partir del número de vCPU. La herramienta codifica esas dos fórmulas al pie de la letra: escribe un número de vCPU y el tipo de sistema y te devuelve el número de hilos que derivaría el sistema, el límite de la sustitución manual bigd.numprocs y el techo de monitores. Un número solo calcula las dos fórmulas en paralelo.

## Las dos fórmulas

Para los sistemas con hyperthreading (HT), las notas de la versión de F5 indican `Number of BigD Threads = (Number of vCPUs × 6) ÷ 10`, con el argumento de que los núcleos HT rinden aproximadamente un 60 % de lo que rinde un núcleo real. Para los sistemas normales (sin HT), la fórmula es `Number of BigD Threads = (Number of vCPUs ÷ 2) − 1`. Cuando una fórmula da una fracción (8 vCPU con hyperthreading dan 4,8), las notas de la versión no indican ninguna regla de redondeo, así que la herramienta muestra tanto el valor exacto como su parte entera en hilos y lo dice claramente. Con 2 vCPU, el resultado honrado de la fórmula normal es 0; bigd sigue ejecutándose, así que interpreta ese caso límite como un uso mínimo de hilos, no como su ausencia.

## La sustitución manual y el techo

La variable de base de datos `bigd.numprocs` define el número de hilos manualmente, pero está limitada al número de vCPU disponibles; su valor predeterminado, 0, significa cálculo automático con las fórmulas de arriba. El daemon multihilo admite hasta 15.000 monitores del plano de control. Como referencia para el dimensionamiento, las notas de la 21.0 de F5 recomiendan mantener bigd en 5000 instancias de monitor o menos y, por encima de esa cifra, pasar a los monitores In-TMM, que escalan hasta 25.000 con una asignación de extramb de 8 GB.

## Qué plataformas usan hyperthreading

La elección de la fórmula es un dato de la plataforma, y la propia documentación de plataformas de F5 lo resuelve. En rSeries, la familia se divide por la mitad: los appliances de gama media y alta (r5000, r10000 y la familia r12000 en las tablas de dimensionamiento de F5) usan hyperthreading, con cada núcleo Intel visto como dos vCPU, mientras que los r2000 y r4000 usan una clase de CPU sin hyperthreading y solo se cuentan en núcleos físicos. VELOS usa hyperthreading en los dos tipos de blade: las vCPU de un tenant son hyperthreads, dos por núcleo físico, y los tenants de BIG-IP usan la disposición HT-Split (K15003), en la que TMM toma un hyperthread de cada núcleo. iSeries y VIPRION también cuentan las vCPU como hyperthreads en el lenguaje de dimensionamiento de F5, pero ninguno de los dos ejecuta BIG-IP 21.x, así que para ellos la herramienta muestra la correspondencia solo como contexto. Virtual Edition hereda lo que exponga el hipervisor: compruébalo dentro del invitado (`lscpu`, Thread(s) per core) y elige la fórmula que corresponda.

Escribe la plataforma directamente en la entrada: `8 r10900` selecciona la fórmula con hyperthreading, `16 r4800` la normal, `22 velos` la de hyperthreading y `8 ve` muestra las dos con la nota de que compruebes tu host. Una palabra explícita `ht` o `normal` siempre se impone al valor predeterminado de la plataforma, para el caso en que el hyperthreading se haya desactivado en el firmware.

## Ejemplos resueltos

`8 ht` da 4,8 exactos, 4 hilos enteros. `10 ht` da justo 6. `16 normal` da 7. `40 ht` da 24. `6` solo muestra las dos: 3,6 (parte entera 3) con hyperthreading y 2 en normal.

## Compartir resultados

Debajo de las dos fórmulas, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la línea tal como se escribió: `/tools/f5-bigd-thread-calculator#input=8%20r10900`. Un número de vCPU y una plataforma no nombran nada de tu red. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la línea no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Una línea de pocas palabras, muy por debajo de los 16.384 caracteres que el sitio admite después del `#`.
- **Al abrir un enlace.** La línea rellena el campo como lo haría la escritura y la página calcula. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Procedencia

Las fórmulas, el comportamiento del límite y el techo de 15.000 están tomados al pie de la letra de las notas de la versión “New Features in BIG-IP Version 21.1.0” de F5 (BigD enhancements for large-scale configurations), descargadas el 2026-07-08; la recomendación de 5000 instancias y las cifras de In-TMM proceden de su equivalente de la 21.0.0. El número real de hilos del sistema en ejecución es siempre el que manda.
