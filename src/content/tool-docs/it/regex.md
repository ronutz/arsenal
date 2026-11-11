## Cosa fa

Prova, spiega ed esegui il debug di un’espressione regolare. Inserisci un pattern e un testo e lo strumento mostra ogni corrispondenza con i suoi gruppi di cattura, in tempo reale mentre scrivi; inserisci solo un pattern e lo scompone in parti annotate, così puoi leggere cosa fa ciascuna; e in ogni momento avvisa quando un pattern rischia un backtracking catastrofico. Usa il motore regex di JavaScript (ECMAScript) e viene eseguito interamente nel tuo browser.

## Quattro funzioni in una

Lo strumento fa le quattro cose che ti servono davvero da un banco di lavoro per regex:

- **Prova.** Compila il pattern e i flag, riporta ogni errore di sintassi in termini chiari ed esegue il pattern sul tuo input, restituendo ogni corrispondenza con i suoi gruppi di cattura numerati e con nome. Il numero di corrispondenze raccolte ha un limite, quindi un pattern che trova corrispondenze in un input enorme non può bloccare la pagina.
- **Spiegazione.** Analizza il pattern scomponendolo in token annotati e indica ogni quantificatore, classe di caratteri, gruppo e asserzione, così puoi capire una regex senza doverla eseguire a mente.
- **Controllo ReDoS.** Cerca le strutture che causano un backtracking catastrofico e ti avvisa.
- **Confronto tra varianti.** Elenca ogni costrutto del pattern il cui supporto o significato differisce tra ECMAScript, PCRE2 (NGINX) e le Advanced Regular Expressions di Tcl (iRules di BIG-IP), in modo statico, senza eseguire il pattern altrove che qui. Lo spiega la sezione Varianti più avanti.

## Cos’è il ReDoS e perché qui conta

Il ReDoS (Regular expression Denial of Service) si verifica quando un pattern può fare backtracking in un numero esponenziale di modi su certi input, così una stringa breve fa girare il motore praticamente all’infinito. La forma classica è un quantificatore applicato a un gruppo che contiene a sua volta un quantificatore, come `(a+)+`, confrontato con un input che alla fine non corrisponde. Nel browser la cosa conta direttamente: una ricerca regex sincrona non si può interrompere, quindi un pattern catastrofico bloccherebbe la pagina. Per questo lo strumento limita il proprio lavoro e segnala i pattern a rischio, ed è un avviso reale di cui tenere conto prima di mettere in produzione un pattern che girerà su input non attendibili. Il [laboratorio dell’articolo sul backtracking](/learn/regex-catastrophic-backtracking#lab-regex-partitions) conta i modi in cui `(a+)+` può suddividere una sequenza di a.

## Il motore e la sua variante

La sintassi delle regex varia da un linguaggio all’altro, e lo strumento usa la variante JavaScript definita dalla specifica ECMAScript, con i suoi flag (global, ignore-case, multiline, dotall, unicode e sticky) e il suo supporto per i gruppi con nome e i lookaround. Se scrivi regex per JavaScript, o per qualsiasi cosa ne condivida la semantica, ciò che vedi qui è ciò che otterrai. Per qualsiasi altro motore, vedi Varianti più avanti.

Sotto il pattern, un pulsante per ogni flag lo aggiunge al campo dei flag o lo toglie, ciascuno con il nome della sua proprietà RegExp (`g global`, `i ignoreCase` e così via); nel campo si può comunque scrivere.

## Varianti

Il tester esegue un solo motore, ECMAScript, ma i pattern scritti da chi si occupa di reti e sicurezza raramente restano in JavaScript. Un blocco `location ~` di NGINX, un’iRule di BIG-IP e una firma di un web application firewall (WAF) passano ciascuno il pattern a un motore diverso, e lì gli stessi caratteri possono significare cose diverse. La sezione **Portabilità** legge i token del tuo pattern ed elenca ogni costrutto il cui supporto o significato differisce tra tre varianti:

- **ECMAScript**, come lo definisce l’edizione 2026 di ECMA-262 (la 17ª edizione; la sua grammatica RegExp non cambia nella bozza 2027), insieme all’allegato per i browser che, ad esempio, fa di `\A` la semplice lettera A quando non è impostato né il flag `u` né il flag `v`.
- **PCRE2**, come la descrive il suo manuale. NGINX ha bisogno della libreria PCRE per le espressioni regolari in `location` e nel modulo rewrite, anche le sue direttive `map` e `server_name` accettano espressioni regolari e, dalla 1.21.5, usa PCRE2 a meno che non sia compilato con `--without-pcre2`, che seleziona la libreria PCRE originale.
- **Advanced Regular Expressions (ARE) di Tcl**, come le descrive il manuale `re_syntax` di Tcl 8.4. F5 dichiara che il set di comandi delle iRules di BIG-IP è stato sviluppato a partire dalla versione base 8.4.6 di Tcl (K6091), e `regexp` e `regsub` non sono nel suo elenco dei comandi Tcl disattivati (K36322151). I manuali di Tcl 8.6 e 9.0 non aggiungono né il lookbehind né i gruppi con nome, e il loro `\w` comprende anche i caratteri di punteggiatura di connessione.

Ogni costrutto riceve una risposta per variante: **uguale** (supportato con il significato indicato dal titolo della riga), **differisce** (supportato con un altro significato o un’altra sintassi, e la riga spiega come) o **non supportato** (un errore, o letto come qualcos’altro, e la riga dice cosa). La sezione compare anche quando il browser non riesce a compilare il pattern, perché incollare un pattern NGINX o iRules è proprio lo scopo.

Dove vivono questi pattern, altri strumenti li leggono: il [simulatore della selezione delle location NGINX](/tools/nginx-location-matcher) mostra quale blocco `location` seleziona un URI, il [linter delle prestazioni delle iRule](/tools/f5-irules-performance-linter) segnala `regexp` e `regsub` dove basterebbe un comando sulle stringhe, e l’[analizzatore di script Expect](/tools/expect-script-explainer) legge i pattern di uno script Expect, i cui pattern `-re` seguono la sintassi del comando regexp di Tcl («follow the syntax defined by Tcl's regexp», expect(1), Expect 5.45.4), quindi anche a loro si applica la colonna Tcl.

| Costrutto | ECMAScript | PCRE2 | Tcl ARE |
|---|---|---|---|
| Lookbehind a lunghezza fissa: `(?<=ab)`, `(?<=colour\|color)` | uguale | uguale: ogni ramo di primo livello è fisso, fino a 65.535 caratteri | non supportato: solo lookahead |
| Lookbehind variabile con un massimo: `(?<=colou?r)` | uguale | differisce: dalla 10.43, ogni ramo entro un limite impostato dal chiamante, 255 per impostazione predefinita; non supportato oltre il limite o prima della 10.43 | non supportato |
| Lookbehind senza massimo: `(?<=\d+)` | uguale | non supportato | non supportato |
| Lookahead che contiene un gruppo o un backreference | uguale | uguale | differisce: le parentesi al suo interno non catturano mai; un backreference non è supportato |
| Gruppo con nome `(?<name>...)` | uguale, l’unica grafia | uguale; fuori dalla modalità UTF il nome deve essere ASCII | non supportato |
| Gruppo con nome `(?P<name>...)` o `(?'name'...)` | non supportato | uguale | non supportato |
| Backreference con nome `\k<name>` | uguale | uguale | non supportato |
| `\k'name'`, `\k{name}`, `\g{name}`, `\g1`, `\g{-1}`, `(?P=name)` | non supportato | uguale | non supportato |
| Modificatori limitati a un gruppo `(?i:...)`, `(?i-s:...)` | uguale da ECMAScript 2025, solo le lettere i, m e s | uguale | non supportato |
| Opzioni semplici `(?i)`, `(?im)` | non supportato | uguale | solo all’inizio assoluto; i e x hanno lo stesso significato, m è la corrispondenza sensibile agli a capo e s la modalità predefinita |
| Quantificatori possessivi `a++`, `a*+` | non supportato | uguale | non supportato |
| Gruppo atomico `(?>...)` | non supportato | uguale | non supportato |
| `\A` | non supportato | uguale | uguale |
| `\Z` | non supportato | uguale: la fine, o prima di un a capo finale | differisce: solo la fine assoluta |
| `\z` | non supportato | uguale | non supportato |
| `$` | uguale: la fine; con `m`, prima dei terminatori di riga | differisce: anche prima di un a capo finale, a meno che non sia impostato PCRE2_DOLLAR_ENDONLY | uguale: la fine; con `-line`, prima di ogni a capo |
| `.` | uguale: non LF, CR, U+2028 né U+2029, a meno di `s` | differisce: non i caratteri della convenzione degli a capo, per impostazione predefinita solo LF | differisce: corrisponde all’a capo, a meno che la corrispondenza non sia sensibile agli a capo |
| Classe POSIX `[[:alpha:]]` | non supportato | uguale: ASCII a meno di PCRE2_UCP; anche `ascii`, `word` e `[:^name:]` | differisce: locale Unicode; dodici nomi, nessuna negazione |
| `[[:<:]]`, `[[:>:]]` | non supportato | uguale, convertito in un confine di parola | uguale, deprecato |
| `\Q...\E` | non supportato | uguale | non supportato; `***=` rende letterale un’intera espressione |
| `\p{L}`, `\P{L}` | differisce con `u` o `v` (nomi più rigorosi); non supportato senza | uguale: nomi tolleranti, nomi di script da soli | non supportato |
| `\pL` | non supportato | uguale | non supportato |
| Quantificatori lazy `*?`, `+?`, `??`, `{n,m}?` | uguale | uguale | differisce: regole di preferenza per la corrispondenza più lunga o più corta |
| `\b` | uguale: caratteri di parola ASCII | uguale: ASCII a meno di PCRE2_UCP | differisce: backspace; il confine è `\y` |
| `\B` | uguale | uguale | differisce: una barra rovesciata; il non confine è `\Y` |
| `\w`, `\W` | uguale: ASCII | uguale: ASCII a meno di PCRE2_UCP | differisce: locale Unicode |
| `\D`, `\S` o `\W` tra parentesi quadre | uguale | uguale | non supportato |
| `\m`, `\M`, `\y`, `\Y` | non supportato: lettere semplici in un browser senza `u` o `v` | non supportato: un errore | uguale: vincoli di parola |
| `{,n}` | non supportato: testo letterale senza `u` o `v` | uguale dalla 10.43 | non supportato: testo letterale |

### Firme dei web application firewall

La sintassi delle firme di F5 per le firme di attacco e bot di BIG-IP ASM (un manuale che si applica a BIG-IP ASM dalla 14.1.0 alla 21.0.0) indica tre opzioni di regola per le espressioni regolari. L’opzione `pcre` si basa sulla sintassi PCRE, ma F5 non dichiara quale libreria PCRE né quale versione usi. L’opzione `re2` accetta la sintassi open source di RE2, che F5 consiglia per le prestazioni, e questa vista non confronta RE2. L’opzione `ipp`, solo per le firme bot, usa un motore basato su Intel la cui sintassi F5 non dichiara. Quindi la colonna PCRE2 è la guida più vicina per l’opzione `pcre`, e niente di più.

### Cosa la vista non controlla

È un confronto statico della sintassi, non un secondo motore: non esegue mai il pattern in PCRE2 o in Tcl. Non controlla i limiti dei motori (limiti dei quantificatori, dimensione del pattern, il limite del lookbehind oltre il valore predefinito di 255), le prestazioni o il comportamento del backtracking, le opzioni che un prodotto imposta per te (il `~*` di NGINX senza distinzione tra maiuscole e minuscole, i modificatori di una firma, la modalità UTF o UCP di PCRE2, l’opzione `-line` di Tcl) né i costrutti fuori dal suo elenco, come le chiamate a subroutine, le condizioni, i commenti, `\K`, `\G`, `\R`, `\X` e gli escape esadecimali o ottali. Un pattern senza righe non è dimostrato portabile; semplicemente non usa nulla dell’elenco.

## Come si usa

Inserisci un pattern e i flag e, se vuoi, un testo su cui cercare corrispondenze, poi leggi le corrispondenze in tempo reale, la spiegazione token per token, le righe di portabilità e gli eventuali avvisi di backtracking. **Esempio di portabilità** carica un pattern che ogni variante legge in modo diverso. Tutto viene calcolato in locale.

## Condivisione dei risultati

Sotto il testo di prova, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il pattern, i flag e il testo di prova così come li hai inseriti, una volta che c’è un pattern. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Il testo di prova contiene spesso dati reali, quindi il riquadro a comparsa ti chiede di rileggerlo prima di inviare il link. Il testo di prova parte così come l’hai inserito: le corrispondenze sono la lettura, e un valore sostituito al suo interno darebbe corrispondenze diverse. Prima che venga offerto un link, nel testo viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezioni 4.1.1 e 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1: la forma «user:password» è deprecata, «is deprecated»), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa indica il campo e la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (un `password=` in una query, `api_key = ...`) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I tre campi vengono compilati come se li inserissi tu, e la pagina spiega e cerca le corrispondenze. Un pattern che il controllo statico segnala per backtracking catastrofico resta comunque in attesa dietro **Esegui comunque**: un link non dà mai quel consenso. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [ECMA-262, ECMAScript 2026 Language Specification (17ª edizione), 22.2.1 Patterns](https://tc39.es/ecma262/2026/#sec-patterns), [22.2.2 Pattern Semantics](https://tc39.es/ecma262/2026/#sec-pattern-semantics), [Annex B.1.2 Regular Expressions Patterns](https://tc39.es/ecma262/2026/#sec-regular-expressions-patterns) e la [Introduction](https://tc39.es/ecma262/2026/#sec-intro) (ECMAScript 2025 ha aggiunto i modificatori in linea) (consultati il 26/10/2026)
- [ECMA-262 draft, 22.2 RegExp Objects](https://tc39.es/ecma262/multipage/text-processing.html): la grammatica dei pattern della bozza 2027 coincide con quella dell’edizione 2026 (consultata il 26/10/2026)
- [Manuale di PCRE2: pcre2pattern](https://www.pcre2.org/doc/pcre2pattern/), [pcre2syntax](https://www.pcre2.org/doc/pcre2syntax/), [pcre2api](https://www.pcre2.org/doc/pcre2api/) e [pcre2build](https://www.pcre2.org/doc/pcre2build/) (manuale 10.50-DEV; consultati il 26/10/2026)
- [Manuale di Tcl 8.4: re_syntax](https://www.tcl-lang.org/man/tcl8.4/TclCmd/re_syntax.htm) e [regexp](https://www.tcl-lang.org/man/tcl8.4/TclCmd/regexp.htm); [Tcl 8.6.18: re_syntax](https://www.tcl-lang.org/man/tcl8.6/TclCmd/re_syntax.htm); [Tcl 9.0.4: re_syntax](https://www.tcl-lang.org/man/tcl9.0/TclCmd/re_syntax.html) (consultati il 26/10/2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) e [K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (consultati il 26/10/2026)
- [F5 BIG-IP ASM: Attack and Bot Signatures, Signature Syntax](https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-asm-attack-and-bot-signatures-14-1-0/signature-syntax.html) (si applica a BIG-IP ASM dalla 14.1.0 alla 21.0.0; consultato il 26/10/2026)
- nginx: [location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location), [map](https://nginx.org/en/docs/http/ngx_http_map_module.html#map), [Building nginx from Sources](https://nginx.org/en/docs/configure.html) e [Regular expression captures](https://nginx.org/en/docs/regex_captures.html) (consultati il 26/10/2026)
- [expect(1), sorgente del manuale di Expect 5.45.4](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (consultato il 27/10/2026): i pattern in stile regexp seguono la sintassi definita dal comando regexp di Tcl
