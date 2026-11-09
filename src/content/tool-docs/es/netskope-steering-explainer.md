## Qué hace

Describe la situación (si el dispositivo está gestionado o no, si está en una sede o en movilidad, si se puede instalar el paquete de certificados, si la política necesita nombrar al usuario) y la herramienta te dice qué método de direccionamiento (steering) encaja: el cliente en el endpoint, un túnel IPsec o GRE, un proxy explícito o el encadenamiento desde un proxy que ya existe. **Cada método enumera lo que cuesta, se elija o no**, porque una herramienta que solo enumerara los inconvenientes de las opciones que descarta sería un anuncio de la que eligió.

## La interacción sobre la que avisa

**El cliente detecta otros métodos de direccionamiento y, de forma predeterminada, se desactiva a sí mismo cuando encuentra IPsec, GRE o un proxy explícito.** Así que usar los dos no es, sin más, una protección por partida doble: es uno de los dos, según un ajuste que la mayoría nunca ha abierto.

La herramienta también ofrece la tercera disposición: desplegar el cliente junto al túnel **no para direccionar**, sino para aprovisionar certificados y aportar la identidad del usuario. El túnel lleva el tráfico; el cliente responde quién es el usuario.

## El límite estricto que plantea

**Sin los certificados raíz e intermedios de Netskope en el endpoint no hay inspección TLS ni autenticación SAML.** El tráfico llega y la política se aplica solo sobre los metadatos. Una regla escrita como si el contenido fuera visible parecerá correcta en la consola y no hará lo que cree quien la escribió.

## En qué se diferencia del explicador de decisiones de direccionamiento

Responden a preguntas distintas, y los dos están en el sitio:

- **Esta herramienta responde a una pregunta de diseño**: ¿qué vía de entrada conviene desplegar en esta situación?
- **El explicador de decisiones de direccionamiento responde a una pregunta de ejecución**: con una configuración de direccionamiento ya implantada, ¿qué le ocurre a *este flujo concreto*: DIRECCIONADO, EN BYPASS, BLOQUEADO o DIRECTO?

Elige el método aquí; sigue el flujo allí.

## Qué no hace

No conoce tus licencias, tu tenant ni tu configuración actual. El direccionamiento por DNS, por ejemplo, exige licencias concretas y solo se aplica a ciertos tipos de configuración, algo que la herramienta no puede verificar por ti.

## Compartir resultados

Debajo del encabezado de los métodos, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` las siete respuestas, cada una como 1 o 0, siempre, para que un enlace conserve su significado aunque cambie un valor predeterminado. Las respuestas describen una situación y no nombran ningún sistema ni ninguna persona. La página muestra métodos nada más abrirse, así que el botón está disponible desde el principio. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Las casillas se marcan como si hubieras hecho clic en ellas, y a continuación aparecen los métodos. Se ignora un enlace al que le falte una respuesta. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
