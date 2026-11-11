## Cosa fa

Incolla del JSON e lo strumento lo convalida, poi lo formatta in modo leggibile, lo compatta o lo ordina. Ciò che lo distingue da un semplice `JSON.parse` è quello che ti dice quando qualcosa non va o è insolito: un errore di analisi indica la riga, la colonna e il percorso esatti del problema; le chiavi ripetute di un oggetto vengono segnalate; e i numeri molto grandi o molto precisi vengono conservati esattamente invece di essere arrotondati. Tutto viene eseguito nel tuo browser.

## Un parser costruito per la diagnostica

Il motore è un parser scritto a mano che tiene traccia della posizione mentre legge, invece di affidarsi all’analisi integrata del runtime JavaScript. Questo porta tre vantaggi che contano nella pratica:

- **Errori precisi.** Quando l’analisi fallisce, ottieni la riga, la colonna, l’offset in byte, un messaggio in linguaggio semplice e il percorso JSON Pointer (RFC 6901) della posizione, invece di un unico `SyntaxError` che dipende dal motore e non indica alcun percorso.
- **Rilevamento delle chiavi duplicate.** La grammatica JSON tecnicamente permette a un oggetto di ripetere una chiave, e `JSON.parse` conserva in silenzio solo l’ultima. Questo comportamento silenzioso nasconde bug reali, quindi il motore segnala ogni duplicato che trova, con il suo percorso.
- **Numeri grandi esatti.** I numeri JSON non hanno limiti di dimensione, ma un numero JavaScript è un float a 64 bit e perde precisione oltre 2^53. Il formattatore conserva le cifre che hai scritto, quindi un ID di 20 cifre o un decimale ad alta precisione non viene arrotondato senza avvisarti.

## Formattazione, compattazione e ordinamento

Una volta che il JSON è valido puoi formattarlo in modo leggibile con un rientro coerente, compattarlo nella forma più breve su una sola riga, oppure ordinare le chiavi degli oggetti, così due documenti che differiscono solo per l’ordine delle chiavi si allineano per il confronto. L’ordinamento avviene per chiave e non riordina gli array, il cui ordine in JSON è significativo.

## Esempi svolti

- `{"b":1,"a":2}` ordinato per chiave diventa `{"a":2,"b":1}`.
- `{ "a": 1 }` compattato diventa `{"a":1}`, senza spazi bianchi.
- `{"id":10000000000000001}` conserva tutte le sue cifre, mentre un passaggio attraverso un float a 64 bit lo trasformerebbe in `10000000000000000`.
- `{"a":1,"a":2}` viene segnalato per la chiave duplicata `a`; un parser standard conserverebbe in silenzio `2`.

## Come si usa

Incolla un documento JSON e scegli se formattarlo, compattarlo o ordinarlo. Se l’analisi non riesce, l’errore indica il punto esatto; se riesce ma ci sono chiavi duplicate o numeri troppo grandi, vengono evidenziati. Lo strumento è una funzione pura del suo input, quindi lo stesso documento dà sempre lo stesso risultato.

Per l’XML, il [formattatore e validatore XML](/tools/xml-formatter) fa lo stesso lavoro: una verifica della buona formazione che indica la riga e la colonna, poi la formattazione leggibile o la compattazione.

## Condivisione dei risultati

In apertura della lettura (o sotto un errore di analisi, che è anch’esso una lettura), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il JSON così come l’hai incollato e le tre scelte (leggibile o compatto, il rientro, le chiavi ordinate). Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Il JSON contiene spesso password, chiavi e nomi interni, quindi il riquadro a comparsa ti chiede di rileggerlo prima di inviare il link. Il testo viene incluso così come l’hai incollato: l’output formattato mostra ogni valore, quindi nulla può essere sostituito senza cambiare ciò che vede chi legge. Prima che venga offerto un link, nel testo viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezioni 4.1.1 e 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1: la forma «user:password» è deprecata, «is deprecated»), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (un membro `password` o `apiKey`) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo. Qui contano come credenziali cinque nomi di membri, perché uno standard definisce cosa contengono: `access_token` e `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sezioni 1.4, 1.5 e 5.1: i token di accesso sono credenziali usate per accedere a risorse protette, «Access tokens are credentials used to access protected resources»), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), sezione 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), sezione 3.2.1) e `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), sezione 3); tutte consultate il 01/11/2026. Se ha un valore, uno qualsiasi di questi membri significa niente link, come nel decodificatore OIDC.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il testo compila la casella e le scelte vengono impostate come le imposteresti tu, e la pagina lo formatta. Una scelta sconosciuta fa ignorare il link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
