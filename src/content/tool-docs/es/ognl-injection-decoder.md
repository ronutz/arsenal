## Qué hace

Tienes delante un evento de un firewall de aplicaciones web (WAF, web application firewall), o una línea del log de una aplicación, y contiene algo como `%{(#_memberAccess["allowStaticMethodAccess"]=true)...}`. La herramienta lee esa cadena y te dice qué intentaba hacer: qué construcciones contiene, si equivalen a desactivar el entorno aislado (sandbox) de las expresiones, a ejecutar un comando, a las dos cosas o a ninguna, y con qué familia de avisos publicados es coherente su forma. Se ejecuta por completo en tu navegador y nunca evalúa ninguna parte de lo que pegas.

## Qué no es

Es un decodificador. Lee cargas útiles (payloads) que ya han llegado a algún sitio y las explica. No construye cargas útiles, no sugiere variantes de la que pegaste y no guarda ninguna biblioteca de plantillas de la que sacarlas: todo lo que reconoce es sintaxis pública, documentada en los propios boletines de seguridad de Apache y visible en los logs de cualquiera que tenga un servidor web en la internet pública. Explicar un artefacto capturado es la mitad defensiva del trabajo. Producir otros nuevos no es para lo que existe este sitio, y la herramienta está construida de forma que leer su código fuente no te da nada que no puedas sacar del aviso.

## OGNL, en un párrafo

El Object-Graph Navigation Language (OGNL) es un lenguaje de expresiones para leer y escribir las propiedades de objetos Java. Existe para que un framework pueda dejar que la configuración llegue al interior de una aplicación en ejecución: obtener esta propiedad, llamar a aquel método, formatear el resultado. Es útil de verdad, y también es todo el problema: una expresión que puede llamar a métodos de objetos vivos solo es segura mientras quien escribió las expresiones que se evalúan sea alguien de confianza. Apache Struts pasó varios años parcheando una familia de fallos que compartían una misma forma, en la que una entrada aportada por el atacante llegaba a un evaluador que la trataba como configuración.

## Las dos mitades que busca la herramienta

Un intento que funcionara contra la familia de Struts necesitaba dos cosas, y la herramienta las indica por separado porque la diferencia te dice a qué te enfrentas. La primera es un escape del entorno aislado: OGNL restringe lo que puede tocar una expresión mediante un objeto llamado `_memberAccess`, y el escape consiste en llegar a ese objeto y desactivar sus restricciones. La segunda es una primitiva de ejecución, normalmente una llamada al objeto `Runtime` de la JVM seguida de `exec`, que inicia un proceso del sistema operativo.

Una carga útil con las dos es un intento real de explotación y merece el tratamiento completo: averiguar si la solicitud se bloqueó, qué hizo la aplicación con ella y si el entorno de ejecución estaba parcheado. Una carga útil que solo tiene la llamada de ejecución es mucho más habitual y mucho menos alarmante, porque en un entorno de ejecución parcheado esa llamada simplemente se rechaza: suele significar que un escáner está recorriendo una lista, no que alguien haya mirado tu aplicación. Una carga útil con sintaxis de expresión y nada más suele ser un sondeo, que comprueba si la entrada llega siquiera a evaluarse antes de enviar nada costoso. Esa respuesta importa más de lo que parece, porque, si es que no, nada más de la lista funcionará tampoco.

## Familias de avisos

Cuando la forma es característica, la herramienta nombra la familia de avisos: el fallo de 2017 en el analizador multipart, en el que se evaluaba el propio encabezado `Content-Type` cuando fallaba el análisis; la familia más amplia de member access, cuyas correcciones restringieron una y otra vez lo que podía alcanzar una expresión; y el problema de 2018 en el que se evaluaban los valores de namespace y de result, lo que convertía la ruta de una URL en un vector de ejecución. Se indican como coherentes con la carga útil, no como una identificación, porque varias familias comparten forma y una carga útil demuestra lo que se intentó, no lo que estaba presente.

## Lo que deliberadamente no te dice

Tres cosas, y se muestran siempre en lugar de esconderse tras una opción, porque la forma más peligrosa de leer esta página es no ver ningún hallazgo y concluir que todo está bien.

No puede decirte si la solicitud se bloqueó. Eso está en el evento del WAF, no en la carga útil. No puede decirte si la aplicación evaluó la expresión, algo que depende de la versión y la configuración del framework, no de la cadena. Y que no haya ninguna construcción reconocida no significa que no haya riesgo: las cargas útiles se codifican en URL, se codifican dos veces o se reparten entre varios parámetros de forma habitual, así que decodifica primero y lee después. Un resultado limpio sobre una carga útil codificada significa que la herramienta leyó la codificación, no el ataque.
