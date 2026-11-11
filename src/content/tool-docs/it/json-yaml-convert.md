## Cosa fa

Converti un documento tra JSON e YAML, in entrambe le direzioni, nel tuo browser. Partendo dal JSON produce YAML in stile a blocchi; partendo dallo YAML produce JSON. Quando un’analisi fallisce, l’errore indica la riga e la colonna esatte, e quando una conversione perde qualcosa per strada, una nota spiega cosa e perché.

## Le due direzioni

- **Da JSON a YAML.** Il JSON viene prima convalidato dallo stesso parser preciso, che tiene traccia della posizione, usato dal formattatore JSON, quindi un documento non valido viene rifiutato con una riga, una colonna e un percorso JSON Pointer invece che con un errore vago. I dati validi vengono poi scritti come YAML in stile a blocchi.
- **Da YAML a JSON.** Lo YAML viene analizzato con uno schema compatibile con JSON e serializzato in JSON. Ancore e alias (il meccanismo di riuso di YAML con `&name` e `*name`) vengono espansi sul posto, e gli scalari a blocco (gli stili di YAML per le stringhe su più righe) diventano normali stringhe JSON.

## Le trappole delle virgolette che gestisce

YAML è notoriamente pronto a leggere una parola senza virgolette come qualcosa di diverso da una stringa, ed è lì che le conversioni di andata e ritorno si rompono. Il caso più noto è il cosiddetto «Norway problem»: la parola `NO` senza virgolette viene letta come il booleano false, e lo stesso succede a `yes`, `on` e `off`, e a valori come `1.0` (un numero, non la stringa «1.0») e `08` (che non è un ottale valido). Quando emette YAML, il convertitore mette tra virgolette questi valori, così ciò che intendevi come stringa sopravvive come stringa.

## Cosa può perdere la conversione

Alcune cose esistono in un formato ma non nell’altro, quindi le note le segnalano:

- **Commenti.** YAML ha i commenti e JSON no, quindi i commenti vengono eliminati nella conversione da YAML a JSON.
- **Ancore e alias.** Vengono espansi nel loro valore completo, quindi un riferimento condiviso e compatto nello YAML di origine diventa un dato ripetuto nell’output.

## Esempi svolti

- Il JSON `{"port":8080,"tls":true}` diventa le righe YAML `port: 8080` e `tls: true`.
- Lo YAML `country: NO` diventa in ingresso il JSON `{"country":"NO"}`, e quando questo viene riemesso come YAML il valore viene messo tra virgolette come `country: "NO"`, così non viene scambiato per false.

## Come si usa

Incolla JSON per ottenere YAML, o YAML per ottenere JSON. Leggi le note di conversione quando compaiono: ti dicono se qualcosa, come un commento o un’ancora, è cambiato in un modo che dovresti conoscere. La conversione è deterministica per un dato input.

## Condivisione dei risultati

In apertura della lettura (o sotto un errore di analisi, che è anch’esso una risposta), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’origine così come l’hai incollata, la direzione e il rientro. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. La configurazione contiene spesso password, chiavi e nomi interni, quindi il riquadro a comparsa ti chiede di rileggerla prima di inviare il link. Il testo viene incluso così come l’hai incollato: l’output convertito mostra ogni valore. Prima che venga offerto un link, nel testo viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezioni 4.1.1 e 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1: la forma «user:password» è deprecata, «is deprecated»), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (una chiave `password:` o `apiKey`) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo. Qui contano come credenziali cinque nomi di membri e di chiavi, perché uno standard definisce cosa contengono: `access_token` e `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sezioni 1.4, 1.5 e 5.1: i token di accesso sono credenziali usate per accedere a risorse protette, «Access tokens are credentials used to access protected resources»), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), sezione 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), sezione 3.2.1) e `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), sezione 3); tutte consultate il 01/11/2026. Se ha un valore, uno qualsiasi di questi nomi significa niente link, come nel decodificatore OIDC.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il testo compila la casella e le scelte vengono impostate come le imposteresti tu, e la pagina lo converte. Una scelta sconosciuta fa ignorare il link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
