## Cosa fa

Incolla un blocco di configurazione FortiOS e lo strumento ne restituisce la struttura come albero, con ogni verbo spiegato: cosa fa ciascuno tra `config`, `edit`, `set`, `unset`, `append`, `next`, `end` e `abort`, e in quale punto del blocco si trova ogni riga. In locale e offline: legge la struttura, non la semantica.

## La trappola che esiste per intercettare

**`set` su un campo a più valori sostituisce l’intero elenco.** `set srcaddr "internal-net"` su una policy che aveva quattro indirizzi di origine la lascia con uno solo, con successo, in silenzio, senza che nulla nell’output lo menzioni. Il comando che aggiunge è **`append`**.

Lo strumento avvisa a ogni `set` su un campo elenco noto, indicando il campo e la riga. È l’abitudine più costosa nel lavoro con la CLI di FortiOS ed è invisibile in un blocco letto di sfuggita, che è proprio il modo in cui i blocchi vengono letti.

## Altre due cose che dice sempre

- **`edit` crea ciò che non trova.** Un ID di policy digitato male non produce un errore, produce una policy.
- **`end` è l’unica riga che applica le modifiche.** `next` chiude una voce e resta nella tabella; `abort` chiude e scarta. Un blocco che usa `end` dove si intendeva `next` lascia la tabella in anticipo, e ogni modifica successiva finisce da un’altra parte.

Segnala anche i **blocchi non chiusi**, perché un blocco non chiuso non ha applicato nulla, e incollarne uno in una sessione attiva ti lascia in un punto inatteso.

## Cosa non fa

Non conosce i tuoi oggetti indirizzo, le tue policy né l’organizzazione dei tuoi VDOM, e non può dire se un valore è sensato. Risponde alla domanda se la forma del comando fa ciò che chi lo digita probabilmente si aspettava, che è una domanda diversa e spesso più utile.

Non può nemmeno sapere cosa c’era prima in un campo. Quando avvisa che un `set` sostituisce un elenco, **la domanda a cui ti chiede di rispondere è che cosa contenesse quell’elenco.**

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` una copia del blocco, con il valore di ogni impostazione segreta di FortiOS sostituito da un segno numerato, mai il blocco così come l’hai incollato, perché l’albero mostra il valore di ogni riga. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Il riquadro a comparsa indica anche quanti valori sono stati sostituiti.

Le impostazioni sostituite sono quelle che il [riferimento CLI di FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) classifica come password (`password`, `password-2`, `password-3` o `password_aes256`; consultato il 01/11/2026): il `psksecret`, il `psksecret-remote` e il `ppk-secret` di una fase 1 IPsec, la `password` di un amministratore e il `passwd` di un utente locale, l’`api-key` di un utente API, i valori `secret` di RADIUS (Remote Authentication Dial-In User Service), i valori `key` di TACACS+ e dell’HA, l’`auth-pwd` e il `priv-pwd` di SNMPv3, la `password` di BGP (Border Gateway Protocol) e di LDAP (Lightweight Directory Access Protocol), l’`authentication-key` e il `key-string` di OSPF (Open Shortest Path First), una `passphrase` Wi-Fi e le chiavi segrete dei cloud connector; qualsiasi impostazione il cui nome termina con una parola come password, secret o token; il `name` di una community SNMP, che è la community string stessa ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sezione 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), sezione 5.2.1); e ogni valore `ENC`, qualunque sia la sua impostazione. L’advisory stesso di Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (consultato il 01/11/2026) dice che i dati `ENC` di una configurazione pubblicata volontariamente su un forum per risolvere un problema («willingly posted on a forum for troubleshooting purpose») possono essere decifrati in chiaro, e che vanno considerati facili da decifrare («should currently be considered “easy to decrypt”»), quindi un valore `ENC` viene trattato come il segreto che contiene. Ogni valore diventa un segno numerato (`[redacted-1]`, `[redacted-2]` e così via), con lo stesso numero per lo stesso valore; la parola `ENC`, le virgolette e ogni altro carattere restano. Non c’è un interruttore per rimettere i valori: nessuno di essi cambia la lettura, e ognuno è una credenziale.

Un valore che prosegue oltre la sua riga non può essere sostituito lì (una chiave privata PEM tra virgolette su più righe, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sezione 10), e la copia può contenere ancora una credenziale che non sa ricondurre a un’impostazione (un JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1; una riga `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2; una password in un URL, RFC 3986 sezione 3.2.1; un ID della chiave di accesso AWS). In entrambi i casi niente link: il riquadro a comparsa indica la riga, e tu metti un segnaposto al suo posto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (una parola in un commento, per esempio) non blocca il link; il riquadro a comparsa indica il primo. I nomi di interfacce, indirizzi, oggetti e utenti restano così come li hai incollati, e il riquadro a comparsa ti chiede di rileggerli prima.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia riempie la casella come farebbe un incolla e la pagina la spiega: l’albero, gli avvisi e le note si leggono come li ha letti chi ha inviato il link, con i segni al posto dei valori. Un link che contiene ancora un segreto è un link che il pulsante non crea mai, e viene ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Strumenti correlati

Per raccogliere tramite script la configurazione di un FortiGate, il [generatore di script Expect](/tools/expect-script-builder) scrive uno script che accede ed esegue i comandi con un profilo FortiOS. Per impostazione predefinita risponde al paginatore `--More--` con uno spazio invece di cambiare l’impostazione di output della console, una modifica globale che vedrebbe la sessione di ogni amministratore.
