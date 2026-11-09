## Qué hace

Lee un modo de archivo escrito de cualquiera de las tres formas en que se suele escribir y devuelve todas las demás, con su lectura. Las tres formas:

- **Octal**, de uno a cinco dígitos: `755`, `0644`, `4755`, `02775`, `00755`. El cuarto dígito por la derecha son los bits especiales (4 set-user-ID, 2 set-group-ID, 1 borrado restringido o sticky); los tres de su derecha son propietario, grupo y otros, cada uno la suma de lectura 4, escritura 2 y ejecución 1.
- **Una cadena de ls**, de nueve caracteres o de diez con la letra del tipo: `rwxr-xr-x`, `-rwsr-xr-x`, `drwxrwxrwt`, `rwSr--r--`. Una `d` inicial establece el tipo como directorio.
- **Cláusulas de chmod** aplicadas a un modo base con una umask: `u+x,go-w`, `a=rX`, `g+s,o-rwx`, `=755`. La base es 644 para un archivo y 755 para un directorio, salvo que indiques otra; la umask es 022, salvo que indiques otra.

Para el modo que lee, la página muestra los cuatro dígitos octales y la cadena de ls de diez caracteres; los doce bits en una cuadrícula en la que puedes hacer clic para invertirlos; la lectura en lenguaje llano por clase (qué pueden hacer el propietario, el grupo y los otros, redactada para un archivo o para un directorio); los tres bits especiales con lo que significa cada uno para ese tipo; las combinaciones que merecen una segunda mirada; los comandos chmod que llegan a ese modo (octal absoluto, simbólico absoluto y el cambio mínimo desde la base); la umask que crearía el modo a partir del valor predeterminado de un programa; y, para las cláusulas, una traza del modo después de cada una.

## Las reglas que sigue

- **La gramática simbólica es la de POSIX.** Clases `u`, `g`, `o` y `a`; operadores `+`, `-`, `=`; permisos `r`, `w`, `x`, `X`, `s`, `t`; o una clase de la que copiar, `u`, `g` u `o`. Una lista de clases puede ir seguida de varias acciones (`u+r-w`), y las cláusulas se separan con comas.
- **`X`** activa la ejecución “if the file is a directory or if the current file mode bits have at least one of the execute bits set” (si el archivo es un directorio o si los bits de modo actuales tienen activado al menos uno de los bits de ejecución; POSIX chmod). En un archivo normal sin ningún bit de ejecución, `a+X` no cambia nada, y la traza lo indica.
- **`=`** primero borra los bits de las clases nombradas (los doce si no se nombra ninguna clase) y después activa los permisos indicados. `o=` sin nada detrás borra los bits de los otros.
- **Sin clase nombrada** significa las tres, “but bits that are set in the umask are not affected” (pero los bits activados en la umask no se ven afectados) para `+` y `-` (chmod(1)); la calculadora aplica la umask que indiques, 022 de forma predeterminada, y avisa cuando enmascaró algo.
- **`s`** sigue a la clase: con `u` es set-user-ID, con `g` set-group-ID y solo con `o` no cambia nada (POSIX). **`t`** es el indicador de borrado restringido (restricted deletion flag) y se aplica sea cual sea la clase nombrada, como hace GNU chmod.
- **Las letras de ls son las de POSIX.** `s` donde set-user-ID o set-group-ID están activados y la clase puede ejecutar, `S` cuando no puede; `t` donde el indicador de borrado restringido está activado y los otros pueden buscar en el directorio, `T` cuando no pueden.
- **Regla de directorios de GNU.** Cuando la base es un directorio, un modo numérico de hasta cuatro dígitos conserva los bits set-user-ID y set-group-ID de la base, como dice chmod(1): “For directories chmod preserves set-user-ID and set-group-ID bits unless you explicitly specify otherwise.” (En los directorios, chmod conserva los bits set-user-ID y set-group-ID salvo que indiques explícitamente lo contrario). Escribir `00755`, `-6000` o `=755` los borra, y la traza nombra la regla cuando se aplicó.
- **Los modos numéricos con operador** (`=755`, `+111`, `-022`) se leen como los lee GNU: establecer exactamente, añadir, quitar.

## Lectura de los bits especiales

| Bit | Valor | En un archivo | En un directorio |
|---|---|---|---|
| set-user-ID | 4000 | el proceso se ejecuta con el ID de usuario efectivo del propietario | sin significado portable |
| set-group-ID | 2000 | el proceso se ejecuta con el grupo del archivo | las entradas nuevas toman el grupo del directorio (en la mayoría de los sistemas) |
| borrado restringido o sticky | 1000 | hoy sin significado portable; algunos sistemas antiguos mantenían el texto del programa en el área de intercambio (swap) | solo el propietario de una entrada, el propietario del directorio o un usuario con privilegios pueden quitarla o cambiarle el nombre |

Las mayúsculas son las que hay que vigilar: `S` significa que el bit especial está activado pero el bit de ejecución correspondiente no, así que el bit no hace nada hasta que se conceda la ejecución; `T` significa que el indicador de borrado restringido está activado en un directorio en el que los otros no pueden buscar.

## La línea de la umask

Un programa que crea un archivo pide 666 y uno que crea un directorio pide 777; el kernel borra los bits activados en la umask del proceso. Así, la calculadora puede decir qué umask crea el modo que escribiste, y cuándo no lo crea ninguna: un modo de archivo con un bit de ejecución nunca resulta solo de la creación, y los bits especiales nunca vienen de una umask.

## Límites

- La calculadora conoce los doce bits de modo, no el sistema de archivos. No ve la propiedad, las listas de control de acceso, las capabilities, las opciones de montaje, los atributos de inmutabilidad ni el control de acceso obligatorio, y cualquiera de ellos puede anular lo que dicen los bits.
- Los comportamientos propios de GNU se modelan como los describe chmod(1) de coreutils 9.11. Otras implementaciones pueden tratar de otra forma un modo numérico sobre un directorio, o `=755`.
- Si borrar todos los bits de ejecución borra también set-user-ID y set-group-ID depende de la implementación (POSIX chmod); la calculadora no los borra por su cuenta.
- Cada campo se corta a 64 caracteres.

## Compartir resultados

Debajo de las dos formas principales, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el modo tal como lo escribiste (octal, una cadena de `ls` o cláusulas de chmod), si es un archivo o un directorio, y el modo base y la umask cuando los rellenaste; si se dejan en blanco, cada uno significa su valor predeterminado en ambos extremos. Un modo no nombra nada tuyo. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** Los cuatro campos se rellenan como si los escribieras y la página lee el modo. Un modo en blanco, un tipo desconocido o un campo más largo que el de la página (64 caracteres) hacen que se ignore el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [POSIX.1-2024 (IEEE Std 1003.1-2024): chmod](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/chmod.html) (consultado el 2026-10-03)
- [POSIX.1-2024 (IEEE Std 1003.1-2024): ls](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/ls.html) (consultado el 2026-10-03)
- [GNU coreutils manual: Mode Structure](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html) (consultado el 2026-10-03)
- [chmod(1), GNU coreutils 9.11, man7.org](https://man7.org/linux/man-pages/man1/chmod.1.html) (consultado el 2026-10-03)
