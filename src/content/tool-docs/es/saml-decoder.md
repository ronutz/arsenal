## Qué hace

Pega una SAML Response o una aserción, en XML en bruto, en base64 o codificada como URL, y la herramienta la decodifica: el emisor, el estado, el sujeto, las condiciones, la audiencia y los atributos. Junto con la decodificación ejecuta una evaluación de seguridad basada en reglas, y analiza el XML de una forma reforzada contra XXE. Todo ocurre en tu navegador.

## SAML en pocas palabras

El lenguaje de marcado de aserciones de seguridad (SAML, Security Assertion Markup Language) es el estándar basado en XML que sostiene buena parte del inicio de sesión único en las empresas. Después de que te autenticas, un proveedor de identidad emite una **Assertion** (aserción) firmada, normalmente envuelta en una **Response**, que afirma ante un proveedor de servicios quién eres. Las piezas que extrae la herramienta son las que deciden si hay que confiar en esa aserción: el **Issuer** (qué IdP), el **Status** (si la autenticación tuvo éxito), el **Subject** y su NameID (quién), las **Conditions** (la ventana de validez y la **AudienceRestriction**, que nombra para quién es la aserción) y los **Attributes** (los claims sobre el usuario). Como SAML viaja codificado en base64 con el binding HTTP-POST, a menudo con codificación URL dentro de un campo de formulario, la herramienta deshace primero esas codificaciones; un mensaje comprimido con DEFLATE para el binding HTTP-Redirect se rechaza, con un error que pide el XML sin procesar o el formulario HTTP-POST.

## El modelo de seguridad: rechazo de XXE

La propiedad principal de esta herramienta es cómo analiza. El XML no fiable es peligroso por los ataques de entidad externa XML (XXE, XML External Entity) y por los ataques de expansión de entidades como billion laughs, y ambos necesitan que el documento declare una DTD, mediante un `DOCTYPE` o una declaración `<!ENTITY>`, para definir sus entidades. Un mensaje SAML legítimo nunca necesita una DTD, así que el analizador rechaza de plano cualquier documento que la contenga. Esa única regla neutraliza por construcción el XXE clásico y la expansión billion laughs, en lugar de intentar sanearlos a posteriori.

## Qué comprueba la evaluación

Además de decodificar, la herramienta evalúa el mensaje según las recomendaciones de seguridad de SAML: si está firmado, si depende de algoritmos de firma o de resumen débiles (como SHA-1) y si sus condiciones y su audiencia están presentes y son coherentes. Si la aserción está cifrada, la herramienta detecta el `EncryptedAssertion` y lo indica, en lugar de intentar descifrarlo. Estas comprobaciones reflejan las preguntas de la guía de SAML de OWASP, así que la salida apunta a lo que de verdad causa vulnerabilidades en SAML.

## Uso

Pega una SAML Response o una aserción en cualquiera de sus formas habituales y lee el emisor, el estado, el sujeto, las condiciones, la audiencia y los atributos decodificados, junto con la evaluación de seguridad. El análisis es determinista y local, y el analizador que rechaza XXE permite inspeccionar sin riesgo mensajes no fiables.

Para leer un mensaje largo distribuido línea a línea, el [Formateador y validador de XML](/tools/xml-formatter) lo presenta con sangrías; su documentación explica por qué un mensaje firmado no debe reenviarse reformateado.

## Compartir resultados

Debajo de las insignias principales, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el mensaje tal como se pegó (XML en bruto, codificado como URL o en base64), una vez que la página lo ha decodificado. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Un mensaje SAML nombra tu proveedor de identidad y tu proveedor de servicios, y un sujeto puede nombrar a una persona, así que la ventana emergente te pide que lo revises antes de enviar el enlace.

Un mensaje que lleva una credencial no tiene enlace: una aserción firmada, una aserción dentro de una Response firmada o un `EncryptedAssertion`. La especificación [SAML 2.0 Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf) (OASIS, consultada el 2026-11-01) dice del método bearer que “the subject of the assertion is the bearer of the assertion” (el sujeto de la aserción es su portador) (sección 3.3), y que las aserciones entregadas con el binding HTTP POST “MUST be signed” (deben estar firmadas) (sección 4.1.4.5); el proveedor de servicios solo recuerda los ID usados mientras la aserción es válida. Así que una aserción firmada inicia la sesión de su sujeto, y un enlace se la daría a cualquiera que lo reciba hasta que caduque; una cifrada ([SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf), sección 2.3.4) es una que el proveedor de servicios puede abrir. Quitar la firma cambiaría lo que muestra esta página, así que tampoco se genera una copia del mensaje. Una AuthnRequest, una LogoutRequest o una LogoutResponse, los metadatos, una Response de error (que “MUST NOT include any assertions”, no debe incluir ninguna aserción, sección 4.1.4.2 de Profiles) y una aserción sin firmar sí tienen enlace.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El mensaje rellena el cuadro como lo haría un pegado y la página lo decodifica, en local; nunca verifica, descarga ni descifra nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
