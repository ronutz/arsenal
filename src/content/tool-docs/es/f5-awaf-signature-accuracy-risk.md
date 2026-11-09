## Qué hace

Lee las dos propiedades que F5 publica para cada firma de ataque de F5 AWAF (Advanced WAF; antes BIG-IP ASM, Application Security Manager): su precisión (Accuracy) y su riesgo (Risk). Añade si la firma se aplica siquiera a tus sistemas y si está aplicada, y la herramienta te dice lo propensa que es la firma a dar falsos positivos, cuánto daño haría una coincidencia real y el ajuste que corresponde. Es determinista y se ejecuta por completo en tu navegador.

## Por qué propiedades y no una búsqueda por ID de firma

El conjunto de firmas de F5 es propietario y enorme, así que una base de datos por ID no sería ni viable ni honesta. Pero F5 documenta qué significan Accuracy y Risk para cada firma, y esas dos propiedades son las que de verdad guían el ajuste de los falsos positivos, así que la herramienta trabaja a partir de ellas. Accuracy, Risk y Systems se leen directamente en la propia entrada de la firma en la política.

## La precisión es la propensión a los falsos positivos

F5 define la precisión como la capacidad de una firma para identificar el ataque, incluida su propensión a las alarmas por falsos positivos, y afirma sin rodeos que una precisión más alta produce menos falsos positivos. Así, una firma con precisión Low tiene una probabilidad alta de falsos positivos, Medium tiene alguna y High, una probabilidad baja. El riesgo es un eje aparte: el daño potencial si el ataque tiene éxito, desde el reconocimiento (Low) hasta la exposición de datos sensibles o un daño moderado (Medium) y el compromiso total del sistema o la denegación de servicio (High).

## El cuadrante de precisión por riesgo

La herramienta sitúa la firma en una matriz de 2x2. Precisión baja con riesgo bajo es la candidata ideal para relajar: falsos positivos frecuentes y poco que perder al relajarla. Precisión baja con riesgo alto es propensa a los falsos positivos, pero peligrosa, así que investigas la solicitud real antes de desactivarla, en lugar de dejar pasar sin más un posible ataque real. Precisión alta con riesgo alto es un bloqueo fiable y con mucho en juego que no se relaja. Precisión alta con riesgo bajo es fiable, pero con poco en juego. También marca como puro ruido una firma dirigida a un sistema que tu aplicación no ejecuta, y presenta la precisión como una palanca: como la precisión es un criterio de filtro de los conjuntos de firmas, un conjunto inclinado hacia las firmas de mayor precisión produce menos falsos positivos.

## Fundamento

Las definiciones de precisión y riesgo salen de la documentación Working with Attack Signatures de F5 y de la referencia clásica de firmas de ataque de BIG-IP ASM (que detalla la probabilidad baja, media y alta de falsos positivos y la delimitación de los conjuntos de firmas por sistema y por precisión), además del K70544352 sobre la reducción de los falsos positivos. Nada de lo que seleccionas se sube ni sale de la página.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` las cuatro elecciones por su ID: `accuracy`, `risk`, `system` y `enforcement`. Las cuatro van siempre, así que el enlace sigue abriendo la misma lectura. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** Las cuatro elecciones se marcan y la página calcula como cuando se cambian. Una elección que la página no ofrece hace que se ignore el enlace entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
