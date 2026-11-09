## Qué hace

Pega un bloque `f5-tenants:tenants`, en la forma de la CLI o como JSON de RESTCONF, y la herramienta te lo lee: el estado del ciclo de vida y lo que significa, la imagen y la plataforma a la que pertenece, los blades y las VLAN, y cada campo explicado. En local y sin conexión; analiza el texto y no se conecta a ninguna plataforma.

## La comprobación que la convierte en algo más que un glosario

F5 publica la memoria mínima como **(3.5 × 1024 × vCPU) + 512**, así que dos vCPU necesitan 7680 MB y cuatro necesitan 14.848 MB. La herramienta calcula ese mínimo y **lo muestra junto al valor configurado**, con una advertencia cuando la asignación queda por debajo.

También advierte cuando aparece un número de vCPU sin valor de memoria, porque **los dos van juntos**: subir solo los núcleos deja el tenant por debajo de su nuevo mínimo.

## La regla del ciclo de vida que indica

**Para cambiar las vCPU o la memoria de un tenant desplegado, primero tienes que devolverlo a `provisioned`**, hacer el cambio y después volver a ponerlo en `deployed`. No es una operación en caliente, y la herramienta lo dice en cada tenant desplegado sin esperar a que se lo pregunten.

## Forma de la plataforma

Señala qué pertenece a cada máquina. **VELOS** es un chasis, donde `nodes` nombra los blades dentro de una partición del chasis y un tenant puede abarcar varios. **rSeries** es un appliance sin particiones ni blades, y `vcpu-cores-per-node` debe ser múltiplo de cuatro. Un tenant de VELOS válido con dos vCPU **no se podrá confirmar (commit) en un rSeries**, y un paquete de imagen llamado `ALL-VELOS` tampoco se desplegará en uno, algo que la herramienta señala solo por el nombre del archivo.

## Qué no hace

No puede saber qué parte de tu plataforma ya está asignada, así que valida un tenant con la fórmula publicada, no con la capacidad restante. Si el blade tiene libre esa memoria es una pregunta para la plataforma.

## Compartir resultados

Debajo del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como se escribió, y nada más. Su ventana emergente dice primero qué lleva el enlace y después da una precaución propia: el bloque nombra la dirección de administración, la puerta de enlace y las VLAN del tenant, así que léelo antes de enviar el enlace. Después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Un bloque de tenant no contiene ninguna contraseña ni clave: la [referencia del ciclo de vida de tenants de la API de VELOS](https://clouddocs.f5.com/api/velos-api/api-chassis-tenant.html) de F5 (consultada el 2026-10-27) configura un tenant con su nombre, tipo, imagen, nodos, dirección de administración, longitud de prefijo, puerta de enlace, VLAN, cryptos, vCPU, memoria, estado de ejecución y modo appliance. Las credenciales que usa esa página pertenecen a la solicitud a la API, no al bloque.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página lo lee; no se envía nada a ninguna parte. Después, el valor sale de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
