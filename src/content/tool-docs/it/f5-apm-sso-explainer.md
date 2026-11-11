# Analizzatore dei metodi SSO di APM

Il compito di BIG-IP Zero Trust Access (in precedenza BIG-IP APM, Access Policy Manager) dopo l’autenticazione è continuare ad autenticarti al posto tuo, e il capitolo Single Sign-On Methods definisce esattamente otto modi in cui lo fa: HTTP Basic, NTLMv1, NTLMv2, Kerberos constrained delegation, Form Based, Forms - Client Initiated, OAuth Bearer e SAML. Questo strumento li presenta ciascuno come una scheda con il meccanismo, il raccordo delle credenziali, i prerequisiti e le particolarità, il tutto riassunto fedelmente dal capitolo e dalle guide specifiche di ogni metodo.

Il verdetto su ogni scheda è il paragrafo del capitolo sulla portata dell’impatto (blast radius), ed è il titolo operativo: un oggetto SSO configurato male per HTTP Basic, NTLMv1, NTLMv2, Kerberos, OAuth Bearer o SAML può disattivare l’SSO per tutti i metodi di autenticazione nella sessione di quell’utente. Form Based e Forms - Client Initiated sono gli unici due metodi che non vengono disattivati quando l’oggetto di un altro metodo è guasto. Una configurazione SSO Kerberos sbagliata e ogni applicazione della sessione può perdere il suo SSO; una configurazione di modulo sbagliata e lo perde solo quell’applicazione. Questa asimmetria decide con quanta cura meriti di essere gestita ogni classe di oggetti.

La scheda Kerberos riporta l’elenco completo dei prerequisiti: un account di delega in Active Directory per ogni realm dei server, il suo SPN inserito come Account Name in formato SPN, il realm in maiuscolo, la Resource-Based Constrained Delegation per gli ambienti con più realm, e la frase del manuale stesso, da incorniciare: l’SSO Kerberos di APM non ha bisogno di un file keytab e non lo usa. I suoi naturali punti di ingresso sono i metodi in cui la password non viaggia mai in chiaro, con i certificati client e NTLM tra gli esempi del capitolo stesso. NTLMv2 ha la particolarità documentata per cui una risposta 401 con più di un’intestazione WWW-Authenticate: NTLM fa fallire l’SSO, un comportamento previsto secondo il manuale. Forms - Client Initiated ha il dettaglio più ingegnoso del suo progetto: il JavaScript che APM inserisce assegna al parametro della password un token invece della password reale, così la credenziale non si trova mai nella pagina.

La nota sul raccordo, a ogni ricerca, collega i metodi al meccanismo sottostante: gli agenti dell’access policy valorizzano le variabili di sessione che l’SSO usa, con il collegamento classico di una Logon Page seguita da SSO Credential Mapping, che trasferisce session.logon.last.* in session.sso.token.last.*.

Inserisci il nome di un metodo (funzionano anche alias come `ntlm`, `fbci` o `kcd`), oppure `methods` per tutti e otto; oppure premi il pulsante del metodo sotto la casella, che la compila per te.

Tutto viene eseguito in locale; nulla di ciò che inserisci lascia la pagina.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il nome del metodo così come l’hai inserito, e nient’altro. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Questa pagina non accetta alcuna configurazione SSO: legge un nome dalla sua tabella di otto metodi, oppure `methods`, e rifiuta qualsiasi altra cosa. Un link viene offerto solo per un nome che legge, e un link in arrivo viene accettato solo alla stessa condizione, quindi né un oggetto SSO né una credenziale possono viaggiare in un link.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla e la pagina lo legge; nulla viene inviato da nessuna parte. Il valore lascia poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
