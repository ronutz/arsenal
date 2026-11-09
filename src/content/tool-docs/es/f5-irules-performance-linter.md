## Qué hace

Pega una iRule y el revisor (linter) marca, línea a línea, un pequeño conjunto de antipatrones de rendimiento y de funcionamiento documentados por F5 y detectados con alta confianza, cada uno con su severidad, el token problemático, por qué importa y la corrección. Hace un análisis estático (no analiza la sintaxis de Tcl ni ejecuta nada), así que, a propósito, solo cubre patrones que un análisis por líneas puede detectar de forma fiable y con pocos falsos positivos. No sustituye a la medición: combínalo con la Calculadora del tiempo de ejecución de iRules, que lee estadísticas de tiempo reales, para conocer el costo real de una regla. Todo se ejecuta en local.

## Qué marca

**Las variables del espacio de nombres global** (`$::x`, `set ::x`, la palabra clave `global`) se marcan con severidad ALTA. El validador de F5 detecta la palabra clave `global` desde la v10 y degrada el virtual server a una sola instancia de TMM (degradación de CMP), así que un único procesador gestiona todas las conexiones de ese virtual; las variables globales están obsoletas desde la v10. La forma obsoleta `$::datagroup` es aún peor: en la versión 11 y posteriores, acceder así a un data group provoca un error de ejecución de Tcl y envía un reset al cliente. La corrección es el espacio de nombres `static::`, seguro para CMP, para las constantes compartidas; variables locales normales para los datos de cada conexión, o el comando `class` para los data groups.

**`expr` sin llaves** es una ADVERTENCIA. Tcl sustituye y vuelve a analizar la forma sin llaves, y puede hacer una doble sustitución; poner la expresión entre llaves permite que el compilador de bytecode la optimice. La corrección es `expr { ... }`.

**`matchclass` / `findclass`** son INFO. Los dos quedaron obsoletos en la v10 en favor del comando `class`, que según F5 ofrece mejor funcionalidad y rendimiento. La corrección es `class match` / `class search`.

**`regexp` / `regsub`** son INFO. Las expresiones regulares cuestan bastante más que el trabajo con cadenas fijas; cuando la coincidencia es un prefijo, un sufijo, un valor exacto o un glob simple, `string`, `scan`, `switch -glob` o `class` son más baratos. Si la expresión regular se queda, la vista de portabilidad de la [Caja de herramientas de regex](/tools/regex) enumera las construcciones que se leen de forma distinta en las Advanced Regular Expressions de Tcl, la variante que etiqueta como BIG-IP iRules, que en JavaScript o en PCRE2.

## Qué no marca, a propósito

Las variables `static::` (seguras para CMP), `class match` / `class search` y `expr` entre llaves son correctos y pasan sin hallazgos. La persistencia, las tablas (table) y el comando `session` son compatibles con CMP en las versiones modernas, así que no se tratan como problemas de CMP. Las líneas que son enteramente un comentario se omiten.

## Compartir resultados

Debajo del resumen de hallazgos, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la iRule tal como se pegó, y nada más. Antes de que copies nada, la ventana emergente añade una precaución: una iRule puede nombrar hosts, pools y data groups internos.

Antes incluso de ofrecer un enlace, la página busca en la iRule claves y credenciales escritas tal cual donde las ponen las propias referencias de F5 (todas consultadas el 2026-10-27):

- la frase de contraseña (pass phrase) de `HTTP::cookie encrypt` y `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- una clave en la forma de cadena `AES 128 <hex>`, o la clave de `AES::encrypt` y `AES::decrypt` escrita tal cual ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- el valor de `-key` o `-keyhex` en `CRYPTO::encrypt`, `decrypt`, `sign` y `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- un encabezado `Authorization` o `Proxy-Authorization` escrito con `HTTP::header insert` o `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), cuyo valor el [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (secciones 11.6.2 y 11.7.2) define como las credenciales;
- un literal asignado con `set` a una variable que se usa en uno de esos lugares, como en el propio ejemplo de `CRYPTO::encrypt`;
- y, por la comprobación de secretos del sitio, una clave privada PEM, un JWT, un ID de clave de acceso de AWS o una contraseña en una URL.

Si la página encuentra alguno, no hay enlace: la ventana emergente nombra la línea, y tú sustituyes el valor por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (`set static::api_token "..."`) no impide el enlace; en su lugar, la línea de precaución lo nombra. Ninguna comprobación encuentra todos los secretos, así que lee lo que envías.

Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si la iRule es más larga, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado, y la página lo lee igual que lee lo pegado; la iRule nunca se ejecuta. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.
