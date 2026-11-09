## Qué hace

Ejecuta `tty` en un shell, pega lo que imprimió y la herramienta te dice qué capa de la pila del terminal estás viendo realmente: el lado esclavo de un pseudoterminal, una consola virtual, una línea serie real, el sinónimo del terminal de control o la consola del sistema. También trata **“not a tty”**, que es un hallazgo y no un error.

Las cuatro definiciones de una línea se muestran **antes** de que pegues nada, porque quien llega confundido con las palabras no debería tener que aportar ningún dato para que la página le explique algo.

## Qué te da cada respuesta

- **`/dev/pts/N`**: el lado esclavo (slave) de un pseudoterminal. Algo en el espacio de usuario tiene el lado maestro (master): tu emulador, `sshd` o `tmux`. **El número se asigna, no significa nada**: dos shells con números consecutivos no tienen ninguna relación. Por eso también al cerrar una ventana muere lo que se estaba ejecutando: el maestro desaparece, el kernel cuelga la línea y el líder de sesión recibe SIGHUP.
- **`/dev/ttyN`**: una consola virtual: el kernel, que maneja el teclado y la pantalla de la propia máquina. Sobrevive a lo que un pseudoterminal no sobrevive, y por eso es donde acabas cuando el servidor gráfico (display server) ha muerto.
- **`/dev/ttyS0`, `/dev/ttyUSB0`**: una línea serie real, el caso original sin cambios. La herramienta advierte que **los parámetros de la línea serie no se negocian**: si no coinciden, salen caracteres basura muy convincentes en lugar de silencio, así que una consola que muestra basura suele ser un problema de velocidad y no un cable roto.
- **`/dev/tty`**: no es un dispositivo, sino un **sinónimo** del terminal que controla el proceso que lo invoca. Explica por qué una petición de contraseña te sigue llegando aunque la salida esté redirigida.
- **`/dev/console`**: donde habla el kernel, y en un servidor muchas veces es el puerto serie y no la pantalla.

## Qué no hace

Lee una ruta, no un sistema. No puede decirte quién tiene el maestro de tu `/dev/pts/3` concreto, y no intenta adivinar nombres de dispositivo desconocidos: una ruta que no reconoce se indica como no reconocida, porque un dispositivo propio de una plataforma no debe deducirse de cómo se escribe su nombre.

## Compartir resultados

Debajo de lo que es el dispositivo, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la ruta del dispositivo o la salida de tty tal como se escribió (`input`), y nada más. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Las cuatro definiciones de arriba son la propia página, así que no van en el enlace.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la ruta no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Al abrir un enlace.** La ruta rellena el cuadro como si la escribieras y la página la explica; no se envía nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
