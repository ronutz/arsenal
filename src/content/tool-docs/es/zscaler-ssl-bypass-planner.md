# Planificador de bypass SSL de ZIA

## Qué hace

Pega una lista de aplicaciones o destinos (uno por línea, en una gramática de cuatro campos) y recibe un plan determinista de inspección TLS. Cada activo recibe uno de tres veredictos: **Inspeccionar** (el predeterminado, que alimenta a todos los motores de contenido), **Do Not Inspect mediante regla de política** (la exención en el Edge para las categorías de gobernanza y para las aplicaciones con pinning en rutas que ningún agente controla) o **Bypass en Client Connector** (la exención más limpia para las aplicaciones con pinning cuando ZCC controla la ruta: el tráfico nunca entra en el túnel, y se combina con una regla de política como defensa en profundidad). Cada veredicto lleva su justificación documentada; cada bypass lleva un registro de puntos ciegos que nombra lo que deja de ver este flujo, y siempre que algo queda sin inspeccionar, el plan añade la lista de controles de respaldo externos: la acción Untrusted Server Certificates, OCSP (protocolo de estado de certificados en línea, Online Certificate Status Protocol) mediante stapling, el suelo de Minimum TLS Version y Block No-SNI.

## La gramática

Un activo por línea, cuatro campos separados por barras verticales; las líneas que empiezan por `#` son comentarios:

```
<name> | pinned|clean | regulated|general | agent|no-agent
```

`pinned` marca una aplicación con certificate pinning (fijación de certificados): no acepta un certificado regenerado con la CA de inspección y, si se intercepta, falla en modo cerrado. `regulated` marca una categoría de gobernanza que una política o la ley exigen mantener sellada. `agent` marca una ruta que controla el Zscaler Client Connector.

## Cómo leer el plan

El resumen cuenta los veredictos; las tarjetas recorren el razonamiento de cada activo; la nota sobre el orden recoge la doctrina de que las excepciones Do Not Inspect van en lo alto del orden, por encima del cuerpo de reglas Inspect, porque las reglas de la política SSL se evalúan en orden ascendente, por primera coincidencia. Cuando todos los activos se inspeccionan, no hay registro de bypass ni deuda de controles de respaldo, y el plan lo dice. Toda exención por política que recomienda el planificador es una regla Do Not Inspect configurada como **Evaluate Other Policies**, porque esa es la forma que mantiene en vigor los controles de respaldo externos y las políticas web; una nota del plan explica que **Bypass Other Policies** no ofrece controles de respaldo y además se salta URL Filtering y Cloud App Control, y que el tráfico al que se aplica bypass en el Client Connector ni siquiera llega al Edge.

## Honestidad

La gramática es, a propósito, un subconjunto didáctico: una planificación real de bypass también acota las reglas por usuarios, grupos y ubicaciones, y sopesa particularidades de las aplicaciones que este planificador no modela. La lógica de decisión (el pinning obliga a una exención, la gobernanza sella una categoría, todo lo demás se inspecciona y cada bypass es un punto ciego con su precio) es la parte duradera. Todo el cálculo es local; los nombres de los activos nunca salen de la página.

## Compartir resultados

Debajo de los recuentos del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los activos tal como los pegaste. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Los nombres de los activos pueden identificar tus aplicaciones internas (por eso la ventana emergente añade una línea de precaución). Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por un estándar: una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sección 10), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una línea `Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. La gramática no tiene sitio para ninguno de ellos, pero los nombres de los activos y las líneas de comentario son texto libre. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto no impide el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página planifica la inspección. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

Se basa en la documentación de inspección SSL de Zscaler (Configuring the SSL/TLS Inspection Policy; About SSL Inspection) y en la arquitectura de referencia Data Protection, con fecha de consulta 2026-07-21. Las dos formas de Do Not Inspect, y las opciones que ofrece cada una, se volvieron a leer en [Configuring SSL/TLS Inspection Policy](https://help.zscaler.com/zia/configuring-ssltls-inspection-policy) (consultado el 2026-10-26). El artículo complementario de Aprender es [*TLS Inspection in ZIA: The Policy, the Bypasses, and the Bill*](/learn/zia-ssl-inspection-policy-and-bypasses).

La regla del fragmento en la que se apoya Compartir resultados es la del [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.5 (consultado el 2026-11-01), y las credenciales que busca su comprobación las definen el RFC 7468, el RFC 9110, el RFC 6265 y el RFC 7519 (consultados el mismo día).
