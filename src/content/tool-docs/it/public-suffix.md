## Cosa fa

Lo strumento prende un nome host e ne ricava due cose: il **suffisso pubblico** (public suffix, cioè il dominio di primo livello effettivo, o eTLD, effective top-level domain) e il **dominio registrato** (l’eTLD più un’etichetta, spesso chiamato eTLD+1). Per `www.blog.example.co.uk` il suffisso pubblico è `co.uk` e il dominio registrato è `example.co.uk`. Tutto viene eseguito in locale nel tuo browser su una copia inclusa della Public Suffix List; non viene inviato nulla.

## Perché conta

Il dominio registrato è l’unità su cui molti sistemi fanno i loro conteggi. Le autorità di certificazione come Let's Encrypt applicano al dominio registrato il loro limite di frequenza di emissione per dominio, quindi `api.example.com` e `www.example.com` condividono un’unica quota sotto `example.com`. I browser usano lo stesso confine per decidere l’ambito dei cookie e il comportamento same-site. Il problema è che non lo si trova prendendo semplicemente le ultime due etichette: `example.co.uk` richiede tre etichette perché `.co.uk` è esso stesso un suffisso pubblico, e l’unico modo corretto per saperlo è la Public Suffix List.

## Come funziona

Lo strumento implementa l’algoritmo pubblicato della Public Suffix List. Trova la regola che si applica al tuo host, preferendo una regola di eccezione (una regola `!`) a qualsiasi regola normale e, altrimenti, scegliendo la regola con più etichette. Le regole con carattere jolly (wildcard) come `*.ck` corrispondono a qualsiasi singola etichetta in quella posizione. Se nessuna regola corrisponde, l’etichetta più a destra viene trattata come suffisso. Il dominio registrato è quindi il suffisso pubblico più l’etichetta successiva alla sua sinistra, quando esiste.

## Le sezioni ICANN e PRIVATE

L’elenco ha due parti. La sezione **ICANN** è l’insieme dei suffissi gestiti dai registri che i browser applicano. La sezione **PRIVATE** comprende i nomi delegati dai fornitori di servizi, come `github.io` o `*.compute.amazonaws.com`, dove un fornitore assegna sottodomini. Le due possono non concordare: con l’elenco completo `user.github.io` è un dominio registrato a sé, ma con le sole regole ICANN il dominio registrato è `github.io`. Quando la risposta dipende da una regola PRIVATE, lo strumento mostra anche la vista solo ICANN, perché è l’interpretazione usata dai limiti di frequenza dei certificati e dai controlli same-site.

## Note

Inserisci solo il nome host; uno schema, una porta, un percorso o un’etichetta jolly `*.` iniziale vengono rimossi automaticamente, e i nomi internazionalizzati vengono convertiti nella forma punycode prima del confronto. Gli indirizzi IP vengono indicati come tali invece di essere analizzati come domini, perché non hanno un suffisso pubblico. Poiché la Public Suffix List cambia nel tempo, la copia inclusa è uno snapshot datato: considera il risultato esatto alla data di quello snapshot e verifica su publicsuffix.org se ti servono le regole più recenti.

## Condivisione dei risultati

Sotto la risposta principale, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene il nome host così come l’hai inserito (`#input=www.blog.example.co.uk`), e nient’altro. Tutto ciò che il link contiene si trova dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un nome host è molto più corto.
- **Apertura di un link.** Il nome host compila il campo come se lo inserissi tu e la pagina lo cerca di nuovo nella sua copia inclusa dell’elenco; un indirizzo IP o un nome malformato riceve la nota della pagina stessa. Accettati o no, i valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.
