## Qué hace

Escribe un script de [Expect](/glossary/expect) completo a partir de unas pocas elecciones: cómo conectarse (ssh, telnet u otro programa, como un cliente de consola serie), el host y el usuario, cómo se autentica el inicio de sesión, un perfil de dispositivo, los comandos, los tiempos de espera y adónde va la salida. El script inicia sesión, eleva privilegios donde se lo pidas, gestiona la paginación, ejecuta los comandos de uno en uno y cierra la sesión. De forma predeterminada no cambia nada en el dispositivo: cuando desactivar la paginación sería un cambio de configuración global, responde al paginador en su lugar, y cambiar el ajuste es una elección explícita que viene con su restauración. No se ejecuta nada ni sale nada del navegador: copias o descargas el script y lo ejecutas tú.

Todo script que puede escribir pasa el [Explicador de scripts de Expect](/tools/expect-script-explainer) sin ningún error ni advertencia, y la página ejecuta el explicador sobre el script mientras lo construyes. Los vectores de referencia de la herramienta comprueban esa promesa para cada clase de combinación de elecciones, más de dos mil. Las notas que el explicador aún puede mostrar son deliberadas: E5, sobre el único Espacio que responde a un prompt `--More--`, y E12, sobre un script que solo escribe en un archivo de log.

## Secretos: nunca en el script

- **Una clave ssh.** ssh se ejecuta con `BatchMode=yes`, que, en palabras de ssh_config(5), desactiva la “user interaction such as password prompts and host key confirmation requests” (la interacción con el usuario, como las peticiones de contraseña y las solicitudes de confirmación de la clave de host), para scripts y otros trabajos por lotes. La clave tiene que funcionar por sí sola: cárgala en `ssh-agent` o indica un archivo de clave (`-i`, con `IdentitiesOnly=yes` para que solo se ofrezca esa clave).
- **Una contraseña tomada de una variable de entorno.** El script comprueba que la variable está definida y no está vacía (si no, código 2), la copia y la quita del entorno con `unset env(NAME)` antes de iniciar la conexión, para que el programa que lanza no la herede.
- **Una contraseña pedida al ejecutar.** La construcción habitual de expect(1): `stty -echo`, `send_user`, `expect_user -re "(.*)\n"`, `stty echo`, con sus propios dos minutos para escribirla (`-timeout 120` dentro del bloque) y el eco reactivado en todos los desenlaces. En ese caso, el script necesita un terminal.

Tampoco llega nada secreto a un log. El inicio de sesión se ejecuta con `log_user 0`, así que un dispositivo que devuelve el eco de la contraseña no puede ponerla en la pantalla, y el archivo de transcripción, cuando lo pides, se abre solo después del inicio de sesión y del paso de enable. El log de Expect registra lo que lee `expect_user` incluso con el eco desactivado, y `exp_internal` imprime entero cada `send`, así que el generador nunca abre un log antes de usar los secretos y nunca activa `exp_internal`. Los dos hechos se comprobaron con el `expect` 5.45.4 real y se explican en [Secretos en los scripts de Expect](/learn/expect-secrets-and-safe-scripts).

ssh recibe siempre `-o StrictHostKeyChecking=accept-new`: ssh_config(5) dice que, con esa opción, “ssh will automatically add new host keys to the user's known_hosts file, but will not permit connections to hosts with changed host keys” (ssh añadirá automáticamente las claves de host nuevas al archivo known_hosts del usuario, pero no permitirá conexiones a hosts cuya clave haya cambiado). El generador nunca escribe `no`, que acepta una clave cambiada.

## Perfiles de dispositivo

Los perfiles salen del módulo de datos de la suite; cada valor se leyó en los propios documentos del fabricante el 27 de octubre de 2026 y se explica en [Expect con dispositivos de red](/learn/expect-against-network-devices):

- **Cisco IOS XE:** `terminal length 0` para la sesión, `--More--` respondido con Espacio, `enable` con su pregunta `Password:`.
- **F5 BIG-IP (tmsh):** `modify /cli preference pager disabled display-threshold 0`, una preferencia del usuario cuya duración no indica la referencia, sin ningún valor documentado al que volver.
- **Fortinet FortiOS:** de forma predeterminada, el script responde a cada `--More--` con un Espacio y `exp_continue`, y la configuración del dispositivo queda como estaba. Desactivar la paginación es una elección explícita: `config system console`, `set output standard`, `end`, un cambio de configuración global que ve la sesión de cada administrador, así que entonces el generador avisa y añade la restauración documentada (`set output more`), que puedes rechazar.
- **Extreme Switch Engine:** `disable cli paging session`, para la sesión.
- **Extreme Fabric Engine:** `terminal more disable`, cuyo alcance no indica la referencia, con `terminal more enable` para volver atrás; `enable` puede hacer preguntas que los documentos no imprimen, así que el generador solo lo ofrece sin contraseña.
- **Genérico:** tu propia expresión regular de prompt y un comando de paginación, si lo tienes.

Cada expresión regular de prompt se escribe literal entre llaves, `-re {...}`, para que Tcl no sustituya nada en ella.

## Cómo se construye el script

- El tiempo de espera se define antes del primer `expect`, para que nada espere con el valor predeterminado de 10 segundos.
- Un solo `expect` gestiona todo el inicio de sesión: cada pregunta (nombre de usuario, contraseña) se responde una vez, una segunda significa que se rechazó y detiene el script con el código 1, el prompt termina el inicio de sesión, y las ramas `timeout` y `eof` detienen el script con un mensaje.
- Todo bloque entre llaves empieza con un salto de línea después de la llave. Expect 5.45.4 solo lee un argumento entre llaves como patrones y cuerpos en ese caso; escrito en una sola línea, el bloque sería un único patrón (la regla E19 del explicador).
- `run_command` envía una línea que termina en `\r` y espera al prompt. Un patrón que coincide con cualquier fin de línea, con `exp_continue`, reinicia el temporizador en cada línea, así que el tiempo de espera del comando cuenta el silencio y no el comando entero, y una salida larga no agota el tiempo de espera mientras sigue llegando.
- Cuando se responde a la paginación, el patrón se escribe `-ex "--More--"`, porque `expect` lee como opción cualquier palabra que empiece por `-` (la regla E20 del explicador).
- El final es el comando de cierre de sesión seguido de `expect eof`, o un `close` si no das comando de cierre de sesión, y después `wait`, para que se recoja el proceso.

Códigos de salida: 0, terminado; 1, falló el inicio de sesión; 2, falta un dato o es incorrecto; 3, un comando no terminó; 4, la sesión se cerró antes de tiempo.

## Qué comprueba en lo que escribes

- Solo nombres de host y direcciones (sin guion inicial, para que un valor nunca llegue a ssh como opción); si el host se toma de la línea de comandos, el script comprueba el argumento de la misma forma al ejecutarse.
- Un puerto solo para ssh (`-p`); para telnet en otro puerto, usa Otro programa.
- Archivos de clave y archivos de log como rutas simples, sin espacios, sin `~` y sin caracteres que Tcl sustituiría; la línea de comandos de un programa como palabras separadas por espacios, ninguna con `~` ni con uno de esos caracteres, y el nombre del programa sin empezar por un guion.
- Comandos como texto simple, hasta 40, de 300 caracteres como máximo cada uno; cada `\`, `"`, `$`, `[`, `]`, `{` y `}` se protege con una barra invertida para que el dispositivo reciba el comando tal como se escribió.
- Tiempos de espera de 1 a 3600 segundos, nunca `-1`.
- Una expresión regular de prompt genérica con las llaves equilibradas, y nunca una que coincida de inmediato (`.*`, `^`, `$`).

Un comando que hace una pregunta no recibe respuesta: el script se detiene con el código 3 cuando pasa el tiempo de espera del comando. Cuando un comando empieza como una de las confirmaciones documentadas del perfil (`reload`, `save configuration`, `reboot`, `reset`, `execute restore`), el generador lo advierte.

## Límites

- El generador escribe el script; nunca lo ejecuta. Ejecútalo primero contra un dispositivo de laboratorio.
- Espera el patrón de prompt del perfil. Una línea de banner o una línea de comando que termine a su vez en `>` o `#` y llegue en un fragmento aparte puede confundirse con el prompt; [el artículo sobre dispositivos de red](/learn/expect-against-network-devices) trata los patrones de prompt.
- Los comentarios y los mensajes del script están en inglés, igual que los propios comandos.
- No responde a confirmaciones, no gestiona varios dispositivos en un mismo script ni separa la salida de cada comando; para eso, edita el script y vuelve a comprobarlo con el [explicador](/tools/expect-script-explainer).

## Herramientas y lecturas relacionadas

- **Lo que recoge el script.** Cuando es configuración, la lee el explicador de la plataforma: el [Explicador de configuración tmsh](/tools/f5-tmsh-config-explainer), el [Explicador de configuración de la CLI de FortiOS](/tools/fortios-cli-config-explainer) y el [Explicador de configuraciones de ExtremeXOS](/tools/exos-config-explainer).
- **Por qué el script se escribe así.** El entrecomillado de Tcl, que decide lo que llega al dispositivo, está en [Tcl para quien escribe Expect](/learn/tcl-for-expect-writers); el temporizador que `exp_continue` reinicia en `run_command`, en [Tiempos de espera, eof y bucles en Expect](/learn/expect-timeouts-eof-and-loops); y lo que Expect escribe en un log, en [Depuración de Expect](/learn/expect-debugging-and-logging).

## Compartir resultados

Debajo del script, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el formulario, nunca el script: cada elección (transporte, inicio de sesión, perfil de dispositivo, enable, paginación, salida, las casillas y los dos tiempos de espera) y cada campo de texto que el formulario muestra para esas elecciones. La página escribe el mismo script a partir del mismo formulario, byte a byte. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. El generador nunca recibe una contraseña: la lee de una variable de entorno, cuyo nombre es el único campo, o la pide al ejecutarse. El formulario sigue nombrando tu host, tu usuario y tus comandos, así que la ventana emergente te pide que los leas antes de enviar el enlace. Antes de ofrecer un enlace, se busca en el texto una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), secciones 4.1.1 y 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1: la forma “user:password” “is deprecated”, está en desuso), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece uno, no hay enlace: la ventana emergente indica el campo, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (`username admin secret ...` en un comando, `set password ...`) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El formulario queda como lo dejarías tú, con los campos que el enlace no lleva en sus valores predeterminados, y la página construye el script. Cada elección tiene que ser una de las que ofrece la página y no puede haber ningún campo oculto; si no, se ignora el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [expect(1), Expect 5.45.4 manual source, core.tcl-lang.org](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (consultado el 2026-10-27)
- [expect.c, Expect 5.45.4: how expect reads its arguments](https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4) (consultado el 2026-10-27)
- [OpenSSH ssh(1)](https://man.openbsd.org/ssh.1) (consultado el 2026-10-27)
- [OpenSSH ssh_config(5): StrictHostKeyChecking, BatchMode, IdentitiesOnly](https://man.openbsd.org/ssh_config.5) (consultado el 2026-10-27)
- [RFC 854, Telnet Protocol Specification](https://www.rfc-editor.org/rfc/rfc854) (consultado el 2026-10-27)
- Los documentos de los fabricantes para los perfiles de dispositivo, con sus fechas, en [Expect con dispositivos de red](/learn/expect-against-network-devices) (consultados el 2026-10-27)
