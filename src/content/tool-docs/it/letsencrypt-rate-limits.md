## Cosa fa

Incolla l’elenco dei nomi host che intendi inserire nei certificati Let’s Encrypt e lo strumento li raggruppa per **dominio registrato** (eTLD+1), mostrando come si collocano rispetto ai limiti di emissione di Let’s Encrypt. Indica il numero minimo di certificati di cui l’insieme ha bisogno, segnala dove un certificato wildcard raccoglierebbe più sottodomini e avvisa quando l’approccio ingenuo di un certificato per nome supererebbe il limite settimanale per dominio. Tutto viene eseguito in locale nel tuo browser; nulla viene inviato da nessuna parte.

## Perché conta il dominio registrato

Il limite principale di Let’s Encrypt conta i nuovi certificati per **dominio registrato**, non per singolo nome host. Così `www.example.com`, `api.example.com` e `blog.example.com` attingono tutti a un unico budget settimanale sotto `example.com`. Lo strumento calcola questo raggruppamento con la Public Suffix List, quindi è corretto anche per i suffissi di più etichette: `shop.example.co.uk` e `www.example.co.uk` vengono raggruppati sotto `example.co.uk`, profondo tre etichette, non sotto `co.uk`. Sbagliare questo confine è il motivo abituale per cui un errore di limite di frequenza coglie di sorpresa.

## Cosa calcola

Per ogni dominio registrato mostra il numero di nomi previsti (rispetto al limite settimanale per dominio), il numero minimo di certificati necessari se ne inserisci fino a 100 nomi per certificato, e gli eventuali **candidati wildcard**: un dominio padre con due o più sottodomini diretti, che un solo nome `*.parent` potrebbe coprire al loro posto. Il riepilogo somma i nomi, i domini registrati distinti e i certificati minimi complessivi, e solleva un avviso se un qualsiasi dominio registrato supererebbe il limite settimanale con un certificato per nome. Gli indirizzi IP inseriti vengono elencati a parte, perché usano una propria unità, e tutto ciò che non è un nome host valido (compreso un semplice suffisso pubblico come `co.uk`) viene segnalato.

## I limiti che usa

I valori mostrati sono un’istantanea datata, con la sua fonte, dei limiti pubblicati da Let’s Encrypt: 50 nuovi certificati per dominio registrato ogni 7 giorni, 300 nuovi ordini per account ogni 3 ore, 5 certificati per lo stesso insieme esatto di nomi ogni 7 giorni e fino a 100 nomi per certificato. Il dato più utile per pianificare è che **i rinnovi coordinati tramite ARI sono esenti da tutti i limiti di frequenza**, quindi, una volta ottenuti i certificati, mantenerli rinnovati non è un problema di limiti. Poiché Let’s Encrypt può cambiare questi valori, lo strumento mostra la data dell’istantanea e rimanda alla fonte; prima di contare su un margine stretto, verifica i valori attuali in quella pagina.

## Condivisione dei risultati

In fondo al riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i nomi host così come li hai inseriti, uno per riga. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i nomi non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I nomi compilano la casella come farebbe un incolla e la pagina li pianifica. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
