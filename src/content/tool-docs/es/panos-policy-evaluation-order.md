# Orden de evaluación de políticas de PAN-OS

Pega una base de reglas que abarque capas de Panorama y reglas locales del firewall. La herramienta la pone en el orden en que PAN-OS la evalúa de verdad, opcionalmente sigue un flujo hasta la regla que lo decide e indica las reglas que nunca se disparan porque algo por encima de ellas ya coincide. Todo se ejecuta en el navegador.

## El problema que resuelve

Un firewall independiente evalúa una única lista ordenada, y leerla es sencillo. Un firewall gestionado desde Panorama o un tenant de Prisma Access, no. Evalúa por capa y por tipo, en este orden:

1. Reglas previas compartidas
2. Reglas previas del grupo de dispositivos
3. **Reglas locales del firewall**
4. Reglas posteriores del grupo de dispositivos
5. Reglas posteriores compartidas
6. Reglas predeterminadas

Las reglas locales que un administrador puede ver y editar en el firewall quedan en medio de un sándwich que no puede editar en absoluto desde el firewall. Es la sorpresa más habitual en un parque gestionado con Panorama: una regla local que parece perfectamente correcta nunca se ejecuta, porque una regla previa compartida dos capas más arriba ya coincidió y la evaluación se detuvo ahí.

## El sombreado, y por qué las herramientas del propio fabricante no lo indican

El documento de buenas prácticas de políticas de seguridad de Palo Alto es explícito sobre esa carencia, que Commit y Push no informan del sombreado:

> Commit and Push doesn't provide shadowing information.

Una regla amplia colocada por encima de una específica se queda con el tráfico para el que se escribió la específica. La regla específica nunca se dispara. Nada en el push te avisa, y el síntoma aparece más tarde, cuando el tráfico recibe un trato que nadie pretendía.

La herramienta indica el sombreado (shadowing) y marca dos casos en especial. **Cruzar una capa** importa porque una regla local sombreada por una regla previa compartida no se puede ver ni corregir en absoluto desde el firewall; la corrección está en Panorama. **Una acción distinta** importa porque significa que el resultado no es simplemente redundante, sino lo contrario de lo que pretendía la regla sombreada.

La prueba de sombreado es conservadora a propósito. Solo da una regla por sombreada cuando la regla de encima es un superconjunto en todos y cada uno de los campos, es decir, cuando cualquier paquete con el que podría coincidir la regla de abajo ya está tomado. Los solapamientos parciales no se indican, porque a menudo son intencionados, y un informe de sombreado que da falsas alarmas es un informe que nadie lee, lo que sería peor que la postura actual del fabricante de no indicar nada.

## Las reglas predeterminadas no son simétricas

Al final de toda base de reglas hay dos reglas predeterminadas, y hacen cosas opuestas:

- **intrazone-default** permite todo el tráfico dentro de una zona
- **interzone-default** deniega todo el tráfico entre zonas

Un modelo que tratara “no coincidió nada” como una única denegación implícita se equivocaría en todos los flujos dentro de una misma zona. La herramienta aplica la regla predeterminada que corresponde a las zonas e indica cuál usó.

Las dos se pueden modificar para que registren en el log o apliquen perfiles de seguridad, y merece la pena hacerlo: el tráfico que llega a las reglas predeterminadas es tráfico que ninguna regla previó.

## Cómo escribir una base de reglas para la herramienta

Una regla por línea. La capa va primero, a propósito: es justo lo que esta herramienta existe para mostrar, y una gramática que permitiera omitirla te permitiría olvidar precisamente lo que venías a comprobar.

```
shared-pre | block-tor      | deny  | from=any to=any app=tor
dg-pre     | allow-dns      | allow | from=trust to=untrust app=dns svc=application-default
local      | web-out        | allow | from=trust to=untrust app=web-browsing
dg-post    | catch-all-deny | deny  | from=any to=any
```

Los campos son `key=value`, con comas dentro de un valor para las listas. Todo lo que se omite toma el valor `any`, que es lo que hace PAN-OS. Claves aceptadas: `from`, `to`, `src`, `dst`, `app`, `svc`, `user`. Las acciones son `allow`, `deny`, `drop`, `reset-client`, `reset-server`, `reset-both`.

## Qué no hace

No lee tu configuración, no se conecta a Panorama y no recoge nada. No modela el cambio de App-ID a mitad de sesión, los perfiles de seguridad, el NAT (traducción de direcciones de red, network address translation) ni la política de descifrado. Razona sobre el **orden** de las reglas que le das, que es la parte que se decide en el momento del commit y la que cuesta ver.

## Una nota sobre la autorización

Este sitio no declara ninguna autorización ni asociación con Palo Alto Networks. La herramienta razona sobre el orden de evaluación que publica la propia documentación de Palo Alto. Es el análisis de una especificación pública, no material del fabricante, y no cuenta con su respaldo.

## Compartir resultados

Debajo del orden de evaluación, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva la base de reglas tal como se escribió (`#input=...`). El flujo que sigues no va en el enlace, y cuando hay un seguimiento activo la ventana emergente lo indica. Antes de que copies nada, la ventana emergente añade una advertencia: una base de reglas nombra tus zonas, tus direcciones y tus usuarios, así que léela antes de enviar el enlace. Todo lo que lleva el enlace va después del `#`, que según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si la base de reglas es más larga, no hay enlace, y la ventana emergente indica cuánto mediría.
- **Al abrir un enlace.** El enlace tiene la misma forma que los demás enlaces a esta herramienta: las reglas rellenan el cuadro y se evalúan igual que si las hubieras pegado. Como en todo enlace a esta herramienta, el valor se queda después del `#` hasta que cambias o borras el campo, y entonces sale de la dirección de la página sin ninguna solicitud.

## Fuentes

- [Palo Alto Networks, Device Groups](https://docs.paloaltonetworks.com/panorama/getting-started/panorama-overview/centrally-manage-firewall-configuration-and-updates-with-panorama/device-groups) (consultado el 2026-11-11): un firewall evalúa las reglas de política por capa y por tipo, de arriba abajo; las reglas locales del firewall se muestran entre las reglas previas y las posteriores
- [Palo Alto Networks, Security Policy Rulebase Best Practices](https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices/security-policy-best-practices/deploy-security-policy-best-practices/security-policy-rulebase-best-practices) (consultado el 2026-11-11): gana la primera coincidencia y la comparación se detiene; Commit and Push no da información sobre el sombreado
- [Palo Alto Networks, Security Policy Rule Best Practices](https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices/security-policy-best-practices/deploy-security-policy-best-practices/security-policy-rule-best-practices) (consultado el 2026-11-11): definición del sombreado; intrazone-default permite e interzone-default deniega
- [Palo Alto Networks, Defining Policies on Panorama](https://docs.paloaltonetworks.com/ngfw/help/11-1/panorama-web-interface/defining-policies-on-panorama) (consultado el 2026-11-11): las reglas previas se añaden al principio del orden de reglas y se evalúan primero; las posteriores se añaden al final y se evalúan después de las previas y de las reglas locales del firewall
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
