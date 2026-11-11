## Cosa fa

Incolla due configurazioni FortiOS separate da una riga di `---` e ottieni un diff **strutturale**: cosa è cambiato per sezione, oggetto e impostazione. Viene eseguito interamente nel tuo browser.

## Perché qui un diff riga per riga è lo strumento sbagliato

Un diff testuale trova uno **script di modifica** (edit script) minimo, che non è la stessa cosa della modifica fatta da una persona. Applicato all’output di FortiOS, produce tre fastidi precisi:

- Un blocco che si è **spostato** viene riportato come una cancellazione più un inserimento, quindi rivedere un oggetto invariato richiede la stessa attenzione di una modifica vera.
- Un oggetto risulta modificato perché un oggetto vicino ha guadagnato una riga e l’allineamento si è spostato.
- Tre modifiche reali restano sepolte in quattrocento righe di contesto invariato.

Questo strumento scompone entrambi i lati in sezione, oggetto e impostazione, poi confronta le strutture. Un blocco che si è spostato non è una modifica. Un’impostazione cambiata è una riga che indica il valore vecchio e quello nuovo.

## L’unico punto in cui l’ordine non è rumore

Per la maggior parte delle sezioni l’ordine degli oggetti è irrilevante: oggetti indirizzo, oggetti servizio, interfacce. Segnalare lì un riordinamento sarebbe rumore, quindi viene ignorato.

Per **firewall policy** e le sezioni affini, l’ordine **è** il comportamento. Vince la prima corrispondenza, quindi spostare una policy sopra un’altra cambia ciò che fa il dispositivo senza cambiare una sola impostazione. È proprio la modifica che un diff riga per riga seppellisce più a fondo, perché da un lato e dall’altro dello spostamento nulla differisce nel testo, tranne la posizione.

Quelle sezioni vengono trattate come sensibili all’ordine in base al nome, e un riordinamento al loro interno viene riportato come un rilievo vero e proprio:

`firewall policy` · `firewall policy6` · `firewall proxy-policy` · `firewall local-in-policy` · `firewall shaping-policy` · `firewall security-policy` · `router policy` · `router policy6` · `system sdwan`

Trattare i due casi allo stesso modo, in un senso o nell’altro, renderebbe lo strumento sbagliato, quindi entrambi i comportamenti sono fissati da vettori di test di riferimento (golden vectors).

## Input

Due configurazioni, separate da una riga che contiene solo `---` oppure etichettate con `BEFORE:` e `AFTER:` su righe a sé. Ogni lato è un normale output di `show` o di `show full-configuration`.

I blocchi `config` annidati all’interno di un oggetto vengono analizzati, e le loro impostazioni ricevono come prefisso il percorso annidato, così non possono entrare in conflitto con un’impostazione omonima dell’oggetto padre.

## Cosa non fa

**Confronta, non giudica.** Ti dirà che una policy si è spostata o che un indirizzo è cambiato; non ti dirà se è stata una buona idea, perché dipende da un’intenzione che non può vedere.

Non modella nemmeno il peso semantico di un’impostazione. Cambiare un commento e cambiare un’azione si leggono entrambi come un’impostazione modificata, e sta a chi legge sapere quale conta.

Un input identico produce silenzio, non un banner rassicurante. Uno strumento di diff che trova modifiche fantasma non è affidabile su quelle che contano, quindi anche questo è fissato da un vettore.

## Condivisione dei risultati

In cima al confronto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` una copia del testo della casella, cioè entrambe le configurazioni con il valore di ogni impostazione segreta di FortiOS sostituito da un segno numerato, mai il testo così come l’hai incollato. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Il riquadro a comparsa indica anche quanti valori sono stati sostituiti.

Le impostazioni sostituite sono quelle che il [riferimento CLI di FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) classifica come password (`password`, `password-2`, `password-3` o `password_aes256`; consultato il 01/11/2026): il `psksecret`, il `psksecret-remote` e il `ppk-secret` di una fase 1 IPsec, la `password` di un amministratore e il `passwd` di un utente locale, l’`api-key` di un utente API, i valori `secret` di RADIUS (Remote Authentication Dial-In User Service), i valori `key` di TACACS+ e dell’HA, l’`auth-pwd` e il `priv-pwd` di SNMPv3, la `password` di BGP (Border Gateway Protocol) e di LDAP (Lightweight Directory Access Protocol), l’`authentication-key` e il `key-string` di OSPF (Open Shortest Path First), una `passphrase` Wi-Fi e le chiavi segrete dei cloud connector; qualsiasi impostazione il cui nome termina con una parola come password, secret o token; il `name` di una community SNMP, che è la community string stessa ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sezione 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), sezione 5.2.1); e ogni valore `ENC`, qualunque sia la sua impostazione. L’advisory stesso di Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (consultato il 01/11/2026) dice che i dati `ENC` di una configurazione pubblicata volontariamente su un forum per risolvere un problema («willingly posted on a forum for troubleshooting purpose») possono essere decifrati in chiaro, e che vanno considerati facili da decifrare («should currently be considered “easy to decrypt”»), quindi un valore `ENC` viene trattato come il segreto che contiene. Ogni valore diventa un segno numerato (`[redacted-1]`, `[redacted-2]` e così via), con lo stesso numero per lo stesso valore; la parola `ENC`, le virgolette e ogni altro carattere restano. Non c’è un interruttore per rimettere i valori: nessuno di essi cambia la lettura, e ognuno è una credenziale. Poiché valori uguali mantengono segni uguali e valori diversi segni diversi, un segreto cambiato tra i due lati risulta ancora un’impostazione modificata (`psksecret: ENC [redacted-1] → ENC [redacted-3]`), e uno che non è cambiato continua a non risultarlo.

Un valore che prosegue oltre la sua riga non può essere sostituito lì (una chiave privata PEM tra virgolette su più righe, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sezione 10), e la copia può contenere ancora una credenziale che non sa ricondurre a un’impostazione (un JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1; una riga `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2; una password in un URL, RFC 3986 sezione 3.2.1; un ID della chiave di accesso AWS). In entrambi i casi niente link: il riquadro a comparsa indica la riga, e tu metti un segnaposto al suo posto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (una parola in un commento, per esempio) non blocca il link; il riquadro a comparsa indica il primo. Gli indirizzi, i nomi degli oggetti e il resto delle due configurazioni restano così come li hai incollati, e il riquadro a comparsa ti chiede di rileggerli prima.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia riempie la casella come farebbe un incolla e la pagina confronta i due lati, con le stesse sezioni, gli stessi oggetti e le stesse impostazioni modificate che ha visto chi ha inviato il link. Un link che contiene ancora un segreto è un link che il pulsante non crea mai, e viene ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Dove si colloca

Abbinalo all’articolo sulle policy del firewall e sul NAT di FortiGate, che spiega perché l’ordine determina il comportamento nelle sezioni che questo strumento tratta come sensibili all’ordine.
