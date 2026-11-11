## Cosa fa

Incolla un profilo tmsh `client-ssl` o `server-ssl` e lo strumento lo spiega: il ruolo del profilo, la matrice delle versioni del protocollo TLS che attiva e disattiva, e una valutazione della sicurezza che copre la catena di certificati, la rinegoziazione, SNI, lo stapling OCSP (Online Certificate Status Protocol) e il TLS reciproco. Analizza il profilo interamente nel tuo browser e non contatta mai alcun dispositivo.

## Profili lato client e lato server

Su un BIG-IP, SSL è gestito da due tipi di profilo, e la prima cosa che lo strumento ti dice è di quale si tratta. Un profilo **client-ssl** termina il TLS proveniente dal client: il BIG-IP presenta un certificato e decifra il traffico. Un profilo **server-ssl** fa l’opposto: avvia il TLS verso il membro del pool, cifrando di nuovo il traffico in uscita. Un deployment TLS full proxy li usa entrambi: decifra il traffico del client per poterlo ispezionare o indirizzare, poi lo cifra di nuovo verso il server. Conoscere il ruolo inquadra tutto il resto del profilo.

## La matrice dei protocolli

Le versioni TLS ammesse da un profilo sono stabilite dal suo campo `options`, che attiva o disattiva versioni specifiche. Lo strumento lo mostra come una matrice chiara, così vedi a colpo d’occhio se, per esempio, TLS 1.0 e 1.1, deprecati dalla RFC 8996, sono ancora attivi, o se TLS 1.3 è attivo. Spesso è la cosa più importante da verificare in un profilo SSL, ed è facile leggerla male nella bitmask grezza di `options`.

## La valutazione della sicurezza

Oltre ai protocolli, lo strumento valuta le parti del profilo che determinano quanto è davvero sicuro il TLS:

- il **certificato, la chiave e la catena**, compreso se la catena è completa;
- la **rinegoziazione**, e se è richiesta la rinegoziazione sicura (RFC 5746);
- **SNI** (RFC 6066), per servire il certificato giusto quando più nomi condividono il profilo;
- lo **stapling OCSP** (l’estensione `status_request`, RFC 6066), che permette al server di fornire la prova del proprio stato di revoca; e
- la **convalida del certificato del peer**, cioè il modo in cui si configura il TLS reciproco, in cui il BIG-IP richiede e verifica un certificato client.

Ognuno riceve una valutazione, così le impostazioni rischiose si distinguono da quelle solide.

## Come si usa

Incolla un blocco di profilo `client-ssl` o `server-ssl` e leggi il suo ruolo, la sua matrice dei protocolli e la valutazione di sicurezza delle impostazioni di catena, rinegoziazione, SNI, OCSP e TLS reciproco. L’analisi è deterministica e locale.

Per verificare cosa negozia davvero un client con un virtual server che usa il profilo, esegui `openssl s_client` verso il virtual server e incolla l’output nell’[analizzatore di openssl s_client](/tools/openssl-s-client-explainer); la stringa di cifratura del profilo viene letta dall’[analizzatore di stringhe di cifratura F5](/tools/f5-cipher-string-expander).

## Condivisione dei risultati

Sotto l’intestazione del profilo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il profilo con il valore di ogni impostazione `passphrase` e `proxy-ca-passphrase` sostituito da `[redacted]`, mai così come l’hai incollato; i riferimenti di F5 per [client-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_client-ssl.html) e [server-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_server-ssl.html) (consultati il 27/10/2026) le descrivono come la passphrase della chiave e la passphrase della chiave della CA di SSL Forward Proxy. Il suo riquadro a comparsa indica prima cosa contiene il link e quanti valori sono stati sostituiti, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

Nemmeno questa pagina mostra mai quei valori, quindi la pagina che riceve il link legge lo stesso profilo. `passphrase none` resta, e così i nomi, le partizioni, gli oggetti file e i nomi host. Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga.
- **Apertura di un link.** La copia riempie la casella come farebbe un incolla e la pagina la spiega. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
