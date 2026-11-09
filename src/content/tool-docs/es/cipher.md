## Qué hace

Introduce un conjunto de cifrado (cipher suite) de TLS, ya sea con su nombre IANA, con un nombre de OpenSSL o de GnuTLS o con un punto de código hexadecimal, y la herramienta lo desglosa en sus partes (el intercambio de claves, la autenticación, el algoritmo de cifrado de los datos con su modo, y el MAC) y da una lectura de seguridad en lenguaje llano junto con el estado oficial de recomendación de la IANA para ese conjunto. Se ejecuta en tu navegador con una copia integrada del registro de la IANA.

## Cómo se lee el nombre de un conjunto de cifrado

Un conjunto de cifrado es un paquete con nombre de los algoritmos que va a usar una conexión TLS, y el nombre tiene estructura. En TLS 1.2 y anteriores, un nombre como `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256` se lee por partes: `ECDHE` es el método de intercambio de claves, `RSA` es cómo se autentica el servidor, `AES_128_GCM` es el algoritmo de cifrado de los datos con su tamaño de clave y su modo, y `SHA256` es el hash del MAC y de la PRF. TLS 1.3 cambió esto: un conjunto de 1.3 como `TLS_AES_128_GCM_SHA256` solo nombra el algoritmo de cifrado simétrico y el hash, porque el intercambio de claves es siempre efímero y se negocia por separado. La herramienta analiza las dos formas y las separa en sus componentes.

## Nombres, puntos de código y el registro

Un mismo conjunto tiene nombres distintos en herramientas distintas, con un punto de código numérico debajo de todos ellos. La fuente de referencia es el registro TLS Cipher Suites de la IANA, que asocia cada punto de código de dos bytes con su nombre y lleva el flag **Recommended** (Y, N o D de discouraged, desaconsejado, según el RFC 8447). La herramienta resuelve lo que escribas (un nombre IANA, un nombre de OpenSSL o de GnuTLS, o el punto de código hexadecimal en bruto) hasta ese registro, para que puedas pasar de la forma que muestra una herramienta a la que espera otra.

## La lectura de seguridad

Conociendo las partes, la herramienta puede juzgar el conjunto, y señala lo conocido como malo y lo débil a partir de los estándares, no de opiniones: los conjuntos con RC4 son inseguros (RFC 7465), los conjuntos con 3DES son débiles por el ataque Sweet32 (RFC 8429), y además refleja las entradas que el propio registro marca como no recomendadas. También reconoce las opciones modernas, incluidos los modos de cifrado autenticado (GCM y ChaCha20-Poly1305) y los grupos híbridos poscuánticos de intercambio de claves basados en ML-KEM (NIST FIPS 203).

## Uso

Introduce un conjunto de cifrado en cualquiera de las formas habituales y lee su intercambio de claves, su autenticación, su algoritmo de cifrado, su modo y su MAC decodificados, su estado de recomendación de la IANA y la evaluación de seguridad. La decodificación es determinista y totalmente local.

El conjunto que eligió un servidor real está en la línea `Cipher is` de la salida de `openssl s_client`; el [Explicador de openssl s_client](/tools/openssl-s-client-explainer) lee esa línea con todo lo que la rodea, incluida la trampa de que su versión es la del propio conjunto, no siempre la versión negociada.

## Compartir resultados

Debajo de las insignias del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el conjunto de cifrado tal como lo escribiste: `/tools/cipher#input=TLS_CHACHA20_POLY1305_SHA256`. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el nombre no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El enlace tiene la forma `#input=` que esta página ya lee, así que al abrirlo funciona exactamente como siempre han funcionado esos enlaces: el valor rellena el cuadro y se decodifica, y se queda en la dirección hasta que cambias o borras el cuadro.
