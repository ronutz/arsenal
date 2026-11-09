## Qué hace

En un BIG-IP, “¿esto empieza en 0 o en 1?” no tiene una respuesta única. Tcl, el lenguaje que hay debajo de las iRules, cuenta todas las posiciones desde 0. Varios comandos que añadió F5 cuentan desde 1. Los contadores devuelven 1 para el primer elemento. Muchos ceros de la configuración son valores y no posiciones. El buscador reúne 76 de estos lugares, cada uno con su fuente, para que puedas comprobar justo el que vas a usar.

Tiene dos modos:

- **Consultar** lista los lugares, agrupados por parte del sistema: Tcl dentro de las iRules, los comandos que F5 añade a las iRules, los objetos de configuración, la plataforma y el hardware, las API, y el registro de eventos y la captura de paquetes. Busca por comando o por término, o filtra según dónde empieza la cuenta.
- **Traducir una posición** toma una posición tal como la cuenta la gente, donde 1 es la primera, la convierte en el número que necesita cada comando, ejecuta cada comando en el motor didáctico de Tcl 8.4.6 del sitio y muestra al lado la versión con el desfase de uno (off-by-one).

## Cómo leer una entrada

- **La insignia** indica cómo cuenta ese lugar: `0` empieza en 0, `1` empieza en 1, `←` cuenta desde la derecha (`end`, `end-1`, los N últimos), `0·1` significa que las dos bases coinciden en el mismo lugar, `=0` significa que 0 es un valor con significado (predeterminado, sin límite, todo, éxito, igual) y `n` significa un recuento que es fácil confundir con una posición.
- **Cuenta**, **Primero**, **Último** y **Si no hay nada** dicen qué se cuenta, cómo llegar al primer y al último elemento y qué se devuelve cuando no hay nada (-1, 0 o una cadena vacía).
- **Ejemplo** muestra el código y lo que devuelve. Cada ejemplo de Tcl se ejecutó en un tclsh 8.4.6 real.
- **Cuidado** es la trampa por la que se conoce esa entrada.
- **Las páginas de F5 no coinciden** aparece cuando dos afirmaciones de F5 no pueden ser ciertas a la vez.
- **Grado de certeza** distingue cuatro niveles: lo afirma el manual de Tcl y se ejecutó en tclsh 8.4.6; lo afirma la fuente; solo lo muestra un ejemplo de la página de la fuente; y dos afirmaciones de F5 que no coinciden.
- **Fuentes** lista todas las páginas en las que se basa la entrada, con la fecha en que se consultaron.

## Reglas prácticas

1. Las posiciones de Tcl cuentan desde 0, y `end` es el último índice, la longitud menos uno.
2. Los números de F5 de tipo campo cuentan desde 1: los campos de `getfield`, las profundidades de `URI::path`, los índices de segmentos de ruta de las políticas de LTM y el `matchclass` heredado.
3. Los contadores devuelven 1 para el primer elemento: `HTTP::request_num`, `table incr`.
4. Muchos ceros son valores, no posiciones: el route domain 0, el puerto 0, `connection-limit 0`, el 0 de `SSL::verify_result` y el `0.0` de tcpdump.
5. Lo más bajo va primero casi en todas partes (la prioridad de los eventos, los ordinales de las políticas, el orden de BIG-IP DNS, la gravedad de syslog), salvo en los grupos de prioridad de los pools, donde gana lo más alto.
6. En un `if`, 0 es falso y cualquier otro número es verdadero, -1 incluido: compara un índice con `>= 0` en lugar de evaluarlo directamente, y guarda tus propios indicadores como 0 o 1, como pide la iRules Style Guide de DevCentral.

## El traductor

Elige una pregunta y da un valor y N (1 es el primero):

- **El carácter número N**: `string index` y `string range` con N-1, y el `substr` de F5, junto a `string index` con N.
- **El campo número N tras dividir**: el `getfield` de F5 con N, y `split` seguido de `lindex` con N-1, junto a los dos contados de forma equivocada.
- **El segmento número N de una ruta**: los mismos dos comandos, teniendo en cuenta el trozo vacío que hay antes de una barra inicial, junto a la versión que lo olvida.
- **Las últimas N etiquetas de un nombre de host**: el `domain` de F5, y `split`, `lrange` desde el final y `join`, junto a la versión que toma una etiqueta de más.
- **El elemento número N de una lista de Tcl**: `lindex` con N-1, junto a `lindex` con N.
- **Dónde aparece primero un texto**: `string first` y la prueba `>= 0`, junto a un `if` sobre el propio índice.

Cada fila se marca como **Su propia numeración** (el número correcto para ese comando), **Desfase de uno** o **Una respuesta relacionada**. La respuesta de arriba es lo que devolvió la primera fila correcta, y aparece una nota cuando las filas correctas no coinciden entre sí. Las notas explican los casos que cambian los números: un valor que empieza por el separador, una ruta con cadena de consulta (`HTTP::uri` la incluye y `HTTP::path` no), un separador de más de un carácter (`split` trata cada carácter como separador y `getfield` usa la cadena entera) y una coincidencia en el índice 0 o un fallo en -1.

## Dónde no coinciden las páginas de F5

Al leer las fuentes con atención aparecieron lugares en los que dos afirmaciones de F5 no pueden ser ciertas a la vez. Ninguno se probó en un BIG-IP para esta herramienta, así que trata cada uno como una pregunta que comprobar en tu versión: el recuento 0 de `substr`, los comentarios del ejemplo de `URI::path`, el valor de `matchclass` cuando no hay coincidencia, el rango de la página de `priority`, el nombre de variable del ejemplo de `DNSMSG::record`, la descripción de iControl REST del ordinal de una política, el orden de las listas de control de acceso (ACL, Access Control List) de APM y la prioridad que indica `LB::server` para un miembro que no tiene ninguna configurada. Cada conflicto aparece en su entrada, con las dos fuentes.

## Compartir resultados

Debajo de la primera respuesta de cada modo (el número de coincidencias en Consultar, la respuesta en Traducir), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los campos de ese modo como valores con nombre: en Consultar, `search`, `base` y `area` cuando están definidos (sin palabras y sin filtro no hay nada que compartir, y el botón está desactivado); en Traducir, `mode=translate`, `question`, `value` y `n`, `sep` o `needle`, según los use la pregunta. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; cada uno se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Longitud.** Los campos tienen como máximo 2000 caracteres (el valor), muy por debajo de los 16.384 que el sitio admite después del `#`.
- **Al abrir un enlace.** Se abre el modo, se rellenan sus campos y la página calcula como al escribir; el motor didáctico de Tcl 8.4.6 se ejecuta en la página y no se descarga nada. Un campo del otro modo, una base, un área o una pregunta desconocidas, un valor que supera el límite de su campo o un N fuera del rango de 1 a 1000 hacen que se ignore el enlace entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Límites

- El traductor admite un valor de hasta 2000 caracteres, un N de 1 a 1000, un separador de hasta 20 caracteres y un texto de búsqueda de hasta 200 caracteres, y cada comando se detiene tras 200 pasos.
- Los comandos de F5 del traductor se comportan como los describen las páginas de F5. Cuando una página no dice nada, la fila lo indica: la página de `getfield` de F5 no tiene ningún ejemplo en el que la cadena empiece por el separador, así que la lectura que hace la herramienta de ese caso se marca como suposición.
- Las entradas de plataforma, de configuración y de API salen de la documentación de F5 y no se probaron en hardware para esta herramienta.
- Todo se ejecuta en tu navegador. No se envía nada a ningún sitio y no se ejecuta nada en un BIG-IP.

## Fuentes

La herramienta lista cada fuente con la fecha en que se consultó, 109 en total. Las principales:

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultado el 2026-10-03)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (consultado el 2026-10-03)
- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consultado el 2026-10-03)
- [Tcl 8.4 manual: lindex](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lindex.htm) (consultado el 2026-10-03)
- [Tcl 8.4 manual: split](https://www.tcl-lang.org/man/tcl8.4/TclCmd/split.htm) (consultado el 2026-10-03)
- [Tcl 8.4 manual: if](https://www.tcl-lang.org/man/tcl8.4/TclCmd/if.htm) (consultado el 2026-10-03)
- [F5 iRules reference: getfield](https://clouddocs.f5.com/api/irules/getfield.html) (consultado el 2026-10-03)
- [F5 iRules reference: substr](https://clouddocs.f5.com/api/irules/substr.html) (consultado el 2026-10-03)
- [F5 iRules reference: domain](https://clouddocs.f5.com/api/irules/domain.html) (consultado el 2026-10-03)
- [F5 iRules reference: URI::path](https://clouddocs.f5.com/api/irules/URI__path.html) (consultado el 2026-10-03)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (consultado el 2026-10-03)
- [F5 tmsh reference: ltm policy](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_policy.html) (consultado el 2026-10-03)
- [F5 tmsh reference: ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html) (consultado el 2026-10-03)
- [F5 K411: Overview of packet tracing with the tcpdump utility](https://my.f5.com/manage/s/article/K411) (consultado el 2026-10-03)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (consultado el 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): la sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
