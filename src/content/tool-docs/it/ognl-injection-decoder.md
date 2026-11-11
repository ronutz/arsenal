## Cosa fa

Stai guardando un evento del WAF (web application firewall), o una riga del log di un’applicazione, e contiene qualcosa come `%{(#_memberAccess["allowStaticMethodAccess"]=true)...}`. Lo strumento legge quella stringa e ti dice cosa cercava di fare: quali costrutti contiene, se nel complesso servono a disattivare la sandbox delle espressioni, a eseguire un comando, a entrambe le cose o a nessuna delle due, e con quale famiglia di advisory pubblicati è compatibile la sua forma. Viene eseguito interamente nel tuo browser e non valuta mai alcuna parte di ciò che incolli.

## Cosa non è

È un decodificatore. Legge payload già arrivati da qualche parte e li spiega. Non costruisce payload, non suggerisce varianti di quello che hai incollato e non contiene alcuna libreria di modelli da cui attingere: tutto ciò che riconosce è sintassi pubblica, documentata nei bollettini di sicurezza di Apache stessa e visibile nei log di chiunque gestisca un web server su Internet. Spiegare un artefatto catturato è la metà difensiva del lavoro. Produrne di nuovi non è lo scopo di questo sito, e lo strumento è costruito in modo che leggerne il codice sorgente non ti dia nulla che tu non possa ricavare dall’advisory.

## OGNL, in un paragrafo

OGNL (Object-Graph Navigation Language) è un linguaggio di espressioni per leggere e scrivere le proprietà degli oggetti Java. Esiste perché un framework possa permettere alla configurazione di arrivare dentro un’applicazione in esecuzione: recupera questa proprietà, chiama quel metodo, formatta il risultato. È davvero utile, ed è anche tutto il problema: un’espressione che può chiamare metodi su oggetti attivi è sicura solo finché le espressioni valutate sono state scritte da qualcuno di cui ti fidi. Apache Struts ha passato diversi anni a correggere una famiglia di falle che avevano tutte la stessa forma: un input fornito dall’attaccante raggiungeva un valutatore che lo trattava come configurazione.

## Le due metà che lo strumento cerca

Un tentativo efficace contro la famiglia Struts aveva bisogno di due cose, e lo strumento le segnala separatamente perché la differenza ti dice con cosa hai a che fare. La prima è un’uscita dalla sandbox (sandbox escape): OGNL limita ciò che un’espressione può toccare tramite un oggetto chiamato `_memberAccess`, e l’uscita funziona raggiungendo quell’oggetto e disattivandone le restrizioni. La seconda è una primitiva di esecuzione, di solito una chiamata all’oggetto `Runtime` della JVM seguita da `exec`, che avvia un processo del sistema operativo.

Un payload con entrambe è un vero tentativo di sfruttamento e merita il trattamento completo: stabilire se la richiesta è stata bloccata, cosa ne ha fatto l’applicazione e se il runtime aveva le patch. Un payload con la sola chiamata di esecuzione è molto più comune e molto meno allarmante, perché su un runtime con le patch quella chiamata viene semplicemente rifiutata: di solito significa che uno scanner sta scorrendo un elenco, non che qualcuno abbia studiato la tua applicazione. Un payload con la sintassi delle espressioni e nient’altro è il più delle volte una sonda, che verifica se l’input viene valutato prima di inviare qualcosa di più costoso. Quella risposta conta più di quanto sembri, perché se è no, non funzionerà nient’altro dell’elenco.

## Famiglie di advisory

Quando la forma è caratteristica, lo strumento indica la famiglia di advisory: la falla del 2017 nel parser multipart, in cui l’intestazione `Content-Type` stessa veniva valutata quando l’analisi falliva; la più ampia famiglia member-access, le cui correzioni hanno ristretto più volte ciò che un’espressione poteva raggiungere; e il problema del 2018 in cui venivano valutati i valori di namespace e result, il che rendeva un percorso URL un vettore di esecuzione. Vengono indicate come compatibili con il payload e non come identificazione, perché diverse famiglie hanno la stessa forma e un payload dimostra ciò che è stato tentato, non ciò che era presente.

## Cosa non ti dice, di proposito

Tre cose, mostrate ogni volta invece di essere nascoste dietro un interruttore, perché il modo più pericoloso di leggere questa pagina è non vedere alcun rilievo e concludere che vada tutto bene.

Non può dirti se la richiesta è stata bloccata: quello sta nell’evento del WAF, non nel payload. Non può dirti se l’applicazione ha valutato l’espressione, cosa che dipende dalla versione e dalla configurazione del framework, non dalla stringa. E l’assenza di un costrutto riconosciuto non è assenza di rischio: i payload vengono abitualmente codificati in URL, codificati due volte o suddivisi tra più parametri, quindi prima decodifica e poi leggi. Un risultato pulito su un payload codificato significa che lo strumento ha letto la codifica, non l’attacco.
