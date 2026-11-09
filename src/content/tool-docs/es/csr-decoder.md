## Qué hace

Decodifica una solicitud de firma de certificado (CSR, certificate signing request) PKCS#10 y lee lo que contiene: el nombre del sujeto, la clave pública, los nombres alternativos del sujeto (SAN, Subject Alternative Names) y las demás extensiones que pide el solicitante, y los atributos que haya. Analiza la estructura de la solicitud por completo en tu navegador y nunca contacta con una autoridad de certificación.

## Qué es una CSR y qué no es

Una CSR es el objeto que entregas a una autoridad de certificación cuando le pides que emita un certificado. Lo importante es que no es un certificado. No tiene número de serie, ni emisor, ni fechas de validez, porque todavía no se ha decidido nada de eso. Solo lleva lo que pide el solicitante: un nombre de sujeto, una clave pública y, opcionalmente, un conjunto de extensiones solicitadas como los nombres alternativos del sujeto. Toda la solicitud va firmada con la clave privada que corresponde a la clave pública que contiene, lo que demuestra que el solicitante tiene de verdad esa clave privada, un paso que se llama prueba de posesión (proof of possession).

## Solicitado, no concedido

Leer una CSR te dice qué se pidió, no qué va a conceder una CA. Una autoridad de certificación puede añadir, cambiar o eliminar lo que pide una CSR según su propia política y la validación que hace, así que los SAN y las extensiones que ves aquí son una solicitud, no una garantía. La distinción importa cuando un certificado emitido no coincide con la CSR: muchas veces es la CA aplicando su política, no un error.

## Qué decodifica

La solicitud es ASN.1 codificado en DER (la misma codificación tipo-longitud-valor que usan los certificados), y el decodificador la recorre y la convierte en campos legibles:

- el nombre distintivo del **sujeto**;
- la **clave pública**, con su algoritmo y su tamaño;
- las **extensiones solicitadas**, que van en un atributo `extensionRequest` de PKCS#9, sobre todo los nombres alternativos del sujeto; y
- otros **atributos**, como una contraseña de desafío (challenge password) o un nombre no estructurado, si los hay.

Solo decodifica la estructura. No verifica la autofirma de la solicitud y, como una CSR no tiene periodo de validez, no hay nada que dependa del tiempo que comprobar.

## Uso

Pega una CSR PKCS#10 (el bloque entre los marcadores CERTIFICATE REQUEST) y lee su sujeto, su clave, los SAN y las extensiones solicitados y sus atributos. El análisis es determinista y local.

## Compartir resultados

Debajo de la nota inicial, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como lo pegaste: `/tools/csr-decoder#input=-----BEGIN%20CERTIFICATE%20REQUEST-----...`. Una solicitud es lo que envías a una CA: un sujeto, una clave pública y las extensiones que se piden. Cualquier otra cosa que haya en el cuadro va con ella. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la solicitud no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Sin enlace en dos casos.** Cuando el cuadro también contiene una clave privada (un bloque `-----BEGIN ... PRIVATE KEY-----`, porque algunos generadores imprimen juntas la solicitud y su clave) y cuando la solicitud lleva una contraseña de desafío, que esta página muestra en claro: la solicitud está firmada, así que no se puede compartir sin la contraseña. La ventana emergente indica cuál de los dos casos es.
- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El enlace tiene la forma `#input=` que esta página ya lee, así que al abrirlo funciona exactamente como siempre han funcionado esos enlaces: el valor rellena el cuadro y se decodifica, y se queda en la dirección hasta que cambias o borras el cuadro.
