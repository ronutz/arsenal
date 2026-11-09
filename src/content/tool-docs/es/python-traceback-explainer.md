## Qué hace

Pega un traceback que haya impreso CPython y la herramienta lo desmonta: cada marco con su archivo, su línea, su función y su línea de código fuente, y a qué apuntan las marcas `^` y `~` que tiene debajo; cada excepción con su cadena de clases dentro de la jerarquía incorporada, la sugerencia del propio CPython cuando la hay, los detalles del errno o del códec, y una pista sacada de su documentación; el encadenamiento entre excepciones (“direct cause” frente a “during handling”); los grupos de excepciones con sus miembros y sus notas; dónde mirar primero; a qué versiones apunta el formato; y qué puede ser sensible en lo pegado, con una versión con datos ocultos para compartir en lugar del original. Todo se ejecuta en tu navegador: lo pegado se lee, nunca se ejecuta y nunca se envía a ninguna parte.

Lee los formatos de CPython de la 3.11 a la 3.15, las versiones que la Python Developer's Guide daba como soportadas el 27 de octubre de 2026: la 3.15 y la 3.14 en fase de correcciones (bugfix), y la 3.13, la 3.12 y la 3.11 en fase de solo seguridad (security), con final de vida útil en octubre de 2031, 2030, 2029, 2028 y 2027, respectivamente. La 3.10 llegó al final de su vida útil el 1 de octubre de 2026. Cada comportamiento que se describe abajo se comprobó con tracebacks impresos ese día por CPython 3.11.17, 3.12.3 y 3.13.16, y por CPython 3.14.2 en la compilación del [entorno de pruebas de Python](/tools/python-playground) del sitio. No había ningún intérprete 3.15 disponible, así que aquí no se probó nada con la 3.15; cuando se menciona la 3.15, la fuente es su documentación. El [artículo sobre los errores y los tracebacks de Python](/learn/python-errors-and-tracebacks) enseña lo mismo con ejemplos.

## Qué lee

**El encabezado y los marcos.** Un traceback empieza con `Traceback (most recent call last):` y enumera los marcos desde la llamada más externa hasta la más interna: el último marco es donde se lanzó la excepción. Cada marco es una línea `  File "<file>", line <n>, in <function>` seguida de la línea de código fuente con una sangría de cuatro espacios, cuando CPython pudo leer el archivo. La función es el nombre del objeto de código, así que el nivel superior de un script es `<module>`, una lambda es `<lambda>` y una expresión generadora es `<genexpr>`. El número de línea puede ser `None`.

**Las marcas (PEP 657, desde la 3.11).** Bajo la línea de código fuente de un marco, CPython imprime `^` bajo la expresión que ejecutaba el marco. Cuando la expresión tiene partes, `~` marca las partes y `^` la operación: el operador de una operación binaria (`a / b` da `~^~`), los corchetes de un subíndice (`cfg["hostname"]` da `~~~^^^^^^^^^^^^`) y, desde la 3.13, los paréntesis de una llamada (`int(port)` da `~~~^^^^^^`). La herramienta convierte las marcas de nuevo en texto: la expresión, la parte bajo `^` y las partes bajo `~`. CPython coloca las marcas por columna de visualización y cuenta un carácter ancho o de ancho completo (East Asian Width W o F) como dos columnas; la herramienta hace lo mismo, con la tabla de anchos de Unicode 15.1.0 que usa CPython 3.13. No se imprimen marcas cuando CPython se inició con `-X no_debug_ranges` o `PYTHONNODEBUGRANGES`, cuando la expresión es toda la línea y, desde la 3.13, tampoco para `x = f(...)` ni `return name(...)` cuando la llamada es todo el valor (la 3.12 marca `json.loads(body)` en `data = json.loads(body)`; la 3.13, no).

**Expresiones en varias líneas (desde la 3.13).** Un marco puede mostrar una expresión que ocupa varias líneas de código fuente, con marcas bajo cada una y `...<N lines>...` en lugar de las líneas omitidas. La 3.11 y la 3.12 solo muestran la primera línea.

**Marcos repetidos.** Después de tres marcos idénticos (mismo archivo, misma línea y misma función), CPython imprime `[Previous line repeated N more times]` en lugar del resto. La herramienta los cuenta en el marco de arriba.

**Variables locales.** `unittest --locals` y `traceback.TracebackException(..., capture_locals=True)` imprimen líneas `name = value` bajo un marco. La herramienta las enumera y advierte de que los valores pueden contener secretos.

**La línea de la excepción.** `<type>: <message>`, o `<type>` solo cuando el mensaje está vacío. CPython escribe el tipo como `module.qualname`, salvo en las clases incorporadas y en las clases del script que se ejecutó (`__main__`), que escribe sin módulo. Así, `ValueError` es incorporada, `json.decoder.JSONDecodeError` viene de la biblioteca estándar y `PollError` se definió, con toda probabilidad, en el script.

**Notas y mensajes de varias líneas.** Las notas añadidas con `add_note()` (PEP 678, desde la 3.11) se imprimen “immediately after the exception message, in the order in which they were added, with each note starting on a new line” (justo después del mensaje de la excepción, en el orden en que se añadieron, cada una en una línea nueva). Un mensaje que contiene saltos de línea se imprime igual, así que el texto por sí solo no permite distinguir el resto de un mensaje de una nota; la herramienta muestra esas líneas juntas y lo indica.

**La ubicación de un SyntaxError.** Cuando el código no compila, CPython imprime `  File "<file>", line <n>` sin función, la línea problemática y marcas `^`, y después `SyntaxError: <message>`. Si el propio script no compiló, no se ejecutó nada y no hay ningún encabezado `Traceback`; si lo que no compiló fue un módulo importado, la ubicación aparece después de los marcos del código que lo importó. Estas marcas cuentan caracteres, no columnas de visualización.

**Cadenas (PEP 3134).** Cuando se lanza una excepción mientras se gestiona otra, CPython imprime las dos, la más antigua primero, unidas por una línea de enlace:

- `The above exception was the direct cause of the following exception:` significa `raise new from original`: una traducción deliberada, y la excepción anterior es el `__cause__` de la nueva.
- `During handling of the above exception, another exception occurred:` significa que el manejador de la excepción anterior lanzó una nueva: falló el propio manejador, y la excepción anterior pasó a ser el `__context__` de la nueva.
- `raise new from None` imprime la excepción nueva sola (PEP 409, PEP 415).

Una excepción que se creó pero nunca se lanzó, como la causa en `raise ValueError(...) from KeyError(...)`, se imprime sin encabezado y sin marcos.

**Grupos de excepciones (PEP 654, desde la 3.11).** Un grupo se imprime como un recuadro: `+ Exception Group Traceback (most recent call last):`, un margen `|` en cada línea del grupo y cada miembro bajo un título `+-+---------------- 1 ----------------`, `+---------------- 2 ----------------`, etc., cada uno con su propio traceback, su cadena y sus notas, anidado un margen más adentro en cada nivel. El mensaje del grupo termina con `(N sub-exceptions)`. De forma predeterminada, CPython imprime 15 miembros y después `and N more exceptions` (`max_group_width`), y diez niveles de anidamiento y después `... (max_group_depth is 10)`. La herramienta lee grupos de hasta 40 niveles, así que también lee un traceback impreso con límites mayores.

**Lo que va antes del traceback.** `Exception in thread <name>:` significa que `threading.excepthook` imprimió una excepción lanzada en un hilo, y puede que el programa siguiera adelante. `Exception ignored in: ...` significa que `sys.unraisablehook` imprimió una excepción que no podía propagarse, por ejemplo desde un destructor. Una línea de log como `ERROR:netops.poller:...`, un prompt de shell o `>>> ` antes del encabezado se deja sin leer, con una nota.

**Lo que no lee.** Los informes de IPython y de pytest tienen sus propios formatos, no el de CPython; la herramienta lo indica y solo lee lo que está en el formato de CPython (de IPython, la línea de la excepción). No se lee un log en el que cada línea lleva un prefijo (una marca de tiempo, un nivel). Cuando lo pegado contiene dos tracebacks, se lee el primero y una nota indica la línea donde empieza el segundo. Las líneas que siguen a una línea de excepción se toman como su mensaje o sus notas hasta una línea en blanco, una línea de enlace, un encabezado nuevo o un prompt `>>> `.

## Dónde difieren las versiones

Visto en los tracebacks que fijan los vectores (3.11.17, 3.12.3, 3.13.16 y 3.14.2) y en la documentación de cada versión.

| Qué | 3.11 | 3.12 | 3.13 | 3.14 | 3.15 |
| --- | --- | --- | --- | --- | --- |
| `^` bajo la expresión que falla, `~` alrededor de un operador o de un subíndice | sí | sí | sí | sí | sin probar |
| `~` bajo una función llamada, `^` bajo sus paréntesis | no: solo `^` | no: solo `^` | sí | sí | sin probar |
| Sin marcas para una expresión que ocupa toda la línea | sí | sí | sí, y también para `x = f(...)` y `return name(...)` | como la 3.13 | sin probar |
| Una expresión en varias líneas, con `...<N lines>...` | solo la primera línea | solo la primera línea | sí | sí | sin probar |
| Un marco para una comprensión de lista, diccionario o conjunto (`<listcomp>`) | sí | no (PEP 709) | no | no | sin probar |
| Grupos de excepciones, notas | sí | sí | sí | sí | sin probar |
| “Did you forget to import 'sys'?” | no | sí | sí | sí | sin probar |
| Un script con el nombre de un módulo de la biblioteca estándar | “partially initialized module ... (most likely due to a circular import)” | lo mismo | “(consider renaming '...' since it has the same name as the standard library module ...)” | sin probar | sin probar |
| Un argumento por palabra clave mal escrito | “'max_split' is an invalid keyword argument for split()” | lo mismo | “got an unexpected keyword argument 'max_split'. Did you mean 'maxsplit'?” | como la 3.13 | sin probar |
| El nombre de archivo del shell interactivo | `<stdin>` | `<stdin>` | `<python-input-0>` | `<python-input-N>` en los ejemplos de la documentación | lo mismo en la documentación |
| Color en un terminal | no | no | sí | sí | sí |
| Nuevas excepciones incorporadas | | | `PythonFinalizationError` | | `ImportCycleError` |

En las ejecuciones aparecieron dos diferencias más. En la 3.11, la sugerencia “Did you mean” de un `NameError` la imprime la presentación propia del intérprete, pero no `traceback.print_exc()`; desde la 3.12 la imprimen las dos. Y la compilación de Pyodide de la 3.14.2 imprimió las excepciones de ssl como `_ssl.SSLError` (sin `ValueError` en la cadena de `SSLCertVerificationError`), mientras que de la 3.11 a la 3.13 se imprime `ssl.SSLError`; la herramienta conoce las dos grafías. En 26 de los 34 escenarios ejecutados en ambas, el texto de la 3.14.2 era idéntico byte a byte al de la 3.13.16; los otros ocho solo difieren en las rutas, en la profundidad a la que se detuvo la recursión y en lo que WebAssembly no puede hacer (sockets, hilos y procesos). La documentación de tracebacks de la 3.15 dice lo mismo que la de la 3.14, salvo en su línea de versión; los mensajes nuevos de la 3.15 (sugerencias a través de atributos internos, nombres de Python para los métodos de otros lenguajes, importaciones diferidas notificadas en el primer uso) se leyeron, pero no se ejecutaron.

## La clase de la excepción

La herramienta conoce todas las excepciones incorporadas documentadas y las excepciones de la biblioteca estándar con las que más se encuentran los scripts de redes y de seguridad: `socket.gaierror` y `socket.herror`; los errores de `ssl`; `json.decoder.JSONDecodeError`; `asyncio.exceptions.CancelledError`, `InvalidStateError`, `IncompleteReadError` y `LimitOverrunError`; los errores de `subprocess`; `urllib.error.URLError`, `HTTPError` y `ContentTooShortError`; y `http.client.HTTPException`, `RemoteDisconnected`, `IncompleteRead`, `BadStatusLine`, `InvalidURL` y `LineTooLong`. Para cada una muestra la cadena de clases, empezando por la base más cercana (por ejemplo, `ConnectionRefusedError → ConnectionError → OSError → Exception → BaseException`), una frase sobre lo que significa, la versión que la añadió cuando es posterior a la 3.11 y un enlace a su entrada en la documentación. Las cadenas las imprimieron los propios intérpretes (el `__mro__` de cada clase en la 3.11.17, la 3.12.3, la 3.13.16 y la 3.14.2, idéntico para todas las incorporadas) y coinciden con el árbol de jerarquía de la página de excepciones de cada versión; `ImportCycleError` sale solo de la documentación de la 3.15. Los alias se imprimen con el nombre de su destino: `socket.timeout` y `asyncio.TimeoutError` como `TimeoutError`, `IOError` y `EnvironmentError` como `OSError`, `ssl.CertificateError` como `ssl.SSLCertVerificationError`.

Para una clase desconocida, la herramienta dice lo que implica el nombre impreso: un nombre sin módulo es una clase del script que se ejecutó (o una incorporada más reciente que la herramienta), y un nombre con módulo lo documenta ese módulo.

**Pistas.** Para 36 clases de excepción frecuentes, y para cualquier mensaje sobre `'NoneType'`, la herramienta añade qué comprobar primero, siempre tomado de la documentación de la clase: `ModuleNotFoundError` (un entorno virtual solo ve lo que se instaló en él), `KeyError` (`dict.get(key, default)` devuelve en su lugar un valor predeterminado), `AttributeError` o `TypeError` sobre `'NoneType'` (una función sin `return` devuelve `None`, y `re.match()` y `re.search()` devuelven `None` cuando no hay coincidencia), `UnboundLocalError` (una asignación en cualquier parte de una función hace que el nombre sea local en toda ella), `ConnectionRefusedError`, `TimeoutError`, `socket.gaierror`, `ssl.SSLCertVerificationError` (verify_message dice por qué; `CERT_NONE` acepta prácticamente cualquier certificado), `subprocess.CalledProcessError`, `asyncio.exceptions.CancelledError` (un `TaskGroup` cancela las demás tareas cuando una falla), `AssertionError` (`python -O` elimina las sentencias `assert`), `SyntaxError` (las marcas muestran dónde detectó el error el analizador, que “is not always the place that needs to be fixed”, no siempre es el lugar que hay que corregir), y otras.

**A partir del mensaje.** Las sugerencias del propio CPython (“Did you mean”, “Did you forget to import”, “consider renaming”); el errno y su texto en `[Errno N] text` y `[WinError N] text` (los números son los del sistema operativo y varían entre sistemas; un número negativo en `socket.gaierror` es uno de los códigos `EAI_*` de getaddrinfo); y el códec, el byte o el carácter, la posición y el motivo de un `UnicodeDecodeError` o un `UnicodeEncodeError`.

## Dónde mirar primero

Para la excepción con la que termina el traceback (en un grupo, para cada miembro hoja, hasta veinte):

- lanzada en tu propio código: ese marco y los valores que llegaron a él;
- lanzada por una sentencia `raise`: el mensaje dice por qué; cuando una línea de enlace la une a una excepción anterior, la lectura sigue la cadena también hasta esa (la causa directa es el fallo original; con “during handling”, el primer fallo es el anterior y el manejador falló después);
- lanzada dentro de la biblioteca estándar, de un paquete instalado o de un módulo congelado: el último marco de tu propio código antes de ella, que le pasó lo que la biblioteca no pudo gestionar;
- un SyntaxError: la ubicación, y el marco que importó el archivo, cuando lo hay;
- un `RecursionError`: el marco que se repite; un `KeyboardInterrupt`: dónde estaba esperando el programa;
- sin marcos: la excepción nunca se lanzó por sí misma, o solo se pegó su última línea.

“Tu propio código” es cualquier marco que no esté en la biblioteca estándar (`.../lib/python3.X/...`, `...\Lib\...`), en un paquete instalado (`site-packages`, o `dist-packages` en Debian) ni en un módulo congelado (`<frozen ...>`); `<stdin>`, `<string>` y el shell interactivo cuentan como tuyos. Es una lectura, no un veredicto: el marco que lanza la excepción no siempre es donde está el error.

## Qué versión lo imprimió

La herramienta reúne indicios y los cruza: una ruta que nombra la biblioteca estándar (`/usr/lib/python3.13/`, `python314.zip`, `Python313\`) da la versión exacta; que haya marcas significa 3.11 o posterior; `~` bajo una llamada o una expresión en varias líneas, 3.13 o posterior; un marco de comprensión, 3.11 o anterior; un grupo de excepciones, 3.11 o posterior; `<python-input-N>`, 3.13 o posterior; “Did you forget to import”, 3.12 o posterior; “consider renaming” o “Did you mean '...'?” sin dos puntos, 3.13 o posterior; `PythonFinalizationError`, 3.13 o posterior; `ImportCycleError`, 3.15. Los indicios que se contradicen (lo pegado mezcla dos versiones o se editó) se indican como tales.

## Qué puede ser sensible

Un traceback es un artefacto de log y suele llevar lo que no debería publicarse: las rutas nombran usuarios y hosts, las líneas de código y los mensajes pueden contener tokens, contraseñas y URL con credenciales, y las variables locales impresas contienen valores. La herramienta busca:

- un nombre de usuario en un directorio personal: `/home/<name>/`, `/Users/<name>/`, `C:\Users\<name>\`, indicado una vez por nombre, con un recuento;
- todo lo que encuentra la comprobación de secretos de [Código a imagen](/tools/code-to-image), otra herramienta del sitio: bloques de clave privada, encabezados `Authorization`, ID de clave de acceso de AWS, JSON Web Tokens, contraseñas en URL, valores cifrados de FortiOS y atributos, miembros, claves, variables y asignaciones con aspecto de secreto. Las líneas de más de 2000 caracteres no pasan por esa comprobación (se vuelve lenta con líneas muy largas), y una nota lo indica.

La **versión con datos ocultos** sustituye cada nombre de usuario por `<user>` y cada hallazgo por `[redacted]`, y es lo que hay que pegar en una incidencia (issue) o en un ticket. Las comprobaciones no son completas: lee la copia antes de publicarla.

Por el mismo motivo, la página nunca pone en un enlace un traceback tal como lo pegaste (su ajuste de compartición es “never”). Su botón **Compartir resultados**, en esta sección, genera un enlace solo cuando lo presionas, y el enlace lleva después del `#` la versión con datos ocultos de arriba, nunca lo pegado; cuando algunas líneas tenían más de 2000 caracteres y por eso no se comprobaron, no ofrece enlace e indica por qué. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace, pero cualquiera que tenga el enlace puede leerla: lee la copia antes. Un enlace rellena el cuadro como lo haría un pegado y la página lo explica; después, el valor sale de la dirección de la página sin ninguna solicitud. La copia está limitada a 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`. Tampoco se ofrece la herramienta en la API del sitio: enviar un traceback a un servidor para que lo explique enviaría con él sus secretos, y un programa que tiene un traceback ya tiene el objeto de la excepción, que `traceback.TracebackException` de la biblioteca estándar lee con exactitud.

## Límites

Como máximo 200.000 caracteres, 5000 líneas y 5000 caracteres por línea; grupos de excepciones de hasta 40 niveles de anidamiento. La entrada más larga de las pruebas tardó unos 0,4 segundos.

## Ejemplo resuelto

El botón Ejemplo carga el traceback que imprimió CPython 3.13.16 para este script, que sondea un dispositivo de laboratorio en un puerto en el que no escucha nada:

```python
# poll.py: open an SSH session to each device in the inventory; nothing listens on the lab's port here.
import socket  # TCP

INVENTORY = {"r1": "127.0.0.1"}  # device name and management address
SSH_PORT = 2222  # the lab's SSH port


class PollError(Exception):
    """A device could not be polled."""


def open_session(host, port):
    # Connect with a short timeout.
    return socket.create_connection((host, port), timeout=2)


def poll(inventory):
    # Turn a refusal into the application's own error, keeping the original as its cause.
    for name, host in inventory.items():
        try:
            open_session(host, SSH_PORT)
        except ConnectionRefusedError as err:
            err.add_note(f"device {name} ({host})")
            raise PollError(f"{name}: SSH port {SSH_PORT} closed") from err


poll(INVENTORY)
```

La herramienta lee dos excepciones unidas por la línea de enlace “direct cause”. La primera, `ConnectionRefusedError: [Errno 111] Connection refused`, tiene cuatro marcos (dos en `poll.py` y dos en `/usr/lib/python3.13/socket.py`) y una línea después de su línea de excepción, `device r1 (127.0.0.1)`, que es la nota. La segunda, `PollError: r1: SSH port 2222 closed`, es una clase del script (no hay módulo en su nombre) lanzada por una sentencia `raise`. Dónde mirar primero: `PollError` se lanzó a propósito; su causa directa es el rechazo, lanzado dentro de la biblioteca estándar, y el último marco del script antes de él es `open_session`, línea 14. La ruta nombra la biblioteca estándar de la 3.13, y la `~` bajo cada función llamada confirma la 3.13 o posterior. Se indica el nombre de usuario de `/home/ana/`, y la versión con datos ocultos lleva `/home/<user>/` en su lugar.

## Procedencia

El comportamiento lo fija el conjunto de vectores de referencia `python-traceback-explainer-golden-2026-10-27b`: 57 vectores de traceback (45 impresos por la 3.13.16, entre ellos una sesión interactiva, un hilo, logging, `sys.unraisablehook`, `unittest --locals`, `-X no_debug_ranges`, color, `python -m` y un nombre de archivo de estilo Windows pasado a `compile()`; seis impresos por las otras versiones, cuatro por la 3.11.17, uno por la 3.12.3 y uno por la 3.14.2; el informe de IPython 9.17.1; la última línea de un traceback de la 3.13.16 sola; y cuatro tracebacks de la 3.13.16 transformados con saltos de línea CR LF, espacios de no separación, una sangría y un corte), ocho rechazos, 26 anchos de visualización y 14 cadenas de clases. La estructura esperada de cada traceback (tipos, mensajes, notas, enlaces, marcos, posiciones, si se imprimieron marcas y el tipo de expresión bajo ellas) no la produjo la herramienta: un programa de pruebas volvió a ejecutar cada script y la escribió a partir de los objetos de la excepción (`traceback.TracebackException`, `FrameSummary` y el texto propio de CPython para cada marco), y en todos los escenarios y versiones la lectura que hace la herramienta del texto impreso coincidió con ella en las 3971 comparaciones. Las lecturas (dónde mirar primero, el rango de versiones, las notas y los hallazgos, las versiones con datos ocultos) se escribieron a mano a partir de las reglas de arriba. Seis vectores de compartición fijan lo que lleva un enlace de Compartir resultados: las versiones con datos ocultos del Ejemplo, del vector de secretos y del vector de la ruta de Windows, y la ausencia de enlace para una línea que la comprobación de secretos omitió, para algo pegado que no es un traceback y para un cuadro vacío. 100.000 entradas aleatorias y mutadas nunca la hicieron fallar.

## API

No se expone en la API, a propósito: consulta “Qué puede ser sensible” más arriba.

## Fuentes

Todas consultadas el 2026-10-27.

- Documentación de Python 3.15: [traceback](https://docs.python.org/3/library/traceback.html) (comparada con las ediciones [3.11](https://docs.python.org/3.11/library/traceback.html), [3.12](https://docs.python.org/3.12/library/traceback.html), [3.13](https://docs.python.org/3.13/library/traceback.html) y [3.14](https://docs.python.org/3.14/library/traceback.html)), [Built-in Exceptions](https://docs.python.org/3/builtins/exceptions.html) (con las ediciones de la 3.11 a la 3.14), [Command line and environment](https://docs.python.org/3/using/cmdline.html), [sys](https://docs.python.org/3/library/sys.html), [threading](https://docs.python.org/3/library/threading.html), [sysconfig](https://docs.python.org/3/library/sysconfig.html), [unittest](https://docs.python.org/3/library/unittest.html), [venv](https://docs.python.org/3/library/venv.html), [codecs](https://docs.python.org/3/library/codecs.html), [re](https://docs.python.org/3/library/re.html), [Built-in Types](https://docs.python.org/3/builtins/stdtypes.html), [socket](https://docs.python.org/3/library/socket.html), [ssl](https://docs.python.org/3/library/ssl.html), [json](https://docs.python.org/3/library/json.html), [asyncio exceptions](https://docs.python.org/3/library/asyncio-exceptions.html), [Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html), [subprocess](https://docs.python.org/3/library/subprocess.html), [urllib.error](https://docs.python.org/3/library/urllib.error.html), [http.client](https://docs.python.org/3/library/http.client.html)
- [The Python Tutorial: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) y [More Control Flow Tools](https://docs.python.org/3/tutorial/controlflow.html); [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) y [Execution model](https://docs.python.org/3/reference/executionmodel.html); [Programming FAQ: UnboundLocalError](https://docs.python.org/3/faq/programming.html)
- What's New in Python [3.11](https://docs.python.org/3/whatsnew/3.11.html), [3.12](https://docs.python.org/3/whatsnew/3.12.html), [3.13](https://docs.python.org/3/whatsnew/3.13.html), [3.14](https://docs.python.org/3/whatsnew/3.14.html), [3.15](https://docs.python.org/3/whatsnew/3.15.html)
- [PEP 657](https://peps.python.org/pep-0657/), [PEP 654](https://peps.python.org/pep-0654/), [PEP 678](https://peps.python.org/pep-0678/), [PEP 3134](https://peps.python.org/pep-3134/), [PEP 409](https://peps.python.org/pep-0409/), [PEP 415](https://peps.python.org/pep-0415/), [PEP 709](https://peps.python.org/pep-0709/), [PEP 3151](https://peps.python.org/pep-3151/)
- [Python Developer's Guide: Status of Python versions](https://devguide.python.org/versions/)
- [Debian Python Policy](https://www.debian.org/doc/packaging-manuals/python-policy/): `dist-packages`
- Unicode Character Database [15.1.0 EastAsianWidth.txt](https://www.unicode.org/Public/15.1.0/ucd/EastAsianWidth.txt) (comparado con la 16.0.0 y la 17.0.0) y [UAX #11, East Asian Width](https://www.unicode.org/reports/tr11/)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
