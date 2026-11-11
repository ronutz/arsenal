## Cosa fa

Legge il file eseguito da un monitor Scripted di BIG-IP LTM (le righe send ed expect conservate in `/config/eav/`) e lo spiega nel modo in cui, secondo la documentazione di F5, lo legge il monitor. Ogni riga viene mostrata così come è scritta e così come viene letta: la parola chiave, il testo senza virgolette e con le sequenze di escape di F5 risolte, il modo in cui termina un send (CR LF, solo LF, solo CR o nulla) e il significato di una risposta o di un comando noti in SMTP, POP3, IMAP o FTP, con la sezione della RFC. I rilievi verificano il file rispetto a ogni regola indicata da F5 e segnalano tutto ciò che F5 lascia aperto, con le regole da S1 a S16, ognuna legata a una riga.

Se fornisci anche la trascrizione di un server, lo strumento simula il controllo: ogni send viene inviato, ogni expect viene confrontato con la risposta successiva del server e il risultato è **superato**, **fallito alla riga N** con il motivo indicato da F5, oppure **indeterminato alla riga N** quando il testo di F5 non dice che cosa fa il monitor. Nulla si connette a niente: la trascrizione è un testo che incolli e lo script viene letto, mai eseguito. Il [laboratorio sul monitor Scripted](/learn/bigip-ltm-scripted-monitors#lab-scripted-monitor-dialogue) dell’articolo della sezione Imparare esegue uno script contro un server che segue le RFC, riga per riga, e mostra quale regola di F5 lo blocca.

I fatti sono quelli di F5: il BIG-IP 21.1.0 LTM Monitors Reference, sezione «Scripted monitor settings», e il TMSH Reference per `ltm monitor scripted`. I fatti sui protocolli vengono dalla RFC 5321 (SMTP), dalla RFC 1939 (POP3), dalla RFC 9051 (IMAP4rev2) e dalla RFC 959 (FTP). Tutti i documenti sono stati consultati il 27 ottobre 2026.

## Le regole indicate da F5

- **S1, un CR in una riga (errore).** Secondo F5, gli script devono usare terminatori di riga LF, non CR-LF («must use hard-return line endings (LF), not soft-return line endings (CR-LF)»). Un file salvato su Windows ha un CR prima di ogni LF. Il rilievo indica se il CR chiude la riga o si trova al suo interno.
- **S2, non esattamente uno spazio dopo la parola chiave (errore).** F5 chiede un solo spazio tra la parola chiave send o expect e il testo («Exactly one character space must be used to separate the send or expect instruction keywords from the text»). Due o più spazi, o una tabulazione, vengono segnalati.
- **S3, caratteri dopo una virgoletta di chiusura (errore).** Secondo F5, il testo da inviare o da confrontare arriva fino alla fine della riga anche con le virgolette, e qualsiasi carattere dopo la virgoletta di chiusura impedisce la corrispondenza («The text to send or match extends to the end of the line, even when using quotation marks. Any characters that follow a closing quotation mark will break the match.»). Su una riga expect il simulatore fa quindi fallire lì il controllo; su una riga send F5 non dice che cosa viene inviato, quindi il simulatore si ferma con esito indeterminato.
- **S4, una prima parola che non è send né expect (errore).** F5 documenta solo queste due parole chiave. Il rilievo indica quando la parola è una parola chiave con l’iniziale maiuscola (`Expect`), un commento (`#`) o il segno che è stato incollato uno script Expect (Tcl) (`spawn`, `set`, `#!/usr/bin/expect` e simili).
- **S5, una sequenza di escape che F5 non elenca (avviso).** La tabella di F5: `\a` campanello (bell), `\b` backspace, `\f` avanzamento pagina (form feed), `\n` nuova riga, `\r` ritorno a capo (return), `\t` tabulazione, `\v` tabulazione verticale, `\\` barra rovesciata, `\'` virgoletta singola. Qualsiasi altra cosa dopo una barra rovesciata, come `\x0d` o `\"`, non è documentata.
- **La regola del prefisso (la corrispondenza del simulatore).** Secondo F5, il testo di corrispondenza può corrispondere al prefisso di una risposta, ma non a una sottostringa che inizi altrove («Matching text can match the prefix of a response, but cannot match a substring that is not a prefix, that is, a substring that starts other than at the beginning of the response.»). Quando il testo compare più avanti nella risposta, il passaggio indica a quale carattere.
- **L’ordine.** Secondo F5, le righe del file vengono sempre lette nella sequenza indicata («the lines of the file are always read in the sequence specified»). Il simulatore percorre il file dall’alto in basso e si ferma alla prima riga che fallisce o su cui non si può decidere.

## Cosa lascia aperto F5

Il testo di F5 non risolve questi casi, quindi l’analizzatore li segnala come avvisi e il simulatore si ferma lì con esito **indeterminato** e il motivo, invece di tirare a indovinare:

- **S9, una riga vuota.** Le righe vuote dopo l’ultima istruzione vengono annotate, ma non possono cambiare una corrispondenza.
- **S10, spazi bianchi prima della parola chiave.**
- **S11, una forma di virgolette che F5 non descrive:** virgolette singole (F5 elenca un escape per la virgoletta singola, ma non dice se le virgolette singole racchiudono un testo), una virgoletta di apertura senza quella di chiusura, o una virgoletta dentro un testo senza virgolette.
- **S12, un testo vuoto** (`expect` da solo, o `expect ""`).
- **S13, un’ultima riga senza LF.** Un expect su una riga del genere ferma la simulazione; un send viene solo annotato.
- **S14, nessuna riga expect:** nulla di ciò che dice il server viene mai verificato.
- **Maiuscole e minuscole.** Quando la risposta inizia con il testo ma con maiuscole e minuscole diverse (`+ok` contro `+OK`), il simulatore dà esito indeterminato: F5 non dice se il confronto distingue tra maiuscole e minuscole.
- **Che cos’è una risposta.** F5 non dice quanta parte di una risposta su più righe legge il monitor prima del confronto. Quando una corrispondenza richiederebbe che il monitor abbia letto oltre la fine della prima riga della risposta, il simulatore dà esito indeterminato.
- **Una riga senza virgolette che termina con CR** (un file CR-LF senza virgolette): F5 indica solo LF, ma non come viene letta poi una riga del genere.

## Le indicazioni delle RFC

- **S6, un send senza terminatore di riga (avviso).** SMTP, POP3, IMAP e FTP chiudono ogni comando con CR LF (RFC 5321 2.3.8, RFC 1939, sezione 3, RFC 9051 2.2, RFC 959, sezione 4), quindi un server di questi protocolli lo attende. L’esempio di F5 scrive `\r\n` alla fine di ogni send; nulla nel testo di F5 dice che il monitor aggiunga un terminatore di riga.
- **S7, un send che termina con il solo LF o il solo CR (nota).** RFC 5321 2.3.8: un’implementazione conforme non deve riconoscere alcun terminatore di riga diverso da CR LF.
- **S8, un expect scritto come un pattern (nota):** un `^` iniziale, un `$` finale, `.*` o `.+`, oppure `-re`, `-gl`, `-ex` o `-nocase` di Expect. Il testo viene confrontato letteralmente; F5 indica che gli unici monitor che supportano la corrispondenza con espressioni regolari sono HTTP, HTTPS, HTTP/2, TCP e UDP.
- **S15, una credenziale in un send (avviso):** `PASS` (POP3, FTP) o `LOGIN` (IMAP). La password viene mascherata ovunque nell’output, compreso il confronto con la trascrizione. Il file la conserva in chiaro, il riferimento tmsh non elenca alcuna opzione TLS per questo tipo di monitor e la RFC 9051 6.2.3 stabilisce che LOGIN non deve essere usato su reti non sicure. POP3 consente QUIT e IMAP consente LOGOUT prima dell’autenticazione, quindi di solito è possibile un controllo che non accede mai.
- **S16, un expect su un codice di risposta seguito da uno spazio (nota),** come `"250 "`. Nelle risposte su più righe di SMTP e FTP ogni riga tranne l’ultima inizia con il codice e un trattino (RFC 5321 4.2.1, RFC 959 4.2), quindi `"250 "` non è mai l’inizio di una risposta a EHLO; attendi il solo codice.

## La trascrizione, e come la legge la simulazione

Scrivi la sessione come fanno le RFC: `S:` prima di ogni riga inviata dal server, `C:` prima di ogni riga inviata dal client.

```
S: 220 foo.com Simple Mail Transfer Service Ready
C: HELO bigip1.somecompany.net
S: 250 foo.com
C: quit
S: 221 foo.com Service closing transmission channel
```

- Una **risposta** è una sequenza di righe `S:`; una riga `C:` o una riga vuota la chiude. Inserisci una riga vuota tra due sequenze `S:` quando il server le invia come risposte separate.
- Ogni riga `S:` viene letta come terminata da **CR LF**, come richiedono tutti e quattro i protocolli. Gli spazi dopo `S:` e `C:` fanno parte della notazione, non dei dati (la RFC 1939 scrive `S:  +OK`, con due spazi).
- Ogni **expect** viene confrontato con la **risposta successiva**, a partire dal suo primo carattere. È l’unica ipotesi del simulatore: F5 non dice che cosa conta come risposta («the response») quando una risposta ha più righe. Ovunque questo possa cambiare il verdetto, il simulatore dà esito indeterminato.
- Ogni **send** viene confrontato con la riga `C:` successiva, se c’è; una differenza viene annotata (la trascrizione può venire da un altro client), mai considerata un fallimento.
- Quando nella trascrizione **non resta alcuna risposta** per un expect, il controllo fallisce lì: la riga Timeout di F5 indica che una destinazione che non risponde entro il Timeout viene considerata down.
- Le righe che non iniziano né con `S:` né con `C:` vengono ignorate ed elencate.

I motivi per cui un controllo fallisce: il testo compare nella risposta ma non all’inizio (con lo scostamento); la risposta non inizia con il testo e non lo contiene; la risposta termina prima del testo; dopo una virgoletta di chiusura seguono caratteri, oppure il CR di un terminatore CR-LF; non arriva alcuna risposta.

## Come leggere l’output

Il riepilogo conta righe, send, expect e rilievi, e segnala quando il file non termina con un LF. La simulazione mostra il verdetto, poi una riga di tabella per ogni riga raggiunta: la riga, ciò che invia o attende così come lo legge il monitor, la risposta con cui è stata confrontata (numerata come nella trascrizione) oppure, per un send, se la trascrizione mostra la stessa riga del client, e l’esito. La tabella delle righe mostra ogni riga così come è scritta: un carattere di controllo realmente presente nel file (il CR di un terminatore CR-LF, una tabulazione) compare come il suo simbolo grafico Unicode, come ␍ o ␉, e un escape scritto come barra rovesciata seguita da una lettera resta così come è stato scritto; altrove il testo viene mostrato con le sequenze di escape di F5 e la barra rovesciata come doppia barra.

Il pulsante **Esempio** carica lo script SMTP di F5 tratto dal Monitors Settings Reference, alla lettera, con una sessione modellata su quella della RFC 5321: il controllo viene superato.

## Tempi

Nella documentazione di F5 lo script non ha un proprio timer. L’Interval del monitor (10 secondi per impostazione predefinita per Scripted, secondo il riferimento tmsh) e il Timeout (31 secondi, tre volte l’Interval più uno) decidono quando un membro viene contrassegnato come down, come per ogni monitor; [l’articolo sui monitor di integrità LTM](/learn/ltm-health-monitors) e il suo [laboratorio sui tempi dei monitor](/learn/ltm-health-monitors#lab-f5-monitor-timing) mostrano come si combinano.

## Condivisione dei risultati

Alla fine del riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` entrambe le caselle (`input` per lo script, `transcript` per la trascrizione, se presente), con ogni password di PASS e LOGIN sostituita dai pallini che mostra questa pagina, sia nello script così come è scritto sia nelle righe `C:` della trascrizione, quindi nessuna password viene inviata così come l’hai inserita. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Sono le password che la regola S15 maschera: `PASS` ([RFC 1939](https://www.rfc-editor.org/rfc/rfc1939), sezione 7) e l’ultimo argomento di `LOGIN` ([RFC 9051](https://www.rfc-editor.org/rfc/rfc9051), sezione 6.2.3), consultate il 27/10/2026. Un pallino per carattere, come in questa pagina, quindi la pagina di chi riceve il link legge esattamente le stesse righe, gli stessi rilievi e la stessa simulazione: i vettori di condivisione dello strumento confrontano i due risultati per intero. Una password scritta con sequenze di escape non può essere individuata così come è scritta (la pagina maschera l’intero testo), quindi non ottiene alcun link, e il riquadro a comparsa indica la riga. Le altre credenziali vengono inviate così come le hai inserite, per esempio uno scambio SMTP AUTH ([RFC 4954](https://www.rfc-editor.org/rfc/rfc4954), Base64 che si decodifica nella password); il riquadro a comparsa lo segnala prima che tu copi. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Entrambe le caselle vengono compilate come farebbe un testo incollato (una trascrizione che il link non contiene viene svuotata) e la pagina le legge. Nulla si connette a niente e nulla viene eseguito. I valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Limiti

- L’analizzatore applica le regole pubblicate da F5. Non può sapere che cosa faccia una determinata build di BIG-IP al di là di queste; dove la documentazione tace, dà invece esito indeterminato.
- La trascrizione è tua: il simulatore non sa come risponde davvero il tuo server, con quale rapidità, né se risponde solo a una parte di una risposta.
- Il controllo delle credenziali si basa su un pattern: `PASS x` e `tag LOGIN user password`. Una password inviata in un altro modo (con AUTH, per esempio) non viene riconosciuta.
- Verifica il monitor reale sul sistema: `tmsh run ltm monitor scripted NAME destination ADDRESS:PORT`, poi `tmsh show ltm monitor scripted NAME test-result`, oppure il pulsante Test nella Configuration utility.

## API

Lo stesso motore risponde all’operazione `/api/v1/bigip-scripted-monitor-explainer` dell’API HTTP del sito, descritta nel contratto OpenAPI della [pagina dell’API](/api); il contratto indica anche se questo sito offre l’API.

- **Richiesta.** Un oggetto JSON, `{"script": "...", "transcript": "..."}`, nel corpo di una POST o nel parametro di query `input` di una GET; la trascrizione può essere vuota o assente. Lo script è limitato a 32.768 caratteri e la trascrizione a 65.536.
- **Risposta.** `lines` (ognuna con `line`, `raw`, `kind`, `keyword`, `written`, `quoted`, `decoded`, `length`, `ending`, `hint`, `secret`, `breaks` e `open`), `findings` (`rule`, `severity`, `line`, `params`), `counts`, `sends`, `expects`, `endsWithLf`, `transcript` (`replies`, `clientLines`, `ignoredLines`) e `simulation` (`verdict`, `stopLine`, `reason`, `steps`, `unreadReplies`, `unusedClientLines`, `notes`), gli ultimi due null quando non viene fornita alcuna trascrizione. Una password viene mascherata in ogni campo.

## Fonti

- [F5, BIG-IP 21.1.0 LTM Monitors Reference, Monitors Settings Reference: Scripted monitor settings, the escape sequences and F5's SMTP example; the TCP Receive String and which monitors support regular expressions](https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-local-traffic-manager-monitors-reference/monitors-settings-reference.html#scripted-monitor-settings) (consultato il 27/10/2026)
- [F5 TMSH Reference v17, ltm monitor scripted: options and defaults, run and show test-result](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_scripted.html) (consultato il 27/10/2026)
- [RFC 5321, Simple Mail Transfer Protocol](https://www.rfc-editor.org/rfc/rfc5321) (consultata il 27/10/2026)
- [RFC 1939, Post Office Protocol, Version 3](https://www.rfc-editor.org/rfc/rfc1939) (consultata il 27/10/2026)
- [RFC 9051, Internet Message Access Protocol (IMAP), Version 4rev2](https://www.rfc-editor.org/rfc/rfc9051) (consultata il 27/10/2026)
- [RFC 959, File Transfer Protocol](https://www.rfc-editor.org/rfc/rfc959) (consultata il 27/10/2026)
- Learn: [BIG-IP LTM Scripted monitors](/learn/bigip-ltm-scripted-monitors), [How LTM health monitors decide up or down](/learn/ltm-health-monitors). Strumenti correlati: l’[analizzatore di script Expect](/tools/expect-script-explainer), per Expect stesso, e l’[analizzatore della configurazione tmsh](/tools/f5-tmsh-config-explainer), per l’oggetto `ltm monitor scripted` che indica il file.
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
