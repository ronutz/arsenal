## Cosa fa

Incolla una dichiarazione AS3 di F5 BIG-IP, il JSON che invii con POST a `/mgmt/shared/appsvcs/declare`, e lo strumento te la rilegge: se è una richiesta AS3 completa o una dichiarazione solo ADC, le opzioni di primo livello, i metadati ADC e l’albero Tenant, Application e risorse, con ogni classe indicata e spiegata. Verifica anche le regole strutturali documentate da F5. È uno strumento che si limita a decodificare, viene eseguito interamente nel tuo browser e si basa sulla guida utente e sul riferimento dello schema di AS3 pubblicati da F5.

## Richiesta o dichiarazione

La prima cosa che ti dice è quale delle due forme hai incollato. Una richiesta AS3 completa ha `class: "AS3"` e contiene `action` (deploy, dry-run, retrieve, remove, patch) e `persist`, che racchiudono la dichiarazione. Una dichiarazione solo ADC ha `class: "ADC"` al primo livello e omette il wrapper, quindi le opzioni action e persist non sono disponibili. Lo strumento mostra action e persist per una richiesta e, in entrambi i casi, schemaVersion, id, label e remark della dichiarazione ADC.

## L’albero che percorre

Sotto i metadati, lo strumento percorre la gerarchia fissa di AS3: ogni Tenant (che diventa una partizione BIG-IP), ogni Application (con il suo template, segnalando quando generic è il valore predefinito, da AS3 3.20 in poi) e ogni oggetto risorsa al loro interno. Per ogni oggetto mostra la classe e una spiegazione in parole semplici, da Service_HTTP e Service_HTTPS fino a Pool, Monitor, TLS_Server, TLS_Client, Certificate, Persist, WAF_Policy, Endpoint_Policy e iRule. Una classe che non riconosce viene comunque elencata e contrassegnata, mai nascosta.

## Le verifiche strutturali

Oltre alla spiegazione, lo strumento applica le regole documentate che rendono valida una dichiarazione: una classe AS3 o ADC al primo livello, uno schemaVersion obbligatorio, almeno un Tenant che contenga almeno una Application che contenga almeno una risorsa, e la regola di corrispondenza tra template e classe del servizio (un template http, https, tcp, udp o l4 richiede un oggetto Service corrispondente chiamato service, in passato serviceMain). Segnala inoltre, a titolo informativo, i nomi riservati (Common, Shared, service) e verifica che i nomi degli oggetti rispettino la regola: da 1 a 64 caratteri, alfanumerici, con una lettera iniziale.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` una copia della dichiarazione, mai il testo incollato: ogni valore che il [riferimento dello schema](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/schema-reference.html) di AS3 (consultato il 27/10/2026) definisce come segreto viene sostituito da `[redacted]`. Si tratta del `ciphertext` di un oggetto Secret (con l’intestazione `protected` predefinita è il segreto stesso, solo codificato in base64url), di un `passphrase`, `password`, `secret`, `sharedSecret` o `token` scritto come semplice stringa, delle passphrase con nome (`cookiePassphrase`, `md5SignaturePassphrase`, `javaSignKeyPassphrase`), del `privateKey` e del `pkcs12` di un Certificate, inseriti direttamente o forniti come `base64` o `text`, del `targetPassphrase` della richiesta AS3 e di ogni valore di `targetTokens`, e delle credenziali di Service Discovery (`secretAccessKey`, `apiAccessKey`, `encodedCredentials`, `encodedToken`). Il suo riquadro a comparsa indica prima cosa contiene il link e quanti valori sono stati sostituiti, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Questa pagina non mostra mai quei valori, quindi la pagina di chi riceve il link legge la stessa dichiarazione; la copia conserva ogni altro byte, spaziatura e ordine compresi. Una chiave fornita come percorso `bigip` o come `url` resta, e così `accessKeyId`, i nomi, gli indirizzi, le iRule e le stringhe `send` dei monitor, che lo schema non contrassegna come segreti: controllali tu prima di condividere.

Un testo incollato che non è JSON valido non si può scomporre in modo sicuro: se in un punto qualsiasi contiene una di quelle impostazioni, il link non viene creato e il riquadro a comparsa chiede di correggere prima il JSON; se non ne contiene nessuna, viene inviato così come l’hai inserito e la pagina di chi lo riceve mostra lo stesso errore di analisi.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia compila la casella come farebbe un testo incollato e la pagina la spiega; nulla viene inviato altrove. Il valore poi lascia subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Ambito e fondamenti

È un analizzatore della struttura e un controllo di coerenza, non un validatore JSON Schema completo. Non riproduce l’intero schema AS3 né verifica ogni proprietà, quindi una dichiarazione che qui risulta corretta può comunque essere rifiutata da AS3; considera un risultato senza rilievi un buon segno, non una garanzia. Nulla di ciò che incolli viene inviato o lascia la pagina. Si basa sulla documentazione AS3 di F5; per un deployment, convalida la dichiarazione con la tua versione di AS3 e con il riferimento dello schema.
