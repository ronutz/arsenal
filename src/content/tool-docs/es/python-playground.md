## Qué hace

CPython 3.14 real se ejecuta en tu navegador. El motor es Pyodide 314.0.7, la compilación de CPython para WebAssembly del proyecto Pyodide, servida desde este mismo origen y fijada por versión y por resumen SHA-256. Escribes un programa, opcionalmente le das una entrada estándar, presionas Ejecutar y lees stdout, stderr y el valor de la última expresión, tal como lo mostraría un REPL. Nada de lo que escribes sale de la página: el intérprete vive en un Web Worker de tu dispositivo, no tiene red ni procesos, y la política de la propia página los rechazaría de todos modos.

Es la primera herramienta del sitio que ejecuta código que no es del propio sitio. De ahí se siguen tres cosas, y la página dice cada una abiertamente en lugar de ocultarla:

- **Hay una descarga, una sola vez, cuando tú lo decides.** El motor ocupa unos 13,5 MB en cinco archivos. La página se abre con el editor y un ejemplo, pero sin el motor; un botón, que indica el tamaño, inicia la descarga con una barra de progreso. Tu navegador guarda los archivos en caché (tienen versión y están marcados como inmutables), así que una segunda visita no cuesta nada.
- **Se ejecuta un motor de terceros.** Las comprobaciones del propio sitio cubren el código que rodea al motor: la comprobación previa, los límites, los ejemplos (que se vuelven a ejecutar con el motor real en cada compilación) y los resúmenes de los archivos fijados. El comportamiento del intérprete es cosa del proyecto Pyodide.
- **Lo disponible es la biblioteca estándar.** La distribución de Pyodide ofrece 357 paquetes (numpy, pandas, requests y los demás); esta versión no carga ninguno. Cuarenta módulos de la biblioteca estándar no están en la compilación para WebAssembly (tkinter, curses, pwd, grp y readline, entre otros), y la comprobación previa los nombra si importas alguno.

## La comprobación previa

Antes de enviar nada al motor, se lee el texto del programa (nunca se ejecuta) y se te dice qué no funcionará aquí y por qué, en los términos del propio motor:

- la importación de un módulo de la biblioteca estándar que falta en esta compilación, con el error que lanza el motor;
- la importación de un paquete que ofrece la distribución de Pyodide pero que esta versión no carga, con su nombre de paquete (PIL es Pillow, yaml es pyyaml);
- la importación de algo que aquí nadie puede instalar, o una importación relativa, que no tiene ningún paquete respecto al que ser relativa;
- los módulos de red (socket, urllib, http, requests...) y de procesos (subprocess, multiprocessing, os.system), que Emscripten rechaza;
- zoneinfo, que aquí no encuentra ninguna base de datos de zonas horarias y lanza ZoneInfoNotFoundError;
- input() con el cuadro de stdin vacío, que lanza EOFError en la primera lectura;
- un time.sleep más largo que el límite de tiempo real, un while True sin límite y los módulos cuya salida cambia de una ejecución a otra (random, time, uuid, datetime.now);
- los archivos, que viven en la memoria del motor y desaparecen con la ejecución; un programa que no imprime nada (en su lugar se muestra el valor de la última expresión); tabuladores y espacios mezclados en la sangría.

Los elementos marcados como errores bloquean la ejecución; el resto son notas.

## Límites

- Programa: 20.000 caracteres. Entrada estándar: 20.000 caracteres.
- Tiempo real: 30 segundos por ejecución. Al llegar al límite se termina el Worker y se inicia uno nuevo a partir de los archivos en caché.
- Salida: 200.000 caracteres por flujo; después se corta y se marca.
- Detener termina el Worker al instante (es la única forma de interrumpir Python síncrono sin un búfer de interrupción con aislamiento de origen cruzado (cross-origin isolation), que este sitio estático no tiene) e inicia uno nuevo.
- Cada ejecución empieza en un espacio de nombres global nuevo, con `__name__` igual a `"__main__"`, así que las ejecuciones no se pasan variables entre sí y funciona la construcción habitual que protege el código principal (main guard).

## Entrada estándar

El cuadro de stdin alimenta `input()` y `sys.stdin`, una línea por lectura, y después el fin de archivo. Un salto de línea final no añade una línea vacía. `for line in sys.stdin:` lo lee todo.

## Los ejemplos

Trece programas escritos para las personas a las que se dirige el sitio: dividir una /24 en /26, resumir prefijos, máscaras de red y wildcards en binario, un EUI-64 modificado a partir de una dirección MAC, un encabezado DNS construido con struct, HMAC-SHA256 en hexadecimal y en base64url, estadísticas de latencia con p95, jitter y dos desviaciones estándar, tiempos de transferencia a tres velocidades de línea, un recuento de syslog por severidad a partir de texto de log pegado, líneas leídas del cuadro de stdin, campos extraídos de una respuesta de API, el cálculo de la ruta más corta de Dijkstra sobre seis routers y la última expresión sola. Su salida exacta se registra como vectores de referencia y se vuelve a medir con el motor real bajo Node en cada compilación; una actualización del motor que cambie cualquiera de ellas hace fallar la compilación y se revisa expresamente.

El ejemplo de latencia imprime las dos desviaciones estándar y etiqueta cada una. `statistics.pstdev` devuelve “the population standard deviation” (la desviación estándar de la población), que es lo que ping imprime como mdev: la página de manual ping(8) dice “Population standard deviation (mdev)”, e iputils la calcula dividiendo la suma de los cuadrados de las desviaciones entre el número de respuestas. `statistics.stdev` devuelve “the sample standard deviation” (la desviación estándar de la muestra), que es mayor para las mismas muestras (8,34 frente a 7,99 ms en el ejemplo). Compara la línea de pstdev con el resumen `rtt min/avg/max/mdev` de ping, no con la línea de stdev.

El ejemplo de SPF ejecuta el algoritmo de la ruta más corta primero (SPF, shortest path first) de Dijkstra desde el router R1 sobre los seis routers y los ocho enlaces del [artículo sobre Dijkstra](/learn/dijkstra-and-the-twenty-minute-algorithm), con una lista de candidatos en `heapq`, e imprime cada paso en el orden que describe la sección 16.1 del RFC 2328: “the paths to the candidate vertex that is closest to the root are guaranteed to be shortest” (las rutas al vértice candidato más cercano a la raíz son, con seguridad, las más cortas), así que ese router se une al árbol y se examinan sus enlaces; una ruta más corta sustituye el costo y los siguientes saltos de un candidato, una ruta de igual costo añade sus siguientes saltos a los ya listados, y la ejecución termina cuando la lista de candidatos queda vacía. Acaba con el costo, los siguientes saltos y los padres de cada router, y el orden en que los costos pasaron a ser definitivos (R1 R3 R2 R4 R5 R6), que es la idea de Dijkstra de 1959 con sus propias palabras: “the minimal paths from P to the other nodes are constructed in order of increasing length” (las rutas mínimas de P a los demás nodos se construyen en orden de longitud creciente). Los candidatos de igual costo salen del heap por orden de nombre de router, una regla que el programa indica en un comentario, así que la salida es la misma en cada ejecución. Cambia un costo (el de R2 a R4, de 1 a 20, por ejemplo) y vuelve a ejecutarlo para ver cómo se mueven los siguientes saltos; la [introducción a OSPF](/learn/ospf-primer) trata de Open Shortest Path First, el protocolo que ejecuta este cálculo.

## Lo que la API no hace

Esta herramienta no está expuesta en la API HTTP. Ejecutar Python arbitrario en una infraestructura compartida sería ejecución remota de código; el motor solo se ejecuta en tu navegador. La comprobación previa es una ayuda didáctica en torno al editor, no un contrato estable.

## Compartir resultados

Debajo de la barra de ejecución, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el programa y la entrada estándar tal como se escribieron, nunca la salida: quien abra el enlace ejecuta el programa por su cuenta, si así lo decide. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Un programa puede contener claves, tokens y nombres internos, así que la ventana emergente te pide que lo leas antes de enviar el enlace. Antes de ofrecer un enlace, se busca en el texto una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), secciones 4.1.1 y 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1: la forma “user:password” “is deprecated”, está obsoleta), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece uno, no hay enlace: la ventana emergente indica el cuadro y la línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (`api_key = "..."`, una asignación que la comprobación lee en la forma propia de Python) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Se rellenan los dos cuadros, se borra cualquier salida anterior y la página indica que el programa viene de un enlace. No pasa nada más: el motor (unos 13,5 MB) no se descarga y, si ya está cargado, el programa no se ejecuta hasta que presionas **Ejecutar**. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

La documentación de Pyodide (las páginas sobre web workers y sobre los flujos estándar, versión 314.0.7), los propios package.json, pyodide-lock.json y typings del paquete en el registro de npm, la documentación de CPython 3.14 de los módulos que usan los ejemplos, la sección 4.1.1 del RFC 1035, el apéndice A del RFC 4291 y la sección 6.2.1 del RFC 5424 para la aritmética de los ejemplos, y MDN para los Workers de módulo y la lista de orígenes de Content Security Policy, consultados el 2026-10-04. La página de statistics de Python 3.14 (pstdev y stdev), la página de manual ping(8) de man7.org y el código fuente de iputils de la línea de resumen de ping (ping/ping_output.c) se consultaron el 2026-10-19, igual que las secciones 16.1 y 16.1.1 del RFC 2328 (rfc-editor.org) y la nota de Dijkstra de 1959, A Note on Two Problems in Connexion with Graphs, Numerische Mathematik 1, páginas 269 a 271 (el escaneo del repositorio del CWI que cita el artículo sobre Dijkstra), para el ejemplo de SPF. Todas figuran en la página de la herramienta.
