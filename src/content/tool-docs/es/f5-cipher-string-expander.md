## Qué hace

Pega una cadena de cifrado (cipher string) de F5 BIG-IP y la herramienta explica cada palabra clave y cada operador que contiene, y señala las opciones débiles u obsoletas. Lee la cadena, el valor del campo `cipher` de una regla de cifrado (cipher rule) o de un perfil SSL, y convierte su sintaxis compacta en una explicación en lenguaje llano de lo que selecciona y en qué orden. Se ejecuta por completo en tu navegador.

## Cómo se construye una cadena de cifrado de F5

Una cadena de cifrado de BIG-IP es una lista ordenada de juegos de cifrado, separados por dos puntos, una coma o espacios en blanco, y el orden importa porque expresa la preferencia del servidor. Dentro de un juego, las palabras clave se combinan con `+`, así que `ECDHE+AES-GCM` significa los cifrados que son a la vez ECDHE y AES-GCM. Las palabras clave nombran las piezas de un conjunto de cifrado (cipher suite): la versión del protocolo, el intercambio de claves, la autenticación, el algoritmo de cifrado de los datos y el MAC. `DEFAULT` representa el juego predeterminado integrado de F5, un punto de partida habitual.

## Los operadores, que son la parte sutil

Un juego puede llevar un operador inicial, y la diferencia entre ellos importa:

- **`!`** excluye de forma permanente los cifrados que coinciden; una vez excluidos así, ningún término posterior puede volver a añadirlos.
- **`-`** elimina los cifrados que coinciden, pero, a diferencia de `!`, un término posterior puede volver a añadirlos.
- **`+`** no añade; mueve los cifrados que coinciden al final, lo que baja su prioridad.

Y `@STRENGTH` reordena toda la lista por longitud de clave. Confundir `!` con `-`, u olvidar que `+` reordena en lugar de añadir, es una causa habitual de que una cadena de cifrado no haga lo que pretendía quien la escribió, y eso es exactamente lo que la herramienta deja a la vista.

## La lectura de seguridad y un límite honesto

La herramienta señala los elementos débiles y obsoletos, como los cifrados de grado de exportación (export-grade), RC4 o 3DES y las versiones de protocolo obsoletas, para que una cadena arriesgada salte a la vista. Hay algo que no hace, a propósito: no reproduce la lista final ordenada exacta de conjuntos de cifrado que produciría un BIG-IP concreto, porque eso depende de la tabla de cifrados de la versión de software concreta del equipo. Explica la cadena; no sustituye al equipo.

## Uso

Pega una cadena de cifrado de una regla de cifrado o de un perfil SSL y lee la explicación de cada palabra clave y cada operador, con las opciones débiles señaladas. El análisis es determinista y local.

## Compartir resultados

Debajo de la lectura de seguridad, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la cadena de cifrado o el nombre de regla tal como lo escribiste: `/tools/f5-cipher-string-expander#input=ECDHE%3ARSA%3A!SSLv3...`. Su ventana emergente dice primero qué lleva el enlace, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la cadena no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Al abrir un enlace.** La cadena rellena el cuadro como lo haría un pegado y la página la explica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
