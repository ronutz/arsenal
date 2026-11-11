## Cosa fa

Descrivi una policy (il traffico, l’impostazione dell’ispezione SSL, la modalità di ispezione e i profili di sicurezza associati) e questo strumento ti dice quali profili possono davvero **vedere** quel traffico. Viene eseguito interamente nel tuo browser.

## La catena delle dipendenze

Un profilo di sicurezza agisce solo quando valgono tutte le condizioni che lo precedono:

1. Una policy del firewall **consente** il traffico. Nulla ispeziona ciò che è stato negato.
2. L’ispezione SSL lo **decifra**, se è cifrato.
3. La **modalità** di ispezione supporta la funzionalità.
4. Solo allora il profilo agisce.

Lo strumento percorre quella catena per ogni profilo e indica l’anello che ha ceduto. La maggior parte delle segnalazioni di un profilo che non funziona si risolve al **passo 2**: il traffico è HTTPS, la policy usa l’ispezione dei certificati anziché l’ispezione approfondita (deep inspection), e semplicemente non c’è nulla da leggere. Il profilo risulta associato, la configurazione sembra corretta, ed è cieco.

## Cieco non è come degradato

Questa distinzione è il giudizio che lo strumento esiste per dare, e sbagliarla in una delle due direzioni sarebbe peggio che non dire nulla.

**Cieco** significa associato, configurato e inattivo. AntiVirus, IPS (Intrusion Prevention System, sistema di prevenzione delle intrusioni), DLP (Data Loss Prevention, prevenzione della perdita di dati) e file filter hanno tutti bisogno del corpo del messaggio. Dietro l’ispezione dei certificati il corpo non c’è, quindi non sono parzialmente efficaci: sono inerti.

**Degradato** significa che funziona con un quadro incompleto. Application control e web filter possono ancora identificare parte del traffico dai metadati dell’handshake, come l’SNI, quindi una policy basata sul nome host si applica ancora, mentre una basata sul percorso dell’URL no.

Dire a qualcuno che un profilo funziona in parte quando non vede proprio nulla è l’errore più pericoloso, quindi i due casi vengono riportati separatamente e con uno stile diverso.

## L’ispezione dei certificati è un’altra cosa, non una versione più debole

Convalida il certificato e legge l’handshake. Non decifra mai il payload. Descriverla come una «deep inspection più leggera» porta dritti alla situazione del profilo cieco, ed è per questo che lo strumento la presenta come un meccanismo diverso e non come un livello inferiore.

Passare una policy all’ispezione approfondita è l’unica modifica che ripara in un colpo solo tutti i profili ciechi, ed è una vera decisione, non una casella da spuntare. Ispezione approfondita significa terminare il TLS sul FortiGate, con conseguenze sulla fiducia nei certificati, sulla privacy e sulle prestazioni che fanno parte della decisione.

## Avvertenze sulla modalità

Anche dove la copertura esiste, la modalità flow limita alcuni comportamenti, e lo strumento indica dove. In modalità flow l’AntiVirus analizza il file mentre scorre invece di caricarlo per intero in un buffer, quindi i file molto grandi e gli archivi profondamente annidati sono il punto in cui la copertura si assottiglia. Segnala anche l’azione per i file oltre soglia (oversize), il cui valore predefinito **lascia passare** i file sopra la soglia, lasciando senza ispezione i download più grandi a meno che non la si cambi deliberatamente.

## Cosa non modella

**La copertura, non il rilevamento.** Risponde alla domanda se un profilo può vedere il traffico. Non afferma mai che un profilo intercetterebbe una minaccia specifica, perché questo dipende dalle firme, dai database e dalla minaccia stessa, nessuno dei quali si può calcolare dalla descrizione di una policy.

Non valuta nemmeno la qualità della configurazione dei profili: un profilo AntiVirus con tutte le scansioni disattivate qui risulta efficace, perché la domanda riguarda la visibilità.

## Condivisione dei risultati

Sotto la tabella della copertura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai incollato. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Le righe di direttiva nominano tipi di profilo e modalità di ispezione, non la tua rete, quindi il riquadro a comparsa non aggiunge una riga di avvertenza propria. Prima che venga offerto un link, nella casella viene cercata una credenziale definita da FortiOS o da uno standard: una riga `set` di un’impostazione che il [riferimento CLI di FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) classifica come password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e le altre; consultato il 01/11/2026) o il `name` di una community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sezione 3.2.5), qualsiasi valore `ENC` (secondo l’advisory di Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultato il 01/11/2026, dati di questo tipo pubblicati dove altri possono leggerli vanno considerati facili da decifrare: «should currently be considered “easy to decrypt”»), una coppia `psksecret=` o `password=` con gli stessi nomi su una riga di direttiva, una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una password in un URL o un ID della chiave di accesso AWS. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo, così ciò che condividi è esattamente ciò che hai scelto (un valore non viene mai sostituito all’interno di una casella incollata, perché cambierebbe ciò che viene inviato). Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina verifica la copertura. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Dove si colloca

Si abbina all’articolo sui profili di sicurezza di FortiGate, che spiega per intero la differenza tra flow e proxy, e all’articolo sulle modalità di ispezione SSL. Per chi prepara l’NSE 4 copre gli obiettivi dal 3.02 al 3.05.
