## Qué hace

Pega una cadena de vector CVSS v3.1 o v3.0 y la herramienta calcula la puntuación, la asocia a una franja de gravedad y explica qué significa cada métrica. Calcula la puntuación base y, cuando el vector incluye esas métricas, también las puntuaciones temporal y de entorno. Es matemática pura y funciona sin conexión; no se envía nada a ninguna parte.

## Qué es CVSS

CVSS, el Common Vulnerability Scoring System de FIRST.org, es la forma estándar de expresar la gravedad de una vulnerabilidad con un único número de 0,0 a 10,0. Ese número no se asigna a mano; se calcula a partir de una cadena de vector, una lista compacta de métricas como `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`, en la que cada campo es una característica de la vulnerabilidad. La herramienta convierte esa cadena de nuevo en lenguaje llano y le aplica la fórmula oficial.

## Las métricas base

La puntuación base, la parte que tiene todo vector, se construye con métricas de dos grupos. Las métricas de explotabilidad describen lo difícil que es aprovechar la vulnerabilidad: **Vector de ataque** (red, adyacente, local o físico), **Complejidad del ataque**, **Privilegios requeridos** e **Interacción del usuario**. Las métricas de impacto describen qué pasa si se aprovecha: el efecto sobre la **Confidencialidad**, la **Integridad** y la **Disponibilidad**. El **Alcance** está entre ambos grupos y recoge si explotar el componente puede afectar a recursos que están fuera de él. La herramienta muestra el valor elegido de cada métrica y su significado, para que un vector deje de ser un código opaco.

## Puntuación, gravedad y los demás grupos

La puntuación base calculada se asocia a una franja cualitativa: Ninguna, Baja, Media, Alta o Crítica. Dos grupos de métricas opcionales la afinan cuando están presentes: las métricas **temporales** la ajustan al estado actual del código de explotación y de las correcciones, y las métricas **de entorno** vuelven a ponderar la puntuación para tu despliegue concreto, incluidos tus propios requisitos de confidencialidad, integridad y disponibilidad. La aritmética sigue exactamente la especificación de FIRST.org, incluida su propia regla de redondeo, así que el número que muestra la herramienta coincide con el de la calculadora oficial.

## Uso

Pega un vector v3.0 o v3.1 y lee la puntuación, la franja de gravedad y las métricas decodificadas. El cálculo es determinista: el mismo vector da siempre la misma puntuación, porque es la fórmula publicada y nada más.

[PHP2Shell: las vulnerabilidades de PHP de octubre de 2026](/learn/php-october-2026-vulnerabilities) analiza un caso real: los mismos fallos puntuaron 9,8 u 8,1 en v3.1, según la complejidad del ataque que eligió cada evaluador.

## Compartir resultados

Debajo de las puntuaciones, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el vector tal como lo escribiste, una vez que la página lo ha decodificado. Un vector CVSS es un descriptor público de gravedad y no nombra nada tuyo. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El vector rellena el cuadro como lo haría un pegado y la página lo decodifica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
