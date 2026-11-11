# Pianificatore dei bypass SSL ZIA

## Cosa fa

Incolla un elenco di applicazioni o destinazioni, una per riga in una grammatica a quattro campi, e ottieni un piano deterministico di ispezione TLS. Ogni asset riceve uno di tre verdetti: **Inspect** (il comportamento predefinito, che alimenta ogni motore di analisi dei contenuti), **Do Not Inspect tramite regola di policy** (l’esenzione a livello di Edge per le categorie di governance e per le applicazioni con pinning su percorsi che nessun agente controlla) o **bypass del Client Connector** (l’esenzione più pulita per le applicazioni con pinning quando ZCC controlla il percorso: il traffico non entra mai nel tunnel, e il bypass è affiancato da una regola di policy come difesa in profondità). Ogni verdetto riporta la sua motivazione con le fonti; ogni bypass riporta un registro dei punti ciechi che indica cosa smette di vedere questo flusso; e ogni volta che qualcosa non viene ispezionato, il piano aggiunge la checklist delle contromisure esterne: l’azione Untrusted Server Certificates, OCSP (Online Certificate Status Protocol) tramite stapling, la soglia Minimum TLS Version e Block No-SNI.

## La grammatica

Un asset per riga, quattro campi separati da barre verticali; le righe che iniziano con `#` sono commenti:

```
<name> | pinned|clean | regulated|general | agent|no-agent
```

`pinned` indica un’applicazione con certificate pinning (non accetta un certificato rigenerato con la CA di ispezione e in caso di intercettazione fallisce in modo chiuso). `regulated` indica una categoria di governance per cui una policy o la legge richiede che resti sigillata. `agent` indica un percorso controllato da Zscaler Client Connector.

## Come leggere il piano

Il riepilogo conta i verdetti; le schede ripercorrono il ragionamento per ogni asset; la nota sull’ordinamento riporta il principio per cui le eccezioni Do Not Inspect vanno in alto nell’ordine, sopra il blocco Inspect, perché le regole della policy SSL vengono valutate in ordine crescente con la prima corrispondenza. Quando ogni asset viene ispezionato non c’è alcun registro dei bypass né alcun debito di contromisure, e il piano lo dice. Ogni esenzione di policy che il pianificatore raccomanda è una regola Do Not Inspect impostata su **Evaluate Other Policies**, perché è la forma che mantiene in vigore le contromisure esterne e le policy web; una nota del piano spiega che **Bypass Other Policies** non offre contromisure e salta anche URL Filtering e Cloud App Control, e che il traffico escluso con un bypass nel Client Connector non raggiunge mai l’Edge.

## Trasparenza

La grammatica è volutamente un sottoinsieme didattico: una pianificazione reale dei bypass delimita le regole anche per utenti, gruppi e sedi, e tiene conto di particolarità delle applicazioni che questo pianificatore non modella. La logica decisionale (il pinning impone un’esenzione, la governance sigilla una categoria, tutto il resto viene ispezionato e ogni bypass è un punto cieco con un costo) è la parte duratura. Tutti i calcoli avvengono in locale; i nomi degli asset non lasciano mai la pagina.

## Condivisione dei risultati

Sotto i conteggi del riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` gli asset così come li hai incollati. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

I nomi degli asset possono identificare le tue applicazioni interne (è il motivo per cui il riquadro a comparsa aggiunge una riga di avvertenza). Prima che venga offerto un link, nella casella viene cercata una credenziale definita da uno standard: una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sezione 10), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una riga `Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. La grammatica non prevede alcuno spazio per nessuna di queste, ma i nomi degli asset e le righe di commento sono testo libero. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina pianifica l’ispezione. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

Lo strumento si basa sulla documentazione di Zscaler sull’ispezione SSL (Configuring the SSL/TLS Inspection Policy; About SSL Inspection) e sull’architettura di riferimento Data Protection, con data di consultazione 21/07/2026. Le due forme di Do Not Inspect, e le impostazioni offerte da ciascuna, sono state rilette su [Configuring SSL/TLS Inspection Policy](https://help.zscaler.com/zia/configuring-ssltls-inspection-policy) (consultata il 26/10/2026). L’articolo della sezione Imparare abbinato è [*TLS Inspection in ZIA: The Policy, the Bypasses, and the Bill*](/learn/zia-ssl-inspection-policy-and-bypasses).

La regola del frammento su cui si basa Condividi i risultati è quella della [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.5 (consultata il 01/11/2026), e le credenziali cercate dal suo controllo sono definite nelle RFC 7468, RFC 9110, RFC 6265 e RFC 7519 (consultate lo stesso giorno).
