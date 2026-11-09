## Qué hace

Calcula el registro TXT exacto que publicas para superar un desafío dns-01 de ACME. Pega el token del desafío y la clave de tu cuenta ACME, como JWK o como su huella digital (thumbprint), y devuelve el nombre de registro `_acme-challenge`, el valor que va en el registro TXT y los pasos intermedios de los que se deriva: la autorización de clave (key authorization) y la huella. Todo se ejecuta en tu navegador con el SHA-256 nativo de Web Crypto; tu clave nunca sale de la página y solo se usan sus miembros públicos.

## Por qué existe dns-01

ACME (RFC 8555) automatiza la emisión de certificados con un desafío: demostrar que controlas un dominio. El desafío dns-01 lo hace a través del DNS: publicas un registro TXT concreto bajo el dominio y la CA lo consulta. A diferencia de http-01, dns-01 no necesita ninguna conexión entrante a tu servidor, así que funciona detrás de un firewall o de un balanceador de carga, y es el único tipo de desafío que puede validar un nombre comodín (wildcard).

## El cálculo

El valor del registro no es arbitrario: la CA lo vuelve a calcular a partir de la clave de tu cuenta, y eso es lo que vincula el desafío contigo. La cadena tiene tres pasos. Primero, se toma la huella SHA-256 de la clave pública de tu cuenta en la forma canónica que define el RFC 7638 y se codifica en base64url. Segundo, la autorización de clave se forma uniendo el token y esa huella con un punto: `token.thumbprint`. Tercero, el valor del registro TXT es el base64url del resumen SHA-256 de la autorización de clave. El registro se publica en `_acme-challenge.<domain>`; un comodín como `*.example.com` se valida bajo `_acme-challenge.example.com`.

## Solo se usa tu clave pública

La huella del RFC 7638 se calcula solo sobre los miembros públicos obligatorios de la clave: en una clave EC, la curva y las coordenadas x e y; en una clave RSA, el módulo y el exponente. Tu clave privada nunca hace falta para calcular el registro, así que conviene que pegues solo el JWK público. Si pegas una clave completa, sus campos privados se ignoran y nunca se muestran.

## Uso

Introduce el token del desafío y la clave de tu cuenta y, si quieres ver el nombre completo del registro, el dominio. Publica el valor devuelto como registro TXT en `_acme-challenge.<domain>`, espera a que se propague y deja que tu cliente ACME continúe. El mismo token y la misma clave producen siempre el mismo valor, así que puedes comprobar lo que publica tu cliente comparándolo con lo que calcula esta herramienta.

## Compartir resultados

Debajo del registro, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva tres valores después del `#`: el token del desafío, la huella de la clave de la cuenta (la que calculó la página o la que escribiste) y el dominio. Nunca lleva el cuadro de la clave: un archivo de clave de cuenta contiene el miembro privado `d` junto a los públicos, y el enlace no lleva ninguno de ellos. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Nada de lo que lleva es secreto. Según el [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555) (consultado el 2026-10-27), la autorización de clave (el token y la huella unidos por un punto) se sirve en claro en `/.well-known/acme-challenge/<token>` para el desafío http-01 (sección 8.3), y el registro dns-01 demuestra el control del DNS del dominio, que el enlace no da (sección 8.4). Según el [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638) (sección 3.2.1, consultado el 2026-10-27), la huella de una clave privada es la de su clave pública, así que el enlace identifica la clave sin contenerla. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Al abrir un enlace.** El token y el dominio rellenan sus cuadros y la huella va al cuadro de la clave, que la admite; la página calcula el registro igual que con un pegado, con Web Crypto en el navegador. Un token o una huella con caracteres fuera del alfabeto base64url que exige la página hace que se ignore el enlace entero. En ambos casos, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
- **Prueba.** Las comprobaciones de uso compartido del sitio generan el enlace a partir de una clave de cuenta privada (el ejemplo P-256 del RFC 7515, con `d` incluido) y confirman que en él no aparecen ni `d`, ni un miembro público, ni el propio JWK, ya sea tal cual, con codificación por porcentaje, codificados como formulario o decodificados.
