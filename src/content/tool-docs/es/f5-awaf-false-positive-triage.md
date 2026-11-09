## Qué hace

Elige una infracción que estés clasificando en F5 AWAF (Advanced WAF; antes BIG-IP ASM, Application Security Manager): su categoría, su calificación media de la infracción y si la comprobación está aplicada, en staging o en una política Transparent. La herramienta devuelve el veredicto de F5 basado en la calificación, si la infracción está bloqueando tráfico en este momento y la corrección acotada para esa categoría si resulta ser un falso positivo real. Es la contrapartida del estimador de envenenamiento: aquel advierte contra relajar de más, y este muestra cómo relajar correctamente un falso positivo real. Es determinista y se ejecuta por completo en tu navegador.

## El veredicto sale de la calificación

Advanced WAF asigna a cada transacción una calificación de la infracción de 1 a 5, y esa calificación decide cómo tratar un posible falso positivo. Las calificaciones de 4 o 5 son probablemente ataques reales y bloquean aunque el indicador Block de todas las infracciones esté desactivado, así que la herramienta te dice que borres la sugerencia sin cambiar la política. Una calificación de 3 es ambigua y hay que investigarla primero en el log de eventos. Las calificaciones de 1 y 2 suelen ser falsos positivos reales, así que la herramienta te dice que apliques la corrección acotada (o aceptes la sugerencia de aprendizaje) una vez que hayas confirmado que la solicitud es legítima.

## Tiene en cuenta el staging y el modo Transparent

Que una infracción bloquee de verdad depende de la aplicación. La herramienta solo marca una infracción como bloqueante cuando la política está en modo Blocking y la calificación es 4 o 5. Una firma en staging registra pero no bloquea, y una política en modo Transparent no bloquea nada, así que en esos casos la herramienta indica que el falso positivo es una señal de aprendizaje y no una experiencia de usuario rota, y que la corrección importa para cuando se active la aplicación.

## La corrección siempre es acotada

Para cada categoría de infracción, la herramienta da la corrección documentada, y todas las opciones se limitan a la URL o al parámetro concretos, nunca a una desactivación en toda la política. Desactivar una firma en una URL, añadir una entidad permitida, añadir un metacarácter al conjunto de esa entidad, subir una longitud concreta, marcar un parámetro de subida de archivos, asociar un perfil de contenido XML o JSON o activar Potential False Positive Detection son acciones acotadas. La herramienta recuerda siempre la disciplina que rige todo el ejercicio: relaja solo donde se produjo realmente un falso positivo, nunca donde un ataque real causó la infracción.

## Fundamento

La lógica que va de la calificación a la acción y las correcciones acotadas salen del K70544352 de F5 (Reducing false positive violations), de la documentación Working with Violations de BIG-IP ASM (que define cómo la calificación determina el bloqueo y qué infracciones no se pueden aprender) y de la guía Refining Security Policies with Learning. Nada de lo que seleccionas se sube ni sale de la página. Para un cambio en producción, confírmalo con la documentación y con la solicitud concreta de tu log de eventos.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` las tres elecciones por su ID: `category`, `rating` y `state`. Las tres van siempre, así que el enlace sigue abriendo el mismo triaje aunque cambien las elecciones iniciales de la página. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** Las tres elecciones se marcan y la página calcula como cuando se cambian. Una elección que la página no ofrece hace que se ignore el enlace entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
