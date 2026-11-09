## Qué hace

Pega una declaración AS3 de F5 BIG-IP, el JSON que envías con POST a `/mgmt/shared/appsvcs/declare`, y la herramienta te la explica: si es una solicitud AS3 completa o una declaración solo ADC, las opciones de nivel superior, los metadatos del ADC y el árbol que va de Tenant a Application y a cada recurso, con cada clase nombrada y explicada. También comprueba las reglas estructurales que documenta F5. Es una herramienta que solo decodifica, se ejecuta por completo en tu navegador y se basa en la guía del usuario de AS3 y en la referencia del esquema de F5.

## Solicitud o declaración

Lo primero que te dice es cuál de las dos formas pegaste. Una solicitud AS3 completa tiene `class: "AS3"` y lleva `action` (deploy, dry-run, retrieve, remove, patch) y `persist`, que envuelven la declaración. Una declaración solo ADC tiene `class: "ADC"` en el nivel superior y omite el envoltorio, lo que significa que las opciones action y persist no están disponibles. La herramienta muestra action y persist en una solicitud, y en ambos casos el schemaVersion, el id, el label y el remark de la declaración ADC.

## El árbol que recorre

Debajo de los metadatos, la herramienta recorre la jerarquía fija de AS3: cada Tenant (que se convierte en una partición de BIG-IP), cada Application (con su plantilla, e indicando cuándo se aplica generic de forma predeterminada en AS3 3.20 y posteriores) y cada objeto de recurso que contiene. De cada objeto muestra la clase y una explicación en lenguaje claro, desde Service_HTTP y Service_HTTPS hasta Pool, Monitor, TLS_Server, TLS_Client, Certificate, Persist, WAF_Policy, Endpoint_Policy e iRule. Una clase que no reconoce se lista igualmente y se marca; nunca se oculta.

## Las comprobaciones estructurales

Junto a la explicación, la herramienta aplica las reglas documentadas que hacen válida una declaración: una clase AS3 o ADC en el nivel superior, un schemaVersion obligatorio, al menos un Tenant que contenga al menos una Application que contenga al menos un recurso, y la regla de correspondencia entre plantilla y clase de servicio (una plantilla http, https, tcp, udp o l4 exige un objeto Service correspondiente llamado service, antes serviceMain). También señala como informativos los nombres reservados (Common, Shared, service) y comprueba que los nombres de los objetos sigan la regla de 1 a 64 caracteres alfanuméricos que empiezan por una letra.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` una copia de la declaración, nunca lo pegado: cada valor que la [referencia del esquema](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/schema-reference.html) de AS3 (consultada el 2026-10-27) define como secreto se sustituye por `[redacted]`. Es decir, el `ciphertext` de un objeto Secret (con el encabezado `protected` predeterminado es el propio secreto, solo que codificado en base64url), un `passphrase`, `password`, `secret`, `sharedSecret` o `token` escrito como cadena simple, las frases de contraseña con nombre (`cookiePassphrase`, `md5SignaturePassphrase`, `javaSignKeyPassphrase`), el `privateKey` y el `pkcs12` de un Certificate incluidos en línea o dados como `base64` o `text`, el `targetPassphrase` de la solicitud AS3 y cada valor de `targetTokens`, y las credenciales de Service Discovery (`secretAccessKey`, `apiAccessKey`, `encodedCredentials`, `encodedToken`). Su ventana emergente dice primero qué lleva el enlace y cuántos valores se sustituyeron, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Esta página nunca muestra esos valores, así que la página que recibe el enlace lee la misma declaración; la copia conserva todos los demás bytes, espacios y orden incluidos. Una clave dada como ruta `bigip` o como `url` se queda, igual que `accessKeyId`, los nombres, las direcciones, las iRules y las cadenas `send` de los monitores, que el esquema no marca como secretos: revísalos tú antes de compartir.

Un pegado que no es JSON válido no se puede recortar con seguridad: si nombra en cualquier parte una de esas propiedades, no hay enlace y la ventana emergente pide que primero se corrija el JSON; si no nombra ninguno, va tal como se escribió y la página que lo recibe muestra el mismo error de análisis.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página la explica; no se envía nada a ninguna parte. Después, el valor sale de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Alcance y fundamento

Es un explicador de estructura y un comprobador de coherencia, no un validador completo de JSON Schema. No reproduce el esquema AS3 entero ni comprueba cada propiedad, así que una declaración que pasa aquí puede ser rechazada igualmente por el propio AS3; toma un resultado limpio como una buena señal, no como una garantía. Nada de lo que pegas se sube ni sale de la página. Se basa en la documentación de AS3 de F5; para un despliegue, valida contra tu versión de AS3 y contra la referencia del esquema.
