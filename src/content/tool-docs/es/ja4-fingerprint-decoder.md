## Qué hace

Un JA4 es una huella de un cliente TLS, calculada a partir de los campos de su ClientHello: la versión de TLS, los conjuntos de cifrado que ofrece, las extensiones que envía, los algoritmos de firma y el ALPN. Dos clientes que construyen su ClientHello de la misma forma producen el mismo JA4, y así es como los servidores, los proxies y los sensores pasivos reconocen el software cliente sin descifrar nada. Esta herramienta decodifica un JA4 en sus partes, o calcula el JA4 con hash a partir de los valores sin procesar y sin hash. Todo se ejecuta en tu navegador.

## Cómo se construye un JA4

Un JA4 tiene tres secciones unidas por guiones bajos, `JA4_a_JA4_b_JA4_c`, por ejemplo `t13d1516h2_8daaf6152771_e5627efa2ab1`.

- **JA4_a** es legible por personas y tiene diez caracteres:
  - el transporte: `t` para TLS sobre TCP, `q` para QUIC, `d` para DTLS;
  - la versión de TLS: `13` para TLS 1.3, `12` para 1.2, etc., leída de la extensión supported_versions cuando está presente;
  - el SNI: `d` cuando el ClientHello lleva un nombre de servidor (un dominio), `i` cuando no lo lleva (una dirección IP a secas);
  - el número de conjuntos de cifrado, con dos dígitos;
  - el número de extensiones, con dos dígitos (este recuento incluye SNI y ALPN);
  - el marcador ALPN: el primer y el último carácter del primer valor ALPN, así que `h2` para HTTP/2, o `00` cuando no hay ALPN.
- **JA4_b** son los doce primeros caracteres hexadecimales del SHA-256 de la lista de conjuntos de cifrado, ordenada.
- **JA4_c** son los doce primeros caracteres hexadecimales del SHA-256 de la lista de extensiones (ordenada, sin SNI ni ALPN) seguida de la lista de algoritmos de firma en su orden original.

Como JA4_b y JA4_c son hashes truncados, son unidireccionales: la herramienta puede mostrarlos, pero no puede recuperar a partir de ellos las listas de conjuntos de cifrado ni de extensiones.

## GREASE

GREASE (los valores reservados de draft-davidben-tls-grease) mantiene TLS extensible obligando a los clientes a enviar valores aleatorios sin uso que los servidores tienen que ignorar. JA4 también los ignora, así que nunca afectan a los recuentos ni a los hashes. Si pegas valores sin procesar que incluyen GREASE, esta herramienta los filtra antes de contar, ordenar y calcular los hashes.

## Ordenar es lo que hace robusto a JA4

Las huellas anteriores, como JA3, calculaban el hash de las listas de conjuntos de cifrado y de extensiones en el orden en que las enviaba el cliente. Los navegadores modernos aleatorizan ahora a propósito el orden de las extensiones TLS en cada conexión, lo que cambia el JA3 cada vez y lo inutiliza. JA4 ordena los conjuntos de cifrado y las extensiones antes de calcular el hash, así que la huella se mantiene estable aunque el cliente baraje el orden. Esa es la razón principal de que JA4 haya sustituido en gran medida a JA3.

## Ejemplo resuelto

La huella `t13d1516h2_8daaf6152771_e5627efa2ab1` se decodifica como TLS sobre TCP, TLS 1.3, SNI presente, 15 conjuntos de cifrado, 16 extensiones y ALPN `h2` (HTTP/2). Es el ejemplo resuelto de la especificación de JA4, y es uno de los vectores de referencia de esta herramienta: el SHA-256 de su lista ordenada de conjuntos de cifrado da `8daaf6152771`, y las extensiones ordenadas más los algoritmos de firma dan `e5627efa2ab1`.

## Una nota sobre la licencia

FoxIO publica JA4 (la huella de clientes TLS) con la licencia permisiva BSD 3-Clause, las mismas condiciones que el JA3 original, así que se puede implementar libremente, también en herramientas comerciales. Los demás miembros de la familia JA4+, como JA4S, JA4H, JA4X y JA4T, están bajo la FoxIO License 1.1, que no permite la monetización sin un acuerdo aparte, así que esta herramienta solo implementa JA4.

## JA3, el predecesor

Esta herramienta también trata JA3, la huella anterior a la que sustituyó JA4. Un JA3 es el MD5 de cinco campos decimales del ClientHello en el orden en que se enviaron: `SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats`, por ejemplo `769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0`. Pega una cadena JA3 y la herramienta calcula su MD5 y desglosa los campos; pega un MD5 de 32 caracteres a secas y lo reconoce como hash JA3, que, al ser unidireccional, no puede decodificar. JA3 es BSD 3-Clause, como JA4. Es sensible al orden, así que un navegador que aleatoriza el orden de sus extensiones produce un JA3 distinto en cada conexión, y esa es la razón de que exista JA4.

## Uso

La herramienta detecta automáticamente lo que pegas: un JA4 tiene guiones bajos, mientras que un JA3 son campos decimales separados por comas, o un MD5 a secas. Pega un JA4 con hash para decodificarlo; un JA4_r sin procesar (el valor `JA4_a` seguido de las listas sin hash de conjuntos de cifrado, de extensiones y de algoritmos de firma, separadas por guiones bajos) para calcular el JA4 con hash; una cadena JA3 para calcular su MD5 y ver sus campos; o un MD5 de JA3 para identificarlo. La ruta del JA4 sin procesar ordena las listas y les quita el GREASE por ti, así que las entradas ordenadas y las que están en su orden original producen el mismo JA4 canónico.

## Compartir resultados

Debajo de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva la huella tal como se pegó (`#input=t13d1516h2_8daaf6152771_e5627efa2ab1`), y nada más. Todo lo que lleva el enlace va después del `#`, que según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; una huella es mucho más corta.
- **Al abrir un enlace.** La huella rellena el cuadro como lo haría un pegado y la página la vuelve a leer; una mal formada recibe el mensaje propio de la página. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.
