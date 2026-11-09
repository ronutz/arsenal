## Qué hace

Pega una ruta RESTCONF de F5OS y la herramienta la decodifica segmento a segmento: la raíz de la API, los prefijos de módulo YANG, la jerarquía de contenedores y las claves de lista como `tenant=tenant1`. Nombra los módulos que reconoce y dice qué gobierna cada uno. Solo analiza el texto de la ruta: no se descarga nada, no se consulta ningún esquema y nada sale del navegador.

## Por qué hay que decodificar una ruta de F5OS

F5OS, la capa de plataforma que hay debajo de los tenants en VELOS y rSeries, se gestiona con **RESTCONF** (RFC 8040) sobre datos modelados en **YANG**, no con iControl REST sobre el modelo de objetos de TMOS. Alguien que domina `/mgmt/tm/ltm/virtual` se encuentra con `/restconf/data/f5-tenants:tenants/tenant=tenant1/config` y no tiene forma de saber qué parte es un módulo, cuál es un contenedor y cuál selecciona una instancia. Es un problema de vocabulario más que de dificultad, y es lo que elimina esta herramienta.

## El prefijo de módulo y la convención de prefijos

`f5-tenants:tenants` es el nodo `tenants` del módulo YANG `f5-tenants`. F5OS usa módulos **OpenConfig**, neutrales respecto al fabricante (`openconfig-system`, `openconfig-interfaces`, `openconfig-vlan`), junto a los módulos `f5-` propios de F5. **Solo el primer nodo de un módulo lleva el prefijo**; los nodos que cuelgan de él se escriben sin prefijo porque lo heredan. Un prefijo que reaparece a mitad de una ruta significa que la ruta ha pasado a otro módulo, y es lo más útil en lo que fijarse al leer una.

## Claves de lista y la dualidad de puertos

RESTCONF direcciona una entrada de lista poniendo su clave en la ruta, así que `tenant=tenant1` selecciona un tenant de la lista `tenants`, en lugar de hacerlo con un parámetro de consulta. La herramienta las marca aparte de los contenedores simples.

También explica la disposición de puertos que confunde a la gente: F5OS expuso originalmente RESTCONF en el **puerto 8888** bajo `/restconf`, y desde **F5OS 1.8** la misma API está accesible en el puerto HTTPS estándar bajo `/api`. Dos rutas que parecen distintas pueden apuntar al mismo recurso. La versión es la que indica el propio DevCentral de F5, donde un codeshare de diciembre de 2022 sobre la automatización de copias de seguridad de F5OS recoge que, desde F5OS 1.8, la forma `:8888/restconf` se puede sustituir por `:443/api`; las notas de la versión de F5OS-A 1.8.0 incluyen una corrección equivalente, 1572137-2, para que la API de carga y descarga funcione tanto con `/api` como con `/restconf`. Las guías de automatización de rSeries y VELOS de F5 documentan las dos puertas de entrada sin nombrar ninguna versión. La autenticación usa un encabezado `X-Auth-Token`, y ese token es a su vez un JWT, así que caduca.

## Qué no hace

La tabla de módulos es finita y corta a propósito. Si una ruta usa un módulo que la herramienta no conoce, decodifica la estructura y **dice que el módulo no se reconoce en lugar de describirlo a ciegas**. Tampoco valida nada contra un esquema, porque no tiene ninguno: no puede decirte si un nodo existe en tu versión de F5OS, solo cómo está construida la ruta que escribiste.

## Uso

Pega una ruta sola, una URL completa o una ruta con cadena de consulta. Los parámetros de consulta se apartan y se nombran, porque matizan la solicitud en lugar de identificar el recurso.

## Compartir resultados

Debajo del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como se escribió, y nada más. Su ventana emergente dice primero qué lleva el enlace y después da una precaución propia: una dirección completa nombra el host y el puerto de administración de tu plataforma, así que léela antes de enviar el enlace. Después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Una dirección también puede contener una contraseña antes de su `@` (`https://admin:secret@host:8888/...`). El [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.2.1, consultado el 2026-10-27) declara obsoleto el formato “user:password” en el campo userinfo y dice que las aplicaciones “should not render as clear text any data after the first colon” (no deberían mostrar en claro ningún dato posterior a los primeros dos puntos). Esta página la mostraría como parte del host, así que, mientras lo pegado contenga una, no hay enlace; quítala y vuelve a presionar. Un nombre de usuario solo (`admin@host`) sí va.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página lo lee; no se envía nada a ninguna parte. Después, el valor sale de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
