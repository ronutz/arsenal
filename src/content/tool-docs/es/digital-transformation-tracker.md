# Seguimiento de la transformación digital

Treinta hitos en siete ámbitos de la vida cotidiana, desde los primeros paquetes de ARPANET hasta previsiones que todavía no se han cumplido. Lo importante de la herramienta no es la cronología, sino el **nivel de certeza** que acompaña a cada fila.

## Por qué existen los niveles

Una herramienta de seguimiento con una sección de “lo que viene después” es un escaparate de previsiones, y la regla de este sitio es que las herramientas calculan, no adivinan. La solución es que nunca se permite que una previsión parezca un hecho:

- **Realizado**: ocurrió, con fecha y verificable.
- **En vigor**: una obligación legal que se aplica hoy.
- **Programado**: una fecha futura fija, establecida por ley o por un calendario publicado. Mucha confianza en la fecha y ninguna afirmación sobre las consecuencias.
- **Programado, pero en revisión**: una fecha que existe realmente en la ley *y* que se está cambiando. La herramienta muestra la fecha original, la fecha propuesta y el hecho de que el cambio todavía no es ley.
- **Previsión**: la proyección de alguien, que siempre nombra a quien la hace y va acompañada de una señal en sentido contrario cuando la hay.

Ese cuarto nivel es el que nadie más muestra. Las obligaciones de alto riesgo de la Ley de IA de la UE son el ejemplo resuelto: programadas para el 2 de agosto de 2026, con un acuerdo provisional del 7 de mayo de 2026 para trasladarlas al 2 de diciembre de 2027, y todavía sin rango de ley, así que la fecha original sigue rigiendo la planificación.

## Qué registra cada fila

Cada hito responde a dos preguntas: qué cambió para una persona corriente y qué pasó a ser posible que antes no lo era. Al filtrar por ámbito se ve lo distinta que fue la llegada de la transformación al dinero, al trabajo, a la salud y al Estado.

## Compartir resultados

Debajo del recuento, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los filtros activados, por su ID: `domains` y `certainties`, en el orden de la página (una fila sin nada activado no lleva nada, lo que equivale a todos, como en la página). Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Sin ningún filtro activado, la vista es la página tal como se abre, a la que ya enlaza el propio botón Compartir de la página, así que el botón espera. Los hitos nunca viajan: la página que abre el enlace lee el mismo conjunto de datos, así que el enlace sigue siendo corto y una fila corregida llega también a los enlaces antiguos.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la vista no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Al abrir un enlace.** Los chips de filtro se activan y la línea de tiempo se vuelve a dibujar, igual que al tocarlos. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Privacidad

Los filtros se evalúan en local. No se transmite nada, y el conjunto de datos viene con la página.
