## Qué hace

Trabaja con los dos valores que están en el centro de la extensión PKCE de OAuth 2.0. La herramienta genera un `code_verifier` aleatorio y deriva su `code_challenge` con el método S256, o toma un `code_verifier` que pegues y lo comprueba con las reglas de longitud y de caracteres del RFC 7636, derivando el mismo challenge que esperará tu servidor de autorización. La derivación es exactamente el paso de SHA-256 y Base64url que define el estándar, y todo se ejecuta en tu navegador.

## De qué protege PKCE

El flujo de código de autorización de OAuth 2.0 devuelve un código de corta duración a través del navegador del usuario, y en una aplicación móvil o de una sola página otra aplicación puede interceptar esa redirección. PKCE, la clave de prueba para el intercambio de código (“Proof Key for Code Exchange”), cierra ese agujero. Al empezar el flujo, el cliente se inventa un secreto, el `code_verifier`, y con la solicitud inicial solo envía una versión transformada, el `code_challenge`. Cuando más tarde canjea el código por tokens, presenta el `code_verifier` original, y el servidor vuelve a derivar el challenge y comprueba que coincide. Un atacante que roba el código no puede usarlo, porque nunca vio el verifier.

## El verifier y el challenge

- El **code_verifier** es una cadena aleatoria de alta entropía de 43 a 128 caracteres, tomados del conjunto no reservado `A-Z a-z 0-9 - . _ ~`.
- El **code_challenge** se deriva de él. El método recomendado, `S256`, es `BASE64URL(SHA256(ASCII(verifier)))`, la codificación Base64url del resumen SHA-256 del verifier, sin relleno. El método `plain`, en el que el challenge es simplemente igual al verifier, existe para clientes con recursos limitados, pero se desaconseja, porque no protege de nada si alguien observa el challenge.

## Por qué importa ahora

PKCE nació como solución para las aplicaciones móviles, pero hoy es lo mínimo exigible. La buena práctica de seguridad actual de OAuth, el RFC 9700, exige PKCE a todo cliente que use el flujo de código de autorización, no solo a los públicos. Si estás desarrollando o depurando un cliente OAuth, generar aquí un verifier y confirmar su challenge S256 te permite contrastar tu implementación directamente con la especificación.

## Uso

Genera un `code_verifier` nuevo y lee su `code_challenge` `S256`, o pega un verifier que ya tengas para validar su longitud y sus caracteres y derivar el challenge que le corresponde. Como S256 es un hash unidireccional, el challenge no revela nada del verifier.

## Compartir resultados

Debajo de las insignias de validez, **Compartir resultados** ofrece un enlace a esta página para un único verifier: el ejemplo que imprime el [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) en el apéndice B (`dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`, el Ejemplo de la página), que lleva después del `#`. Con cualquier otro verifier, la ventana emergente indica que no hay enlace y por qué.

Un code_verifier es el secreto del flujo. El RFC 7636 (consultado el 2026-11-01) lo presenta como una “cryptographically random key” (clave aleatoria criptográficamente segura) que inutiliza un código de autorización interceptado “since the attacker would not know this one-time key” (porque el atacante no conocería esa clave de un solo uso) (sección 1), y apoya la seguridad del protocolo en que el verifier no sea “learned or guessed by the attacker” (averiguado ni adivinado por el atacante) (sección 7.1). Nada derivado puede sustituirlo, porque esta página lo calcula todo a partir del propio verifier: el challenge sin el verifier no dejaría nada que mostrar. Por eso un enlace solo lleva el verifier cuando es el propio valor de prueba del estándar.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el valor no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El ejemplo rellena el cuadro y la página deriva los dos challenges con Web Crypto, en el navegador. Un enlace que lleva cualquier otro valor se ignora y nunca rellena el cuadro. En cualquier caso, el valor sale de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
