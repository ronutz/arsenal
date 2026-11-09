# Generador de la opción 43 de DHCP

Dale la dirección de una controladora inalámbrica y el fabricante de los puntos de acceso, y devuelve el valor que ese fabricante espera de verdad. Todo se ejecuta en el navegador; la dirección nunca sale de la página.

## Por qué no es solo “pasar una IP a hexadecimal”

El RFC 2132 define la opción 43 como *Vendor Specific Information* (información específica del fabricante) y deja su contenido en manos de cada fabricante: “The definition of this information is vendor specific.” (la definición de esta información es específica de cada fabricante). Solo recomienda una estructura: un fabricante que pone más de un elemento en la opción “SHOULD encode the option using 'Encapsulated vendor-specific options'” (debería codificar la opción con opciones encapsuladas específicas del fabricante), una secuencia de campos de subopción, longitud y valor. Qué significan las subopciones, y cómo se escribe una dirección dentro de ellas, sigue siendo decisión del fabricante. El resultado es que un mismo número de opción transporta al menos cuatro codificaciones incompatibles entre sí, y cuando eliges la equivocada el fallo es del peor tipo: el punto de acceso arranca, obtiene una dirección, lee un valor que no puede interpretar y simplemente nunca se une. No aparece ningún error en ninguna parte.

Las cuatro familias:

**TLV binario**: Cisco y UniFi. La dirección va como cuatro bytes en bruto. `192.168.10.5` se convierte en `c0a80a05`.

**TLV en ASCII**: RUCKUS. La dirección va como *texto*, un byte por carácter, con los puntos incluidos. El artículo 000008703 de la base de conocimiento de RUCKUS expresa la regla como “For each number, the ASCII translation is ‘3’ plus the number in decimal” (para cada número, la traducción ASCII es “3” seguido del número en decimal) y “For the ‘.’ character, the ASCII code is ‘2e’” (para el carácter “.”, el código ASCII es “2e”), y su propio ejemplo escribe `192.168.1.120` como `060d3139322e3136382e312e313230`: subopción `06`, longitud `0d` (13 caracteres) y después los 13 caracteres como texto. Así, 10 escrito como byte binario es `0a`, pero escrito como texto es `31 30`. Son valores distintos y, para un fabricante dado, solo uno de los dos funciona.

**Texto dentro de la subopción 1**: ExtremeWireless. La guía de despliegue de Extreme declara la subopción como `option HAP.HWC code 1 = text;` y su ejemplo lleva dos controladoras en un mismo valor, `"10.100.2.36, 10.100.2.22"`, así que la herramienta escribe la subopción `01`, la longitud y después las direcciones como texto, separadas por una coma y un espacio: ese ejemplo se convierte en `011831302e3130302e322e33362c2031302e3130302e322e3232`.

**Cadena sin más**: Aruba. Nada de hexadecimal. El servidor DHCP envía la dirección como texto, y aquí un valor hexadecimal está mal por muy cuidadosamente que se haya construido.

**Otra opción distinta**: FortiAP. Lee la dirección de la controladora de la opción 138, la opción de controlador de acceso de CAPWAP: “The FortiAP acquires the IP address of an AC in DHCP option 138 (the factory default)” (el FortiAP obtiene la dirección IP de un AC en la opción 138 de DHCP, el valor de fábrica). Fortinet también documenta que “If Option 138 is used for some other purpose on your network, you can use a different option number if you configure the AP units to match.” (si la opción 138 se usa para otra cosa en tu red, puedes usar otro número de opción siempre que configures los AP en consecuencia).

## Uso

Elige primero el fabricante. Ese orden es intencionado: la misma dirección produce cuatro respuestas distintas, así que no hay ningún valor con sentido que leer hasta que se elige el fabricante.

Introduce la IP de administración de la controladora. Cisco acepta varias, separadas por espacios o comas, y las codifica en orden; los demás aceptan una.

El resultado muestra el valor y, para los fabricantes que usan hexadecimal, el detalle byte a byte de cómo se armó (subopción, longitud y después la dirección), para que puedas comprobar la aritmética en lugar de fiarte de ella. Debajo hay líneas listas para pegar en ISC dhcpd, Cisco IOS, Windows Server y MikroTik.

## Lo que te dice y un cuadro hexadecimal no

**Cuando también hace falta la opción 60.** Los puntos de acceso de Aruba solo piden información específica del fabricante cuando coincide el identificador de clase de fabricante (VCI, vendor class identifier), así que la opción 43 sin la opción 60 establecida en `ArubaAP` no hace absolutamente nada. ExtremeWireless también necesita un VCI, y varía según la generación del AP: los modelos antiguos usan `HiPath` seguido del nombre del modelo, y los nuevos, solo el modelo.

**Cuando la respuesta no es hexadecimal.** Para Aruba, la herramienta devuelve una cadena y lo dice, porque devolver un valor hexadecimal de aspecto plausible sería peor que no devolver nada.

**Cuando estás preguntando por la opción equivocada.** Para FortiAP devuelve la opción 138 y explica por qué.

## Compartir resultados

Debajo del valor, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva la dirección o las direcciones de la controladora tal como las escribiste (`#input=192.168.1.10`). El fabricante no va en el enlace: el enlace se abre con el primer perfil, Cisco Wireless LAN Controller, y cuando hay otro fabricante elegido, la ventana emergente indica cuál hay que elegir después de abrirlo. Antes de que copies nada, la ventana emergente añade una advertencia: la dirección de administración de una controladora es topología interna, así que revísala antes de enviar el enlace. Todo lo que lleva el enlace va después del `#`, que según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; una lista de direcciones es mucho más corta.
- **Al abrir un enlace.** El enlace es la misma dirección que usan los demás enlaces a esta herramienta: las direcciones rellenan el campo y se codifican como si las escribieras. Como en todo enlace a esta herramienta, el valor se queda después del `#` hasta que cambias o borras el campo, y entonces sale de la dirección sin ninguna solicitud.

## API

El mismo motor responde a la operación `/api/v1/dhcp-option-43` de la API HTTP del sitio, descrita campo por campo en el contrato OpenAPI de la [página de la API](/api), con ejemplos tomados de los vectores de referencia. El contrato también indica si este sitio sirve la API.

- **Solicitud.** `{"vendor": "<id>", "addresses": "<addresses>"}`. Los ID de fabricante son `cisco-wlc`, `ruckus-zonedirector`, `ruckus-smartzone`, `unifi-ip`, `extreme-wireless`, `extreme-cloudiq-switch`, `aruba` y `fortiap`; las direcciones se separan con espacios, comas o puntos y comas.
- **Respuesta.** `vendor` (el perfil usado: `encoding`, `subOption`, `addressForm`, `multiple`, `vendorClass`, `useOption` y `source`), `addresses`, `option` (43, o 138 para FortiAP), `encoding`, `hex` o `text`, `breakdown`, `serverSnippets` y `notes` (códigos estables).
- **Errores.** HTTP 400, `invalid_input`, con el mensaje del motor: ninguna dirección, un fabricante desconocido, una dirección que no está en notación decimal con puntos estricta, más de una dirección para un fabricante que acepta una sola, o un valor de más de 255 bytes.

Desde el 2026-10-19, `extreme-wireless` responde con un valor hexadecimal con `addressForm` `ascii-list` y `multiple` a true: `{"vendor": "extreme-wireless", "addresses": "10.100.2.36, 10.100.2.22"}` responde `011831302e3130302e322e33362c2031302e3130302e322e3232`. `source.access_date` y `source.unreachable` indican cuándo se leyó por última vez la página de cada fabricante, o por qué no se pudo leer.

## Fuentes

Cada perfil de fabricante se construye a partir de la propia documentación de ese fabricante, y cada vector de referencia nombra un documento que imprime sus bytes, citados tal como se imprimen. Un vector producido por el código que se está probando y atribuido después a un fabricante solo demostraría que el código coincide consigo mismo, así que no hay ninguno así. Dos valores proceden de fuentes secundarias y se marcan como tales: un ejemplo resuelto de Cisco de un repositorio comunitario en Cisco Code Exchange y un ejemplo de RUCKUS de una publicación de la comunidad de RUCKUS. La base de conocimiento de RUCKUS solo da la subopción como “03 or 06” (03 o 06); la asignación de 3 a ZoneDirector procede de una publicación de la comunidad de RUCKUS, así que el vector de ZoneDirector solo fija los dos bytes que imprimen los documentos.

- RFC 2132, sección 8.4, Vendor Specific Information (consultado el 2026-10-19)
- Cisco, documento 97066, *Configure DHCP OPTION 43 for Lightweight Access Points*, actualizado el 22 de julio de 2026 (consultado el 2026-10-19)
- Cisco Code Exchange, README de cisco43calc de Brett Verney, un repositorio comunitario (secundaria; consultado el 2026-10-19)
- Base de conocimiento de RUCKUS, artículo 000008703, *Understanding DHCP Option 43 Hexadecimal code in Ruckus*, actualizado el 6 de mayo de 2020 (consultado el 2026-10-19)
- RUCKUS Networks Community, *How the APs discover the IP address of the controller* y *AP Discovery: How to configure DHCP option 43 to discover the controller*, publicaciones de miembros del equipo de RUCKUS (secundarias; consultadas el 2026-10-19)
- Fortinet, *FortiWiFi and FortiAP Configuration Guide*: *Discovering, authorizing, and deauthorizing FortiAP units* (7.2.5) y *Advanced WiFi controller discovery* (8.0.1) (consultado el 2026-10-19)
- Ubiquiti, artículo de ayuda 204909754, *Layer 3 Adoption for Remote UniFi Controllers* (no se pudo volver a leer el 2026-10-19: el sitio respondió con un desafío antibots)
- Extreme Networks, *ExtremeCloud IQ Controller Deployment Guide*, y la guía de usuario de Fabric Engine para la subopción 226 (las páginas de ExtremeCloud IQ Controller se leyeron con HTTP 200 el 2026-10-18; el 2026-10-19 el sitio de documentación respondió 401 y no se pudieron volver a leer)
- HPE Aruba Networking, opciones de DHCP para puntos de acceso (no se pudo volver a leer el 2026-10-19: acceso denegado)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados

## Una omisión intencionada

Aerohive no se ofrece. Extreme la adquirió en 2019 y la integró en ExtremeCloud IQ, y no se encontró documentación del fabricante sobre una subopción propia de Aerohive, solo afirmaciones de la comunidad. La única subopción 226 documentada pertenece a los switches Fabric Engine que hablan con ExtremeCloud IQ, que son otra clase de dispositivo y responden a otra pregunta. Un valor pegado en el DHCP de producción es el peor lugar posible para acertar más o menos, así que, hasta que exista una fuente del fabricante, Aerohive se queda fuera. Si tienes esa documentación, se puede añadir en una tarde.
