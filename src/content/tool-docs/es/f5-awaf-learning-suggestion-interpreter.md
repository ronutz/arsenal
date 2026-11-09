## Qué hace

Describe una sugerencia de Traffic Learning de F5 AWAF (Advanced WAF; antes BIG-IP ASM, Application Security Manager): su acción, su puntuación de aprendizaje, la calificación media de la infracción, el modo de aprendizaje y si el tráfico que hay detrás es de confianza. La herramienta te dice si aceptar la sugerencia relaja o endurece la política, si una relajación es una corrección real de un falso positivo o una relajación de la seguridad, y si el aprendizaje Automatic está a punto de aplicarla por ti. Es el puente entre el estimador de envenenamiento y el triaje de falsos positivos, y se ejecuta por completo en tu navegador.

## Relajación frente a endurecimiento

F5 clasifica las sugerencias en dos sentidos. Las sugerencias de endurecimiento (tightening) hacen la política más específica: quitar un comodín y añadir entidades explícitas, aplicar una entidad que está en staging, hacer más específico un atributo. Aceptarlas suele mejorar la seguridad. Las sugerencias de relajación (loosening) relajan la política: añadir una entidad permitida, permitir un metacarácter, relajar un atributo, desactivar una infracción o una firma. Añadir una entidad legítima que la política simplemente no había aprendido tiene poco riesgo, pero una relajación que reduce la aplicación exige criterio, y la herramienta la juzga por la calificación de la infracción: 1 o 2 es probablemente la corrección de un falso positivo, 3 exige investigar, y 4 o 5 significa que estarías relajando un ataque real.

## La puntuación de aprendizaje y el vector de envenenamiento

Cada sugerencia lleva una puntuación de aprendizaje que muestra lo cerca que está el sistema de aceptarla, y la puntuación sube a medida que baja la calificación de la infracción. Así, las sugerencias con la calificación más baja, las que tienen más probabilidades de ser falsos positivos, son las que antes llegan a la aceptación automática. Es así a propósito, pero también es exactamente lo que hace subir un atacante que alimenta muchas infracciones de calificación baja. Cuando el modo es Automatic, la relajación reduce la aplicación, el tráfico no es de confianza y la puntuación va subiendo, la herramienta señala el vector de envenenamiento y te remite al estimador de envenenamiento para ver a qué distancia está el umbral de aceptación automática. En el aprendizaje Manual, una persona tiene que aceptar cada sugerencia, así que no se aplica nada sin revisión.

## La disciplina

Para cualquier relajación que reduzca la aplicación, la herramienta recuerda la regla de F5: relaja la política solo donde se produjo un falso positivo, nunca donde un ataque real causó la infracción. La calificación de la infracción es lo que permite distinguir los dos casos, y por eso es la que determina la evaluación.

## Fundamento

Las categorías de relajación y endurecimiento salen del K03513854 de F5, y el comportamiento de la puntuación de aprendizaje, la aplicación automática al 100 % en el modo Automatic y la disciplina de los falsos positivos salen de la documentación de aprendizaje de ASM y del K70544352. La herramienta modela el comportamiento documentado y no depende del JSON exacto de las sugerencias en REST (que varía según la versión); la sugerencia la describes tú a partir de la pantalla Traffic Learning. Nada de lo que seleccionas sale de la página.

## Compartir resultados

Debajo de la evaluación, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` las cinco elecciones por su ID: `action`, `score` (de 0 a 100), `rating` (de 1 a 5, o `na`), `mode` y `trust`. Las cinco van siempre, así que el enlace sigue abriendo la misma lectura. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** Las cinco elecciones se marcan y la página calcula como cuando se cambian. Una elección que la página no ofrece hace que se ignore el enlace entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
