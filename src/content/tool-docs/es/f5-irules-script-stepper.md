## Qué hace

Ejecuta un fragmento corto comando a comando y muestra cada comando de tres formas: tal como está escrito, como las palabras que recibió realmente después de que Tcl sustituyera variables, comandos y barras invertidas, y lo que devolvió. Debajo de cada comando ves las variables que cambió, la rama que tomó `if` o `switch` y cada expresión que evaluó, en forma de árbol. Las líneas de log se recogen, y acciones como `pool`, `HTTP::redirect`, `drop` o `reject` se registran en lugar de ejecutarse.

En el modo **iRules**, los comandos de solicitud (`HTTP::uri`, `HTTP::host`, `HTTP::method`, `HTTP::header`, `IP::client_addr` y otros) responden a partir de una solicitud de ejemplo editable, y un bloque `when` ejecuta su cuerpo una vez, como si se hubiera disparado el evento.

## Cómo se leen los pasos

Los comandos aparecen en el orden en que empezaron. Un comando con sangría se ejecutó dentro del de arriba: en su cuerpo, o entre corchetes mientras se construían las palabras del comando exterior, lo que significa que terminó antes de que se ejecutara el comando exterior. “recibió” muestra las palabras tal como le llegaron al comando; el contorno discontinuo marca dónde empieza y dónde termina cada palabra, que es lo que decide el entrecomillado.

## Conviene saber

- `"$a$b"` une dos valores sin nada entre ellos; `"$a $b"` conserva el espacio.
- `append` añade el texto exactamente como se le da; `concat` recorta los espacios en blanco de los dos extremos de cada argumento, descarta los vacíos y une el resto con espacios simples; `lappend` añade elementos de lista.
- Para `foreach`, una cadena con espacios es una lista: `foreach item "red green blue"` se ejecuta tres veces.
- `incr` lee `010` como el octal 8, así que el resultado es 9.
- `switch` lee como opción cualquier palabra que empiece por un guion. Pon `--` antes del valor (F5 K15650046), o un valor como `-foo` romperá el comando.
- Un `expr` sin llaves sustituye dos veces: si una variable contiene `[log local0. "x"]`, ese comando se ejecuta (F5 K57410758). El ejemplo “Doble sustitución” lo muestra.

## Compartir resultados

Debajo de cómo terminó la ejecución, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva lo que lee la ejecución, por nombre: el script como `#input=`, `&mode=irules` en el modo iRules y, en ese modo, cada campo de la solicitud de ejemplo que cambiaste (`&uri=`, `&host=`, `&method=`, `&agent=` para el User-Agent). Tcl a secas es el valor predeterminado y no se incluye, ni tampoco un ejemplo que Tcl a secas no lee. Un script suele ser un trozo de una iRule real, así que, antes de que copies nada, la ventana emergente añade una precaución (un script puede nombrar hosts, pools y data groups internos), y la página revisa cada campo que llevaría el enlace con la misma comprobación de secretos que las herramientas de este sitio que leen iRules.

Antes incluso de ofrecer un enlace, busca claves y credenciales escritas tal cual donde las ponen las propias referencias de F5 (todas consultadas el 2026-10-27):

- la frase de contraseña (pass phrase) de `HTTP::cookie encrypt` y `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- una clave en la forma de cadena `AES 128 <hex>`, o la clave de `AES::encrypt` y `AES::decrypt` escrita tal cual ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- el valor de `-key` o `-keyhex` en `CRYPTO::encrypt`, `decrypt`, `sign` y `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- un encabezado `Authorization` o `Proxy-Authorization` escrito con `HTTP::header insert` o `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), cuyo valor el [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (secciones 11.6.2 y 11.7.2) define como las credenciales;
- un literal asignado con `set` a una variable que se usa en uno de esos lugares, como en el propio ejemplo de `CRYPTO::encrypt`;
- y, por la comprobación de secretos del sitio, una clave privada PEM, un JWT, un ID de clave de acceso de AWS o una contraseña en una URL.

Si la página encuentra alguno, no hay enlace: la ventana emergente nombra el campo y la línea, y tú sustituyes el valor por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (`set static::api_token "..."`) no impide el enlace; en su lugar, la línea de precaución lo nombra. Ninguna comprobación encuentra todos los secretos, así que lee lo que envías.

Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si el script es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los campos se rellenan como si los escribieras (si el enlace cambió la solicitud de ejemplo, se muestra abierta) y la página retiene el script: una nota indica que viene de un enlace compartido, y no se ejecuta nada hasta que presionas **Ejecutar** o cambias un campo. El intérprete didáctico nunca ejecuta por sí solo el texto de un enlace. Un modo distinto de `tcl` o `irules`, o un valor de ejemplo en el modo Tcl a secas, hace que se ignore todo el enlace. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## Límites

Es un intérprete didáctico, no TMM. Modela los comandos que enumera el código de esta página y se detiene después de 2000 comandos, con valores de más de 1.000.000 de caracteres y a los 200 niveles de anidamiento. No se modelan los arrays, `proc`, `regexp`, `table`, `after` ni el sistema de archivos; los comandos que F5 desactiva en las iRules (K36322151) tampoco están disponibles. La temporización de los eventos, el estado de la conexión y los demás eventos quedan fuera del alcance. La herramienta no se ofrece a través de la API, porque ejecuta el Tcl que le das.

## Fuentes

- [Tcl 8.4 manual: Tcl (the substitution rules)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consultado el 2026-10-03)
- [Tcl 8.4 manual: append](https://www.tcl-lang.org/man/tcl8.4/TclCmd/append.htm), [concat](https://www.tcl-lang.org/man/tcl8.4/TclCmd/concat.htm), [lappend](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lappend.htm), [incr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/incr.htm) y [switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (consultado el 2026-10-03)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultado el 2026-10-03)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (consultado el 2026-10-03)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (consultado el 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consultado el 2026-10-03)
- [F5 iRules reference: log](https://clouddocs.f5.com/api/irules/log.html) (consultado el 2026-10-02)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) y [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (consultado el 2026-10-27): dónde guarda una iRule una frase de contraseña, una clave o credenciales, que impiden un enlace de Compartir resultados
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultado el 2026-10-27): secciones 11.6.2 y 11.7.2, los valores de Authorization y de Proxy-Authorization son credenciales
