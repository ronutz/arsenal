## Qué hace

Esta herramienta relaciona, en los dos sentidos, los niveles de seguridad TLS de F5 Distributed Cloud (XC) con los conjuntos de cifrado (cipher suites) que negocian. Elige un nivel (**High**, **Medium** o **Low**) y muestra las versiones mínima y máxima exactas de TLS y la lista completa de cifrados, con cada conjunto anotado según su intercambio de claves, su confidencialidad directa (forward secrecy) y su robustez. O pega un conjunto de cifrado (en la forma `TLS_*` de la IANA o en la forma con guiones de OpenSSL) o una línea entera de un escáner, y te dice qué niveles incluyen ese cifrado. Todo se ejecuta en tu navegador.

## La tabla en la que se basa

Las listas de cifrados se transcriben al pie de la letra de la TLS Reference de F5. Hay dos cosas de esa tabla que sorprenden a mucha gente. La primera: **Default es el nivel High**: tiene como mínimo TLS 1.2 y como máximo TLS 1.3, y es el que usa un balanceador de carga HTTPS con certificado automático. La segunda: los niveles son **acumulativos**; Medium es todos los cifrados de High más cuatro conjuntos ECDHE-CBC, y Low es todos los cifrados de Medium más cuatro conjuntos de RSA estático. Todos los niveles llegan como máximo a TLS 1.3.

## Por qué tu escáner marca un balanceador de carga

Hay dos preguntas que surgen una y otra vez en el día a día, y la herramienta responde las dos. Si un escáner indica **TLS 1.0 o 1.1 habilitado**, el balanceador de carga está en **Medium o Low**: esos niveles tienen como mínimo TLS 1.0. El nivel Default/High tiene como mínimo TLS 1.2, así que no ofrece los protocolos antiguos (K000148226). Si un escáner indica **cifrados débiles**, casi siempre se trata de los **conjuntos de RSA estático que añade el nivel Low**: no tienen confidencialidad directa, que es justo lo que un escáner penaliza (K000148079).

## Cómo leer las anotaciones

Cada cifrado lleva una etiqueta con su intercambio de claves (TLS 1.3, ECDHE-ECDSA, ECDHE-RSA o RSA), si ofrece confidencialidad directa (PFS) y una calificación de robustez. Los conjuntos ECDHE tienen PFS; los de RSA estático, no. TLS 1.3 y los conjuntos AEAD (GCM / ChaCha20) son robustos; los conjuntos CBC-SHA son de robustez media; los de RSA estático son débiles.

## Compartir resultados

Cada modo tiene su propio botón **Compartir resultados**, debajo de su propia respuesta, que genera un enlace a esta página, solo cuando lo presionas, y lleva después del `#` el valor de ese modo: debajo de los cifrados del nivel, el nivel que elegiste; debajo de los niveles del cifrado, la línea de cifrado que escribiste, una vez que se reconoce algún cifrado en ella. Un nivel o un conjunto de cifrado no nombra ningún sistema ni a ninguna persona. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Se elige el nivel y se rellena la línea de cifrado, como si hubieras hecho clic y escrito; aparecen las dos lecturas. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
