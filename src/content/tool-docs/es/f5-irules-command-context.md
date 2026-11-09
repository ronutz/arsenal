# Explicador de contextos de comandos de iRules

Una iRule es Tcl con un contrato: el código se ejecuta cuando se disparan los eventos, los comandos son válidos en unos eventos y no en otros, y unas cuantas construcciones te cuestan, sin hacer ruido, todos los núcleos de CPU menos uno. Esta herramienta te lee ese contrato.

Pega una iRule y cada bloque `when` se muestra como una tarjeta. La identidad del evento procede de la Master List of iRule Events de clouddocs, condensada con fidelidad, con su módulo y un enlace a su página de referencia; los eventos que no están en la tabla seleccionada del ámbito de BIG-IP LTM (Local Traffic Manager) se siguen analizando y se señalan, en lugar de adivinar. Los comandos del bloque se inventarían, con espacio de nombres o sin él, cada uno enlazado directamente a su página de referencia.

Cuando un evento aparece en más de un bloque, el orden de evaluación se muestra según las reglas documentadas del comando priority: valores de 0 a 1000, 500 de forma predeterminada, se ejecuta antes el menor, a igual prioridad se ejecutan por orden de inserción y, entre varias iRules de un mismo virtual, el orden en que se listan las reglas resuelve los empates que queden.

La auditoría de CMP es la parte que justifica la herramienta, y cada hallazgo remite a la página CMP Compatibility. Las variables globales no son compatibles con CMP; desde la v10, el validador detecta la forma global y el virtual server se degrada, lo que significa que cada conexión que transporta acaba en un solo TMM. La alternativa documentada para los valores estáticos compartidos es el espacio de nombres `static::`, y la herramienta lo dice en cuanto lo ve. Las claves generadas en RULE_INIT tienen una instancia por TMM, así que el descifrado entre TMM distintos falla; los perfiles de estadísticas cuentan por instancia de TMM. La auditoría nombra cada uno de estos casos donde los ve.

Una nota de honestidad, incorporada a propósito: las listas de los eventos en los que es válido cada comando están en la propia página de referencia de cada comando y varían según la versión, así que la herramienta enlaza la página de cada comando en lugar de reproducir tablas de validez que no ha verificado. Un solo nombre de evento muestra su tarjeta; la palabra `events` muestra el catálogo agrupado por módulos.

La iRule se analiza y se lee, nunca se ejecuta. Todo se ejecuta en local; nada de lo que pegas sale de la página.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro (una iRule, un nombre de evento o `events`) tal como se pegó, y nada más. Antes de que copies nada, la ventana emergente añade una precaución: una iRule puede nombrar hosts, pools y data groups internos.

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
