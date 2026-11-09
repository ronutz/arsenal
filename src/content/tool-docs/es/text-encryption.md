## Qué hace

Escribe un texto y una frase de contraseña, presiona Cifrar y obtienes una sola cadena que empieza por `aesgcm1.`. Pega esa cadena de nuevo en el modo Descifrar, escribe la misma frase de contraseña y recuperas el texto, exactamente como era. Todo ocurre en tu navegador mediante su Web Cryptography API: el texto y la frase de contraseña nunca se envían, nunca se guardan y nunca van en la dirección.

Es para tu propio texto y tu propia frase de contraseña: una nota que quieres guardar en un archivo o en un hilo de mensajes sin que quede legible, o un secreto que quieres entregar en dos partes (la cadena por un lado y la frase de contraseña por otro). Solo abre lo que se selló con una frase de contraseña que tú tienes. No adivina, no rompe ni recupera nada más, y una frase de contraseña incorrecta no devuelve nada.

## Cómo funciona

Cada paso es una primitiva de la [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/), la implementación del propio navegador; en la página no hay código criptográfico escrito a mano.

1. **Se prepara la frase de contraseña.** Cada espacio no ASCII (categoría Unicode Zs, como el espacio de no separación) se convierte en un espacio normal y después se aplica la forma de normalización C de Unicode (Unicode Normalization Form C): las dos reglas de asignación del perfil OpaqueString del [RFC 8265](https://www.rfc-editor.org/rfc/rfc8265) (sección 4.2.2, reglas 2 y 4). Así, una “ç” escrita como un solo carácter y una “ç” pegada como una “c” más una cedilla combinante dan la misma clave. No se cambia nada más: se conservan las mayúsculas y las minúsculas, y no se rechaza ningún carácter salvo un sustituto sin pareja, que UTF-8 no puede representar. El resultado se codifica en UTF-8 ([RFC 3629](https://www.rfc-editor.org/rfc/rfc3629)).
2. **Se deriva una clave.** PBKDF2 (función de derivación de claves basada en contraseña 2, Password-Based Key Derivation Function 2, [RFC 8018](https://www.rfc-editor.org/rfc/rfc8018), sección 5.2), con HMAC-SHA-256 como función pseudoaleatoria, convierte la frase de contraseña, una sal (salt) aleatoria de 16 bytes y 600.000 iteraciones en una clave de 256 bits para AES (estándar de cifrado avanzado, Advanced Encryption Standard).
3. **Se sella el texto.** AES en modo contador de Galois (GCM, Galois/Counter Mode, [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)) cifra el texto, en UTF-8, con esa clave y un vector de inicialización (IV) aleatorio de 12 bytes, y produce una etiqueta de autenticación de 128 bits. Los cuatro primeros campos de la cadena se pasan a GCM como datos autenticados adicionales, así que la etiqueta también los cubre.
4. **Se escribe una sola cadena.** La etiqueta de versión, el número de iteraciones, la sal, el IV y el texto cifrado con su etiqueta, unidos por puntos.

Descifrar es el camino inverso: se leen los campos, se prepara la frase de contraseña de la misma forma, se deriva la misma clave a partir de la sal y del número de iteraciones de la cadena, y se deja que AES-GCM compruebe la etiqueta antes de devolver nada. Es la forma que el RFC 8018 llama PBES2 (sección 6.2): una clave obtenida con PBKDF2 y después un esquema de cifrado. El formato de la cadena que lo envuelve es propio de esta herramienta, y se describe abajo para que cualquiera pueda reimplementarlo.

La sal y el IV los genera la página con `crypto.getRandomValues`, que la Web Cryptography API define como el relleno de un array con “cryptographically secure random bytes” (bytes aleatorios criptográficamente seguros) (sección 10.1.1). El propio motor los recibe como entradas y no genera nada, y por eso se puede probar byte a byte con una sal y un IV fijos. Por eso también cifrar dos veces el mismo texto con la misma frase de contraseña da dos cadenas distintas, y las dos se descifran.

## La cadena

```
aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZqiea5CBm...
```

| Campo | Contenido | Codificación |
|---|---|---|
| 1 | `aesgcm1`: esta construcción, versión 1 del formato | ASCII |
| 2 | El número de iteraciones de PBKDF2 | Decimal, sin signo ni cero a la izquierda, de 1000 a 10.000.000 |
| 3 | La sal, 16 bytes | base64url sin relleno, 22 caracteres |
| 4 | El IV, 12 bytes | base64url sin relleno, 16 caracteres |
| 5 | El texto cifrado seguido de la etiqueta de 16 bytes | base64url sin relleno |

- **base64url** es el alfabeto seguro para URL y nombres de archivo del [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) (sección 5): de la A a la Z, de la a a la z, del 0 al 9, `-` y `_`. Se omite el relleno `=`, lo que la sección 3.2 permite cuando la especificación lo indica: aquí el campo termina en el siguiente punto. La decodificación es estricta: se rechaza cualquier otro carácter, una longitud que no puede codificar bytes enteros o un último carácter cuyos bits sin usar no son cero (la sección 3.5 permite que un decodificador rechace una codificación no canónica). El punto no está en ese alfabeto, así que un campo nunca puede contener uno.
- **Los datos autenticados adicionales** son el texto de los campos 1 a 4 con sus tres puntos, exactamente como está escrito. Si cambias la versión, el número de iteraciones, la sal o el IV, la etiqueta deja de verificarse, aunque el resto de la cadena esté intacto.
- **El espacio en blanco** (espacios, tabulaciones, saltos de línea) en cualquier parte de una cadena pegada se quita antes de leerla, porque los clientes de correo cortan las líneas largas; el resultado indica cuándo lo hizo.
- **Longitud.** El texto cifrado ocupa lo mismo que el texto en UTF-8, más la etiqueta de 16 bytes. Por eso la longitud de la cadena muestra más o menos cuánto ocupa el texto.

## Por qué estos números

- **600.000 iteraciones.** La [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) de OWASP indica “PBKDF2-HMAC-SHA256: 600,000 iterations (recommended)” (consultada el 2026-10-27). Cada iteración es un cálculo de HMAC más para cualquiera que pruebe frases de contraseña contra tu cadena, y para ti, una vez por cada cifrado o descifrado: cuenta con que el botón tarde un momento.
- **De 1000 a 10.000.000 al descifrar.** El número de iteraciones va en la cadena, así que el descifrado lo sigue, dentro del intervalo que establece el [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) (sección 5.2), que recomienda un mínimo, “A minimum iteration count of 1,000 is recommended”, y considera que “an iteration count of 10,000,000 may be appropriate” para las claves especialmente críticas. El RFC 8018 cita el mismo texto (sección 4.2). El techo también impide que una cadena manipulada haga que la página pase minutos derivando una clave.
- **Una sal de 16 bytes.** NIST SP 800-132, sección 5.1: “The length of the randomly-generated portion of the salt shall be at least 128 bits” (la parte de la sal generada aleatoriamente debe tener al menos 128 bits). El RFC 8018 (sección 3) señala que la sal y el número de iteraciones “need not be kept secret” (no hace falta mantenerlos en secreto); viajan en la cadena.
- **Un IV de 12 bytes, generado al azar.** El SP 800-38D recomienda limitar los IV a 96 bits “to promote interoperability, efficiency, and simplicity of design” (para favorecer la interoperabilidad, la eficiencia y la sencillez del diseño) (sección 5.2.1.1). Su regla central es que no se use dos veces el mismo IV con la misma clave (sección 8, con una probabilidad “no greater than 2^-32”), y cuando los IV son aleatorios limita a 2^32 el número de cifrados con una misma clave (sección 8.3). Aquí cada cifrado tiene una sal aleatoria nueva, y por tanto una clave nueva, además de un IV aleatorio nuevo.
- **Una etiqueta de 128 bits**, la más larga que permite GCM (sección 5.2.1.2) y la predeterminada de la Web Cryptography API.
- **AES-256.** PBKDF2 deriva 32 bytes, que se importan como una clave AES-GCM que no se puede exportar desde el objeto de clave del navegador.

## Qué protege y qué no

**Protege** el contenido del texto mientras está en la cadena, frente a cualquiera que tenga la cadena pero no la frase de contraseña, y detecta cualquier cambio en la cadena: AES-GCM devuelve o bien el texto entero o bien la única respuesta FAIL (SP 800-38D, sección 7.2), y la página muestra FAIL como “Frase de contraseña incorrecta o texto alterado”, sin nada más. No hay ningún resultado parcial que leer.

**No protege:**

- **Una frase de contraseña débil.** Quien tenga la cadena puede probar frases de contraseña en su propio hardware, tantas veces y tan rápido como quiera; la página no interviene y no puede frenarlo. El RFC 8018 lo dice claramente: la criptografía basada en contraseñas “is generally limited in the security that it can provide” (en general tiene una seguridad limitada), sobre todo “where offline password search is possible” (donde es posible buscar la contraseña sin conexión) (sección 8). El número de iteraciones multiplica el costo de cada intento; no impide que quien adivina llegue a una frase de contraseña que esté al principio de su lista. El SP 800-132 (apéndice A.1) añade que esas búsquedas se pueden paralelizar y pueden ejecutarse en un sistema “much more powerful” (mucho más potente) que el tuyo.
- **Frente a quien conoce la frase de contraseña.** Quien tiene a la vez la cadena y la frase de contraseña lee el texto. Envíalas por separado, y nunca en el mismo mensaje.
- **Un dispositivo del que no puedes fiarte.** El malware o un registrador de pulsaciones de teclas (keylogger) ve lo que escribes antes de que se cifre nada; el NIST señala que registrar las pulsaciones es “equally effective on lengthy and complex passwords as they are on simple ones” (igual de eficaz con contraseñas largas y complejas que con las sencillas) ([SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), apéndice A). Las consideraciones de seguridad de la propia Web Cryptography API dicen que un script inyectado en una página “may allow for the exfiltration of keys or data” (puede permitir la exfiltración de claves o de datos), y que los navegadores no están obligados a borrar el material de claves de la memoria ni del almacenamiento (sección 6.2).
- **La longitud.** La cadena muestra más o menos cuánto ocupa el texto.
- **Lo que pasa después de descifrar.** El texto se muestra en la página. Al copiarlo, va al portapapeles del sistema, donde otros programas pueden leerlo.

## La nota sobre la frase de contraseña

Mientras escribes una frase de contraseña en el modo Cifrar, la página muestra su longitud en caracteres y en bytes UTF-8 y qué tipos de caracteres contiene (letras minúsculas y mayúsculas, letras sin mayúsculas ni minúsculas, dígitos, espacios, signos de puntuación o símbolos). También indica cuándo la frase de contraseña empieza o termina con un espacio en blanco, y cuándo la preparación la cambia. **No calcula ninguna puntuación de robustez**, a propósito:

- Quien intenta adivinar no prueba frases de contraseña al azar; prueba primero las probables (palabras, nombres, fechas, citas, contraseñas de filtraciones anteriores). La página no puede saber en qué lugar de una lista así está la tuya, así que cualquier número sería inventado.
- El NIST considera la longitud “a primary factor in characterizing password strength” (un factor principal para caracterizar la robustez de una contraseña) y concluye que las reglas de composición (exigir dígitos, mayúsculas y símbolos) aportan menos de lo esperado, porque la gente las cumple de forma predecible: “password” se convierte en “Password1!” (SP 800-63B-4, apéndice A). También dice que resistir los ataques sin conexión exige contraseñas “orders of magnitude more complex” (órdenes de magnitud más complejas) que resistir los intentos en línea.
- El SP 800-132 (apéndice A.1) dice que las contraseñas de menos de 10 caracteres suelen considerarse débiles, y las frases de contraseña de menos de 20 caracteres también. El mismo apéndice desaconseja las secuencias de números o de letras y los datos personales, como un nombre, un número de teléfono o una fecha de nacimiento.

El modo Cifrar pide la frase de contraseña dos veces, y sigue desactivado hasta que las dos coinciden: nadie puede recuperar un texto cifrado con una frase de contraseña mal escrita.

## Nada sale de la página

- **Ninguna solicitud.** El cifrado y el descifrado son llamadas a la Web Cryptography API del navegador. No se envía nada a este sitio ni a ningún otro lugar.
- **Ningún almacenamiento.** El texto, la frase de contraseña y los resultados solo existen en la memoria de la página mientras está abierta; Borrar vacía todos los campos. No se escribe nada en el almacenamiento local, en cookies ni en ningún otro almacén.
- **Nada en la dirección.** La página no escribe nada en su propia dirección. Solo se genera un enlace cuando presionas Compartir resultados, y lleva únicamente la cadena cifrada (sección siguiente).
- **El corrector ortográfico está desactivado** en los campos (el atributo HTML `spellcheck="false"`). El [corrector ortográfico mejorado](https://support.google.com/chrome/answer/12027911?hl=en) de Chrome “sends the text you enter in your browser to Google” (envía a Google el texto que escribes en el navegador); el [HTML Standard](https://html.spec.whatwg.org/multipage/interaction.html) (sección 6.8.5) permite que una configuración del propio usuario se imponga al atributo, así que, si has forzado la revisión ortográfica en todas partes, desactívala antes de escribir secretos. Los campos de la frase de contraseña son campos de contraseña, que no están entre los campos que el estándar dice que los navegadores deben revisar (las entradas de texto, de búsqueda, de URL y de correo electrónico y las áreas de texto), hasta que eliges Mostrar.
- **Ningún formulario.** Los campos no están dentro de un formulario y no tienen nombre, así que nada puede enviarlos.
- **La Web Cryptography API necesita un contexto seguro.** Su interfaz `subtle` solo existe en las páginas servidas de forma segura (la especificación la marca como `[SecureContext]`); sin ella, la página lo indica y no hace nada.

## Compartir resultados

Debajo de la cadena cifrada (y, en el modo Descifrar, debajo del botón Descifrar), un botón **Compartir resultados** genera un enlace a esta página que lleva la cadena cifrada y nada más: nunca la frase de contraseña, nunca el texto. Solo genera el enlace cuando lo presionas, dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema. La dirección de la página no cambia.

- **Dónde va la cadena.** Después del `#`: `/tools/text-encryption#input=aesgcm1...`. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el navegador no lo envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace tiene la cadena. Por eso la frase de contraseña tiene que viajar por otra vía.
- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`. Con 600.000 iteraciones, eso equivale a un texto de hasta 12.230 bytes en UTF-8; una cadena más larga no recibe enlace, y la ventana emergente lo indica: copia la cadena en su lugar.
- **Al abrir un enlace.** La página se abre en el modo Descifrar con la cadena rellenada, indica que vino de un enlace y borra cualquier frase de contraseña que hubieras escrito. Solo descifra cuando escribes la frase de contraseña y presionas Descifrar. Un valor que no es una cadena bien formada de este formato se ignora. En cualquier caso, la página quita el valor de su dirección al instante (sin ninguna solicitud), así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada.
- **Prueba.** Para cada vector de referencia de ida y vuelta y para el Ejemplo, las comprobaciones de compartición del sitio generan el enlace y confirman que en él no aparecen ni la frase de contraseña ni el texto, ni tal como se escribieron, ni codificados por porcentaje, ni codificados como formulario, ni decodificados.

## Códigos de error

| Código | Significado |
|---|---|
| `empty-text` | Cifrar: no hay texto |
| `text-too-large` | El texto ocupa más de 1.048.576 bytes (1 MiB) en UTF-8, el límite de la página (GCM permite hasta 2^39 - 256 bits) |
| `lone-surrogate` | El texto o la frase de contraseña contiene un sustituto sin pareja, que UTF-8 no puede representar |
| `empty-passphrase` | No hay frase de contraseña |
| `passphrase-too-long` | Más de 1024 caracteres después de la preparación |
| `bad-salt-length` | Una sal que no tiene 16 bytes |
| `bad-iv-length` | Un IV que no tiene 12 bytes |
| `iterations-out-of-range` | Un número de iteraciones fuera del rango de 1000 a 10.000.000 |
| `empty-input` | Descifrar: solo hay espacio en blanco |
| `input-too-large` | Descifrar: más de 2.000.000 caracteres |
| `bad-format` | No son cinco campos separados por puntos |
| `unknown-version` | Un primer campo distinto de `aesgcm1` (la etiqueta distingue mayúsculas de minúsculas) |
| `bad-iterations` | Un segundo campo que no es un entero decimal sin cero a la izquierda |
| `bad-encoding` | Un campo de sal, de IV o de texto cifrado que no está en base64url canónico sin relleno |
| `too-short` | Un campo de texto cifrado más corto que la etiqueta de 16 bytes |
| `auth-failed` | La etiqueta no se verificó: la frase de contraseña es incorrecta, o la cadena se modificó después de generarse |
| `not-utf8` | La etiqueta se verificó, pero el contenido no es texto UTF-8 (esta herramienta nunca escribe una cadena así) |
| `no-crypto` | La página no tiene la Web Cryptography API |
| `crypto-error` | La Web Cryptography API se negó por otro motivo |

La página lee una cadena pegada en cuanto la pegas y muestra su formato, su número de iteraciones y sus tamaños, o el motivo por el que no se puede leer, antes de que escribas la frase de contraseña.

## Ejemplos resueltos

- **El botón Ejemplo, en el modo Cifrar**, rellena el texto “Lab notes: the core switch maintenance window moves to Saturday 02:00 (São Paulo).” y la frase de contraseña `Password` en los dos campos. `Password` es la contraseña de prueba del RFC 7914, sección 11, que cualquiera puede leer; la página la marca como la frase de contraseña del Ejemplo siempre que está en el campo. Nunca la uses para un texto real. Presiona Cifrar y obtienes una cadena de 187 caracteres (83 bytes de texto, 99 bytes una vez sellado), distinta cada vez.
- **El botón Ejemplo, en el modo Descifrar**, rellena la cadena que fija el vector de referencia “example”: `aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZ...` (la cadena completa está en la página). Se generó con una sal fija (bytes 00 a 0f) y un IV fijo (bytes 10 a 1b), que la propia página nunca usa. Con `Password` se descifra en el texto anterior; con `password` da `auth-failed`.
- **Cambiar un carácter.** Si cambias cualquier carácter del texto cifrado, de la sal, del IV o del número de iteraciones de una cadena válida, el descifrado da `auth-failed`, nunca un texto ilegible.
- **La misma frase de contraseña, escrita de otra forma.** “coração de exemplo” escrita con caracteres compuestos, con caracteres descompuestos o con un espacio de no separación entre las palabras deriva la misma clave, así que las tres descifran la misma cadena.

## Procedencia

El motor es un conjunto de funciones puras en torno a la Web Cryptography API: con el mismo texto, la misma frase de contraseña, la misma sal, el mismo IV y el mismo número de iteraciones, siempre escribe la misma cadena. Incluye vectores de referencia (conjunto `text-encryption-golden-2026-10-27`, 207 comprobaciones):

- **Respuestas conocidas para las primitivas**: los dos vectores PBKDF2-HMAC-SHA-256 del [RFC 7914](https://www.rfc-editor.org/rfc/rfc7914), sección 11; siete vectores de cifrado AES-GCM del archivo `gcmEncryptExtIV256.rsp` del Cryptographic Algorithm Validation Program del NIST (AES-256, IV de 96 bits, etiqueta de 128 bits; textos en claro de 0 a 408 bits, datos adicionales de 0 a 720 bits), cada uno también descifrado de vuelta; y dos vectores de descifrado de `gcmDecrypt256.rsp`, uno de los cuales el archivo marca como FAIL y el motor rechaza.
- **La codificación**: las cadenas de la sección 10 del RFC 4648 y siete cadenas que el decodificador estricto tiene que rechazar.
- **Ida y vuelta** con sales e IV fijos (el Ejemplo con 600.000 iteraciones; ASCII, portugués con saltos de línea y una tabulación, caracteres fuera del plano multilingüe básico, una marca de orden de bytes inicial; tres formas de escribir una misma frase de contraseña), cada uno comprobado en los dos sentidos. Cada cadena esperada la calculó primero un script de Python independiente (hashlib y el paquete cryptography) a partir del formato tal como se describe aquí, no el motor.
- **Rechazos**: 35 rechazos de descifrado (todos los errores de formato, los límites de iteraciones, frases de contraseña incorrectas, un texto cifrado, una etiqueta, un IV, una sal y un número de iteraciones modificados, el texto cifrado de otra cadena y bytes auténticos que no son UTF-8) y 11 rechazos de cifrado, cada uno con su código, y una comprobación de que ningún rechazo lleva texto alguno.
- **Compartir resultados**: 5 cadenas que un enlace puede llevar (compactas, sin espacios en blanco) y 9 textos que no puede llevar (un texto en claro, una frase de contraseña, una cadena truncada, otra versión, números de iteraciones fuera de rango, codificaciones incorrectas, una frase de contraseña añadida como sexto campo).

## API

Ninguna, a propósito. La API HTTP del sitio ejecuta las herramientas en un servidor; esta herramienta tendría que recibir allí una frase de contraseña o un texto en claro, que es justo lo que existe para no hacer. Figura entre las herramientas excluidas de la API, con ese motivo.

## Fuentes

- [NIST SP 800-38D, Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC, noviembre de 2007](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) (consultado el 2026-10-27): secciones 5.2.1, 7.1, 7.2, 8, 8.2.2 y 8.3. Su [página del CSRC](https://csrc.nist.gov/pubs/sp/800/38/d/final) (consultada el 2026-10-27) lleva una nota de planificación del 6 de marzo de 2024: el NIST ha decidido revisarla.
- [NIST CAVP, GCM test vectors (gcmtestvectors.zip)](https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip) (consultado el 2026-10-27): `gcmEncryptExtIV256.rsp` y `gcmDecrypt256.rsp`, CAVS 14.0
- [RFC 8018, PKCS #5: Password-Based Cryptography Specification Version 2.1](https://www.rfc-editor.org/rfc/rfc8018) (consultado el 2026-10-27): secciones 3, 4.1, 4.2, 5.2, 6.2 y 8; sus cuatro erratas verificadas solo afectan a los apéndices ASN.1, y el RFC 9579 y el RFC 9879 lo actualizan solo para PKCS #12
- [RFC 7914, The scrypt Password-Based Key Derivation Function](https://www.rfc-editor.org/rfc/rfc7914) (consultado el 2026-10-27): sección 11, los vectores de prueba de PBKDF2-HMAC-SHA-256
- [OWASP Cheat Sheet Series, Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) (consultado el 2026-10-27): PBKDF2, 600.000 iteraciones para PBKDF2-HMAC-SHA256
- [NIST SP 800-132, Recommendation for Password-Based Key Derivation, Part 1: Storage Applications, diciembre de 2010](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) (consultado el 2026-10-27): secciones 5.1 y 5.2, apéndice A. Su [página del CSRC](https://csrc.nist.gov/pubs/sp/800/132/final) lleva una nota de planificación del 11 de mayo de 2023: el NIST tiene previsto revisarla.
- [W3C, Web Cryptography API, recomendación del 26 de enero de 2017](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/), y [Web Cryptography Level 2, primer borrador de trabajo público del 22 de abril de 2025](https://www.w3.org/TR/WebCryptoAPI/), que ahora se sirve en la dirección de la API (ambos consultados el 2026-10-27): getRandomValues, AES-GCM, PBKDF2, la regla del contexto seguro y las consideraciones de seguridad
- [RFC 4648, The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648) (consultado el 2026-10-27): secciones 3.2, 3.5, 5 y 10
- [RFC 8265, Preparation, Enforcement, and Comparison of Internationalized Strings Representing Usernames and Passwords](https://www.rfc-editor.org/rfc/rfc8265) (consultado el 2026-10-27): sección 4.2.2
- [RFC 3629, UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629) (consultado el 2026-10-27)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento
- [NIST SP 800-63B-4, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html) (consultado el 2026-10-27): apéndice A, Strength of Passwords
- [Google Chrome Help, Turn Chrome spell check on and off](https://support.google.com/chrome/answer/12027911?hl=en) (consultado el 2026-10-27), y el [HTML Standard, sección 6.8.5, Spelling and grammar checking](https://html.spec.whatwg.org/multipage/interaction.html) (consultado el 2026-10-27)
