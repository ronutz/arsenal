## Cosa fa

PingFederate ti permette di scrivere espressioni OGNL nelle mappature degli attributi e nei criteri di emissione, per i casi in cui una semplice mappatura non basta. Lo strumento legge una di queste espressioni e la spiega costrutto per costrutto, poi segnala ciò che tende a rompersi in produzione invece che nei test. Viene eseguito nel tuo browser e non valuta mai l’espressione.

## Perché conta il selettore del contesto

Una mappatura degli attributi e un criterio di emissione sono entrambi espressioni, ma devono restituire cose diverse. Una mappatura produce il valore che viene inviato oltre nell’asserzione o nel token. Un criterio produce true o false, e l’emissione procede solo quando è true. Confondere i due è un errore di configurazione comune, e non fallisce in modo evidente: un criterio che restituisce una stringa invece di un booleano si comporterà in modi che sembrano un problema di autorizzazione da tutt’altra parte. Il selettore esiste perché lo strumento possa dirti quando ciò che hai scritto non corrisponde al posto in cui lo stai mettendo.

## Cosa spiega

I costrutti riconosciuti sono quelli che compaiono nelle mappature reali: la lettura di un attributo per nome, il controllo sul null, la conversione di un valore in stringa, la normalizzazione di maiuscole e minuscole, le operazioni sulle stringhe che tolgono il dominio da un nome utente o ripuliscono gli spazi bianchi che una directory si porta dietro dal 2004, le espressioni condizionali che forniscono un valore predefinito, i letterali di mappa che traducono i nomi dei gruppi della directory nei nomi dei ruoli dell’applicazione e le proiezioni e selezioni che gestiscono attributi multivalore come l’appartenenza ai gruppi.

## I controlli diagnostici e il perché di ciascuno

**Attributi letti senza controllo sul null.** È la causa più comune in assoluto di un’espressione che funziona nei test e fallisce in produzione, e il motivo è banale: gli account usati per i test sono più ordinati della directory. Un attributo sempre presente sul tuo account non è sempre presente su quello di tutti, assente non equivale a vuoto, e capitano entrambi. Lo strumento elenca gli attributi che ha visto leggere, così puoi decidere su quali puoi davvero contare.

**Chiamate a metodi Java statici.** Costrutti come `@java.lang.String@format` sono supportati e a volte sono proprio la scelta giusta. Sono anche il motivo per cui nel prodotto la scrittura delle espressioni è un ruolo amministrativo a parte: lo stesso costrutto che formatta una data può arrivare a molto più di una data. Segnalarlo non è un invito a rimuoverlo: è una nota che dice che l’espressione fa qualcosa che solo il ruolo per le espressioni dovrebbe poter fare.

**Un criterio senza alcun confronto.** Se un criterio di emissione non contiene alcun confronto, alcun test di appartenenza e alcuna corrispondenza di pattern, difficilmente restituisce un booleano, qualunque cosa restituisca al suo posto.

**Una mappatura che si limita a passare un attributo.** È legittima, e di solito si ottiene anche senza alcuna espressione. Quando puoi, è da preferire, perché una semplice mappatura è visibile a ogni amministratore, mentre un’espressione può essere modificata solo dal ruolo per le espressioni, e chi un giorno dovrà farne il debug potrebbe non avere quel ruolo.

**Espressioni diventate lunghe.** Le espressioni lunghe sono difficili da revisionare, ancora più difficili da passare ad altri, e invisibili a chiunque non abbia il ruolo per le espressioni, cioè alla maggior parte delle persone che prima o poi ne saranno responsabili.

## Perché non valuta mai

Un analizzatore di espressioni che le valutasse sarebbe un servizio di esecuzione di codice, cioè proprio la proprietà che rende la scrittura delle espressioni un privilegio controllato all’interno di PingFederate stesso. Lo strumento analizza e descrive. Se vuoi sapere cosa restituisce un’espressione per un determinato utente, il posto giusto per scoprirlo è una connessione di test in un ambiente non di produzione, non una pagina web.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’espressione così come l’hai inserita e, quando si tratta di un criterio di emissione, il contesto in cui viene usata (la mappatura degli attributi è il valore predefinito, quindi viene omessa). Il suo riquadro a comparsa indica prima cosa contiene il link, poi un’avvertenza specifica: le espressioni riportano nomi reali di attributi e a volte di gruppi, quindi rileggila prima di inviare il link. Poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Se il controllo dei segreti del sito trova nell’espressione una credenziale scritta in una forma che riconosce dall’aspetto, il link non viene creato e il riquadro a comparsa indica la credenziale e la sua riga: una chiave privata PEM, un’intestazione Authorization, un ID della chiave di accesso AWS, un JWT, una password in un URL o un valore FortiOS `ENC`. Sostituiscila con un segnaposto e premi di nuovo; la pagina spiega gli stessi costrutti in entrambi i casi.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** L’espressione e il suo contesto compilano la pagina, che la spiega come per un incolla; come sempre, non viene valutato né inviato nulla. Un contesto che la pagina non offre, o un’espressione che contiene una credenziale, fa ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
