# Explicador de métodos de SSO de APM

Después de la autenticación, el trabajo de BIG-IP Zero Trust Access (antes BIG-IP APM, Access Policy Manager) es seguir autenticándote, y el capítulo Single Sign-On Methods define exactamente ocho formas de hacerlo: HTTP Basic, NTLMv1, NTLMv2, delegación restringida de Kerberos (Kerberos constrained delegation), Form Based, Forms - Client Initiated, OAuth Bearer y SAML. La herramienta muestra cada una en una tarjeta con su mecanismo, el recorrido de sus credenciales, sus requisitos previos y sus particularidades, todo resumido con fidelidad a partir del capítulo y de las guías específicas de cada método.

El veredicto de cada tarjeta es el propio párrafo del capítulo sobre el alcance del impacto, y es el titular operativo: un objeto de SSO mal configurado para HTTP Basic, NTLMv1, NTLMv2, Kerberos, OAuth Bearer o SAML puede desactivar el SSO de todos los métodos de autenticación de la sesión de ese usuario. Form Based y Forms - Client Initiated son los dos únicos métodos que no se desactivan cuando se rompe el objeto de otro método. Basta una configuración de SSO de Kerberos errónea para que todas las aplicaciones de la sesión puedan perder su SSO; con una configuración de formulario errónea, solo lo pierde esa aplicación. Esa asimetría decide con cuánto cuidado merece tratarse cada clase de objeto.

La tarjeta de Kerberos lleva la lista completa de requisitos previos: una cuenta de delegación en Active Directory por cada realm de servidor, su SPN introducido como Account Name en formato SPN, el realm en mayúsculas, Resource-Based Constrained Delegation para entornos con varios realms y la frase del propio manual, digna de enmarcar: el SSO de Kerberos de APM no necesita ni usa un archivo keytab. Sus puertas de entrada naturales son los métodos en los que la contraseña nunca viaja en claro, con los certificados de cliente y NTLM entre los ejemplos del propio capítulo. NTLMv2 lleva la particularidad documentada de que un 401 con más de un encabezado WWW-Authenticate: NTLM hace fallar el SSO, un comportamiento esperado según el manual. Forms - Client Initiated lleva el detalle más ingenioso de su diseño: el JavaScript que inserta APM asigna al parámetro de la contraseña un token en lugar de la contraseña real, así que la credencial nunca está en la página.

La nota sobre el recorrido de las credenciales que acompaña a cada consulta relaciona los métodos con la maquinaria: los agentes de la política de acceso rellenan las variables de sesión que consume el SSO, y el cableado clásico es una Logon Page seguida de SSO Credential Mapping, que pasa session.logon.last.* a session.sso.token.last.*.

Escribe el nombre de un método (también sirven alias como `ntlm`, `fbci` o `kcd`), o `methods` para los ocho; o presiona el botón del método debajo del cuadro, que lo rellena por ti.

Todo se ejecuta en local; nada de lo que escribes sale de la página.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el nombre del método tal como se escribió, y nada más. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Esta página no recibe ninguna configuración de SSO: lee un nombre de su tabla de ocho métodos, o `methods`, y rechaza todo lo demás. Solo se ofrece un enlace para un nombre que lee, y un enlace que llega solo se acepta en ese mismo caso, así que en un enlace no puede viajar ni un objeto de SSO ni una credencial.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página lo lee; no se envía nada a ninguna parte. Después, el valor sale de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
