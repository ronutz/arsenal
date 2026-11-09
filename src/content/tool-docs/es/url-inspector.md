## Qué hace

Descompone cualquier URL en sus partes con nombre: el esquema, el host, el puerto, la ruta, cada uno de los parámetros de consulta y el fragmento. Decodifica las secuencias de escape con porcentaje y los nombres de host internacionalizados (punycode), marca las credenciales incrustadas y otros problemas, y muestra el puerto predeterminado del esquema. Todo se ejecuta en tu navegador.

## Las partes de una URL

Una URL tiene una gramática definida, la que establece el RFC 3986, y la herramienta divide la URL en sus componentes de primer nivel: el **esquema** (como `https`), la **autoridad** (que contiene la información de usuario, si la hay, el **host** y el **puerto**), la **ruta**, la **consulta** y el **fragmento**. Después divide la cadena de consulta en parámetros individuales y decodifica por porcentaje cada uno, así que una consulta larga se convierte en una lista legible de pares de nombre y valor en lugar de una cadena opaca. Siguiendo el URL Standard del WHATWG, trata un `+` en una consulta codificada como formulario como un espacio.

## Se analiza tal como se escribió, sin normalizar

Una decisión de diseño importante: la herramienta analiza la URL exactamente como la diste y no la normaliza por su cuenta. Eso importa porque las diferencias que un navegador suavizaría sin decir nada suelen ser justo lo que intentas ver: un puerto inesperado, una barra duplicada, un carácter codificado suelto. Mostrar la URL tal como se escribió es lo que la hace útil para depurar y para detectar algo sospechoso.

## Decodificación y avisos

La herramienta destaca dos cosas en particular:

- **Nombres de host internacionalizados.** Una etiqueta de host en forma punycode (que empieza por `xn--`) se decodifica de vuelta a su texto Unicode (RFC 3492 y el marco IDNA del RFC 5890), para que veas el nombre real, lo que también ayuda a destapar los trucos con dominios de aspecto parecido.
- **Credenciales incrustadas.** Una URL puede llevar un nombre de usuario y una contraseña con la forma `user:pass@host`, y la herramienta lo marca, porque las credenciales en una URL son un error frecuente y un problema de seguridad.

## Uso

Pega una URL y lee su esquema, su host, su puerto, su ruta, sus parámetros de consulta decodificados y su fragmento, con las credenciales u otros problemas marcados. El análisis es determinista y local, así que es seguro inspeccionar cualquier URL, incluso una que no quieres visitar.

## Compartir resultados

Debajo de la tira de anatomía, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la URL con su contraseña y cualquier parámetro de token sustituidos por `REDACTED`, nunca tal como se escribió: la tira de anatomía muestra la URL entera, contraseña incluida. Su ventana emergente dice primero qué lleva el enlace y cuántos valores se sustituyeron, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Qué se sustituye:

- **La contraseña de la información de usuario**, el texto que va después de sus primeros dos puntos: el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1, dice que las aplicaciones “should not render as clear text any data after the first colon” (no deberían mostrar en claro nada de lo que sigue a los primeros dos puntos). El nombre de usuario se mantiene.
- **Los parámetros de consulta y de fragmento** con nombre de secreto: `access_token` en una consulta ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sección 2.3) o en un fragmento, donde lo devuelve una concesión implícita (implicit grant) ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sección 4.2.2); `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sección 4.1.2); `X-Amz-Signature` y `X-Amz-Security-Token` enteros, y de `X-Amz-Credential` solo el ID de clave de acceso, de modo que el ámbito de la credencial que le sigue (la fecha, la región y el servicio) se sigue leyendo, y ahí es donde suele estar la causa cuando falla una URL prefirmada ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), consultado el 2026-11-01); `sig` ([Create a service SAS](https://learn.microsoft.com/en-us/rest/api/storageservices/create-service-sas), consultado el 2026-11-01); `key` ([Use API keys to access APIs](https://cloud.google.com/docs/authentication/api-keys-use), consultado el 2026-11-01); y cualquier nombre que termine en token, secret, password o api key.

El host, el puerto, la ruta y todos los demás parámetros van tal como se escribieron, y los vectores de compartición de la herramienta comprueban que la página que abre el enlace lee las mismas partes. Una nota que solo se refería a un valor sustituido (una secuencia de escape con porcentaje o un `+` dentro de él) desaparece con él. Si queda una clave o un token donde ningún nombre lo delata (un JWT en la ruta), no hay enlace, y la ventana emergente lo indica.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el campo como lo haría un pegado y la página la descompone. Como en todo enlace `#input=` a esta página, el valor se queda en la dirección hasta que editas el campo.
