# Analizzatore delle decisioni di inoltro ZCC

Incolla una configurazione di Zscaler Client Connector (lo stato della rete rilevato, l’azione di inoltro ZIA, la versione di Z-Tunnel e, se vuoi, l’azione ZPA) e ripercorri livello per livello l’ossatura decisionale documentata, esattamente come la descrivono l’architettura di riferimento e il portale di assistenza del vendor.

## Perché un analizzatore e non un simulatore

Questo strumento esiste nella forma stabilita dalla sua clausola di ratifica, e il motivo viene dichiarato qui prima di ogni altra cosa. La verifica del 21 luglio 2026, condotta sull’architettura di riferimento Secure Mobile Access with Zscaler Client Connector e su help.zscaler.com, ha trovato l’**ossatura** decisionale documentata pubblicamente da un capo all’altro: come viene determinato lo stato di rete attendibile, cosa fa ciascuna delle quattro azioni per stato di ZIA, cosa cattura ciascuna versione di Z-Tunnel, il failover automatico da Z-Tunnel 2.0 a 1.0, il web-split ibrido e le due azioni di ZPA. Quell’ossatura è deterministica, e questo strumento la calcola.

Ciò che **non** è pubblicato è un unico ordine di precedenza per il livello dei bypass. I meccanismi sono documentati uno per uno (Application Bypass, Destination Exclusions e Inclusions, Domain Exclusions e Inclusions, VPN Gateway Bypass, dove VPN sta per rete privata virtuale, il PAC dell’App profile, il PAC del Forwarding profile con la sua macro di bypass per Z-Tunnel 2.0), ma quando più meccanismi riguardano lo stesso flusso Zscaler pubblica ricette, non una matrice per risolvere i conflitti. Un simulatore dovrebbe inventare quella matrice. Questo strumento si rifiuta di farlo: presenta ogni meccanismo documentato come un registro spiegato e non decide nulla. È la stessa regola di non inventare nulla che vale per gli altri strumenti di questo sito.

## Grammatica dell’input

Un’impostazione per riga, `key = value`. Le righe che iniziano con `#` sono commenti.

- `network`: trusted | vpn | off-trusted (obbligatoria)
- `zia-action`: tunnel | twlp | enforce-proxy | none (obbligatoria)
- `tunnel`: zt2 | zt1 (solo con le azioni di tunnel)
- `web-split`: on | off (la modalità ibrida documentata di Z-Tunnel 2.0)
- `zpa-action`: tunnel | none (facoltativa)

## Cosa ottieni

L’ossatura viene presentata come schede a livelli: lo stato della rete con i criteri di rilevamento documentati (DNS Server e Search Domains consigliati come i più statici, corrispondenza ANY/ALL, l’esclusività di Pre-Defined Trusted Networks e la modalità di guasto documentata della risoluzione dinamica); il significato documentato dell’azione ZIA; la semantica di Z-Tunnel per la tua scelta, cioè il tunnel proxy di Z-Tunnel 1.0, solo web su 80/443, contro la cattura DTLS/TLS di tutte le porte di Z-Tunnel 2.0, con il failover automatico e, se attivato, il web-split ibrido; e la decisione a due azioni del livello ZPA, volutamente più piccola. Sotto l’ossatura si trovano il registro dei bypass e le note permanenti, tra cui la tabella di raccomandazioni dell’architettura di riferimento stessa (Trusted = None, VPN = Tunnel with Local Proxy, Off-Trusted = Tunnel, Z-Tunnel 2.0) e le impostazioni fail-open/fail-close che si sovrappongono a ogni stato.

Tutto viene eseguito in locale nel tuo browser; nulla di ciò che incolli lascia la pagina.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le impostazioni così come le hai incollate. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Ogni impostazione è una tra poche scelte documentate, senza indirizzi, host, utenti o chiavi, quindi il riquadro a comparsa non aggiunge una riga di avvertenza propria. Prima che venga offerto un link, nella casella viene cercata una credenziale definita da uno standard: una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sezione 10), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una riga `Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. La grammatica non prevede alcuno spazio per nessuna di queste, ma una riga di commento è testo libero. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina ripercorre l’ossatura. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [Zscaler Reference Architecture: Secure Mobile Access with Zscaler Client Connector](https://www.zscaler.com/resources/reference-architectures/secure-mobile-access-with-zcc.pdf): gli stati, le azioni, i criteri, la semantica dei tunnel, il failover e la tabella di raccomandazioni (consultata il 09/11/2026)
- [Zscaler Help: About Z-Tunnel 1.0 & Z-Tunnel 2.0](https://help.zscaler.com/zscaler-client-connector/about-z-tunnel-1.0-z-tunnel-2.0) (consultata il 09/11/2026)
- [Zscaler Help: Best Practices for Adding Bypasses for Z-Tunnel 2.0](https://help.zscaler.com/zscaler-client-connector/best-practices-adding-bypasses-z-tunnel-2.0): la divisione dei compiti tra i due PAC (consultata il 09/11/2026)
- [Zscaler Help: Configuring Forwarding Profiles for Zscaler Client Connector](https://help.zscaler.com/zscaler-client-connector/configuring-forwarding-profiles-zscaler-client-connector) (consultata il 09/11/2026)

La regola del frammento su cui si basa Condividi i risultati è quella della [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.5 (consultata il 01/11/2026), e le credenziali cercate dal suo controllo sono definite nelle RFC 7468, RFC 9110, RFC 6265 e RFC 7519 (consultate lo stesso giorno).
