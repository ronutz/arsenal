# Explicador de los factores de la puntuación ZDX

Pega las métricas que expone Zscaler Digital Experience (la puntuación compuesta, las métricas de Web Probe y las de CloudPath) y lee qué es cada una según la propia documentación del fabricante: qué familia de sondas la mide, qué significa y cómo se aplica la semántica documentada de la puntuación.

## Alcance honesto, desde el principio

Zscaler documenta los factores de la puntuación ZDX, la frecuencia de sus sondas, su regla del valor más bajo de la hora, su escala de 0 a 100 y las tres franjas (Good, de 66 a 100; Okay, de 34 a 65; Poor, de 0 a 33), pero **no** publica la fórmula compuesta exacta. Por eso esta herramienta **no calcula ninguna puntuación a partir de las métricas**. Clasifica una puntuación dada en una de las tres franjas documentadas, explica el significado documentado de cada métrica y la familia de sondas a la que se atribuye, y dice claramente dónde termina la documentación. Para las métricas en bruto, ningún umbral publicado hace que un valor sea bueno o malo por sí mismo (los criterios de alerta de ZDX los define el administrador en cada regla), así que la herramienta explica la métrica y se abstiene de calificarla. Es la misma regla de no inventar que siguen las demás herramientas del sitio.

## Gramática de la entrada

Una métrica por línea, `metric = value`. Las líneas que empiezan por `#` son comentarios.

- `score`: la puntuación ZDX compuesta, un número entero de 0 a 100 (Zscaler redondea cada puntuación al entero más próximo)
- `pft`, `dns`, `srt`: tiempos de Web Probe en milisegundos (Page Fetch Time, DNS Time, Server Response Time)
- `availability`: la disponibilidad de Web Probe, en porcentaje de 0 a 100
- `path-latency`, `path-loss`: métricas de CloudPath (milisegundos, porcentaje)

## Qué obtienes

Cada métrica se muestra como una tarjeta de lectura: su insignia de familia de sondas (Web Probe / CloudPath / Puntuación compuesta), su significado documentado (Page Fetch Time solo pide el documento de nivel superior de la página; Server Response Time es el tiempo hasta el primer byte) y, para la puntuación, su clasificación en la franja documentada Good, Okay o Poor, con la nota sobre el análisis automático de causa raíz en Poor. Cuando están las dos familias de sondas, aparece el reparto del diagnóstico: métricas web malas sobre una ruta limpia apuntan a la aplicación; una ruta mala acusa a la red. Las notas permanentes recogen la semántica documentada en la que se apoya cada lectura: sondas cada cinco minutos; el valor más bajo de la hora como valor horario; las puntuaciones de aplicación, que promedian el valor más bajo de cada usuario, mientras que las de departamento, ubicación, ciudad y organización promedian el valor más bajo de cada intervalo de tiempo; los tres tipos de puntuación (Synthetic Probe, RUM y Combined), que pueden no coincidir para la misma aplicación; el retraso de unos veinte minutos de la telemetría, y la pequeña variación entre la API y el panel por la agregación aproximada.

Todo se ejecuta en local, en tu navegador; nada de lo que pegas sale de la página.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` las métricas tal como las pegaste. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Las métricas pueden describir el rendimiento de una aplicación interna (por eso la ventana emergente añade una línea de precaución). Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por un estándar: una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sección 10), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una línea `Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. La gramática no tiene sitio para ninguno de ellos, pero una línea de comentario es texto libre. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto no impide el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página lee cada métrica. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [Arquitectura de referencia de Zscaler: Zscaler Digital Experience (ZDX)](https://help.zscaler.com/downloads/zdx/reference-architecture/zscaler-digital-experience-zdx/zscaler-digital-experience-zdx-reference-architecture.pdf), con las métricas de las sondas, su frecuencia y la semántica del valor más bajo de la hora y de los promedios por grupo (consultado el 2026-11-09)
- [Ayuda de Zscaler: Evaluating User Details](https://help.zscaler.com/zdx/evaluating-user-details) (la franja Poor documentada, de 0 a 33, y su análisis automático de causa raíz; consultado el 2026-11-09)
- [Ayuda de Zscaler: Understanding the ZDX API](https://help.zscaler.com/legacy-apis/understanding-zdx-api) (las calibraciones del retraso de la telemetría y de la variación de los agregados; consultado el 2026-11-09)
- [Ayuda de Zscaler: Understanding the ZDX Score](https://help.zscaler.com/zdx/understanding-zdx-score) (la escala de 0 a 100, las tres franjas, las reglas de agregación, el redondeo a números enteros y los tipos de puntuación; consultado el 2026-10-26)

La regla del fragmento en la que se apoya Compartir resultados es la del [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.5 (consultado el 2026-11-01), y las credenciales que busca su comprobación las definen el RFC 7468, el RFC 9110, el RFC 6265 y el RFC 7519 (consultados el mismo día).
