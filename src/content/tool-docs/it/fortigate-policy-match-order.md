## Cosa fa

Incolla un elenco ordinato di policy di FortiGate e, facoltativamente, un pacchetto. Lo strumento percorre l’elenco dall’alto verso il basso mostrando quale campo ha escluso ogni policy, indica la vincente e segnala quando il pacchetto arriva fino alla negazione implicita (implicit deny). In locale e offline: ragiona sull’elenco che gli fornisci e non tocca mai un dispositivo.

## L’analisi che vale la pena eseguire da sola

Anche senza pacchetto, lo strumento segnala le **policy che non possono mai essere raggiunte**, quando una policy precedente copre tutti i campi che copre una successiva. È la forma più comune di «la mia regola non funziona»: la regola è corretta e semplicemente non viene mai raggiunta. Vale la pena eseguirla periodicamente, non solo quando qualcosa si rompe.

## Cosa corregge

**L’ID della policy è un identificatore, non una posizione.** La policy 3 può trovarsi sotto la policy 47, e rinumerare non cambia nulla nell’ordine di valutazione. Molto materiale online si legge come se l’ID fosse l’ordine; lo strumento enuncia la correzione a ogni esecuzione, e uno dei suoi vettori di test di riferimento (golden vectors) è un elenco in cui la policy 47 sta sopra la policy 3 e vince.

Dice anche sempre che **ogni direzione richiede la propria policy**: il traffico consentito da A verso B non dice nulla su quello da B verso A.

## Le regole sugli IP virtuali

Una policy a cui è applicato un **VIP viene valutata in modo diverso e ha la priorità** su una policy ordinaria, quindi l’ordine da solo non impedisce a un’origine di raggiungerla. La policy di deny richiede **`match-vip`** e deve stare sopra. Le nuove policy di deny lo hanno abilitato per impostazione predefinita; una policy di **accept** non può averlo affatto, e lo strumento segnala quella combinazione come impossibile.

## Cosa non fa

Non risolve gli oggetti indirizzo né i gruppi di servizi, quindi un oggetto con nome è un token opaco, a meno che non sia `all` o `any`. Può quindi dirti che `web-servers` e `all` sono diversi, ma non se uno contiene l’altro. Per questo l’autorità è il dispositivo.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le policy e la riga del pacchetto così come le hai inserite (una riga del pacchetto vuota viene esclusa). Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Le policy riportano le tue interfacce, i tuoi oggetti indirizzo e i tuoi servizi (è il motivo per cui il riquadro a comparsa aggiunge una riga di avvertenza). Vengono letti entrambi i campi, e un messaggio su una credenziale indica quale dei due la contiene. Prima che venga offerto un link, nella casella viene cercata una credenziale definita da FortiOS o da uno standard: una riga `set` di un’impostazione che il [riferimento CLI di FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) classifica come password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e le altre; consultato il 01/11/2026) o il `name` di una community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sezione 3.2.5), qualsiasi valore `ENC` (secondo l’advisory di Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultato il 01/11/2026, dati di questo tipo pubblicati dove altri possono leggerli vanno considerati facili da decifrare: «should currently be considered “easy to decrypt”»), una coppia `psksecret=` o `password=` con gli stessi nomi su una riga di direttiva, una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una password in un URL o un ID della chiave di accesso AWS. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo, così ciò che condividi è esattamente ciò che hai scelto (un valore non viene mai sostituito all’interno di una casella incollata, perché cambierebbe ciò che viene inviato). Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I due campi si riempiono come se li avessi digitati (se il link non contiene una riga del pacchetto, quel campo resta vuoto) e la pagina li legge. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
