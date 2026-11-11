## Cosa fa

Calcola il record TXT esatto da pubblicare per superare una challenge ACME dns-01. Incolla il token della challenge e la chiave dell’account ACME, come JWK o come sua impronta (thumbprint), e lo strumento restituisce il nome del record `_acme-challenge`, il valore da inserire nel record TXT e i passaggi intermedi da cui è stato ricavato, la key authorization e l’impronta. Tutto viene eseguito nel tuo browser con lo SHA-256 nativo di Web Crypto; la chiave non lascia mai la pagina e ne vengono usati solo i membri pubblici.

## Perché esiste dns-01

ACME (RFC 8555) automatizza il rilascio dei certificati chiedendoti di dimostrare il controllo di un dominio. La challenge dns-01 lo fa attraverso il DNS: pubblichi un record TXT specifico sotto il dominio e la CA lo interroga. A differenza di http-01, dns-01 non richiede alcuna connessione in ingresso verso il tuo server, quindi funziona dietro un firewall o un load balancer, ed è l’unico tipo di challenge che può convalidare un nome wildcard.

## Il calcolo

Il valore del record non è arbitrario: la CA lo ricalcola dalla chiave dell’account, ed è questo che lega la challenge a te. La catena ha tre passaggi. Primo, si calcola l’impronta SHA-256 della chiave pubblica dell’account nella forma canonica definita dalla RFC 7638 e la si codifica in base64url. Secondo, si forma la key authorization unendo il token e quell’impronta con un punto: `token.thumbprint`. Terzo, il valore del record TXT è il base64url del digest SHA-256 della key authorization. Il record viene pubblicato in `_acme-challenge.<domain>`; un wildcard come `*.example.com` viene convalidato sotto `_acme-challenge.example.com`.

## Viene usata solo la chiave pubblica

L’impronta RFC 7638 si calcola solo sui membri pubblici obbligatori della chiave: per una chiave EC la curva e le coordinate x e y, per una chiave RSA il modulo e l’esponente. La chiave privata non serve mai per calcolare il record, quindi incolla solo la JWK pubblica. Se incolli una chiave completa, i suoi campi privati vengono ignorati e non vengono mai mostrati.

## Come si usa

Inserisci il token della challenge e la chiave dell’account e, se vuoi, il dominio per vedere il nome completo del record. Pubblica il valore restituito come record TXT in `_acme-challenge.<domain>`, attendi che si propaghi, poi lascia proseguire il tuo client ACME. Lo stesso token e la stessa chiave producono sempre lo stesso valore, quindi puoi confrontare ciò che pubblica il tuo client con ciò che calcola lo strumento.

## Condivisione dei risultati

Sotto il record, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene tre valori dopo il `#`: il token della challenge, l’impronta della chiave dell’account (quella calcolata dalla pagina o quella che hai inserito) e il dominio. Non contiene mai la casella della chiave: un file di chiave dell’account contiene il membro privato `d` accanto a quelli pubblici, e il link non ne contiene nessuno. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Nulla di ciò che contiene è un segreto. La [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555) (consultata il 27/10/2026) prevede che la key authorization (il token e l’impronta uniti da un punto) sia servita in chiaro in `/.well-known/acme-challenge/<token>` per la challenge http-01 (sezione 8.3), e il record dns-01 dimostra il controllo del DNS del dominio, che il link non dà (sezione 8.4). La [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638) (sezione 3.2.1, consultata il 27/10/2026) attribuisce a una chiave privata l’impronta della sua chiave pubblica, quindi il link indica la chiave senza contenerla. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Apertura di un link.** Il token e il dominio compilano le rispettive caselle e l’impronta va nella casella della chiave, che la accetta; la pagina calcola il record come per un testo incollato, con Web Crypto nel browser. Un token o un’impronta con caratteri fuori dall’alfabeto base64url richiesto dalla pagina fa ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
- **Verifica.** I controlli di condivisione del sito creano il link da una chiave privata dell’account (l’esempio P-256 della RFC 7515, `d` compreso) e confermano che né `d`, né un membro pubblico, né la JWK stessa vi compaiono, né così come sono scritti, né con codifica percentuale, né con codifica da modulo, né decodificati.
