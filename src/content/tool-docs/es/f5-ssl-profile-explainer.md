## Qué hace

Pega un perfil `client-ssl` o `server-ssl` de tmsh y la herramienta lo explica: la función del perfil, la matriz de versiones del protocolo TLS que habilita y deshabilita, y una lectura de seguridad que cubre la cadena de certificados, la renegociación, SNI, el stapling de OCSP (protocolo de estado de certificados en línea, Online Certificate Status Protocol) y TLS mutuo. Analiza el perfil por completo en tu navegador y nunca se conecta a un equipo.

## Perfiles del lado del cliente y del lado del servidor

En un BIG-IP, SSL lo gestionan dos tipos de perfil, y lo primero que te dice la herramienta es cuál es este. Un perfil **client-ssl** termina el TLS que llega del cliente: el BIG-IP presenta un certificado y descifra el tráfico. Un perfil **server-ssl** hace lo contrario: inicia TLS hacia el miembro del pool y vuelve a cifrar a la salida. Un despliegue de TLS de proxy completo usa los dos: descifra lo que llega del cliente para poder inspeccionar o dirigir el tráfico, y después lo vuelve a cifrar hacia el servidor. Conocer la función sitúa todo lo demás del perfil.

## La matriz de protocolos

Las versiones de TLS que admite un perfil las fija su campo `options`, que habilita o deshabilita versiones concretas. La herramienta lo muestra como una matriz clara para que veas de un vistazo si, por ejemplo, TLS 1.0 y 1.1, declarados obsoletos por el RFC 8996, siguen habilitados, o si TLS 1.3 está activado. Suele ser lo más importante que hay que comprobar en un perfil SSL, y es fácil leerlo mal en la máscara de bits `options` en bruto.

## La lectura de seguridad

Más allá de los protocolos, la herramienta evalúa las partes del perfil que deciden lo seguro que es realmente el TLS:

- el **certificado, la clave y la cadena**, incluido si la cadena está completa;
- la **renegociación**, y si se exige la renegociación segura (RFC 5746);
- **SNI** (RFC 6066), para servir el certificado correcto cuando varios nombres comparten el perfil;
- el **stapling de OCSP** (la extensión `status_request`, RFC 6066), que permite al servidor aportar su propia prueba del estado de revocación; y
- la **validación del certificado del par**, que es como se configura TLS mutuo, donde el BIG-IP exige y comprueba un certificado de cliente.

Cada punto recibe una calificación para que los ajustes arriesgados destaquen frente a los sólidos.

## Uso

Pega un bloque de perfil `client-ssl` o `server-ssl` y lee su función, su matriz de protocolos y la evaluación de seguridad de su cadena, su renegociación, SNI, OCSP y TLS mutuo. El análisis es determinista y local.

Para comprobar qué negocia realmente un cliente con un virtual server que usa el perfil, ejecuta `openssl s_client` contra el virtual server y pega la salida en el [Explicador de openssl s_client](/tools/openssl-s-client-explainer); la cadena de cifrado del perfil la lee el [Explicador de cadenas de cifrado de F5](/tools/f5-cipher-string-expander).

## Compartir resultados

Debajo del encabezado del perfil, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el perfil con el valor de cada ajuste `passphrase` y `proxy-ca-passphrase` sustituido por `[redacted]`, nunca tal como se pegó; las referencias [client-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_client-ssl.html) y [server-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_server-ssl.html) de F5 (consultadas el 2026-10-27) los llaman la frase de contraseña de la clave (key passphrase) y la frase de contraseña de la clave de la CA de SSL Forward Proxy. Su ventana emergente dice primero qué lleva el enlace y cuántos valores se sustituyeron, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Esta página tampoco muestra nunca esos valores, así que la página que recibe el enlace lee el mismo perfil. `passphrase none` se mantiene, y también los nombres, las particiones, los objetos de archivo y los nombres de host. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página la explica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
