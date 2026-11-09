## Qué hace

Pega un fragmento de un `bigip.conf` de BIG-IP y la herramienta lo analiza y explica cada objeto en lenguaje llano, junto con la estructura que los une. Solo lee la configuración, por completo en tu navegador; no cambia nada y no se conecta a ningún equipo.

## Cómo es una configuración de BIG-IP

BIG-IP guarda su configuración como objetos de tmsh, y todos siguen una misma forma:

    <module> <component> [<type>] <name> {
        <key> <value>
        <key> { <nested body> }
        <bare-list-item>
    }

Las primeras palabras sitúan el objeto en la jerarquía de módulos y componentes de BIG-IP (`ltm virtual`, `ltm pool`, `net vlan`, etc.), el nombre lo identifica y las llaves contienen sus campos. Dentro de un cuerpo, los saltos de línea separan las entradas, los bloques entre llaves se pueden anidar a cualquier profundidad, las cadenas entre comillas pueden contener espacios y un `#` inicia un comentario. Una secuencia con barra invertida dentro de comillas se muestra tal como está escrita: la cadena send de un monitor contiene `\r\n`, y el BIG-IP convierte cada `\r` en un retorno de carro y cada `\n` en un salto de línea solo cuando da formato a la solicitud ([F5 K2167](https://my.f5.com/manage/s/article/K2167), consultado el 2026-10-27). La herramienta sigue exactamente esta gramática para dividir un fragmento en sus objetos y cada objeto en sus campos.

## Qué explica

En lugar de dejar que reconozcas cada campo por tu cuenta, la herramienta describe qué significan los objetos y los ajustes habituales: el `destination`, el `pool`, los `profiles` y la `source-address-translation` de un virtual server; los `members`, el `monitor` y el `load-balancing-mode` de un pool; y los muchos otros objetos que une una configuración. El resultado es un mapa legible de lo que hace realmente una configuración, útil cuando heredas un equipo, revisas un cambio o aprendes el modelo de objetos.

## Lo único que no es tmsh

Hay una excepción deliberada. Un objeto `ltm rule` lleva una iRule de Tcl en su cuerpo, y ese cuerpo es un script, no configuración de tmsh. El analizador lo reconoce y captura la iRule literalmente en lugar de intentar analizarla como objetos y campos, así que tu regla se conserva exactamente como está escrita en vez de quedar destrozada.

## Uso

Pega un fragmento de `bigip.conf`, desde un solo objeto hasta un bloque grande, y lee el desglose estructurado y explicado. El análisis es determinista y local, así que también es una forma segura de leer una configuración exportada de un equipo que no puedes o no debes consultar directamente.

## Compartir resultados

Debajo del resumen de lo encontrado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la configuración con el valor de cada ajuste secreto sustituido por `[redacted]`, nunca tal como se pegó, porque esta página muestra el valor de cada campo. Su ventana emergente dice primero qué lleva el enlace y cuántos valores se sustituyeron, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Los ajustes son `password` (los monitores, [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html): “the password if the monitored target requires authentication”, la contraseña si el destino monitoreado requiere autenticación), `passphrase` ([client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), server-ssl, sys file ssl-key), `secret` ([auth radius-server](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_radius-server.html), auth tacacs, ltm monitor radius), `bind-pw` ([auth ldap](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_ldap.html)), `preshared-key` ([net ipsec ike-peer](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/net/net_ipsec_ike-peer.html)), los `community-name`, `community` y `trap-community` de SNMP ([sys snmp](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_snmp.html)), y cada ajuste cuyo nombre termine en `-password`, `-passphrase` o `-secret` (`encrypted-password`, `auth-password`, `privacy-password`, [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html), [`encrypt-cookie-secret`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_http.html), `proxy-ca-passphrase`); páginas de referencia de tmsh de F5, consultadas el 2026-10-27. La cadena `send` de un monitor conserva su texto, salvo las credenciales de un encabezado `Authorization` o `Proxy-Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2, consultado el 2026-10-27), que también pasan a ser `[redacted]`. `none` se mantiene. `[redacted]` es una sola palabra de tmsh, así que la copia se lee como los mismos objetos, campos y anidamiento: los vectores de compartir de la herramienta comprueban que la página que recibe el enlace analiza el mismo árbol. Los nombres, las direcciones y las particiones van tal como se pegaron.

El cuerpo de una iRule (`ltm rule`) es Tcl, que aquí se muestra literalmente, y va tal como se pegó: cuando la configuración contiene una, la ventana emergente lo indica, para que antes puedas revisar si tiene un token o una contraseña escritos en el código. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página la explica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Herramientas relacionadas

- Un monitor Scripted (`ltm monitor scripted`) reproduce un archivo de líneas send y expect guardado en `/config/eav/`; el [Explicador de monitores Scripted de BIG-IP](/tools/bigip-scripted-monitor-explainer) lee ese archivo y simula la comprobación contra la transcripción de un servidor.
- Para recoger la configuración de un BIG-IP mediante un script, el [Generador de scripts de Expect](/tools/expect-script-builder) escribe un script que inicia sesión y ejecuta comandos con un perfil de tmsh, que desactiva el paginador de tmsh con `modify /cli preference pager disabled display-threshold 0`.
