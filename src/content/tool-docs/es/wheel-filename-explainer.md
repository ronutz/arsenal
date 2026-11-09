## Qué hace

Pega el nombre de archivo de un wheel (`.whl`) o de una distribución de código fuente (`.tar.gz`), o una URL que termine en uno de ellos, y la herramienta lo descompone: el nombre del proyecto y su forma normalizada, la versión y su forma normalizada según PEP 440, la etiqueta de compilación opcional y cada etiqueta de Python, de ABI y de plataforma, con lo que exige cada una. Los conjuntos de etiquetas comprimidos se expanden, y cada combinación dice qué intérpretes y qué sistemas cubre. Abre **Comprobar con un intérprete**, describe uno (CPython o PyPy, la versión de Python, si es una compilación free-threaded o no, Linux con glibc o con musl, macOS o Windows, la versión de la biblioteca de C o de macOS, la arquitectura) y la herramienta te dice si el wheel se instala ahí y cuál de sus etiquetas gana.

El modo **Versiones** lee, en cambio, una lista de versiones: cada una analizada y normalizada, con lo que cambió la normalización, la lista ordenada según PEP 440 con las versiones iguales marcadas y, cuando añades un conjunto de especificadores como `>= 1.0, != 1.3.*, < 2`, qué versiones están dentro del rango y cuáles elige un instalador de forma predeterminada. Todo se ejecuta en tu navegador; de una URL solo se toma su último segmento, y no se descarga nada. Está junto al [Explicador de pyproject.toml](/tools/pyproject-toml-explainer), que lee el archivo que produce estos nombres, y al [Entorno de pruebas de Python](/tools/python-playground).

## Cómo se lee un nombre de archivo

La especificación del formato de distribución binaria da el nombre de archivo de un wheel como `{distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl`, así que un nombre válido tiene cuatro o cinco guiones. Las reglas que se aplican aquí:

- **El nombre** es un nombre de proyecto válido (letras ASCII, dígitos, `.`, `_` y `-`, que empieza y termina por una letra o un dígito), y se compara en su forma normalizada: en minúsculas y con cada secuencia de `-`, `_` y `.` sustituida por un único `-`. En un nombre de archivo, las herramientas lo escriben en minúsculas y con cada una de esas secuencias como un único `_`; las herramientas que leen wheels tienen que seguir aceptando `.` y mayúsculas en los archivos antiguos, así que se aceptan con una advertencia. Un guion bajo doble se rechaza, como hace pip.
- **La versión** es una versión PEP 440. Las herramientas la escriben normalizada; un nombre cuya versión no lo está se acepta con una advertencia que da la forma normalizada.
- **La etiqueta de compilación** tiene que empezar por un dígito. Solo deshace un empate entre wheels idénticos en todo lo demás, y se ordena por sus dígitos iniciales como número y después por el resto como texto. No forma parte de la versión, y la especificación dice que una publicación a la que haya que referirse desde fuera, como una corrección de seguridad, debería recibir una versión nueva y no un número de compilación.
- **Una distribución de código fuente** es `{name}-{version}.tar.gz` con exactamente un guion. Un nombre con más guiones se lee como lo lee pip (la versión va después del último guion), con una advertencia; un `.zip` se lee como la forma antigua, también con una advertencia.

## Las etiquetas

- **Etiqueta de Python**: un código de implementación (`py` para cualquier implementación, `cp` CPython, `pp` PyPy, `ip` IronPython, `jy` Jython) seguido de la versión sin su punto (`cp313` es CPython 3.13). Una etiqueta solo con la versión mayor, como `py3`, no es una abreviatura de `py30`: significa que quien empaquetó publicó un wheel pensado para funcionar en todas las versiones 3.x.
- **Etiqueta de ABI**: `none` (ningún módulo de extensión ligado a una ABI de Python), `abi3` (la ABI estable de CPython, para compilaciones que no son free-threaded), `abi3t` (la ABI estable para compilaciones free-threaded, PEP 803, desde Python 3.15), el `cpXY` propio de CPython con sus flags (`d` depuración, `t` free-threaded, y los más antiguos `m` y `u`) o el `pypyXY_ppNN` de PyPy.
- **Etiqueta de plataforma**: `any`; `win_amd64`, `win32`, `win_arm64`; `manylinux_x_y_arch` (glibc x.y o más reciente, PEP 600) y sus nombres heredados `manylinux1` (glibc 2.5), `manylinux2010` (2.12) y `manylinux2014` (2.17); `musllinux_x_y_arch` (musl x.y o más reciente, PEP 656; packaging solo enumera la misma versión mayor de musl); `macosx_x_y_arch` (macOS x.y o posterior; `10_y` para macOS 10, `x_0` a partir de macOS 11, con x de 10 a 15 o de 26 en adelante), incluidos los nombres multiarquitectura como `universal2` (arm64 y x86_64); `ios_x_y_arch_sdk`; `android_apilevel_abi`; `pyemscripten_YEAR_PATCH_wasm32` (PEP 783, aceptada); y la forma simple `linux_arch`, que la especificación considera insuficiente para la distribución pública. Cualquier otra cosa se lee como el valor de `sysconfig.get_platform()` de otro sistema.
- **Conjuntos de etiquetas comprimidos**: cada etiqueta puede ser una colección ordenada y separada por `.`, y el wheel representa entonces todas las combinaciones. `py2.py3-none-any` son dos combinaciones; hasta 400 se explican una por una, y el resto se cuentan.

## Qué intérpretes y qué sistemas

La especificación de etiquetas de compatibilidad de plataforma dice que un instalador mantiene una lista de las etiquetas (Python, ABI, plataforma) que admite, ordenada por preferencia, e instala un wheel cuando una de las etiquetas del wheel está en la lista. Esta herramienta construye esa lista como la construye packaging 26.3 para el intérprete y el sistema que describes, compara con ella las etiquetas expandidas del wheel e indica la mejor coincidencia y su posición. Para CPython 3.13 con glibc 2.39 en x86-64, la lista tiene 1147 etiquetas, el mismo recuento que imprimió `python -m pip debug --verbose` en el contenedor en el que se creó esta herramienta. pip 26.2 sigue incorporando una copia de packaging 26.2, y packaging 26.3 cambió una cosa del orden: prefiere la etiqueta de plataforma `linux_*` simple a las manylinux y musllinux, así que en cada grupo la etiqueta `linux_x86_64` va ahora la primera en lugar de la última. Por tanto, la lista del propio pip contiene las mismas etiquetas casi en el mismo orden: solo se mueve la etiqueta `linux_*` simple de cada grupo, y que un wheel se instale o no nunca cambia.

Cada combinación recibe además una lectura en claro de su regla de intérprete: `py3-none` es cualquier Python 3; `cp311-abi3` es CPython 3.11 o posterior, en compilaciones que no son free-threaded; `cp313-cp313t` es solo la compilación free-threaded de CPython 3.13. Algunas combinaciones son nombres válidos que ningún instalador enumera nunca, y la herramienta lo dice con el motivo: `abi3` con una etiqueta de Python distinta de `cp`, una ABI compilada con la plataforma `any`, una ABI que nombra una versión distinta de la de la etiqueta de Python, o una etiqueta `cp3` con una ABI.

Lo que no modela la comprobación del destino: los destinos iOS, Android y Emscripten, otras implementaciones distintas de CPython y PyPy (PyPy se toma como 7.3, ABI `pp73`) y las reglas por distribución que un instalador puede añadir encima, como una discrepancia de `Requires-Python` o un índice que oculta un archivo. Las versiones de Python que se ofrecen son las ramas con soporte de la guía para desarrolladores de Python: de la 3.11 a la 3.15.

## Hallazgos

| Código | Gravedad | Significado |
|---|---|---|
| `not-a-distribution` | Error | El nombre no termina en `.whl`, `.tar.gz` ni `.zip` |
| `suffix-case` | Error | El sufijo no está en minúsculas |
| `wrong-part-count` | Error | Un nombre de wheel que no tiene cuatro o cinco guiones |
| `sdist-no-hyphen` | Error | Un nombre de distribución de código fuente sin guion |
| `empty-name`, `bad-name` | Error | No hay nombre, o no es un nombre de proyecto válido |
| `double-underscore` | Error | `__` en la parte del nombre |
| `bad-version` | Error | No es una versión PEP 440 |
| `bad-build-tag` | Error | Una etiqueta de compilación que no empieza por un dígito |
| `empty-tag` | Error | Una etiqueta vacía o un miembro vacío de un conjunto comprimido |
| `python-tag-not-identifier` | Error | Una etiqueta de Python que empieza por un dígito (pip rechaza el nombre) |
| `name-not-escaped` | Advertencia | Se acepta, pero no es la forma escapada que escriben hoy las herramientas |
| `version-not-normalized` | Advertencia | La versión no está en forma normalizada |
| `build-tag-used` | Advertencia | Hay una etiqueta de compilación |
| `tags-not-sorted`, `tags-uppercase` | Advertencia | Un conjunto comprimido desordenado, o mayúsculas en una etiqueta |
| `impossible-combination` | Advertencia | Una combinación que ningún instalador enumera |
| `unknown-python-tag` | Advertencia | Una etiqueta de Python que no son letras seguidas de una versión |
| `linux-simple-tag` | Advertencia | `linux_arch` en lugar de manylinux o musllinux |
| `legacy-arch-mismatch` | Advertencia | Un nombre manylinux heredado en una arquitectura para la que nunca se definió |
| `macos-version-shape`, `android-abi`, `ios-multiarch` | Advertencia | Una etiqueta de plataforma fuera de las formas que define su familia |
| `sdist-zip`, `sdist-hyphens` | Advertencia | Un nombre de distribución de código fuente antiguo o no estándar |
| `local-version` | Nota | Una etiqueta de versión local (PyPI no acepta versiones locales) |
| `legacy-manylinux` | Nota | Un nombre manylinux heredado y la etiqueta que significa |
| `unknown-platform` | Nota | Una plataforma fuera de las familias descritas |
| `too-many-tags` | Nota | Más de 400 combinaciones; el resto se cuentan |

## Versiones PEP 440

Una versión es `[N!]N(.N)*[{a|b|rc}N][.postN][.devN][+local]`. La herramienta analiza las formas que acepta la especificación y da la forma normalizada, diciendo qué cambió: se quitan el espacio en blanco y una `v` inicial, las mayúsculas pasan a minúsculas, se quitan los ceros a la izquierda, `alpha`, `beta`, `c`, `pre` y `preview` se escriben como `a`, `b` y `rc`, los separadores se quitan o se escriben como un solo punto, un número de versión preliminar, posterior o de desarrollo que falta se toma como 0, `-1` después del número de versión se lee como `.post1`, `-` y `_` en una etiqueta local se escriben como `.`, y se quita una época `0!`. Una época distinta de cero se muestra; la especificación la desaconseja.

La ordenación sigue la especificación: los números de versión se comparan como números y los que faltan cuentan como cero, así que `1.0`, `1.0.0` y `1` son iguales; dentro de una misma versión, primero van las versiones de desarrollo, después `a`, `b` y `rc`, después la versión final y después las versiones posteriores; una versión con etiqueta local se ordena después de la misma versión sin ella.

## Conjuntos de especificadores

Cada cláusula se explica con palabras: `~=2.2` es `>=2.2, ==2.*`; `==1.1.*` es una coincidencia de prefijo; `==1.1` ignora la etiqueta local de una candidata y completa con ceros los números de versión; `<V` deja fuera las versiones preliminares de V salvo que V sea una de ellas; `>V` deja fuera las versiones posteriores de V salvo que V sea una de ellas, y también las versiones locales de V; `===` compara el texto (las letras sin distinguir mayúsculas de minúsculas) y está muy desaconsejado. Las cláusulas se rechazan por los motivos que dan la especificación y packaging 26.3: `~=` con un solo número de versión, `.*` con un operador distinto de `==` y `!=` o después de una parte de versión preliminar, posterior o de desarrollo, una etiqueta local con un operador distinto de `==` y `!=`, y dos cláusulas sin una coma entre ellas.

El tratamiento de las versiones preliminares sigue la especificación y packaging 26.3: las versiones preliminares, incluidas las de desarrollo, se dejan fuera salvo que una cláusula nombre una o que todas las versiones dentro del rango sean preliminares; la tabla muestra tanto lo que está dentro del rango como lo que se elige de forma predeterminada, y marca la más reciente de las elegidas.

## Dónde sigue a packaging, y dónde es más estricta

Cada veredicto se comparó con packaging 26.3 durante el desarrollo (mira Procedencia). La herramienta sigue las decisiones de packaging donde la especificación deja margen, como las reglas exclusivas de `<` y `>` y la lista de etiquetas del instalador. Es más estricta en un punto, y lo dice: un nombre de archivo cuya parte del nombre no es un nombre de proyecto válido (un `_` o un `.` al principio o al final, una letra no ASCII, un espacio en el nombre de un sdist) se rechaza aquí, mientras que los analizadores de nombres de archivo de packaging lo aceptan.

## Ejemplos resueltos

- **El botón Ejemplo**: `cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl`. CPython 3.11 o posterior, ABI estable, compilaciones que no son free-threaded, en Linux con glibc 2.34 o más reciente en x86-64. Con CPython 3.13 y glibc 2.39 se instala, como etiqueta 163 de 1147 (pip 26.2.2, con packaging 26.2, la imprime en la posición 162); con glibc 2.31 no se instala; en una 3.14 free-threaded tampoco, porque `abi3` no se enumera para las compilaciones free-threaded.
- `markupsafe-3.0.4-cp313-cp313-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl` se expande a tres combinaciones; `manylinux2014` se indica como el nombre heredado de `manylinux_2_17`.
- `Foo.Bar-1.0-py2.py3-none-any.whl` se acepta con una advertencia: hoy las herramientas escriben `foo_bar`.
- **Versiones**: la lista del ejemplo, `2.1 2.2 2.9.1 3.0 2.10rc1`, con `~=2.2` deja dentro del rango `2.2`, `2.9.1` y `2.10rc1` y elige `2.2` y `2.9.1`, porque hay una versión final dentro del rango.

## Procedencia

El motor es puro: recorridos de cadenas y comparaciones, sin reloj, sin red, sin aleatoriedad y sin expresiones regulares con cuantificadores anidados. La entrada está limitada a 20.000 caracteres, 256 por versión, 1024 por conjunto de especificadores y 500 versiones. Incluye vectores de referencia (conjunto `wheel-filename-explainer/2026-10-27a`): 134 filas que cubren 40 versiones aceptadas y 12 rechazadas, dos listas de ordenación (una de ellas, la de la propia especificación), 22 conjuntos de especificadores (muchos de ellos, ejemplos de la propia especificación) y 13 rechazados, 33 nombres de archivo y 12 destinos de intérprete, con cada veredicto tomado de packaging 26.3. Durante el desarrollo, el motor también se comparó con packaging 26.3 sobre entradas generadas: 60.059 versiones, 59.963 conjuntos de especificadores, 30.000 nombres de archivo, 230 destinos y 607.200 comprobaciones de etiqueta frente a regla, sin ninguna discrepancia salvo la regla de nombres más estricta descrita arriba.

## API

El mismo motor responde a la operación `/api/v1/wheel-filename-explainer` de la API HTTP del sitio, descrita en el contrato OpenAPI de la [página de la API](/api); el contrato también indica si este sitio sirve la API.

- **Solicitud.** Texto, en el cuerpo de un POST o en el parámetro de consulta `input` de un GET. Una sola cadena sin espacios que termina en `.whl`, `.tar.gz` o `.zip` (o una URL que apunte a uno) se lee como nombre de archivo; cualquier otra cosa se lee como versiones, una por línea o separadas por espacios o comas, y la primera línea que empieza por `~`, `=`, `!`, `<` o `>` es el conjunto de especificadores.
- **Respuesta.** `mode` (`filename`, `versions`, `empty` o `too-long`). En el modo de nombre de archivo, `filename` contiene `kind`, `fileName`, `parts`, `name`, `expectedName`, `version` (con `normalized`, `epoch`, `release`, `pre`, `post`, `dev`, `local` y las `notes` de la normalización), `build`, las `pythonTags`, `abiTags` y `platformTags` analizadas, las combinaciones `expanded` con su regla `interpreter`, `expandedCount`, `findings` y `valid`. En el modo de versiones, `versions` contiene `entries`, el orden `sorted`, `equalGroups`, el `specifier` analizado y la `selection`. La comprobación del destino es solo una función de la página.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el nombre de archivo tal como se escribió y, cuando la comprobación del destino está abierta, sus seis opciones (implementación, versión de Python, compilación free-threaded, sistema operativo, su versión y arquitectura); en el modo Versiones lleva las versiones y el conjunto de especificadores. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. El cuadro también acepta una URL que apunte a un wheel, y la URL de un índice privado puede llevar credenciales antes de la `@`: pip lee `https://username:password@...`, y un token de una sola parte “as the ‘username’” (como nombre de usuario) sin contraseña ([pip, Authentication](https://pip.pypa.io/en/stable/topics/authentication/), consultado el 2026-11-01). La lectura solo necesita el nombre de archivo del final de la ruta, así que una URL con algo antes de su `@` no recibe enlace: pega solo el nombre de archivo. El usuario de una URL ssh es un nombre de inicio de sesión y no cuenta.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** Se elige el modo y sus campos se rellenan tal como se escribieron; un destino abre la comprobación con esas opciones. Cada opción tiene que ser una de las que ofrece la página; si no, se ignora el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

Todas consultadas el 2026-10-27.

- [Python Packaging User Guide: Binary distribution format](https://packaging.python.org/en/latest/specifications/binary-distribution-format/): la convención de nombres de archivo, el escape y la etiqueta de compilación
- [Python Packaging User Guide: Source distribution format](https://packaging.python.org/en/latest/specifications/source-distribution-format/): el nombre de archivo de un sdist
- [Python Packaging User Guide: Platform compatibility tags](https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/): las etiquetas de Python, de ABI y de plataforma; las etiquetas manylinux, musllinux, de macOS, de iOS y de Android; los conjuntos de etiquetas comprimidos, y cómo los usan los instaladores
- [Python Packaging User Guide: Names and normalization](https://packaging.python.org/en/latest/specifications/name-normalization/)
- [Python Packaging User Guide: Version specifiers](https://packaging.python.org/en/latest/specifications/version-specifiers/) y [PEP 440](https://peps.python.org/pep-0440/)
- [PEP 427](https://peps.python.org/pep-0427/), [PEP 600](https://peps.python.org/pep-0600/), [PEP 656](https://peps.python.org/pep-0656/), [PEP 803](https://peps.python.org/pep-0803/), [PEP 3149](https://peps.python.org/pep-3149/), [PEP 703](https://peps.python.org/pep-0703/), [PEP 783](https://peps.python.org/pep-0783/)
- [Python documentation: C API Stability](https://docs.python.org/3/c-api/stable.html): `abi3` y `abi3t`
- [packaging 26.3: Tags](https://packaging.pypa.io/en/stable/tags.html): el orden de la lista de etiquetas del instalador; [registro de cambios](https://packaging.pypa.io/en/stable/changelog.html): la 26.3 prefiere las etiquetas de plataforma `linux_*` nativas
- [Python developer's guide: Status of Python versions](https://devguide.python.org/versions/): las ramas con soporte que se ofrecen en la comprobación del destino
