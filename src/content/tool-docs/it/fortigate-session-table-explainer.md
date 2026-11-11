## Cosa fa

Incolla l’output di `diagnose sys session list` e questo strumento lo rilegge: il protocollo e il suo stato, quale policy ha ammesso il flusso, cosa è stato tradotto su ogni tratto, i timer e se l’altro capo ha mai risposto. Viene eseguito interamente nel tuo browser e non contatta mai alcun dispositivo.

## Perché vale la pena leggere la tabella delle sessioni

La tabella delle sessioni è il registro autorevole di ciò che il FortiGate ha fatto davvero. L’elenco delle policy ti dice cosa dovrebbe succedere; la sessione ti dice cosa è successo. Quando qualcuno insiste che il firewall sta bloccando il suo traffico, una voce di sessione che mostra il flusso ammesso dalla policy 7, con byte contati in entrambe le direzioni, chiude la questione in una riga.

Il problema è la presentazione. L’output è denso, posizionale e difficile da ricordare, quindi l’informazione c’è ma nessuno la legge.

## La lettura che si salta

```
statistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0
```

Pacchetti in uscita, zero in risposta. Il FortiGate ha inoltrato il traffico e **non è tornato nulla**. La sessione esiste, il che significa che una policy l’ha consentita, quindi non è il firewall a bloccare qualcosa: il problema è oltre questo dispositivo, nel routing sul percorso di ritorno, nell’host di destinazione o in un filtro più avanti.

Lo strumento parte da questa lettura invece di riportare due numeri, perché scambiarla per un problema del firewall è l’errore più comune e più costoso che si fa con questo output.

Per l’UDP, `proto_state` dice la stessa cosa in modo più diretto: `00` è unidirezionale, `01` è bidirezionale.

## Gli hook del NAT

Le righe `hook=` sono il punto in cui la traduzione diventa visibile.

```
hook=post dir=org  act=snat 192.168.1.10:52345->93.184.216.34:443(203.0.113.5:52345)
hook=pre  dir=reply act=dnat 93.184.216.34:443->203.0.113.5:52345(192.168.1.10:52345)
```

La tupla tra parentesi è la forma tradotta. `hook=post dir=org act=snat` contiene l’origine dopo il NAT, cioè quella che vede l’altro capo. `hook=pre dir=reply act=dnat` contiene la destinazione prima del NAT. Una sessione senza `snat` né `dnat` su alcun tratto è stata instradata senza traduzione, e lo strumento lo dice invece di lasciarlo sottinteso.

## Cosa non ti dice

I campi le cui tabelle complete di valori fanno parte della documentazione del vendor vengono mostrati **grezzi**, con il loro significato indicato solo dove è documentato e privo di ambiguità. Il `proto_state` del TCP è il caso più chiaro: le due cifre sono lo stato della connessione in ciascuna direzione, `01` è la sessione stabilita che tutti incontrano, e il resto della tabella spetta a Fortinet pubblicarlo. Lo strumento dice cosa significano le cifre e non inventa la corrispondenza.

È un limite voluto. Un decodificatore che tira a indovinare una tabella di valori sembra più completo e sbaglia proprio quando il valore è insolito, che è proprio il momento in cui ti trovi a leggere la tabella delle sessioni.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le sessioni così come le hai incollate. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

L’output di `diagnose sys session list` riporta indirizzi, porte, traduzioni NAT e la policy di ogni flusso, e può riportare un utente autenticato (è il motivo per cui il riquadro a comparsa aggiunge una riga di avvertenza). Prima che venga offerto un link, nella casella viene cercata una credenziale definita da FortiOS o da uno standard: una riga `set` di un’impostazione che il [riferimento CLI di FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) classifica come password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e le altre; consultato il 01/11/2026) o il `name` di una community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sezione 3.2.5), qualsiasi valore `ENC` (secondo l’advisory di Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultato il 01/11/2026, dati di questo tipo pubblicati dove altri possono leggerli vanno considerati facili da decifrare: «should currently be considered “easy to decrypt”»), una coppia `psksecret=` o `password=` con gli stessi nomi su una riga di direttiva, una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una password in un URL o un ID della chiave di accesso AWS. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo, così ciò che condividi è esattamente ciò che hai scelto (un valore non viene mai sostituito all’interno di una casella incollata, perché cambierebbe ciò che viene inviato). Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina legge ogni sessione. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Dove si colloca

Si abbina all’analizzatore del policy lookup FortiGate: quello strumento prevede quale policy *dovrebbe* corrispondere, questo conferma quale policy *ha* corrisposto. Insieme chiudono il cerchio tra configurazione e comportamento. Per chi prepara l’NSE 4 copre gli obiettivi 1.02 e 1.04.
