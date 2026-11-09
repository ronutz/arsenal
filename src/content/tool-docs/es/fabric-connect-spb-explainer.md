## Qué hace

Indica un I-SID, un nickname de SPB o el rol de un switch, y la herramienta te ordena el vocabulario de Shortest Path Bridging (SPB): qué VLAN de backbone transporta el servicio y por qué, a qué se vinculan realmente una L2VSN y una L3VSN, qué es y qué no es una B-VLAN, y qué cambia entre un backbone edge bridge y un backbone core bridge. Determinista y sin conexión: explica identificadores, no consulta ningún fabric.

## El comportamiento que conviene comprobar

**Los I-SID pares van por una VLAN de backbone y los impares por la otra.** Con los valores predeterminados de Extreme, 4051 y 4052, el I-SID 20010 se transporta en la 4052 y el 20011 en la 4051. Dos árboles de ruta más corta, cada uno con aproximadamente la mitad de los servicios.

La herramienta aclara que se trata del **reparto predeterminado y no de una regla del estándar**, porque un despliegue puede asignarlos de otra forma, y cuando un servicio se comporta de forma distinta a sus vecinos, en qué árbol está es lo primero que hay que comprobar.

## El hecho que la herramienta repite en cada resultado

**Una B-VLAN no es una VLAN.** No inunda el unicast desconocido, el broadcast ni el multicast. Solo reenvía según las tablas MAC del backbone que IS-IS aprovisionó a partir de los árboles de ruta más corta. Sin spanning tree, sin nada bloqueado.

Todo lo demás se deduce de ahí: si el reenvío se calcula, el núcleo no aprende; si el núcleo no aprende, no necesita saber que tus servicios existen. Por eso **añadir un servicio solo afecta a los switches de borde donde aparece.**

## Validación que hace

Un I-SID tiene que estar en el rango de 24 bits, y la herramienta rechaza los valores que quedan fuera en lugar de explicar un número que no puede existir. Un nickname tiene que tener la forma `x.xx.xx`, y uno mal formado genera una advertencia, porque **un nickname duplicado o mal formado es uno de los pocos errores de este terreno que rompen cosas lejos de donde se escribió.**

## Qué no hace

No puede ver tu fabric. No conoce tu topología, tus adyacencias ni si IS-IS está realmente activo. Explica qué significan tus números dentro de un fabric, no qué está haciendo tu fabric.

## En qué se diferencia del decodificador de identificadores de fabric de VOSS

Las dos herramientas reciben un I-SID y un nickname, y responden preguntas distintas:

- **El decodificador de identificadores de fabric valida un identificador.** Pegas algo y averigua si es un I-SID de 24 bits, un nickname de 20 bits o un system-id, y si está dentro del rango.
- **Esta herramienta explica qué significa el identificador en un fabric.** Qué VLAN de backbone lo transporta y por qué, a qué se vinculan una L2VSN y una L3VSN, qué es y qué no es una B-VLAN, y qué cambia entre un puente de borde (edge bridge) y un puente de núcleo (core bridge).

Decodifica el valor allí; entiende la disposición aquí.

## Compartir resultados

Debajo de los hechos, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` cada campo del formulario tal como se escribió: `isid`, `primary`, `secondary` y `nickname` (un campo vacío no lleva nada y llega vacío), y las dos listas desplegables por su identificador, `service` y `role`. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Los I-SID, las B-VLAN, los nicknames y los roles son los valores que escribes para ver cómo los trata el fabric; nada de ellos es secreto.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el formulario no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** Se rellena cada campo y la página lo explica, igual que al escribir; no se envía nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
