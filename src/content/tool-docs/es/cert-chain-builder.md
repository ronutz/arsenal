## Qué hace

Toma cualquier número de certificados X.509 en formato PEM, en cualquier orden, y hace lo que hace el constructor de rutas de un cliente TLS antes de comprobar una sola firma: encuentra la entidad final (end entity), sigue cada certificado hasta su emisor e informa de la cadena que debería enviar un servidor, de los certificados que faltan, de los que sobran y de cada regla estructural de la validación de rutas del RFC 5280 que la cadena incumple. Después, la página verifica en tu navegador la firma de cada eslabón con WebCrypto y lo indica por separado, porque el resultado estructural es el mismo en cualquier equipo y la comprobación de firmas depende de lo que pueda hacer el navegador.

Pega el certificado hoja (leaf), los intermedios, la raíz si la tienes, una firma cruzada antigua de la que no estás seguro, el intermedio dos veces por error; la página lo ordena y dice qué hizo con cada uno.

## Cómo se construye la cadena

- **La entidad final** es el certificado que no emite ningún otro de la entrada y cuyo basicConstraints no afirma cA. Si hay varios así, se usa el primero y se informa de los demás; si no hay ninguno (un paquete de intermedios solo), se usa la CA más alta y la página lo indica.
- **Cada eslabón** se establece de Authority Key Identifier a Subject Key Identifier cuando los dos certificados los llevan (RFC 5280, sección 4.2.1.1: el identificador de clave existe “to facilitate certification path construction”, para facilitar la construcción de la ruta de certificación), y del nombre del emisor al nombre del sujeto cuando alguno de los dos no lo lleva. Un certificado con el nombre correcto pero con otra clave no es un emisor: se informa de él como una CA que cambió de clave (rollover), y del emisor real como ausente.
- **Si hay varios emisores posibles** (una CA con firma cruzada, o dos certificados para la misma clave), se elige aquel cuya validez cubre el inicio de la del sujeto, y los demás se listan como sobrantes.
- **La ruta termina** en un certificado autofirmado (el sujeto es igual al emisor y los identificadores de clave no lo contradicen), o cuando el siguiente emisor no está en la entrada. En el segundo caso se nombra al emisor que falta, con el identificador de clave que espera el sujeto y la URL caIssuers que lleva el certificado, si la hay. La página no la descarga.

## Las reglas que comprueba

A lo largo de la ruta, de arriba abajo, las comprobaciones de la sección 6.1.4 del RFC 5280 que no necesitan criptografía:

- **(k) basicConstraints.** Un emisor de versión 3 debe llevar la extensión con cA TRUE. “If the cA boolean is not asserted, then the keyCertSign bit in the key usage extension MUST NOT be asserted” y la clave “MUST NOT be used to verify certificate signatures” (sección 4.2.1.9), es decir, sin cA no puede haber keyCertSign y la clave no debe usarse para verificar firmas de certificados.
- **(n) keyUsage.** Cuando la extensión está presente en un emisor, keyCertSign debe estar activado.
- **(l) y (m) pathLenConstraint.** El valor “gives the maximum number of non-self-issued intermediate certificates that may follow this certificate in a valid certification path” (el número máximo de certificados intermedios no autoemitidos que pueden seguir a este en una ruta válida); la entidad final “is not included in this limit” (no cuenta para ese límite), y cero significa que no puede seguirle ningún intermedio. La página cuenta desde lo alto de la ruta hacia abajo, saltándose los certificados autoemitidos, y nombra la CA cuyo límite se agotó. Una raíz autofirmada en lo alto es el ancla de confianza (trust anchor), que no forma parte de la ruta de certificación candidata (“not included as part of the prospective certification path”, sección 6.1); su propia restricción solo se usa como límite inicial.
- **Validez en un instante.** Cada certificado de la ruta se juzga en el instante elegido, tu reloj de forma predeterminada o una fecha que indiques, y se informa de si está caducado o todavía no es válido. Un emisor que caduca antes que el certificado que emitió es una advertencia con la fecha, porque la cadena deja de validar ese día diga lo que diga la hoja.
- **Algoritmos.** Una firma con SHA-1 o MD5 en cualquier sitio salvo en una raíz autofirmada (cuya propia firma no comprueba ningún validador) se señala según los Baseline Requirements del CA/Browser Forum, que pusieron fin al último uso de SHA-1 en certificados el 15 de septiembre de 2026; una clave RSA de menos de 2048 bits se señala según la sección 6.1.5 del mismo documento.
- **La entidad final.** Se señala un certificado de servidor sin subjectAltName, ya que los navegadores comparan el nombre de host solo con esa extensión.

## Los veredictos

- **Completa**: la ruta va de la entidad final a un certificado autofirmado con todos los eslabones establecidos y sin ninguna regla incumplida. Completa significa aquí estructuralmente completa; si la raíz es de confianza es una cuestión del almacén del cliente.
- **Completa, con advertencias**: lo mismo, con algo que conviene leer primero.
- **La cadena termina en una CA cuyo emisor no está aquí**: la ruta es correcta hasta donde llega y se detiene en un intermedio cuyo emisor no se pegó. Es la forma normal de una cadena TLS, ya que “a certificate that specifies a trust anchor MAY be omitted from the chain, provided that supported peers are known to possess any omitted certificates” (puede omitirse el certificado que designa un ancla de confianza, siempre que se sepa que los pares tienen los certificados omitidos) (RFC 9846, sección 4.5.1; sección 4.4.2 en el RFC 8446, al que dejó obsoleto en julio de 2026). Si el emisor que falta está en los almacenes de tus clientes, no falta nada; si es a su vez un intermedio, añádelo.
- **Incompleta**: la ruta se detiene en la entidad final. Ningún cliente puede construir una cadena con lo que hay aquí; añade los intermedios.
- **No válida**: se incumple una de las reglas anteriores. Un cliente conforme rechaza la cadena.

## La cadena que hay que configurar

La página vuelve a codificar los certificados de la ruta a partir de sus bytes, en base64 de 64 columnas, en el orden que pide la sección 4.5.1 del RFC 9846: “The sender's certificate MUST come in the first CertificateEntry in the list. Each following certificate SHOULD directly certify the one immediately preceding it.” (primero va el certificado de quien envía, y cada uno de los siguientes debería certificar directamente al inmediatamente anterior). La raíz puede incluirse u omitirse; los servidores normalmente la omiten. Dónde va el archivo depende del servidor:

- **nginx**: un solo archivo, “the server certificate must appear before the chained certificates in the combined file” (en el archivo combinado, el certificado del servidor debe ir antes que los encadenados); el orden incorrecto falla al arrancar con un error key values mismatch, porque nginx prueba la clave privada contra el primer certificado que encuentra.
- **Apache httpd 2.4.8 y posteriores**: `SSLCertificateFile` “may also include intermediate CA certificates, sorted from leaf to root” (puede incluir también los certificados de CA intermedias, ordenados de la hoja a la raíz), lo que “obsoletes SSLCertificateChainFile” (deja obsoleto SSLCertificateChainFile).
- **F5 BIG-IP**: los intermedios se importan como un objeto de certificado propio (pegados “in sequence with no space between”, seguidos y sin espacio entre ellos) y se seleccionan como Chain del certificado y la clave en el perfil Client SSL o Server SSL; la hoja se queda en su propio objeto. El artículo de F5 añade que “putting the root CA certificate in the certificate bundle is optional, and will never cause the client to trust the root CA” (incluir la CA raíz en el paquete es opcional y nunca hará que el cliente confíe en ella).

## Qué verifica criptográficamente la página y qué no

La firma de cada eslabón se comprueba en el navegador con la clave pública del emisor que se muestra en la tabla: RSASSA-PKCS1-v1_5 y RSASSA-PSS con SHA-1, SHA-256, SHA-384 o SHA-512, ECDSA en P-256, P-384 y P-521, y Ed25519 si el navegador lo admite. Una raíz autofirmada se comprueba con su propia clave, lo que demuestra que el certificado es coherente, no que alguien confíe en él. Todo lo que el navegador no puede hacer aparece como no comprobado, nunca como fallido.

No lo hace, y lo hace un validador: consultar un almacén de confianza, comparar el nombre de host con subjectAltName, evaluar las restricciones de nombres, las restricciones de políticas y el uso extendido de la clave a lo largo de la ruta, y comprobar la revocación. Se listan los punteros de CRL (lista de revocación de certificados, certificate revocation list) y de OCSP (protocolo de estado de certificados en línea, Online Certificate Status Protocol) de la ruta; no se contacta con ninguno.

Para ver qué hizo un validador con la cadena que envía realmente un servidor, ejecuta `openssl s_client -showcerts` contra el servidor y pega la salida en el [Explicador de openssl s_client](/tools/openssl-s-client-explainer): los bloques PEM son la cadena tal como se envió, que esta página puede ordenar después, y el Verify return code es el veredicto de OpenSSL sobre ella.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los certificados tal como los pegaste y, si indicaste una, la fecha del campo Validez a fecha de: `/tools/cert-chain-builder#certs=...&asof=2026-10-04`. Sin fecha, la página juzga con su propio reloj, así que un enlace abierto más tarde juzga con el de quien lo abre. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los certificados no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Nunca se lleva una clave privada.** Un archivo PEM combinado (la cadena completa y su clave, como lo cargan algunos servidores) contiene una clave que el constructor ignora. Cuando el cuadro contiene un bloque `-----BEGIN ... PRIVATE KEY-----`, no se ofrece enlace, y la ventana emergente pide que primero quites la clave.
- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los certificados rellenan el cuadro como lo haría un pegado y se establece la fecha; la página construye la ruta y comprueba las firmas en el navegador, igual que con un pegado. Una fecha que no es un día real con la forma AAAA-MM-DD hace que se ignore el enlace entero. En ambos casos, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
- **Enlaces desde otras páginas.** Un valor entregado como `#input=` sigue rellenando el cuadro exactamente igual que antes; Compartir resultados usa nombres propios (`certs`, `asof`), así que los dos nunca se mezclan.

## Límites

- Hasta 32 bloques de certificado y 262.144 caracteres de entrada; solo PEM (un archivo DER se convierte con `openssl x509 -inform der -outform pem`).
- Los nombres se comparan como los nombres distintivos de una sola línea que imprime el decodificador, lo que es más estricto que la comparación de la sección 7.1 del RFC 5280 en casos límite de tipo de cadena y de mayúsculas y minúsculas; una cadena que solo se enlaza con esas reglas se presenta como no enlazada.
- El instante es una fecha a las 00:00 UTC si indicas una, y tu reloj al segundo si no.
- Los navegadores no hacen lo mismo cuando falta un intermedio: algunos lo descargan de la URL caIssuers en el momento, y Firefox, en cambio, precarga los intermedios de la base de datos de CA de Mozilla (desde Firefox 75) y no descarga nada. Una cadena que funciona en un navegador y no en otro suele deberse a esto.

## Fuentes

- [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile](https://www.rfc-editor.org/rfc/rfc5280) (consultado el 2026-10-04): secciones 4.2.1.1, 4.2.1.2, 4.2.1.3, 4.2.1.9, 6.1 y 6.1.4
- [RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3, July 2026, section 4.5.1, the same text as section 4.4.2 of RFC 8446, which it obsoletes](https://www.rfc-editor.org/rfc/rfc9846.html#section-4.5.1) (consultado el 2026-10-26)
- [CA/Browser Forum: Baseline Requirements for TLS Server Certificates, version 2.3.1](https://github.com/cabforum/servercert/blob/main/docs/BR.md) (consultado el 2026-10-04): sección 6.1.5 y el registro de cambios
- [RFC 9155: Deprecating MD5 and SHA-1 Signature Hashes in TLS 1.2 and DTLS 1.2](https://www.rfc-editor.org/rfc/rfc9155) (consultado el 2026-10-04)
- [nginx: Configuring HTTPS servers, SSL certificate chains](https://nginx.org/en/docs/http/configuring_https_servers.html) (consultado el 2026-10-04)
- [Apache HTTP Server 2.4: mod_ssl, SSLCertificateFile and SSLCertificateChainFile](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html) (consultado el 2026-10-04)
- [F5 K13302: Configure the BIG-IP system to use an SSL chain certificate](https://my.f5.com/manage/s/article/K13302) (actualizado el 2025-11-26, consultado el 2026-10-04)
- [Mozilla: Intermediate CA Preloading](https://wiki.mozilla.org/Security/CryptoEngineering/Intermediate_Preloading) (consultado el 2026-10-04)
- [Let's Encrypt: Chains of Trust](https://letsencrypt.org/certificates/) (consultado el 2026-10-04): la jerarquía a la que pertenece la cadena de ejemplo
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
