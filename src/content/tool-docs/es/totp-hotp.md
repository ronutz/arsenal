## Qué hace

Genera y verifica los códigos de un solo uso que se usan en la autenticación de dos factores: contraseñas basadas en tiempo (TOTP, RFC 6238), los códigos de seis dígitos que muestra una aplicación de autenticación, y contraseñas basadas en contador (HOTP, RFC 4226), los códigos que produce un token de hardware. Puedes elegir el hash (SHA-1, SHA-256 o SHA-512), el número de dígitos y el paso de tiempo. El cálculo usa la API Web Crypto nativa del navegador, y tu secreto compartido nunca sale de tu navegador.

## Una construcción, dos factores móviles

HOTP y TOTP son el mismo algoritmo por debajo. Los dos toman un secreto compartido y un factor móvil, calculan un HMAC del factor móvil con el secreto y después aplican el truncamiento dinámico (“dynamic truncation”) que define el RFC 4226 para reducir ese MAC a un código decimal corto. La única diferencia es de dónde sale el factor móvil:

- **HOTP** usa un contador de eventos explícito que aumenta en uno cada vez que se usa un código. El token y el servidor tienen que mantenerse sincronizados en ese contador.
- **TOTP** usa el reloj: el factor móvil es el número de pasos de tiempo transcurridos desde una época (epoch), `floor((current time - T0) / step)`, con `T0` en 0 y un paso de 30 segundos de forma predeterminada. Dicho de otro modo, TOTP es simplemente HOTP con el intervalo de tiempo actual como contador, y por eso un código TOTP cambia cada 30 segundos.

## El secreto compartido

El secreto es la semilla que tienen los dos lados. Normalmente se intercambia como una cadena Base32, que es lo que codifica un URI `otpauth://` o un código QR de configuración, así que la herramienta decodifica el Base32 para recuperar los bytes de la clave. El hash predeterminado es SHA-1, que es el que siguen usando la mayoría de las aplicaciones de autenticación y de los tokens para las contraseñas de un solo uso; SHA-256 y SHA-512 están disponibles donde los dos lados los admiten.

## Verificación y desfase del reloj

Como el reloj de un dispositivo y el de un servidor nunca están perfectamente alineados, una comprobación TOTP suele aceptar códigos de una pequeña ventana de pasos de tiempo adyacentes, y no solo del actual: cambia un poco de rigor por fiabilidad. HOTP tiene el problema equivalente en el contador, que un token puede adelantar si un código generado no llega a usarse, así que los servidores aceptan una ventana de anticipación (look-ahead) y se resincronizan.

## Uso

Introduce el secreto compartido y genera el código TOTP actual, o fija un contador para generar un código HOTP, y ajusta el hash, el número de dígitos y el paso para que coincidan con tu sistema. También puedes validar un código que te hayan dado. El algoritmo es determinista dados el secreto y el factor móvil, así que las mismas entradas siempre producen el mismo código.

## Compartir resultados

Debajo del código generado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la configuración: el modo, el algoritmo, el número de dígitos, cómo está escrito el secreto y el paso de tiempo o el contador; y el tiempo Unix solo si escribiste uno en lugar de usar el reloj. Nunca lleva el secreto compartido. Quien recibe el enlace escribe el secreto que tú le pases por otra vía, y obtiene los mismos códigos. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

El secreto es el propio segundo factor: quien lo tiene puede generar todos los códigos. El [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226) (sección 7.5, consultado el 2026-11-01) pide que las operaciones con secretos compartidos “be performed securely, in order to mitigate risks of any leakage of sensitive information” (se hagan de forma segura, para mitigar el riesgo de cualquier fuga de información sensible), y el [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) (sección 3, requisito R7, consultado el 2026-11-01), que las claves “SHOULD be protected against unauthorized access and usage” (deberían protegerse contra el acceso y el uso no autorizados). Una excepción: las claves de prueba publicadas sí van, porque cualquiera puede leerlas ya. Son el secreto del apéndice D del RFC 4226 (la cadena ASCII `12345678901234567890`) y las semillas de 32 y 64 bytes del RFC 6238 para HMAC-SHA-256 y HMAC-SHA-512 (su apéndice A), impresas en los estándares, y el tiempo manual existe precisamente para reproducir sus tablas; y la clave con la que se abre esta página, `JBSWY3DPEHPK3PXP`, que el propio sitio imprime (en la página, en la descripción de su API y en el [artículo sobre los URI de aprovisionamiento](/learn/totp-provisioning-uris-and-qr)), para que la página compartida tal como se abre vuelva a abrirse como estaba. Se reconocen por sus bytes, en cualquiera de las tres codificaciones.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Al abrir un enlace.** La configuración sustituye a la del formulario; el reloj solo se desactiva cuando llega un tiempo. El cuadro del secreto toma una clave de prueba publicada cuando llega una (incluida la de la propia página) y, si no, se vacía, con una nota que pide el secreto, para que la página nunca muestre un código de una clave que no usó quien envió el enlace. Los códigos se calculan con Web Crypto en el navegador. Una opción que el formulario no ofrece, un número fuera de rango, un campo del otro modo o un secreto que no es una clave de prueba publicada hacen que se ignore el enlace entero. En cualquier caso, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
