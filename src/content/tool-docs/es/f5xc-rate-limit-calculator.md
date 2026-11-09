## Qué hace

Esta calculadora convierte la configuración de un limitador de tasa (rate limiter) de F5 Distributed Cloud (XC) en exactamente lo que hará. Introduces los cuatro campos que pide la consola de F5 (**Number**, **Per Period**, **Periods** y **Burst Multiplier**), más la **Mitigation Action** (y un bloqueo, o lockout, si eliges Block), y la calculadora obtiene la tasa efectiva, sus equivalentes por segundo, por minuto y por hora, el techo de ráfaga y una descripción en lenguaje llano de cómo se aplica el límite. Se ejecuta por completo en tu navegador.

## Las cuentas de la tasa

XC expresa una tasa como *Number solicitudes por (Periods x Per Period)*. Por eso `[1, Seconds, 60]` y `[1, Minutes, 1]` son el mismo límite (una solicitud por minuto), algo que sorprende a mucha gente una y otra vez. La calculadora normaliza cualquier configuración a una única ventana en segundos y muestra las tasas equivalentes por segundo, por minuto y por hora, para que puedas comparar dos configuraciones directamente.

## Ráfaga y aplicación del límite

El **Burst Multiplier** es la ráfaga máxima de solicitudes permitida, expresada como múltiplo de la tasa (1 de forma predeterminada); un límite de 15 solicitudes por segundo con un multiplicador de 3x permite una ráfaga de 45 solicitudes. El límite se aplica con un leaky bucket (cubo con fugas): cuando el cubo se desborda, el balanceador de carga devuelve **HTTP 429**.

## La trampa de la mitigación

La opción que más se malinterpreta es la **Mitigation Action**. **Disabled no anula la limitación de tasa**: el leaky bucket sigue devolviendo 429 cuando se desborda; Disabled solo significa que no se aplica ningún temporizador de bloqueo adicional. **Block** añade un bloqueo encima: en cuanto el cubo se desborda, el usuario queda bloqueado durante todo el bloqueo aunque el cubo se vacíe, y solo puede volver a enviar cuando vence el temporizador (48 horas como máximo). La calculadora indica qué comportamiento produce tu configuración.

## Advertencias que muestra

El recuento se distribuye por Regional Edge y por proxy, así que puedes ver brevemente más solicitudes que el límite antes de que su aplicación converja. Y cuando combinas por capas reglas de Server URL y de endpoint de API, se evalúan por primera coincidencia, en el orden en que las configuras.

## Compartir resultados

Debajo de la tasa efectiva, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` todos los campos: Number, Per Period, Periods, Burst Multiplier, Mitigation Action y el bloqueo con su unidad, cada uno tal como lo lee el cálculo (un Burst Multiplier vacío, como 1). Todos los campos viajan aunque coincidan con el valor predeterminado, para que un enlace conserve su significado si cambia un valor predeterminado, y los números no nombran ningún sistema ni a ninguna persona. La página muestra un resultado nada más abrirse, así que el botón está disponible desde el principio. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los campos se rellenan como si los hubieras escrito, y aparece el resultado. Un enlace con un valor que la página rechazaría se ignora entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
