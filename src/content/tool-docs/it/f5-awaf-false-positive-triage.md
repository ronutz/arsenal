## Cosa fa

Scegli una violazione su cui stai facendo triage in F5 AWAF (Advanced WAF, in precedenza BIG-IP ASM, Application Security Manager): la sua categoria, il suo violation rating medio e se il controllo è applicato, in staging o in una policy in modalità Transparent. Lo strumento restituisce il verdetto di F5 basato sul rating, se la violazione sta bloccando il traffico in questo momento e la correzione mirata per quella categoria, nel caso si riveli un vero falso positivo. È il complemento dello stimatore di avvelenamento: quello strumento mette in guardia dall’allentare troppo, questo mostra come allentare correttamente per un vero falso positivo. È deterministico e viene eseguito interamente nel tuo browser.

## Il verdetto viene dal rating

Advanced WAF assegna a ogni transazione un violation rating da 1 a 5, ed è quel rating a decidere come trattare un sospetto falso positivo. I rating 4 o 5 sono probabilmente attacchi reali e bloccano anche quando il flag Block di ogni violazione è disattivato, quindi lo strumento ti dice di scartare il suggerimento senza modificare la policy. Un rating 3 è ambiguo e va prima esaminato nel log degli eventi. I rating 1 e 2 sono di solito veri falsi positivi, quindi lo strumento ti dice di applicare la correzione mirata (o di accettare il suggerimento di apprendimento) una volta che hai confermato che la richiesta è legittima.

## Tiene conto dello staging e della modalità Transparent

Che una violazione stia davvero bloccando dipende dall’applicazione. Lo strumento indica una violazione come bloccante solo quando la policy è in modalità Blocking e il rating è 4 o 5. Una firma in staging registra nei log ma non blocca, e una policy in modalità Transparent non blocca nulla, quindi in quei casi lo strumento fa notare che il falso positivo è un segnale per l’apprendimento e non un’esperienza utente compromessa, e che la correzione conta per quando l’applicazione verrà attivata.

## La correzione è sempre mirata

Per ogni categoria di violazione lo strumento indica la correzione documentata, e ogni opzione è circoscritta all’URL o al parametro specifico, mai una disattivazione a livello dell’intera policy. Disattivare una firma su un URL, aggiungere un’entità consentita, aggiungere un metacarattere all’insieme di quell’entità, aumentare una lunghezza specifica, contrassegnare un parametro di caricamento file, associare un profilo di contenuto XML o JSON, o attivare Potential False Positive Detection sono tutte azioni mirate. Lo strumento ribadisce sempre la disciplina che governa l’intero esercizio: allenta solo dove si è verificato davvero un falso positivo, mai dove la violazione è stata causata da un attacco reale.

## Fondamenti

La logica che porta dal rating all’azione e le correzioni mirate vengono dal K70544352 di F5 (Reducing false positive violations), dalla documentazione Working with Violations di BIG-IP ASM (che definisce come il rating determina il blocco e quali violazioni non si possono apprendere) e dalle indicazioni di Refining Security Policies with Learning. Nulla di ciò che selezioni viene inviato o lascia la pagina. Per una modifica in produzione, verifica con la documentazione e con la richiesta specifica nel tuo log degli eventi.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le tre scelte con i loro ID: `category`, `rating` e `state`. Tutte e tre vengono sempre incluse, così il link continua ad aprire lo stesso triage anche se le scelte iniziali della pagina cambiano. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Le tre scelte vengono impostate e la pagina esegue il calcolo come a ogni modifica. Una scelta che la pagina non offre fa ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
