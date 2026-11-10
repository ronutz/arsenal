# Contribuir con una traducción

ronutz.com está hecho para que añadir o mejorar un idioma requiera muy poco esfuerzo, y las contribuciones son bienvenidas. Cada idioma consta de dos piezas: una entrada en el registro de idiomas y un paquete de mensajes en JSON. No hace falta tocar el código de la aplicación.

## Cómo funciona el sistema

- **Los paquetes.** El texto de cada idioma está en un único archivo JSON de frases etiquetadas, `src/i18n/messages/<code>.json`. La página Contribuir permite descargar todos los paquetes activos, y las descargas se copian de los paquetes de origen en cada compilación, así que siempre están al día. `en.json` es la referencia completa; los demás paquetes solo necesitan las frases que traducen.
- **El inglés como idioma de reserva.** Cualquier frase que no esté en un paquete se muestra en inglés. Por eso una traducción parcial ya sirve desde el primer momento: se publica, y las frases que faltan siguen legibles en inglés hasta que alguien las complete.
- **El registro.** `src/i18n/locales.ts` enumera todos los idiomas con su nombre nativo, la dirección del texto y el estado de la traducción. El selector de idioma, las direcciones web y los metadatos de búsqueda se rigen por él.

## Estado de la traducción

Cada idioma tiene un `status`:

| Estado | Significado |
|---|---|
| `reviewed` | Un hablante nativo ha leído y aprobado el paquete. |
| `machine-draft` | Un primer borrador hecho con IA o con traducción automática, que todavía no ha revisado un hablante nativo. |
| `stub` | Todavía no hay paquete; el idioma se muestra en inglés. |

Un texto redactado por máquina nunca se presenta como texto nativo pulido. Un `machine-draft` es un punto de partida que un hablante nativo pasa a `reviewed`. El inglés es el idioma de origen. El portugués de Brasil está escrito con IA y se revisa poco a poco, igual que la interfaz y las herramientas en español, en alemán y en francés; la sección Aprender y las demás secciones de lectura en español, en alemán y en francés, así como los otros once idiomas, son traducciones automáticas. Por eso el portugués de Brasil, el español, el alemán y el francés conservan el estado `machine-draft` y su aviso hasta que una revisión humana acredite lo contrario.

## Mejorar un idioma en cuatro pasos

1. **Descarga el paquete** que quieras mejorar desde la página Contribuir (para un idioma nuevo, descarga `en.json`, la referencia).
2. **Traduce el texto que va después de cada etiqueta.** Cambia solo los valores. No cambies nunca una etiqueta (la clave de la izquierda) y deja todo lo que esté entre llaves exactamente como está: `{count}`, `{name}` y similares los rellena el sitio, y una llave modificada rompe la página. Mantén tal cual los nombres de productos y los nombres técnicos (BIG-IP, CIDR, F5, Fortinet, etc.), y escribe la jerga técnica como la dicen de verdad los profesionales de tu idioma.
3. **Indica el estado** en `_meta.status` del paquete: `machine-draft` para un borrador hecho con IA o con traducción automática, `reviewed` si el idioma es tu lengua materna y has revisado el texto.
4. **Envíalo de vuelta.** Manda por correo el archivo editado desde la página Contribuir e indica el idioma, o abre un pull request en el repositorio público. Cada envío se revisa a mano.

## Puntuación

- **El inglés** se escribe sin raya (em dash). En su lugar se usan la coma, los dos puntos, los paréntesis o una oración nueva; la semirraya (en dash) solo aparece entre los números de un intervalo (10–20).
- **Todos los demás idiomas conservan su propia puntuación natural.** No importes la regla del inglés: las lenguas romances y eslavas usan su raya (el travessão del portugués, la raya del español, el тире del ruso) donde lo pide su propia tipografía; el alemán y las lenguas escandinavas usan la semirraya con espacios; el chino usa sus signos nativos de ancho completo (，。：；) y su propia raya de doble ancho. El francés mantiene el espacio antes de ; : ! y ?.

## Notas

- **Los idiomas que se escriben de derecha a izquierda** (el árabe, por ejemplo) los resuelve el diseño de la página; la dirección viene del registro, así que solo tienes que traducir el texto.
- **Los paquetes parciales son bienvenidos.** Traducir solo la navegación y la página de inicio ya es una primera contribución valiosa.
- **¿Un idioma que todavía no está en el registro?** Añade una línea a `LOCALES` en `src/i18n/locales.ts` con el código, el nombre nativo, el nombre en inglés, la dirección y `status: "stub"`, y después añade tu paquete; o pide por correo que lo añadan por ti.
