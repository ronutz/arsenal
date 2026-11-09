## Qué hace

Pega un JSON Web Key Set y la herramienta lo desglosa clave por clave: de cada clave lee el tipo, el identificador de clave, el uso y el algoritmo previstos y los parámetros propios de su tipo, y señala cualquier clave que contenga material privado. Si además pegas un JWT, empareja el token con la clave que debería verificarlo comparando los identificadores de clave. Nada sale de tu navegador.

## Qué es un JWKS

Un JSON Web Key Set (JWKS) es el documento JSON que publica un proveedor de identidad, normalmente en `/.well-known/jwks.json`, para que cualquiera pueda verificar los tokens que firma sin un secreto compartido. Es simplemente una lista de claves:

    { "keys": [ {JWK}, {JWK}, ... ] }

Cada entrada es una JSON Web Key (JWK) que describe una clave: su tipo (`kty`, como RSA, EC u OKP), un identificador de clave opcional (`kid`), para qué sirve (`use`, normalmente `sig` para firmar o `enc` para cifrar), el algoritmo con el que va (`alg`) y los parámetros propios de ese tipo de clave.

## Material público y privado

En esta distinción está lo esencial de la herramienta en cuanto a seguridad. Un JWKS publicado para verificar solo debería contener claves públicas. Cada tipo de clave tiene parámetros públicos y privados: una clave RSA publica su módulo y su exponente (`n`, `e`) y mantiene en secreto su exponente privado (`d`); una clave de curva elíptica publica sus coordenadas (`x`, `y`) y mantiene en secreto su escalar privado (`d`); una clave simétrica (`oct`) no es más que el secreto (`k`). Si una clave del conjunto lleva alguno de los campos privados, significa que se ha expuesto material de clave privada, lo que es un error grave, así que la herramienta lo señala expresamente.

## Cómo se empareja un token con su clave

Un JWT firmado suele nombrar en su encabezado el identificador de clave (`kid`) de la clave que lo firmó. Un verificador busca en el JWKS la clave con ese `kid` y la usa. La herramienta hace lo mismo: dados un JWT y un conjunto, encuentra la clave cuyo `kid` coincide con el del token, que es exactamente la búsqueda que hace un verificador real antes de comprobar la firma. Los parámetros de las claves siguen el RFC 7517 y el RFC 7518, con el tipo de clave OKP para las claves de curvas de Edwards (como Ed25519) definido en el RFC 8037.

## Uso

Pega un JWKS para inspeccionar cada clave y detectar cualquier material privado expuesto y, si quieres, pega un JWT para ver qué clave del conjunto es la que debe verificarlo.

## Compartir resultados

Debajo del resumen de las claves (en el modo Emparejar un JWT, debajo del emparejamiento), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` una copia del conjunto de claves: cada valor privado sustituido por `[redacted]` y todos los demás caracteres tal como los pegaste. Su ventana emergente dice primero qué lleva el enlace y cuántos valores se sustituyeron, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Un conjunto de claves pegado puede contener material de clave privada, que un enlace nunca debe llevar. El [RFC 7518](https://www.rfc-editor.org/rfc/rfc7518) (consultado el 2026-11-01) define los miembros `d`, `p`, `q`, `dp`, `dq`, `qi` y `oth` de una clave privada RSA (sección 6.3.2, con `r`, `d` y `t` en cada entrada de `oth`), el `d` de una clave privada de curva elíptica (sección 6.2.2) y el `k` de una clave simétrica (sección 6.4.1); el [RFC 8037](https://www.rfc-editor.org/rfc/rfc8037) (sección 2, consultado el 2026-11-01) da a una clave OKP un `d` privado. La copia conserva los nombres de los miembros y solo sustituye sus valores, así que la página que la abre señala el mismo material privado y explica cada clave exactamente igual que la tuya: esta página nunca muestra esos valores. Las comprobaciones del sitio lo fijan con las claves privadas del RFC 7517, apéndices A.2 y A.3, y del RFC 8037, apéndice A.1, entre otras.

En el modo Emparejar un JWT, el enlace también lleva el encabezado del JWT, y nada más del token: la página solo lee el encabezado, y un JWT es una credencial al portador (bearer) mientras es válido ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sección 1.2, consultado el 2026-11-01). Un cuadro de JWT cuyo primer segmento no es un encabezado JSON no lleva nada, así que un token de acceso opaco nunca va en su lugar; si el miembro `jwk` de un encabezado contiene material de clave privada, no hay enlace.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro del conjunto de claves, el modo Emparejar un JWT se abre cuando el enlace lo indica y el encabezado rellena el cuadro del JWT; la página explica y empareja como con un pegado, y nunca descarga un `jwks_uri`. Un conjunto de claves que no se puede analizar o que todavía contiene un valor privado, un modo que la página no ofrece o un encabezado que es algo más que un encabezado hacen que se ignore el enlace entero. En cualquier caso, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
