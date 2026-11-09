## Qué hace

Es una herramienta didáctica. Ejecuta en tu navegador una búsqueda por fuerza bruta acotada que intenta encontrar una entrada cuyo hash coincida con un resumen objetivo. Contra una entrada débil, un PIN corto o unas pocas letras minúsculas, lo consigue en segundos; contra cualquier cosa con entropía real, agota su espacio de claves limitado y se detiene sin respuesta. Ese contraste es la cuestión: muestra de primera mano por qué un hash rápido y sin sal es una mala forma de proteger una contraseña, y por qué un secreto de alta entropía está a salvo incluso frente a una búsqueda directa.

## Qué es una preimagen y cómo funciona la búsqueda

Un hash es unidireccional, así que no hay ninguna fórmula que convierta un resumen en su entrada. La única forma genérica de invertirlo es adivinar: tomar un candidato, calcular su hash y ver si el resumen coincide. Este buscador hace exactamente eso. Enumera candidatos sobre el alfabeto y la longitud que elijas (dígitos, letras minúsculas, etc.) y calcula el hash de cada uno en local hasta que encuentra una coincidencia o se queda sin candidatos. No usa diccionario, ni lista de palabras, ni tablas precalculadas, así que es solo una demostración de búsqueda exhaustiva, no un kit para descifrar contraseñas.

## Por qué caen las entradas débiles y no las fuertes

El número de candidatos es el tamaño del alfabeto elevado a la longitud. Un PIN de 4 dígitos son solo 10^4, es decir, 10.000 posibilidades, que se recorren de forma trivial; seis letras minúsculas son 26^6, unos 300 millones, todavía poco para un equipo; pero cada carácter adicional multiplica el espacio, así que un secreto realmente aleatorio lleva la cuenta mucho más allá de lo que puede cubrir cualquier búsqueda local acotada. Precisamente por eso los hashes rápidos como MD5 o SHA-256, que pueden calcularse miles de millones de veces por segundo, no sirven para contraseñas, y por eso los sistemas reales añaden una sal (salt) y usan una función de derivación de claves lenta a propósito, como recomiendan la guía Password Storage de OWASP y la NIST SP 800-63B.

## Lo que no puede hacer

Como el espacio de claves está limitado y no hay lista de palabras, la herramienta solo recupera entradas que ya se sabía que eran débiles. No puede atacar un hash con sal, ni un hash producido por una función de derivación de claves lenta como bcrypt, scrypt, Argon2 o PBKDF2, que están diseñadas para que cada intento salga caro.

Tampoco tiene una lista de contraseñas filtradas. Para comprobar si una contraseña concreta ya ha aparecido en una filtración de datos, sin enviarla, usa la [comprobación de Pwned Passwords](/dev/out/pwned-passwords) de la sala roja: solo envía los cinco primeros caracteres del hash SHA-1 de la contraseña, y solo cuando presionas Preguntar o Intro.

## Uso

Pega un resumen objetivo, u obtén uno calculando el hash de una entrada de muestra en el [Generador de hashes](/tools/hash) (SHA-1 o SHA-256), elige el alfabeto y la longitud máxima de la búsqueda y mira cómo avanza. Prueba con una entrada numérica corta para ver que acierta enseguida y después añade longitud o amplía el alfabeto para ver cómo el espacio de claves deja atrás a la búsqueda.

## Compartir resultados

Debajo de la búsqueda y del resultado que haya dado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la búsqueda tal como la configuraste: el hash, el alfabeto y la longitud máxima. Nunca lleva lo que encontró una búsqueda, y abrirlo nunca inicia ninguna. Su ventana emergente dice primero qué lleva el enlace, después da una advertencia propia y luego ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Aquí la advertencia importa más que en ningún otro sitio: esta página existe para mostrar que un hash rápido y sin sal de una entrada débil equivale a la propia entrada. Quien abra el enlace puede presionar Iniciar búsqueda y obtener la misma respuesta que tú, así que envía hashes de valores de prueba, nunca de una contraseña real.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Al abrir un enlace.** Se rellenan los tres campos, se detiene cualquier búsqueda en curso y una nota te pide que presiones Iniciar búsqueda: la búsqueda solo se ejecuta cuando tú lo decides, en tu navegador. Un hash cuyo algoritmo la página no puede deducir de su longitud, un alfabeto que la página no ofrece o una longitud fuera del intervalo entre 1 y el techo de ese alfabeto hacen que se ignore el enlace entero. En cualquier caso, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
