## Cosa fa

Incolla una firma SYN p0f v3 nella grammatica canonica (ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass): lo strumento decodifica tutti gli otto campi, spiega il ragionamento sul TTL iniziale e sulla finestra, dà un nome a ogni opzione TCP e a ogni token di quirk e confronta la forma dei campi con le firme di riferimento dei sistemi operativi documentate da p0f. Accetta sia la sola firma sia la forma «label = sig».

## Perché è passivo

p0f ricava l’impronta osservando i pacchetti che un host ha già inviato, il SYN di una normale connessione, e non invia mai una sonda propria. È questo che qui significa «passivo», ed è per questo che la tecnica è invisibile al bersaglio. Lo strumento fa un passo in più, verso la pura didattica: incolli una firma che hai già, e nulla viene letto dal tuo computer né inviato altrove.

## L’indizio del proxy

L’indicazione più utile in assoluto è il TTL iniziale. Poiché ogni router decrementa il TTL, un valore vicino a 64 indica Linux/BSD/Darwin, vicino a 128 Windows, vicino a 255 apparati di rete. Quando il TTL dello stack contraddice il sistema operativo dichiarato da uno User-Agent, quasi certamente stai guardando un proxy o un NAT: il pacchetto porta lo stack dell’intermediario, non quello del client. La disposizione delle opzioni e i quirks affinano l’ipotesi; lo strumento mostra il contributo di ciascuno.

## Condivisione dei risultati

Sotto la lettura del sistema operativo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la firma così come l’hai inserita (`input`), e nient’altro. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Una firma p0f descrive come un host costruisce un SYN TCP (TTL, opzioni, finestra, quirks); non nomina alcun host né alcuna persona.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la firma non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Apertura di un link.** La firma compila la casella come farebbe un incolla e la pagina la decodifica; non viene inviato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
