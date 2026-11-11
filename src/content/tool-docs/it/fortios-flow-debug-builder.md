## Cosa fa

Compila ciò che vuoi tracciare (un indirizzo, facoltativamente le porte, un protocollo, un numero di pacchetti) e lo strumento compone l’intera sequenza `diagnose debug flow` per un FortiGate: l’azzeramento dello stato, il filtro, le opzioni di visualizzazione, la traccia e l’abilitazione, seguite dalla pulizia. Ogni riga viene spiegata singolarmente. Genera testo e non contatta nulla.

Per gran parte del modulo digitare è facoltativo: i campi delle porte e il numero di pacchetti hanno accanto le frecce su e giù, e sotto il campo del protocollo c’è un pulsante per ogni nome di protocollo che lo strumento converte nel suo numero (`tcp`, `udp`, `icmp`, `icmpv6`, `gre`, `esp`, `ah`, `sctp`); premere quello acceso svuota di nuovo il campo. Un numero di protocollo, gli indirizzi e il VDOM vanno comunque digitati.

## Perché un generatore e non un riferimento

`diagnose debug flow` non è un comando, è una ricetta di quattro o cinque comandi che funzionano solo insieme. L’ordine conta, la pulizia conta di più, e il tutto si usa così di rado che quasi nessuno lo ricorda con esattezza. È proprio il tipo di problema che risolve un generatore deterministico.

## L’ordine che produce, e perché

Lo strumento produce **prima il filtro, per ultima l’abilitazione**. La guida all’amministrazione di Fortinet mostra `diagnose debug enable` per primo, prima del filtro, e **funzionano entrambi**, quindi lo strumento lo dice nelle sue note invece di sceglierne uno in silenzio. Il motivo per preferire il filtro per primo è pratico: su un firewall molto carico, attivare l’output prima di impostare il filtro traccia tutto finché il filtro non è in posizione.

## Tre cose che ti dice sempre

- **Il conteggio è in pacchetti, non in secondi.** `trace start 100` sono cento pacchetti, e un’interfaccia molto carica può esaurirli in meno di un secondo.
- **Il traffico in offload non arriva mai a questo codice.** Sulle piattaforme NP o SP un filtro corretto può non produrre nulla mentre il traffico scorre in modo evidente. È il motivo più comune per cui una traccia corretta sembra non funzionare.
- **I numeri di riga nell’output non sono stabili tra le versioni.** Cerca la corrispondenza sul nome della funzione.

## Cosa non fa

Non può conoscere la tua piattaforma, l’organizzazione dei VDOM o se la sessione è in offload, e non convalida nulla su un dispositivo. Si rifiuta di costruire una traccia senza filtro, perché un debug flow senza filtro su un firewall di produzione è il modo più rapido per rendere inutilizzabile una console.

## Condivisione dei risultati

Sotto i comandi, dopo Copia, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il modulo sotto forma di valori con nome, sempre tutti i campi: `addr`, `saddr`, `daddr`, `port`, `sport`, `dport`, `proto`, `vdom` e `count` così come li hai inseriti (quelli vuoti vengono esclusi), e `iprope` e `timestamp` come 1 o 0. Il pulsante resta disattivato finché non è impostato un filtro, perché senza filtro la pagina non costruisce nulla. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Il modulo non contiene segreti (il generatore formatta testo e non esegue nulla), ma i suoi filtri indicano host, porte e un dominio virtuale della tua rete, quindi il riquadro a comparsa aggiunge un’avvertenza prima che tu copi qualsiasi cosa. Vengono inclusi tutti i campi, non solo quelli diversi dai valori predefiniti, così un vecchio link conserva il suo significato se un valore predefinito cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I valori del link sostituiscono l’intero modulo (un campo di testo che il link non contiene viene svuotato) e la pagina compone i comandi; non viene eseguito nulla. Un interruttore con un valore diverso da 1 o 0, o un link senza filtro, fa ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
