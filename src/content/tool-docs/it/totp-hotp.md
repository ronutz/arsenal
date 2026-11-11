## Cosa fa

Genera e verifica i codici monouso usati per l’autenticazione a due fattori: le password basate sul tempo (TOTP, RFC 6238), i codici a sei cifre che mostra un’app di autenticazione, e le password basate su un contatore (HOTP, RFC 4226), i codici prodotti da un token hardware. Puoi scegliere l’hash (SHA-1, SHA-256 o SHA-512), il numero di cifre e l’intervallo di tempo. Il calcolo usa l’implementazione Web Crypto nativa del browser, e il tuo segreto condiviso non lascia mai il tuo browser.

## Una costruzione, due fattori mobili

HOTP e TOTP sono, in fondo, lo stesso algoritmo. Entrambi prendono un segreto condiviso e un fattore mobile, calcolano un HMAC del fattore mobile con il segreto e poi applicano il troncamento dinamico («dynamic truncation») definito nella RFC 4226 per ridurre quel MAC a un breve codice decimale. L’unica differenza è da dove viene il fattore mobile:

- **HOTP** usa un contatore di eventi esplicito che aumenta di uno ogni volta che si usa un codice. Il token e il server devono restare allineati su quel contatore.
- **TOTP** usa l’orologio: il fattore mobile è il numero di intervalli di tempo trascorsi da un’epoca di riferimento, `floor((current time - T0) / step)`, con `T0` pari a 0 e un intervallo predefinito di 30 secondi. In altre parole, TOTP è semplicemente un HOTP il cui contatore è l’intervallo di tempo corrente, ed è per questo che un codice TOTP cambia ogni 30 secondi.

## Il segreto condiviso

Il segreto è il seme che entrambe le parti possiedono. Di solito viene scambiato come stringa Base32, cioè ciò che codificano un URI `otpauth://` o un codice QR di configurazione, quindi lo strumento decodifica il Base32 per ricavare i byte della chiave. L’hash predefinito è SHA-1, che la maggior parte delle app di autenticazione e dei token usa ancora per le password monouso; SHA-256 e SHA-512 sono disponibili dove entrambe le parti li supportano.

## Verifica e deriva dell’orologio

Poiché l’orologio di un dispositivo e quello di un server non sono mai perfettamente allineati, un controllo TOTP di norma accetta i codici di una piccola finestra di intervalli adiacenti invece che solo quello corrente, rinunciando a un po’ di rigore in cambio di affidabilità. HOTP ha il problema analogo sul contatore, perché un token può avanzare se un codice generato non viene usato, quindi i server accettano una finestra di anticipo (look-ahead) e si risincronizzano.

## Come si usa

Inserisci il segreto condiviso e genera il codice TOTP corrente, oppure imposta un contatore per generare un codice HOTP, e regola l’hash, il numero di cifre e l’intervallo in base al tuo sistema. Puoi anche verificare un codice che hai ricevuto. Dati il segreto e il fattore mobile, l’algoritmo è deterministico, quindi gli stessi input producono sempre lo stesso codice.

## Condivisione dei risultati

Sotto il codice generato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le impostazioni: la modalità, l’algoritmo, il numero di cifre, la codifica del segreto e l’intervallo di tempo o il contatore; e il tempo Unix solo quando ne hai inserito uno invece di usare l’orologio. Non contiene mai il segreto condiviso. Chi riceve il link inserisce il segreto che gli comunichi per un’altra via e ottiene gli stessi codici. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Il segreto è il secondo fattore stesso: chi lo possiede può generare ogni codice. La [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226) (sezione 7.5, consultata il 01/11/2026) chiede che le operazioni sui segreti condivisi vengano svolte in modo sicuro («be performed securely, in order to mitigate risks of any leakage of sensitive information»), e la [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) (sezione 3, requisito R7, consultata il 01/11/2026) che le chiavi siano protette da accessi e usi non autorizzati («SHOULD be protected against unauthorized access and usage»). Un’eccezione: le chiavi di test pubblicate vengono incluse, perché chiunque può già leggerle. Sono il segreto dell’appendice D della RFC 4226 (la stringa ASCII `12345678901234567890`) e i semi di 32 e 64 byte della RFC 6238 per HMAC-SHA-256 e HMAC-SHA-512 (la sua appendice A), stampati negli standard, le cui tabelle il tempo manuale serve proprio a riprodurre; e la chiave con cui si apre questa pagina, `JBSWY3DPEHPK3PXP`, che questo sito stesso pubblica (nella pagina, nella descrizione della sua API e nell’[articolo sugli URI di provisioning](/learn/totp-provisioning-uris-and-qr)), così la pagina condivisa com’è all’apertura si riapre identica. Vengono riconosciute dai loro byte, in una qualsiasi delle tre codifiche.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Apertura di un link.** Le impostazioni sostituiscono quelle del modulo; l’orologio viene disattivato solo quando arriva un tempo. La casella del segreto accoglie una chiave di test pubblicata quando ne arriva una (compresa quella della pagina) e altrimenti viene svuotata, con una nota che chiede il segreto, così la pagina non mostra mai un codice per una chiave che il mittente non ha usato. I codici vengono calcolati con Web Crypto nel browser. Una scelta che il modulo non offre, un numero fuori intervallo, un campo dell’altra modalità o un segreto che non è una chiave di test pubblicata fanno ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
