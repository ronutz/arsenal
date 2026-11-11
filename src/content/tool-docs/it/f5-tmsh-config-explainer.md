## Cosa fa

Incolla un estratto del `bigip.conf` di un BIG-IP e lo strumento lo analizza e spiega ogni oggetto in linguaggio semplice, insieme alla struttura che li tiene insieme. Si limita a leggere la configurazione, interamente nel tuo browser; non modifica nulla e non contatta alcun dispositivo.

## Com’è fatta una configurazione BIG-IP

BIG-IP memorizza la configurazione come oggetti tmsh, e tutti seguono la stessa forma:

    <module> <component> [<type>] <name> {
        <key> <value>
        <key> { <nested body> }
        <bare-list-item>
    }

Le parole iniziali collocano l’oggetto nella gerarchia di moduli e componenti di BIG-IP (`ltm virtual`, `ltm pool`, `net vlan` e così via), il nome lo identifica e le parentesi graffe contengono i suoi campi. All’interno di un corpo, gli a capo separano le voci, i blocchi tra graffe possono essere annidati a qualsiasi profondità, le stringhe tra virgolette possono contenere spazi e un `#` inizia un commento. Una sequenza con barra rovesciata tra virgolette viene mostrata così come è scritta: la stringa send di un monitor contiene `\r\n`, e il BIG-IP trasforma ogni `\r` in un ritorno a capo (carriage return) e ogni `\n` in un avanzamento di riga (line feed) solo quando formatta la richiesta ([F5 K2167](https://my.f5.com/manage/s/article/K2167), consultato il 27/10/2026). Lo strumento segue esattamente questa grammatica per scomporre un estratto nei suoi oggetti e ogni oggetto nei suoi campi.

## Cosa spiega

Invece di lasciarti riconoscere ogni campo da solo, lo strumento descrive il significato degli oggetti e delle impostazioni più comuni: `destination`, `pool`, `profiles` e `source-address-translation` di un virtual server; `members`, `monitor` e `load-balancing-mode` di un pool; e i tanti altri oggetti che una configurazione collega tra loro. Il risultato è un quadro leggibile di ciò che una configurazione fa davvero, utile quando erediti un dispositivo, esamini una modifica o studi il modello a oggetti.

## L’unica cosa che non è tmsh

C’è un’eccezione voluta. Un oggetto `ltm rule` contiene nel suo corpo un’iRule Tcl, e quel corpo è uno script, non configurazione tmsh. Il parser lo riconosce e acquisisce l’iRule alla lettera invece di cercare di analizzarla come oggetti e campi, così la tua regola resta esattamente com’è scritta invece di essere stravolta.

## Come si usa

Incolla un estratto di `bigip.conf`, da un singolo oggetto a un blocco esteso, e leggi la scomposizione strutturata e spiegata. L’analisi è deterministica e locale, quindi è anche un modo sicuro per leggere una configurazione esportata da un dispositivo che non puoi o non dovresti interrogare direttamente.

## Condivisione dei risultati

Sotto il riepilogo di ciò che è stato trovato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la configurazione con il valore di ogni impostazione segreta sostituito da `[redacted]`, mai così come l’hai incollata, perché questa pagina mostra il valore di ogni campo. Il suo riquadro a comparsa indica prima cosa contiene il link e quanti valori sono stati sostituiti, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

Le impostazioni sono `password` (i monitor, [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html): «the password if the monitored target requires authentication»), `passphrase` ([client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), server-ssl, sys file ssl-key), `secret` ([auth radius-server](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_radius-server.html), auth tacacs, ltm monitor radius), `bind-pw` ([auth ldap](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_ldap.html)), `preshared-key` ([net ipsec ike-peer](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/net/net_ipsec_ike-peer.html)), le community SNMP `community-name`, `community` e `trap-community` ([sys snmp](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_snmp.html)), e ogni impostazione il cui nome termina con `-password`, `-passphrase` o `-secret` (`encrypted-password`, `auth-password`, `privacy-password`, [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html), [`encrypt-cookie-secret`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_http.html), `proxy-ca-passphrase`); fonte: le pagine del riferimento tmsh di F5, consultate il 27/10/2026. La stringa `send` di un monitor conserva il suo testo, tranne le credenziali di un’intestazione `Authorization` o `Proxy-Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2, consultata il 27/10/2026), che diventano anch’esse `[redacted]`. `none` resta. `[redacted]` è una sola parola tmsh, quindi la copia si legge come gli stessi oggetti, campi e annidamenti: i vettori di test della condivisione dello strumento verificano che la pagina che riceve il link analizzi lo stesso albero. Nomi, indirizzi e partizioni vengono inclusi così come sono stati incollati.

Il corpo di un’iRule (`ltm rule`) è Tcl, mostrato qui alla lettera, e viene incluso così come è stato incollato: quando la configurazione ne contiene uno, il riquadro a comparsa lo segnala, così puoi prima controllare che non contenga token o password scritti nel codice. Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga.
- **Apertura di un link.** La copia riempie la casella come farebbe un incolla e la pagina la spiega. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.

## Strumenti correlati

- Un monitor Scripted (`ltm monitor scripted`) esegue un file di righe send ed expect conservato in `/config/eav/`; l’[analizzatore di monitor Scripted BIG-IP](/tools/bigip-scripted-monitor-explainer) legge quel file e simula il controllo rispetto alla trascrizione di un server.
- Per raccogliere la configurazione di un BIG-IP tramite script, il [generatore di script Expect](/tools/expect-script-builder) scrive uno script di accesso ed esecuzione con un profilo tmsh, che disattiva il pager di tmsh con `modify /cli preference pager disabled display-threshold 0`.
