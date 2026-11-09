## Qué hace esta herramienta

Pega una lista de reglas de Firewall Filtering de Zscaler Internet Access (ZIA) escrita en una pequeña gramática didáctica (una regla por línea, con la forma `order | name | action | criteria`) y, si quieres, una línea `flow:`, y el simulador ejecuta delante de ti la semántica documentada de la política: las reglas se ordenan en orden numérico ascendente, el flujo se sigue regla a regla y la evaluación se detiene en la primera coincidencia, se nombra el veredicto (una regla, o la Default Firewall Filtering Rule para lo que no haya coincidido con ninguna) y un análisis de sombreado por pares enumera las reglas que nunca pueden activarse porque una regla anterior ya cubre todo aquello con lo que podrían coincidir.

## La gramática

Reglas: `10 | allow-web | allow | proto=tcp port=443 dest=203.0.113.0/24 src=any`, con las acciones `allow`, `block` (descarte silencioso) o `block-icmp` (bloqueo que informa al cliente), y un token `disabled` opcional. Los criterios que se omiten significan Any, y Any se ignora durante la evaluación, exactamente como lo documenta el fabricante. Líneas opcionales: `flow: proto=tcp port=8443 dest=203.0.113.7 src=10.0.0.5` para trazar un flujo, y `default: allow|block` para modelar que un superadministrador edita la acción de la regla Default. Las líneas que empiezan por `#` son comentarios.

## Lo que codifica la semántica

Todo lo que se simula es el comportamiento publicado por Zscaler: la evaluación recorre el Rule Order en sentido ascendente y se detiene en la primera coincidencia; una regla desactivada no se aplica, pero conserva su lugar (el servicio se la salta y sigue); la Default Firewall Filtering Rule no se puede borrar, siempre tiene la precedencia más baja, sus criterios son fijos y solo se puede editar su acción, y de serie bloquea todo el tráfico, por eso el valor predeterminado del simulador, sin una línea `default:`, es block.

## Límites, sin rodeos

El modelo de criterios es, a propósito, un subconjunto didáctico: protocolo, puertos, origen y destino. Las reglas reales de Firewall Filtering añaden usuarios, grupos, departamentos, ubicaciones, servicios y aplicaciones de red, países de destino, niveles de confianza del dispositivo y franjas horarias; la semántica de orden que enseña esta herramienta se aplica a todos ellos de forma idéntica. El análisis de sombreado es solo por pares: no se señala una regla cubierta por varias reglas anteriores juntas, pero por ninguna de ellas sola. Las reglas predefinidas del sistema (Office 365, el tráfico del servicio de Zscaler) y los límites de orden de Admin Rank se describen en el artículo complementario, pero no se simulan.

## Compartir resultados

Debajo de la tarjeta del veredicto (al principio de la lectura cuando no hay línea de flujo), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` las reglas y el flujo tal como los pegaste. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Los nombres de las reglas y las direcciones pueden identificar tu infraestructura (por eso la ventana emergente añade una línea de precaución). Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por un estándar: una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sección 10), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una línea `Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. La gramática no tiene sitio para ninguno de ellos, pero los nombres de regla y las líneas de comentario son texto libre. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto no impide el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página simula las reglas. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

Se basa en tres páginas de la ayuda de Zscaler, cada una fijada con su fecha de consulta en el manifiesto de la herramienta: About Firewall Filtering (el orden de evaluación, la regla Default que deniega de forma predeterminada, el conjunto de verbos de acción), Configuring the Firewall Filtering Policy (el Rule Order, la convención de que Any significa que el criterio se ignora, Admin Rank) y Editing the Default Firewall Filtering Rule (la precedencia más baja, que no se puede borrar, los criterios fijos y la edición de la acción por un superadministrador).

La regla del fragmento en la que se apoya Compartir resultados es la del [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.5 (consultado el 2026-11-01), y las credenciales que busca su comprobación las definen el RFC 7468, el RFC 9110, el RFC 6265 y el RFC 7519 (consultados el mismo día).
