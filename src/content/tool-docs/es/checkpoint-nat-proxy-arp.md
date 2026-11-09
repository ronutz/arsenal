## Qué hace esta herramienta

Responde a una sola pregunta: ¿el tráfico dirigido a la dirección traducida llega de verdad al gateway? No si la política lo permite, sino si el paquete llega siquiera.

La distinción importa porque el fallo habitual está una capa por debajo de la base de reglas. Si la dirección traducida está dentro de una subred a la que el gateway está conectado directamente, algún dispositivo va a hacer ARP por ella y, salvo que el gateway responda, nunca se envía nada.

## La regla

**El NAT automático (traducción de direcciones de red, network address translation)** añade ella misma la entrada de proxy ARP al instalar la política, siempre que *Automatic ARP configuration* esté habilitada en Global Properties.

**El NAT manual no lo hace.** Nunca lo ha hecho. La entrada la crea el administrador.

**Ninguna de las dos importa** si la dirección traducida no está en una subred conectada. En ese caso nadie en el segmento va a hacer ARP por ella, y algo aguas arriba tiene que enrutarla; el proxy ARP no es lo que hay que mirar.

## La firma del diagnóstico

Un NAT estático manual hacia una dirección de la propia subred del gateway, sin entrada de proxy ARP, produce un silencio muy particular. La política se instala sin errores. La base de reglas parece correcta. El servidor está sano.

Y **no hay absolutamente nada en los logs del firewall**, ni un drop ni un reject. No llegó nada que registrar. Una captura en la interfaz externa muestra solicitudes ARP que nadie responde.

## Un caso en el que “usa el NAT automático y listo” no basta

El NAT automático tampoco crea nada si *Automatic ARP configuration* está desactivada en Global Properties. La herramienta trata esa combinación exactamente igual que una regla manual, porque el resultado es idéntico.

Si añades entradas a mano junto a las automáticas, *Merge manual proxy ARP configuration* tiene que estar habilitada; si no, no pueden coexistir.

## Lo que no hace, a propósito

**No ordena la base de reglas de NAT.** Las fuentes publicadas se contradicen sobre si las reglas manuales se evalúan antes o después de las automáticas: una guía dice que primero las manuales, otra que primero los niveles automáticos, y la propia guía de administración de Check Point describe que los dos tipos se aplican de forma distinta sin zanjar el orden.

Ordenarlas significaría tomar partido y presentar una suposición como un cálculo. El comportamiento del proxy ARP se describe igual en todas partes, así que eso es lo que responde.

## Límites, sin rodeos

Una interfaz cada vez; un gateway con varias interfaces frente al mismo tráfico es una cuestión de topología que la herramienta no modela. Solo IPv4. Y razona sobre la alcanzabilidad en la capa 2, no sobre si la política de acceso permite la conexión una vez que llega.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el formulario después del `#` como valores con nombre, siempre todos los campos: `method`, `type`, `natip`, `gateway`, `prefix` y `autoarp` (1 o 0). Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

El formulario contiene dos direcciones, un prefijo y tres elecciones, y ninguno es un secreto, así que la ventana emergente no añade nada a la advertencia estándar del sitio. Van todos los campos, no solo los que difieren de los valores predeterminados, para que un enlace antiguo conserve su significado si cambia un valor predeterminado.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los valores del enlace sustituyen todo el formulario y la página lo evalúa (aritmética de subredes; no se envía ningún ARP ni se consulta nada). Un método o un tipo desconocidos, un `autoarp` distinto de 1 o 0, o unas direcciones que la página rechaza hacen que se ignore el enlace entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
