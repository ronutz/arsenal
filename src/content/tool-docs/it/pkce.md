## Cosa fa

Lavora con i due valori al centro dell’estensione PKCE di OAuth 2.0. Lo strumento genera un `code_verifier` casuale e ne ricava il `code_challenge` con il metodo S256, oppure prende un `code_verifier` che incolli, lo verifica rispetto alle regole di lunghezza e di caratteri della RFC 7636 e ne ricava lo stesso challenge che si aspetterà il tuo server di autorizzazione. La derivazione è esattamente il passaggio SHA-256 e Base64url definito dallo standard, e tutto viene eseguito nel tuo browser.

## Da cosa protegge PKCE

Il flusso con codice di autorizzazione (authorization code) di OAuth 2.0 rimanda un codice di breve durata attraverso il browser dell’utente, e in un’app mobile o in una single-page application quel reindirizzamento può essere intercettato da un’altra applicazione. PKCE (Proof Key for Code Exchange) chiude questa falla. All’inizio del flusso il client inventa un segreto, il `code_verifier`, e con la richiesta iniziale ne invia solo una versione trasformata, il `code_challenge`. Quando più tardi scambia il codice con i token, presenta il `code_verifier` originale, e il server ricalcola il challenge e verifica che corrisponda. Un attaccante che ruba il codice non può usarlo, perché non ha mai visto il verifier.

## Il verifier e il challenge

- Il **code_verifier** è una stringa casuale ad alta entropia da 43 a 128 caratteri, presi dall’insieme dei caratteri non riservati `A-Z a-z 0-9 - . _ ~`.
- Il **code_challenge** si ricava dal verifier. Il metodo consigliato, `S256`, è `BASE64URL(SHA256(ASCII(verifier)))`, cioè la codifica Base64url del digest SHA-256 del verifier, senza padding. Il metodo `plain`, in cui il challenge è semplicemente uguale al verifier, esiste per i client con risorse limitate ma è sconsigliato, perché non offre alcuna protezione se il challenge viene osservato.

## Perché conta oggi

PKCE è nato come correzione per le app mobili, ma oggi è la norma. L’attuale best practice di sicurezza per OAuth, la RFC 9700, richiede PKCE per ogni client che usa il flusso con codice di autorizzazione, non solo per i client pubblici. Se stai sviluppando un client OAuth o ne stai facendo il debug, generare qui un verifier e confermarne il challenge S256 ti permette di verificare la tua implementazione direttamente rispetto alla specifica.

## Come si usa

Genera un nuovo `code_verifier` e leggi il suo `code_challenge` `S256`, oppure incolla un verifier esistente per convalidarne lunghezza e caratteri e ricavare il challenge corrispondente. Poiché S256 è un hash unidirezionale, il challenge non rivela nulla del verifier.

## Condivisione dei risultati

Sotto gli indicatori di validità, **Condividi i risultati** offre un link a questa pagina per un solo verifier: l’esempio che la [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) riporta nell’appendice B (`dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`, l’Esempio della pagina), che il link contiene dopo il `#`. Per qualsiasi altro verifier il riquadro a comparsa indica che non c’è alcun link, e perché.

Un code_verifier è il segreto del flusso. La RFC 7636 (consultata il 01/11/2026) lo presenta come una chiave casuale generata crittograficamente («cryptographically random key») che rende inutile un codice di autorizzazione intercettato, perché l’attaccante non conosce questa chiave monouso («since the attacker would not know this one-time key», sezione 1), e fonda la sicurezza del protocollo sul fatto che il verifier non venga scoperto o indovinato dall’attaccante («learned or guessed by the attacker», sezione 7.1). Nessun valore derivato può sostituirlo, perché questa pagina calcola tutto a partire dal verifier stesso: il challenge senza il verifier non lascerebbe nulla da mostrare. Per questo un link contiene il verifier solo quando è il valore di prova dello standard stesso.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il valore non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** L’esempio compila la casella e la pagina ricava entrambi i challenge, con Web Crypto nel browser. Un link che contiene qualsiasi altro valore viene ignorato e non compila mai la casella. In ogni caso il valore lascia subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
