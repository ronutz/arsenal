## Cosa fa

Incolla un elenco di policy del firewall di FortiGate e un pacchetto, e questo strumento esegue la valutazione che farebbe FortiOS: dall’alto verso il basso, ogni criterio deve corrispondere, vince la prima corrispondenza. Riporta la policy che corrisponde, una traccia che indica il **primo criterio che ha escluso** ciascuna policy precedente, e le policy sotto la corrispondenza che avrebbero corrisposto anch’esse. Viene eseguito interamente nel tuo browser e non contatta mai alcun dispositivo.

## Perché la traccia conta più del verdetto

Sapere che ha corrisposto la policy 7 è una piccola parte della risposta. La parte utile è perché le policy da 1 a 6 non hanno corrisposto, perché è questo che ti dice se l’elenco è scritto come previsto. Una policy con gli indirizzi giusti e l’interfaccia di uscita sbagliata non corrisponde senza dare alcun segnale, e nulla nell’interfaccia grafica lo segnala; il contatore degli hit semplicemente non aumenta mai.

La traccia indica un criterio per policy: il primo che non ha corrisposto. FortiOS li richiede tutti, quindi un solo criterio mancato basta a escludere una policy, e riportare il primo è ciò che mantiene leggibile l’output su un elenco lungo.

## Oscurata o catch-all: la distinzione è il punto

Quando una policy corrisponde, le policy successive che avrebbero corrisposto anch’esse ricadono in due categorie molto diverse, e lo strumento le tiene separate.

**Oscurata** (shadowed) significa che la policy successiva è specifica almeno quanto quella che ha vinto. È un vero errore: è attiva nella configurazione, a schermo sembra corretta e, con questo ordine, non può mai avere effetto su questo traffico. È il problema di policy più comune su FortiGate, e la correzione consiste nello spostarla sopra la vincente.

**Catch-all** significa che la policy successiva è più ampia di quella vincente. Un allow generico sotto un insieme di regole specifiche è un progetto corretto, non un errore, quindi lo strumento lo riporta senza segnalarlo. Confondere le due cose è ciò che porta questo genere di strumenti a gridare al lupo su ogni elenco di policy ben ordinato, ed è per questo che la specificità viene calcolata e non presunta.

## Formati di input

Sono accettate due forme, perché potresti avere l’una o l’altra.

**CLI di FortiOS**: l’output di `show firewall policy` o un blocco `config firewall policy`. I membri vengono letti dagli elenchi tra virgolette, e una policy con `set status disable` viene indicata come saltata invece di essere ignorata in silenzio.

**Una tabella con barre verticali o tabulazioni**: `id | srcintf | dstintf | srcaddr | dstaddr | service | action`, che è l’aspetto di una copia dalla GUI o di un elenco scritto a mano. Più membri in una cella sono separati da virgole.

Il pacchetto va su una riga a sé in entrambi i formati:

```
packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS
```

## Il limite, detto chiaramente

La corrispondenza confronta **nomi di oggetti**, non indirizzi risolti. Un elenco di policy incollato non contiene le definizioni degli oggetti indirizzo, quindi alla domanda «10.1.1.5 è dentro l’oggetto chiamato LAN_Subnet?» non si può rispondere con questo input. Indica il nome dell’oggetto, oppure `all`.

È una scelta voluta. Lo strumento potrebbe tirare a indovinare ricavando gli indirizzi dai nomi degli oggetti, e sbaglierebbe con sicurezza ogni volta che un nome non descrive il suo contenuto. Un limite dichiarato è più utile di una risposta plausibile ma sbagliata, ed è il motivo per cui ci si può fidare dello strumento sulle parti a cui risponde.

Modella inoltre **solo la decisione di corrispondenza**. I risultati del NAT (Network Address Translation), gli esiti dei profili di sicurezza, il routing e lo stato delle sessioni dipendono da una configurazione che questo input non contiene, e non vengono dedotti.

## Condivisione dei risultati

Sotto la risposta principale (in cima alla lettura quando non c’è un pacchetto), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` una copia del testo della casella. La pagina legge le policy e la riga `packet:` e salta tutto il resto, quindi anche un’intera configurazione incollata qui ottiene una lettura; la copia sostituisce con un segno numerato il valore di ogni impostazione segreta di FortiOS che contiene, e non è mai il testo così come l’hai incollato. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Il riquadro a comparsa indica anche quanti valori sono stati sostituiti.

Le impostazioni sostituite sono quelle che il [riferimento CLI di FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) classifica come password (`password`, `password-2`, `password-3` o `password_aes256`; consultato il 01/11/2026): il `psksecret`, il `psksecret-remote` e il `ppk-secret` di una fase 1 IPsec, la `password` di un amministratore e il `passwd` di un utente locale, l’`api-key` di un utente API, i valori `secret` di RADIUS (Remote Authentication Dial-In User Service), i valori `key` di TACACS+ e dell’HA, l’`auth-pwd` e il `priv-pwd` di SNMPv3, la `password` di BGP (Border Gateway Protocol) e di LDAP (Lightweight Directory Access Protocol), l’`authentication-key` e il `key-string` di OSPF (Open Shortest Path First), una `passphrase` Wi-Fi e le chiavi segrete dei cloud connector; qualsiasi impostazione il cui nome termina con una parola come password, secret o token; il `name` di una community SNMP, che è la community string stessa ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sezione 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), sezione 5.2.1); e ogni valore `ENC`, qualunque sia la sua impostazione. L’advisory stesso di Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (consultato il 01/11/2026) dice che i dati `ENC` di una configurazione pubblicata volontariamente su un forum per risolvere un problema («willingly posted on a forum for troubleshooting purpose») possono essere decifrati in chiaro, e che vanno considerati facili da decifrare («should currently be considered “easy to decrypt”»), quindi un valore `ENC` viene trattato come il segreto che contiene. Ogni valore diventa un segno numerato (`[redacted-1]`, `[redacted-2]` e così via), con lo stesso numero per lo stesso valore; la parola `ENC`, le virgolette e ogni altro carattere restano. Non c’è un interruttore per rimettere i valori: nessuno di essi cambia la lettura, e ognuno è una credenziale.

Un valore che prosegue oltre la sua riga non può essere sostituito lì (una chiave privata PEM tra virgolette su più righe, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sezione 10), e la copia può contenere ancora una credenziale che non sa ricondurre a un’impostazione (un JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1; una riga `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2; una password in un URL, RFC 3986 sezione 3.2.1; un ID della chiave di accesso AWS). In entrambi i casi niente link: il riquadro a comparsa indica la riga, e tu metti un segnaposto al suo posto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (una parola in un commento, per esempio) non blocca il link; il riquadro a comparsa indica il primo. Il lookup non legge mai quelle impostazioni, quindi dalla copia ricava esattamente la stessa lettura; i nomi delle interfacce, degli indirizzi e delle policy restano così come li hai incollati, e il riquadro a comparsa ti chiede di rileggerli prima.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia riempie la casella come farebbe un incolla e la pagina esegue il lookup. Un link che contiene ancora un segreto è un link che il pulsante non crea mai, e viene ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Dove si colloca

Si abbina all’articolo sulle policy del firewall e sul NAT di FortiGate, che spiega la pipeline di valutazione che questo strumento percorre, compreso il motivo per cui il NAT di destinazione tramite un VIP avviene prima della valutazione delle policy e il NAT di origine dopo. Per chi prepara l’NSE 4 copre gli obiettivi 2.01 e 2.02.
