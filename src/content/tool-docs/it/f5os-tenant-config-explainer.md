## Cosa fa

Incolla un blocco `f5-tenants:tenants`, nella forma della CLI o nel JSON RESTCONF, e lo strumento lo rilegge: lo stato del ciclo di vita e il suo significato, l’immagine e la piattaforma a cui appartiene, i blade e le VLAN, e la spiegazione di ogni campo. In locale e offline: analizza il testo e non contatta alcuna piattaforma.

## Il controllo che lo rende più di un glossario

F5 pubblica la memoria minima come **(3,5 × 1024 × vCPU) + 512**, quindi due vCPU richiedono 7680 MB e quattro ne richiedono 14.848 MB. Lo strumento calcola questo minimo e **lo mostra accanto al valore configurato**, con un avviso quando l’allocazione è inferiore.

Avvisa anche quando compare un numero di vCPU senza un valore di memoria, perché **i due valori vanno di pari passo**: aumentare solo i core lascia il tenant sotto il suo nuovo minimo.

## La regola del ciclo di vita che enuncia

**Per cambiare vCPU o memoria di un tenant deployed devi prima riportarlo a `provisioned`**, applicare la modifica e poi riportarlo a `deployed`. Non è un’operazione a caldo, e lo strumento lo dice per ogni tenant deployed invece di aspettare che glielo si chieda.

## La forma della piattaforma

Lo strumento segnala cosa appartiene a quale macchina. **VELOS** è uno chassis, in cui `nodes` indica i blade all’interno di una partizione dello chassis e un tenant può estendersi su più blade. **rSeries** è un’appliance senza partizioni né blade, e `vcpu-cores-per-node` deve essere un multiplo di quattro. Un tenant VELOS valido con due vCPU **non supera il commit su un rSeries**, e nemmeno un bundle di immagine chiamato `ALL-VELOS` si installa su un rSeries; lo strumento lo fa notare dal solo nome del file.

## Cosa non fa

Non può sapere quanta parte della piattaforma è già allocata, quindi convalida un tenant rispetto alla formula pubblicata e non rispetto alla capacità residua. Se il blade abbia la memoria libera è una domanda da porre alla piattaforma.

## Condivisione dei risultati

Sotto il riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai inserito, e nient’altro. Il suo riquadro a comparsa indica prima cosa contiene il link, poi un’avvertenza specifica: il blocco riporta l’indirizzo di gestione, il gateway e le VLAN del tenant, quindi rileggilo prima di inviare il link. Poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Un blocco di tenant non contiene password né chiavi: il [riferimento di F5 sul ciclo di vita dei tenant per l’API VELOS](https://clouddocs.f5.com/api/velos-api/api-chassis-tenant.html) (consultato il 27/10/2026) configura un tenant con nome, tipo, immagine, nodi, indirizzo di gestione, lunghezza del prefisso, gateway, VLAN, cryptos, vCPU, memoria, stato di esecuzione e appliance mode. Le credenziali usate in quella pagina appartengono alla richiesta API, non al blocco.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla e la pagina lo legge; nulla viene inviato da nessuna parte. Il valore lascia poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
