## Qué hace

Describe los dos extremos de un túnel IPsec y esta herramienta nombra en qué discrepan y, después, lo que de verdad importa: **qué fase fallaría**. Se ejecuta por completo en tu navegador.

## Por qué la fase es todo el diagnóstico

La fase 1 autentica a los extremos y protege la negociación. La fase 2 se ejecuta dentro de ese canal protegido y negocia las asociaciones de seguridad y los selectores.

Esa división es la razón por la que saber la fase acota un fallo de inmediato. Un fallo en la fase 1 tiene que ver con la identidad o con la propuesta, y nunca se llega a intentar la fase 2, así que su ausencia en los logs es lo esperado y no un segundo problema. Un fallo en la fase 2 significa que los extremos se autenticaron bien y *después* discreparon sobre qué proteger, lo que apunta a los selectores, a los transforms o a PFS, y a nada más.

Entenderlo al revés manda al ingeniero a la mitad equivocada de la configuración, y por eso esta herramienta empieza por el veredicto y no por una tabla campo por campo.

## Los tres falsos positivos que se niega a producir

Un analizador de discrepancias que da por rotas configuraciones sanas es peor que no tener analizador, porque la gente deja de leerlo. Hay tres diferencias que parecen fallos y no lo son:

**Las listas de propuestas no tienen que ser idénticas.** FortiOS acepta una lista, y el túnel se levanta si hay algún valor en común. Comparar `aes256` con `aes128 aes256` y llamarlo discrepancia sería un error, así que la herramienta calcula la intersección e indica que un valor compartido está bien.

**Los tiempos de vida no tienen que coincidir.** Gana el más corto. La herramienta nombra el valor efectivo y dice de forma explícita que no es un fallo. Unos valores muy distintos solo implican renegociaciones de claves (rekeys) a intervalos incómodos.

**Los selectores están reflejados.** La subred local de un extremo es la remota del otro, así que comparar local con local marcaría todos los túneles bien construidos. La comparación se cruza a propósito.

Los hallazgos se dividen en discrepancias que bloquean y diferencias que no son fallos, y se mantienen separados visualmente. Presentar “tus tiempos de vida difieren” con el mismo peso que “no hay ningún cifrado en común” es como un resultado se convierte en ruido.

## Lo que detecta

Fase 1: versión de IKE, método de autenticación, modo de IKEv1 y la falta de un cifrado, un hash o un grupo DH en común. El modo solo se compara cuando la versión es v1, porque marcar modo principal (main) frente a agresivo (aggressive) en IKEv2 sería un falso positivo exactamente del tipo anterior.

Fase 2: ningún transform en común, PFS habilitado en un solo lado, un grupo DH de PFS que no coincide cuando los dos lo tienen habilitado, y discrepancias de selectores en cualquier sentido.

El caso de PFS merece una mención aparte: el mensaje de log de ese fallo no suele decir PFS, por eso cuesta tanto tiempo y por eso vale la pena tener una herramienta que lo nombre.

## Los selectores son exactos, no aproximados

`10.1.0.0/16` frente a `10.1.0.0/24` es una **discrepancia**, no una casi coincidencia. Los dos lados tienen que coincidir exactamente en las redes que transporta el túnel. Cuando uno de los extremos es un dispositivo con un soporte limitado de selectores, los dos lados deben configurarse de forma simétrica y no de la forma más cómoda.

## Lo que no te dirá

Compara lo que le das. Un campo presente en un lado y ausente en el otro se trata como *no indicado* y no como una discrepancia, porque un pegado parcial no es prueba de un fallo.

Tampoco diagnostica el caso que más tiempo hace perder en la práctica: un túnel que figura **activo y no pasa tráfico**. Eso no es un problema de IPsec en absoluto: es una ruta o una política de firewall que falta, y la herramienta lo dice cuando no encuentra ninguna discrepancia fatal.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los dos extremos tal como se pegaron. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Los nombres de los extremos y las subredes protegidas describen tu red (el motivo por el que la ventana emergente añade una línea de precaución). La página no lee ninguna clave precompartida, pero quien describe un túnel puede escribir una en una línea `phase1:` o pegar un bloque phase1-interface junto a las directivas. Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por FortiOS o por un estándar: una línea `set` de una opción que la [referencia de la CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) declara de tipo contraseña (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` y las demás; consultada el 2026-11-01) o el `name` de una comunidad SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sección 3.2.5), cualquier valor `ENC` (según el aviso de Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultado el 2026-11-01, esos datos publicados donde otros pueden leerlos “should currently be considered ‘easy to decrypt’”, deben considerarse por ahora fáciles de descifrar), un par `psksecret=` o `password=` con esos mismos nombres en una línea de directiva, una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una contraseña en una URL o un ID de clave de acceso de AWS. Si aparece una, no hay enlace: la ventana emergente indica su línea, y tú la sustituyes por un marcador de posición y vuelves a presionar, de modo que lo que compartes es exactamente lo que elegiste (nunca se sustituye un valor dentro de un cuadro pegado, porque eso cambiaría lo que se envía). Un valor cuyo nombre solo parece el de un secreto no bloquea el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página compara los dos extremos. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Dónde encaja

Se complementa con el artículo sobre las VPN IPsec de FortiGate (red privada virtual, virtual private network), organizado en torno a la misma pregunta y que trata las opciones de topología que esta herramienta no modela. A quien prepara el NSE 4 le sirve para el objetivo 5.01.
