## Cosa fa

Incolla un documento XML e lo strumento ti dice per prima cosa se è ben formato. Se non lo è, ottieni la riga, la colonna (contata in caratteri), un codice di errore stabile, un messaggio semplice che indica la regola e la sua sezione nella Raccomandazione XML 1.0, e la riga in cui il documento non è valido, con un accento circonflesso sotto la colonna. Se è ben formato, lo riottieni formattato in modo leggibile con due spazi, quattro spazi o una tabulazione per livello, oppure compattato, con i commenti mantenuti o rimossi. Tutto viene eseguito nel tuo browser.

Le sue regole vengono dalla Raccomandazione W3C [Extensible Markup Language (XML) 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/) del 26 novembre 2008. Si affianca al [formattatore e validatore JSON](/tools/json-formatter) e al [convertitore JSON ↔ YAML](/tools/json-yaml-convert). Il [decodificatore XML](/tools/xml-decoder) è uno strumento diverso: legge la struttura di un documento e la sua superficie di attacco (DOCTYPE, entità esterne, espansione delle entità) e non lo riscrive.

## Cosa verifica il verdetto

Queste regole, tutte tratte dalla Raccomandazione, decidono qui la buona formazione:

- **Un solo elemento radice** (sezione 2.1): esattamente un elemento al primo livello; prima e dopo di esso solo commenti, istruzioni di elaborazione e spazi bianchi.
- **Caratteri ammessi** (sezione 2.2): tabulazione, avanzamento di riga (line feed), ritorno a capo (carriage return) e gli intervalli Unicode della produzione `Char`. Un carattere di controllo come U+0001, un surrogato isolato, U+FFFE o U+FFFF viene rifiutato ovunque compaia.
- **Nomi** (sezione 2.3): i nomi di elementi e attributi, le destinazioni (target) delle istruzioni di elaborazione e i nomi delle entità seguono la produzione `Name`, comprese le lettere al di fuori dell’ASCII.
- **Dati carattere** (sezione 2.4): `&` e `<` non compaiono mai da soli nel testo, e la sequenza `]]>` non compare mai nel testo.
- **Commenti** (sezione 2.5): nessun `--` all’interno e nessun `--->` alla fine.
- **Istruzioni di elaborazione** (sezione 2.6): il nome di una destinazione, poi spazi bianchi o `?>`; la destinazione non è mai `xml`, con nessuna combinazione di maiuscole e minuscole.
- **Sezioni CDATA** (sezione 2.7): terminano al primo `]]>` e compaiono solo all’interno di un elemento.
- **La dichiarazione XML** (sezione 2.8): solo all’inizio assoluto, senza nulla prima, e nella forma `<?xml version="1.x" encoding="..." standalone="..."?>`, con encoding e standalone facoltativi e in quest’ordine.
- **La dichiarazione del tipo di documento** (sezione 2.8): una sola volta, prima dell’elemento radice, con un nome, un identificatore `SYSTEM` o `PUBLIC` facoltativo (un identificatore pubblico usa solo i caratteri ammessi dalla produzione [13]) e un sottoinsieme interno facoltativo che contiene solo dichiarazioni di markup, commenti, istruzioni di elaborazione, riferimenti a entità parametriche e spazi bianchi, senza riferimenti a entità parametriche all’interno di una dichiarazione (la regola PEs in Internal Subset). Le dichiarazioni di entità nel sottoinsieme interno vengono verificate rispetto alla loro grammatica (sezione 4.2).
- **Tag e attributi** (sezione 3.1): tag di apertura, di chiusura e di elemento vuoto; ogni tag di chiusura corrisponde all’elemento aperto (Element Type Match); nessun attributo compare due volte in un tag (Unique Att Spec); ogni valore di attributo è tra virgolette e non contiene `<`.
- **Riferimenti** (sezione 4.1): ogni `&` apre un riferimento ben formato; un riferimento a carattere indica un carattere ammesso; un riferimento a entità indica un’entità dichiarata quando si applica la regola Entity Declared, cioè senza DTD, con il solo sottoinsieme interno e nessun riferimento a entità parametriche, oppure con `standalone="yes"`. Senza una dichiarazione esistono solo `&amp;`, `&lt;`, `&gt;`, `&apos;` e `&quot;`, quindi i nomi HTML come `&nbsp;` vengono rifiutati. Un riferimento a un’entità dichiarata con `NDATA` viene rifiutato (Parsed Entity), e così anche un riferimento diretto a un’entità esterna all’interno del valore di un attributo (No External Entity References).

Cosa **non** verifica, detto chiaramente:

- **La validità.** Se il documento rispetti una DTD, un XML Schema o qualsiasi altro schema è una questione separata; questo strumento verifica solo la buona formazione.
- **La grammatica interna delle dichiarazioni `<!ELEMENT`, `<!ATTLIST` e `<!NOTATION`**, e qualsiasi cosa si trovi in una DTD esterna, che non viene mai letta.
- **Le regole che richiedono il testo di sostituzione di un’entità**, perché nessuna entità viene mai espansa: un riferimento indiretto a un’entità esterna nel valore di un attributo, un `<` che arriva nel valore di un attributo attraverso un’entità, la ricorsione tra entità e la buona formazione del testo di sostituzione stesso.
- **I nomi quando il DOCTYPE rimanda altrove.** Quando il DOCTYPE indica una DTD esterna o il sottoinsieme interno usa entità parametriche (e la dichiarazione non riporta `standalone="yes"`), il nome di un’entità può essere dichiarato in un punto che questo strumento non legge mai, quindi i nomi sconosciuti vengono accettati e una nota lo segnala.
- **I namespace.** I prefissi vengono mantenuti come parte dei nomi; che ogni prefisso sia dichiarato è una regola della Raccomandazione separata Namespaces in XML, non di XML 1.0, e non viene verificato.
- **La dichiarazione di codifica.** Ciò che incolli è già testo, quindi il nome della codifica viene mantenuto così come è scritto e non viene confrontato con nulla.

## Cosa significa qui «non significativo»

La sezione 2.10 della Raccomandazione stabilisce che un processore XML deve sempre passare all’applicazione tutti i caratteri di un documento che non sono markup («MUST always pass all characters in a document that are not markup through to the application»). Gli spazi bianchi di un documento sono dati, salvo indicazione contraria. Un formattatore deve quindi decidere quali spazi bianchi può trattare come impaginazione, e questo decide in modo restrittivo:

- **L’unico testo che modifica sono gli spazi bianchi tra gli elementi**: un nodo di testo fatto solo di spazi, tabulazioni e a capo, all’interno di un elemento che ha almeno un elemento figlio e non contiene altri dati carattere. La modalità Leggibile sostituisce ogni nodo di questo tipo con un a capo e il rientro della riga successiva; la modalità Compatto lo rimuove. Gli spazi bianchi fuori dall’elemento radice sono markup secondo la sezione 2.4, quindi vengono impaginati allo stesso modo.
- **Il contenuto misto non viene mai toccato.** La sezione 3.2.2 stabilisce che un elemento ha contenuto misto quando può contenere dati carattere, eventualmente alternati a elementi figli («may contain character data, optionally interspersed with child elements»). Quando un elemento contiene testo diverso dagli spazi bianchi, un qualsiasi riferimento a carattere o a entità, o una sezione CDATA, il suo intero contenuto, elementi figli compresi, viene copiato esattamente come è scritto: inserire lì un a capo cambierebbe il testo.
- **`xml:space="preserve"` viene rispettato.** La sezione 2.10 definisce l’attributo speciale `xml:space` con i valori `default` e `preserve`; `preserve` indica che le applicazioni dovrebbero conservare tutti gli spazi bianchi, e l’intenzione si applica a ogni elemento al suo interno, a meno che non venga sostituita da un’altra istanza dell’attributo («unless overridden with another instance of the xml:space attribute»). Il contenuto sotto `preserve` viene copiato come è scritto, e un elemento al suo interno con `xml:space="default"` viene di nuovo formattato. Qualsiasi altro valore è un errore da cui la Raccomandazione consente a un processore di riprendersi ignorando l’attributo; questo strumento lo ignora ai fini della formattazione, lo conserva come è scritto e aggiunge una nota.
- **Un elemento senza elementi figli conserva il suo contenuto come è scritto**, anche quando quel contenuto è fatto solo di spazi bianchi, o di spazi bianchi e commenti. `<a>   </a>` resta `<a>   </a>` e, con i commenti rimossi, un `<a>` che contiene un commento tra due a capo conserva i due a capo.

**Uno schema può comunque rendere significativi quegli spazi bianchi.** Senza leggere una DTD o uno schema, un parser non può sapere se un elemento ha contenuto di soli elementi (element content) o contenuto misto; la sezione 2.10 chiede solo a un processore validante di indicare all’applicazione quali spazi bianchi compaiono nel contenuto di soli elementi. Uno schema che dichiara un elemento come testo potrebbe rendere parte del suo valore persino gli spazi bianchi tra i suoi figli. Se per chi usa il tuo documento questo conta, conserva l’originale.

## Cosa viene conservato esattamente come è scritto

- Il testo, le sezioni CDATA, i commenti (a meno che tu non li rimuova) e le istruzioni di elaborazione, carattere per carattere.
- La dichiarazione XML, così come è stata scritta, virgolette comprese.
- Ogni valore di attributo tra le sue virgolette, con il carattere di virgoletta con cui è stato scritto: le virgolette singole restano singole e le doppie restano doppie. Vengono sistemati solo gli spazi bianchi all’interno di un tag: uno spazio prima di ogni attributo, nessuno intorno a `=` e nessuno prima di `>` o `/>`.
- I tag di elemento vuoto restano tag di elemento vuoto (`<b/>`), e un tag di apertura seguito da un tag di chiusura resta così (`<c></c>`).
- I riferimenti a carattere (`&#169;`, `&#x2122;`) e i riferimenti a entità (`&amp;`, `&org;`) vengono copiati come sono scritti, mai sostituiti dai caratteri che rappresentano.
- Il DOCTYPE, sottoinsieme interno compreso, viene copiato come testo, a capo inclusi.

Due modifiche avvengono sempre, e il risultato lo segnala quando succede: un byte order mark (U+FEFF) all’inizio viene rimosso, e un carriage return seguito da un line feed, o un carriage return da solo, viene letto come line feed, come la sezione 2.11 richiede a ogni processore XML. L’output termina senza un a capo finale.

## Sicurezza: nulla viene espanso, nulla viene scaricato

Lo strumento non espande mai un’entità, non legge mai una DTD esterna e non recupera mai un identificatore `SYSTEM` o `PUBLIC`: il DOCTYPE viene conservato come testo, e l’unica cosa che lo strumento ricava da un sottoinsieme interno è quali entità generali sono dichiarate e come. Un documento costruito per un attacco XML external entity o per un attacco di espansione delle entità qui è quindi solo testo. L’input è limitato a 2.000.000 di caratteri e a 1000 livelli di annidamento, e il parser legge il testo una sola volta, quindi un documento ostile non può bloccare la pagina. Neanche il decodificatore XML espande nulla, ma indica cosa farebbe un documento del genere a un parser che invece espande le entità: segnala le entità esterne, le entità parametriche e le entità che fanno riferimento ad altre entità.

## Documenti firmati

Non riformattare un documento firmato, come un’asserzione SAML firmata. Per convalidare un riferimento, un verificatore ottiene i dati firmati, applica le trasformazioni della firma, calcola il digest del risultato e lo confronta con il valore del digest nella firma; qualsiasi differenza fa fallire la convalida ([XML Signature 1.1, sezione 3.2.1](https://www.w3.org/TR/xmldsig-core1/)). La specifica core di SAML stabilisce che le implementazioni DOVREBBERO usare Exclusive XML Canonicalization, sia per le informazioni firmate sia come trasformazione ([SAML 2.0 core, sezione 5.4.3](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf)). La canonicalizzazione esclusiva tratta gli spazi bianchi come fa Canonical XML ([Exclusive XML Canonicalization, sezioni 1.1 e 3](https://www.w3.org/TR/xml-exc-c14n/)), e Canonical XML conserva tutti gli spazi bianchi nel contenuto testuale («all whitespace in character content»), compresi gli spazi bianchi tra i tag ([Canonical XML 1.1, sezione 1.1 ed esempio 3.2](https://www.w3.org/TR/xml-c14n/)). Modificare il rientro di un documento firmato cambia quindi il digest, e la firma non viene più verificata. Leggere una copia formattata va bene; inoltrarla no. Per leggere cosa afferma un messaggio SAML, e se e come è firmato, usa il [decodificatore SAML](/tools/saml-decoder).

## Opzioni

- **Modalità.** Leggibile mette ogni figlio di un elemento con contenuto di soli elementi su una riga propria, con un livello di rientro in più rispetto al padre, e riporta il tag di chiusura al livello del padre. Compatto rimuove gli stessi spazi bianchi e non ne aggiunge.
- **Rientro.** Due spazi, quattro spazi o una tabulazione per livello (solo nella modalità Leggibile).
- **Mantieni i commenti.** Attivo per impostazione predefinita. Se è disattivato, ogni commento viene escluso, dentro e fuori dalla radice, e i conteggi indicano quanti.

## Codici di errore

| Codice | Significato | Sezione |
|---|---|---|
| `empty` | Solo spazi bianchi (lo segnala l’API; la pagina si limita ad attendere) | |
| `too-large` | Più di 2.000.000 di caratteri | |
| `too-deep` | Più di 1000 elementi annidati | |
| `illegal-character` | Un carattere al di fuori di `Char` | 2.2 |
| `bad-xml-declaration` | Una dichiarazione XML malformata, o `<?XML` all’inizio | 2.8 |
| `misplaced-xml-declaration` | Una dichiarazione XML in un punto diverso dall’inizio assoluto | 2.6, 2.8 |
| `bad-pi` | Un’istruzione di elaborazione senza una destinazione valida | 2.6 |
| `unterminated-pi` | Manca `?>` | 2.6 |
| `unterminated-comment` | Manca `-->` | 2.5 |
| `comment-double-hyphen` | `--` all’interno di un commento, o `--->` | 2.5 |
| `unterminated-cdata` | Manca `]]>` | 2.7 |
| `cdata-outside-root` | Una sezione CDATA fuori da qualsiasi elemento | 2.7 |
| `bad-doctype` | Un DOCTYPE malformato | 2.8 |
| `unterminated-doctype` | Un DOCTYPE mai chiuso | 2.8 |
| `bad-internal-subset` | Nel sottoinsieme interno, qualcosa di diverso da dichiarazioni, commenti, istruzioni di elaborazione, riferimenti a entità parametriche e spazi bianchi, un riferimento a entità parametrica all’interno di una dichiarazione, o una dichiarazione di entità malformata | 2.8, 4.2 |
| `misplaced-doctype` | Un DOCTYPE dopo l’inizio della radice, o un secondo DOCTYPE | 2.8 |
| `unknown-markup` | Un `<!` che non apre né un commento, né una sezione CDATA, né il DOCTYPE | |
| `bad-start-tag` | Un tag di apertura senza un nome valido, o con un carattere fuori posto | 3.1 |
| `bad-attribute` | Manca `=`, mancano le virgolette o manca lo spazio bianco prima di un attributo | 3.1 |
| `duplicate-attribute` | Lo stesso attributo due volte in un tag | 3.1 |
| `lt-in-attribute` | Un `<` all’interno del valore di un attributo | 3.1 |
| `unterminated-tag` | L’input termina all’interno di un tag | 3.1 |
| `bad-end-tag` | Qualcosa di diverso da spazi bianchi tra il nome di un tag di chiusura e il suo `>` | 3.1 |
| `mismatched-end-tag` | Un tag di chiusura che non corrisponde all’elemento aperto | 3.1 |
| `unexpected-end-tag` | Un tag di chiusura senza un elemento aperto | 3.1 |
| `unclosed-element` | Un elemento mai chiuso (segnalato dove si apre) | 3.1 |
| `bad-reference` | Un `&` non seguito da un riferimento ben formato | 2.4, 4.1 |
| `illegal-char-reference` | Un riferimento a carattere verso un carattere al di fuori di `Char` | 4.1 |
| `undeclared-entity` | Un riferimento a un’entità non dichiarata, quando si applica Entity Declared | 4.1 |
| `unparsed-entity-reference` | Un riferimento a un’entità dichiarata con `NDATA` | 4.1 |
| `external-entity-in-attribute` | Un riferimento diretto a un’entità esterna nel valore di un attributo | 3.1 |
| `cdata-end-in-text` | `]]>` nel testo | 2.4 |
| `text-outside-root` | Testo prima o dopo l’elemento radice | 2.1, 2.8 |
| `multiple-roots` | Un secondo elemento di primo livello | 2.1 |
| `no-root` | Nessun elemento | 2.1 |

## Esempi svolti

- **Il pulsante Esempio**: una Response simile a quelle SAML 2.0 su una sola riga, così come arriva da un binding, con i namespace `samlp` e `saml`, uno status code `Success` e un NameID `emailAddress` (i nomi dello standard [OASIS SAML 2.0 core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf); il messaggio non è firmato). Formattata in modo leggibile con due spazi occupa 18 righe; compattando quelle righe si riottiene la riga unica, byte per byte. Il `&amp;` dentro `<saml:AttributeValue>admin &amp; auditor</saml:AttributeValue>` resta `&amp;`.
- **Contenuto misto**: in `<para>Use <code>--force</code> only when <emphasis>all</emphasis> nodes agree.</para>` non viene cambiato alcun rientro, e un `<para>` il cui testo si estende su tre righe conserva i suoi a capo, i suoi spazi e la posizione del suo tag di chiusura.
- **`xml:space`**: sotto `<poem xml:space="preserve">` restano l’a capo e i tre spazi prima del secondo `<line>`; dentro `<listing xml:space="preserve">`, un figlio `<meta xml:space="default">` con due elementi figli viene impaginato di nuovo.
- **CDATA, commenti, istruzioni di elaborazione**: `<step id="1"><![CDATA[if (a < b && c) { go(); }]]></step>` resta su una riga come è scritto; `<?xml-stylesheet type="text/xsl" href="view.xsl"?>` è un’istruzione di elaborazione (la sua destinazione inizia con `xml-`, che non è il riservato `xml`) e viene conservata; `<step id='2'>` conserva le sue virgolette singole.
- **Un DOCTYPE con riferimenti**: `<from>&org;</from>` conserva `&org;` (dichiarato nel sottoinsieme interno, mai espanso), `<sign>&#169; 2026 &#x2122;</sign>` conserva entrambi i riferimenti a carattere, e `<to   lang = "pt-BR" >` diventa `<to lang="pt-BR">`.
- **Rifiuti**: `<a>AT&T</a>` si ferma alla riga 1, colonna 6 con `bad-reference`; `<a>&nbsp;</a>` con `undeclared-entity`; un a capo prima di `<?xml version="1.0"?>` con `misplaced-xml-declaration` alla riga 2, colonna 1.

## Provenienza

Il motore è un’unica passata sul testo con una pila esplicita degli elementi, senza orologio, senza rete e senza casualità. Include vettori di test di riferimento (golden vectors, insieme `xml-formatter-golden-2026-10-26`): 20 documenti accettati il cui output, scritto a mano a partire dalle regole qui sopra prima che il motore venisse eseguito, è fissato byte per byte, e 42 rifiuti fissati per codice, riga e colonna, almeno uno per ogni codice di errore. Per ogni documento accettato vengono verificate anche due proprietà: formattare di nuovo l’output non cambia nulla, e compattare l’output dà lo stesso testo che compattare l’input. Durante lo sviluppo i verdetti sono stati confrontati con quelli del parser Expat 2.6.1 fornito con Python 3.13, su circa 500.000 documenti generati, e coincidevano per tutti tranne che per una classe: Expat accetta un numero di versione che non è «1.» seguito da cifre, come `"10"` o `"2.0"`, che la produzione [26] della Raccomandazione (`'1.' [0-9]+`) non ammette. La pagina degli errata della Raccomandazione è stata letta lo stesso giorno: la sua correzione proposta S01 riformula i nomi riservati e dichiara vietata la destinazione `xml`, che la produzione [17] esclude già, ed E01 aggiunge una nota sulla normalizzazione Unicode; nessuna delle due cambia una regola applicata dal motore.

## API

Lo stesso motore risponde all’operazione `/api/v1/xml-formatter` dell’API HTTP del sito, descritta nel contratto OpenAPI della [pagina dell’API](/api); il contratto indica anche se questo sito espone l’API.

- **Richiesta.** Il documento XML come testo, nel corpo di una POST o nel parametro di query `input` di una GET. L’API applica le opzioni predefinite: leggibile, due spazi, commenti mantenuti.
- **Risposta.** `ok`; se il documento è ben formato, `output` e `stats` (`elements`, `attributes`, `comments`, `commentsDropped`, `cdataSections`, `processingInstructions`, `maxDepth`, `mixedContentElements`, `preserveElements`, `insignificantWhitespaceNodes`); altrimenti `error`, con `code`, un `message` in inglese, `line`, `column`, `offset`, `excerpt`, `excerptColumn` e `params`. Entrambe contengono `notes` (`bom-removed`, `line-endings-normalised`, `doctype-kept`, `entities-unchecked`, `xml-space-invalid`) e le `options` applicate. Un documento malformato è una risposta normale con `ok` a false, non un errore HTTP.

## Condivisione dei risultati

Sotto il verdetto (o sotto la riga in cui il documento non è valido, che è anch’essa il verdetto), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il documento così come l’hai incollato e le tre scelte (leggibile o compatto, il rientro, i commenti mantenuti o rimossi). Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. L’XML può contenere token, host interni e nomi di persone, quindi il riquadro a comparsa ti chiede di rileggerlo prima di inviare il link. Prima che venga offerto un link, nel testo viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezioni 4.1.1 e 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1: la forma «user:password» è deprecata, «is deprecated»), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (un elemento `password`, un attributo `apiKey`) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo. Contano come credenziali altri due punti, come nel decodificatore XML: la `Password` di un `UsernameToken` WS-Security ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html): fornisce informazioni sulla password o un equivalente come un hash, «provides password information (or equivalent such as a hash)») e un’asserzione SAML firmata o cifrata. L’Esempio della pagina, una Response non firmata simile a quelle SAML, non contiene né l’una né l’altra e ottiene il link.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il testo compila la casella e le scelte vengono impostate come le imposteresti tu, e la pagina lo verifica e lo formatta, in locale: nessuna entità viene espansa e nulla viene recuperato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [W3C, Extensible Markup Language (XML) 1.0 (Fifth Edition), W3C Recommendation 26 November 2008](https://www.w3.org/TR/xml/) (consultata il 26/10/2026): sezioni da 2.1 a 2.11, 3.1, 3.2.2, 4.1 e 4.2; [errata](https://www.w3.org/XML/xml-V10-5e-errata) (consultati il 26/10/2026)
- [W3C, Canonical XML Version 1.1, W3C Recommendation 2 May 2008](https://www.w3.org/TR/xml-c14n/) (consultata il 26/10/2026; questo indirizzo ora restituisce la versione 1.1): sezione 1.1 ed esempio 3.2
- [W3C, Exclusive XML Canonicalization Version 1.0, W3C Recommendation 18 July 2002](https://www.w3.org/TR/xml-exc-c14n/) (consultata il 26/10/2026): sezioni 1.1 e 3
- [W3C, XML Signature Syntax and Processing Version 1.1, W3C Recommendation 11 April 2013](https://www.w3.org/TR/xmldsig-core1/) (consultata il 26/10/2026): sezione 3.2.1
- [OASIS, Assertions and Protocols for the OASIS Security Assertion Markup Language (SAML) V2.0, OASIS Standard, 15 March 2005](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) (consultato il 26/10/2026): sezione 5.4.3, e i nomi dei namespace, lo status code Success e il formato di NameID emailAddress usati nell’Esempio
