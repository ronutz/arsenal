## Cosa fa

Descrivi entrambe le estremità di un tunnel IPsec e questo strumento indica su cosa non sono d’accordo, e poi la parte che conta davvero: **quale fase fallirebbe**. Viene eseguito interamente nel tuo browser.

## Perché la fase è tutta la diagnosi

La fase 1 autentica i peer e protegge la negoziazione. La fase 2 si svolge all’interno di quel canale protetto e negozia le security association e i selettori.

È per questa divisione che conoscere la fase restringe subito il campo del guasto. Un errore di fase 1 riguarda l’identità o la proposta, e non viene mai tentata alcuna fase 2, quindi la sua assenza dai log è attesa e non un secondo problema. Un errore di fase 2 significa che i peer si sono autenticati correttamente e *poi* non si sono accordati su cosa proteggere, il che punta ai selettori, ai transform o alla PFS e a nient’altro.

Invertire le due cose manda chi indaga nella metà sbagliata della configurazione, ed è per questo che lo strumento parte dal verdetto e non da una tabella campo per campo.

## I tre falsi positivi che si rifiuta di produrre

Un analizzatore di incongruenze che segnala come guaste configurazioni sane è peggio di nessun analizzatore, perché si smette di leggerlo. Tre differenze sembrano errori e non lo sono:

**Gli elenchi delle proposte non devono essere identici.** FortiOS accetta un elenco, e il tunnel si attiva se c’è un valore in comune. Confrontare `aes256` con `aes128 aes256` e chiamarla incongruenza sarebbe sbagliato, quindi lo strumento calcola l’intersezione e considera corretto un valore condiviso.

**Le durate non devono coincidere.** Vince la più breve. Lo strumento indica il valore effettivo e dice esplicitamente che non è un errore. Valori molto diversi significano solo rinnovi delle chiavi a intervalli scomodi.

**I selettori sono speculari.** La subnet locale di un peer è quella remota dell’altro, quindi confrontare locale con locale segnalerebbe ogni tunnel costruito correttamente. Il confronto è incrociato di proposito.

I rilievi sono divisi tra disaccordi bloccanti e differenze che non sono errori, e tenuti visivamente separati. Presentare «le durate sono diverse» con lo stesso peso di «nessuna cifratura in comune» è il modo in cui un output diventa rumore.

## Cosa rileva

Fase 1: versione IKE, metodo di autenticazione, modalità IKEv1, e nessuna cifratura, hash o gruppo DH in comune. La modalità viene confrontata solo quando la versione è v1, perché segnalare main contro aggressive su IKEv2 sarebbe un falso positivo proprio del tipo descritto sopra.

Fase 2: nessun transform in comune, PFS attiva su un solo lato, un’incongruenza del gruppo DH della PFS quando è attiva su entrambi, e incongruenze dei selettori in una delle due direzioni.

Il caso della PFS merita una menzione a parte: il messaggio di log di quell’errore di solito non nomina la PFS, ed è per questo che fa perdere tanto tempo e che vale la pena avere uno strumento che lo indichi.

## I selettori sono esatti, non approssimati

`10.1.0.0/16` contro `10.1.0.0/24` è un’**incongruenza**, non una quasi corrispondenza. Entrambi i lati devono concordare esattamente sulle reti che il tunnel trasporta. Quando uno dei peer è un dispositivo con un supporto limitato dei selettori, le due estremità vanno configurate in modo simmetrico e non per comodità.

## Cosa non ti dice

Confronta ciò che fornisci. Un campo presente su un lato e assente sull’altro viene trattato come *non indicato* e non come un disaccordo, perché un incolla parziale non è prova di un guasto.

Non diagnostica nemmeno il caso che in pratica fa perdere più tempo: un tunnel che risulta **attivo e non fa passare traffico**. Non è affatto un problema IPsec: manca una route o una policy del firewall, e lo strumento lo dice quando non trova alcun disaccordo fatale.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` entrambi i peer così come li hai incollati. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

I nomi dei peer e le subnet protette descrivono la tua rete (è il motivo per cui il riquadro a comparsa aggiunge una riga di avvertenza). La pagina non legge alcuna chiave precondivisa, ma chi descrive un tunnel potrebbe scriverne una su una riga `phase1:` o incollare un blocco phase1-interface accanto alle direttive. Prima che venga offerto un link, nella casella viene cercata una credenziale definita da FortiOS o da uno standard: una riga `set` di un’impostazione che il [riferimento CLI di FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) classifica come password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e le altre; consultato il 01/11/2026) o il `name` di una community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sezione 3.2.5), qualsiasi valore `ENC` (secondo l’advisory di Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultato il 01/11/2026, dati di questo tipo pubblicati dove altri possono leggerli vanno considerati facili da decifrare: «should currently be considered “easy to decrypt”»), una coppia `psksecret=` o `password=` con gli stessi nomi su una riga di direttiva, una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una password in un URL o un ID della chiave di accesso AWS. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo, così ciò che condividi è esattamente ciò che hai scelto (un valore non viene mai sostituito all’interno di una casella incollata, perché cambierebbe ciò che viene inviato). Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina confronta i due peer. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Dove si colloca

Si abbina all’articolo sulle VPN (Virtual Private Network) IPsec di FortiGate, organizzato attorno alla stessa domanda, che tratta le scelte di topologia che questo strumento non modella. Per chi prepara l’NSE 4 copre l’obiettivo 5.01.
