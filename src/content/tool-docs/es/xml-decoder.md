## Qué hace

Pega un XML y la herramienta lo analiza hasta dejarlo en una estructura legible: la declaración XML, el DOCTYPE y las entidades que declare, y el árbol de elementos completo con sus espacios de nombres y sus atributos, junto con las secciones CDATA, los comentarios y las instrucciones de procesamiento. Comprueba que el documento esté bien formado y hace un análisis de seguridad de la superficie de ataque de XML. No descarga nada ni resuelve nada.

## Qué muestra

XML reúne varios tipos de nodo en un mismo documento, y la herramienta los separa: la **declaración**, con su versión y su codificación; el **DOCTYPE** y las **entidades** que defina; el **árbol de elementos**, con los **espacios de nombres** (las asociaciones `xmlns`) y los **atributos** de cada elemento, y las secciones **CDATA**, los **comentarios** y las **instrucciones de procesamiento**. También comprueba que el documento esté bien formado en el sentido de XML: que cada etiqueta tenga su pareja y que el documento tenga exactamente un elemento raíz.

## La superficie de ataque de XML

XML es potente de una forma que lo vuelve peligroso cuando procede de una fuente no fiable, y el análisis de seguridad de la herramienta señala exactamente dónde está ese peligro:

- **Que haya un DOCTYPE**, porque la definición de tipo de documento es lo que hace posible todo lo demás;
- **Las entidades externas**, que pueden traer un archivo local o una URL y son el mecanismo de los ataques de entidad externa XML (XXE, XML External Entity);
- **Las entidades de parámetro**, una forma que se usa para colar un XXE a través de defensas ingenuas, y
- **La expansión de entidades**, el anidamiento que hay detrás del ataque de denegación de servicio billion laughs.

Verlos señalados es justo lo que importa: te dice si un documento concreto intenta hacer algo que un simple documento de datos nunca haría.

## Seguro por construcción

La herramienta es un analizador léxico de texto (tokenizer), no un procesador XML. Lee el documento como texto y describe su estructura, y nunca resuelve una entidad, nunca abre una referencia externa y nunca expande nada. Eso es lo que le permite analizar sin riesgo un XML hostil: las mismas funciones sobre las que te advierte se describen, no se ejecutan. Es la contraparte de uso general del Decodificador de SAML, que rechaza de plano cualquier DTD porque un mensaje SAML legítimo nunca la lleva.

## Uso

Pega un documento XML y lee su declaración, su DOCTYPE y sus entidades, su árbol de elementos y los avisos de seguridad. El análisis es determinista y local, así que puedes inspeccionar sin riesgo XML de cualquier procedencia.

Para todas las restricciones de buena formación de XML 1.0, con la línea y la columna del primer fallo, y para dar formato legible a un documento o minificarlo, usa el [Formateador y validador de XML](/tools/xml-formatter).

## Compartir resultados

Debajo del veredicto sobre si está bien formado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el documento tal como se pegó, una vez que la página lo ha leído como XML. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Un XML puede nombrar hosts y personas internos, así que la ventana emergente te pide que lo leas antes de enviar el enlace. Antes de ofrecer un enlace, se busca en el texto una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), secciones 4.1.1, 4.2.1 y 8.4, donde una cookie suele contener un identificador de sesión), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (un miembro JSON `token`, un `password=` en la cadena de consulta de una URL) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo. Aquí cuentan como credenciales dos lugares más: el `Password` de un `UsernameToken` de WS-Security ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html), consultado el 2026-11-01: “provides password information (or equivalent such as a hash)”, proporciona información de la contraseña o un equivalente, como un hash) y una aserción SAML firmada o cifrada, como en el Decodificador de SAML. Un elemento o un atributo cuyo nombre parece el de un secreto (`password`, `apiKey`, `client_secret`), en cambio, se indica en la ventana emergente.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El documento rellena el cuadro como lo haría un pegado y la página lo lee, en local: no se resuelve ninguna entidad ni se descarga nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
