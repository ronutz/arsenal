# Analizzatore delle decisioni di steering Netskope

Incolla una descrizione compatta di una configurazione di steering e di un flusso, e ripercorri l’ordine di decisione documentato fino a un verdetto, **inoltrato**, **bypass**, **bloccato** o **diretto**, con un registro che spiega ogni controllo lungo il percorso. È un analizzatore del perché, non un simulatore: ogni passaggio del registro cita un comportamento documentato e, dove la documentazione pubblica non indica alcuna regola, il registro lo dice invece di inventarne una.

## La sintassi

Righe chiave-valore, un dato della decisione per riga:

```
mode: web                     # cloud-apps | web | all
dynamic: on                   # optional; then mode-on-prem / mode-off-prem (none allowed)
location: off-prem            # on-prem | off-prem
tunnel: up                    # up | down
fail-close: off               # on | off
flow: web app.example.com     # web <host> | app <name> | non-web <proto/port> | rfc1918 <ip> | loopback
non-standard-port: ip         # optional; fqdn | ip - how a non-standard web port is reached
exception: domain *.example.com          # 0+ lines; kinds: cert-pinned, domain, category, dest-location, firewall-app
flow-matches: domain          # which configured exception kinds this flow matches (or none)
```

La riga `flow-matches` è una scelta di onestà: se un flusso reale corrisponda a una categoria o a un oggetto di destination location dipende da dati del tenant che questo strumento locale non vede, quindi sei tu a dichiarare la corrispondenza e il motore spiega la conseguenza documentata.

## Cosa sa il registro

Le tre modalità del traffico e a chi è destinata ciascuna (Cloud Apps Only per Cloud Inline o solo CASB, Web Traffic per la maggior parte delle organizzazioni, All Traffic per chi ha l’abbonamento a Cloud Firewall). Il bypass predefinito, sempre attivo, dello spazio RFC1918. Le famiglie di eccezioni e i loro comportamenti documentati, compresa l’opzione per profilo **Steer and decrypt at Netskope Cloud** della famiglia certificate-pinned, l’unica corrispondenza che porta all’inoltro invece che al bypass. Le modalità per posizione dello steering dinamico, compresa **None**: nessun tunnel ed eccezioni non elaborate. La distinzione documentata di **Fail Close**: le eccezioni basate su dominio, su IP e certificate-pinned vengono comunque applicate, mentre quelle basate su categoria vengono bloccate. E la trappola delle porte non standard: una porta configurata per FQDN e raggiunta tramite indirizzo IP viene trattata come non web, con il rimedio documentato di configurarle entrambe.

## Dove passa la mano

Un verdetto **inoltrato** è il punto in cui comincia la decisione successiva: se la sessione viene decifrata dipende dalla policy TLS, e l’[articolo sulla decifratura TLS inline](/learn/netskope-inline-tls-decryption) riprende esattamente da lì. Il panorama dello steering in sé (Client, proxy esplicito e PAC, tunnel, reverse proxy) è descritto nell’[articolo sui metodi di steering](/learn/netskope-steering-methods); il livello PAC ha il [suo analizzatore](/tools/pac-file-explainer).

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la specifica così come l’hai inserita, una volta che la pagina ha una decisione. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Un flusso e le sue eccezioni nominano host, app e domini, e la pagina di Netskope sullo [steering profile](https://docs.netskope.com/en/configure-a-steering-profile) (consultata il 01/11/2026) prevede eccezioni per il traffico con contenuti personali o privati («personal or private content»): il riquadro a comparsa ti chiede di controllarle. Il registro legge ogni riga, quindi nulla viene tolto. Prima che venga proposto un link, nella specifica viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 8.4: i server di solito conservano nel cookie un nonce, cioè un identificatore di sessione, «commonly store a nonce (or “session identifier”) in a cookie»), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore FortiOS `ENC`; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (un membro JSON `token`, un `token=` in una query string) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La specifica compila la casella come farebbe un incolla e la pagina la spiega. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [Documentazione Netskope: Configure a Steering Profile](https://docs.netskope.com/en/configure-a-steering-profile): modalità, bypass predefiniti (consultata il 09/11/2026)
- [Documentazione Netskope: Creating a Steering Configuration](https://docs.netskope.com/en/creating-a-steering-configuration): Fail Close, porte non standard (consultata il 09/11/2026)
- [Documentazione Netskope: Enabling Dynamic Steering](https://docs.netskope.com/en/enabling-dynamic-steering): modalità per posizione, significato di None (consultata il 09/11/2026)
- [Documentazione Netskope: Certificate Pinned Applications](https://docs.netskope.com/en/certificate-pinned-applications): Steer and decrypt (consultata il 09/11/2026)
