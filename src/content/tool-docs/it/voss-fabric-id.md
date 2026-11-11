## Cosa fa

Fabric Connect (SPBM) di Extreme dà un nome alle cose con tre numeri, e questo strumento decodifica quello che incolli, riconoscendolo automaticamente dalla forma:

- un **I-SID**, un identificatore di servizio a 24 bit (da 1 a 16.777.215) che indica un’istanza di servizio nella fabric;
- un **nickname**, un identificatore di nodo a 20 bit scritto `X.XX.XX` in esadecimale; e
- un **system-id / B-MAC**, un indirizzo a 48 bit in forma MAC scritto come tripletta puntata, ad esempio `00bb.0021.0001`.

Viene eseguito interamente nel tuo browser.

## L’I-SID

L’I-SID è il cuore di un servizio della fabric. Una VLAN cliente associata a un I-SID è una Layer 2 VSN; un’istanza VRF (Virtual Routing and Forwarding) associata a un I-SID è una Layer 3 VSN; la tabella di routing globale trasportata su IS-IS senza I-SID è IP Shortcuts. Il numero in sé non codifica quale di questi casi sia, perché dipende da come esegui il provisioning, quindi lo strumento verifica l’intervallo a 24 bit e ne spiega l’uso invece di tirare a indovinare un tipo. L’I-SID predefinito della rete Fabric Attach (FAN) è 16777001, e lo strumento lo mette in evidenza.

## Il nickname

Ogni nodo SPBM ha un nickname a 20 bit, scritto come una cifra esadecimale, un punto, due cifre esadecimali, un punto e altre due cifre esadecimali (ad esempio `C.30.00`). Deve essere univoco in tutta la fabric, anche tra aree IS-IS adiacenti. Lo strumento converte la forma `X.XX.XX` nel suo valore intero e viceversa, e ne verifica l’intervallo. L’assegnazione dinamica dei nickname li distribuisce a partire da un intervallo di prefissi del server, come `C.30.00-C.3F.FF`.

## Il system-id / B-MAC

Il B-MAC del nodo, configurato come system-id IS-IS, è un indirizzo a 48 bit. Lo strumento legge i due bit significativi del suo primo ottetto: il bit U/L (l’indicazione di Extreme è di usare un indirizzo amministrato localmente, primo ottetto `02`) e il bit I/G (l’indirizzo di un nodo dovrebbe essere individuale, non di gruppo).

## Come si usa

Incolla un I-SID decimale, un nickname `X.XX.XX` o un B-MAC in tripletta puntata. Il riconoscimento avviene dalla forma, quindi non c’è nulla da selezionare.

## Condivisione dei risultati

Sotto la lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene l’identificatore così come l’hai inserito (`#input=C.30.00`), e nient’altro. Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un identificatore è molto più corto.
- **Apertura di un link.** Il link è lo stesso indirizzo usato dagli altri link verso questo strumento: l’identificatore compila il campo e viene decodificato come se lo digitassi. Come per ogni link verso questo strumento, il valore resta dopo il `#` finché non modifichi o cancelli il campo, e poi lascia l’indirizzo senza alcuna richiesta.
