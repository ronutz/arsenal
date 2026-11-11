## Cosa fa

Incolla il nome del file di un wheel (`.whl`) o di una distribuzione sorgente (`.tar.gz`), o un URL che termina con uno di questi, e lo strumento lo scompone: il nome del progetto e la sua forma normalizzata, la versione e la sua forma normale PEP 440, il build tag facoltativo, e ogni tag python, ABI e di piattaforma, con ciò che ciascuno richiede. Gli insiemi di tag compressi vengono espansi, e per ogni combinazione viene indicato quali interpreti e quali sistemi copre. Apri **Verifica rispetto a un interprete**, descrivine uno (CPython o PyPy, la versione di Python, una build free-threaded o no, Linux con glibc o musl, macOS o Windows, la versione della libreria C o di macOS, l’architettura), e lo strumento indica se il wheel si installa lì e quale dei suoi tag prevale.

La modalità **Versioni** legge invece un elenco di versioni: ciascuna viene analizzata e normalizzata, con ciò che la normalizzazione ha cambiato, l’elenco viene ordinato secondo la PEP 440 con le versioni uguali segnalate e, quando aggiungi un insieme di specificatori come `>= 1.0, != 1.3.*, < 2`, viene indicato quali versioni rientrano nell’intervallo e quali sceglie un installer per impostazione predefinita. Tutto viene eseguito nel tuo browser; di un URL si tiene solo l’ultimo segmento, e non viene scaricato nulla. Lo strumento si affianca all’[analizzatore di pyproject.toml](/tools/pyproject-toml-explainer), che legge il file da cui nascono questi nomi, e al [Playground Python](/tools/python-playground).

## Come viene letto un nome di file

Il formato di distribuzione binaria (binary distribution format) dà il nome del file di un wheel come `{distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl`, quindi un nome valido ha quattro o cinque trattini. Le regole applicate qui:

- **Il nome** è un nome di progetto valido (lettere ASCII, cifre, `.`, `_` e `-`, che inizia e termina con una lettera o una cifra), confrontato nella sua forma normalizzata: in minuscolo, con ogni sequenza di `-`, `_` e `.` sostituita da un solo `-`. Nel nome di un file, gli strumenti lo scrivono in minuscolo con ogni sequenza di questo tipo come un solo `_`; gli strumenti che leggono i wheel devono comunque accettare `.` e le maiuscole dei file più vecchi, quindi qui vengono accettati con un avviso. Un doppio trattino basso viene rifiutato, come fa pip.
- **La versione** è una versione PEP 440. Gli strumenti la scrivono normalizzata; un nome la cui versione non lo è viene accettato con un avviso che indica la forma normale.
- **Il build tag** deve iniziare con una cifra. Serve solo a sciogliere la parità tra wheel identici in tutto il resto, ordinando prima per le sue cifre iniziali come numero e poi per il resto come testo. Non fa parte della versione, e la specifica dice che una release a cui si deve poter fare riferimento dall’esterno, come una correzione di sicurezza, dovrebbe avere una nuova versione invece di un numero di build.
- **Una distribuzione sorgente** è `{name}-{version}.tar.gz` con esattamente un trattino. Un nome con più trattini viene letto come lo legge pip (la versione è dopo l’ultimo trattino), con un avviso; un `.zip` viene letto come la forma più vecchia, anch’esso con un avviso.

## I tag

- **Tag python**: un codice di implementazione (`py` per qualsiasi implementazione, `cp` CPython, `pp` PyPy, `ip` IronPython, `jy` Jython) seguito dalla versione senza il punto (`cp313` è CPython 3.13). Un tag con la sola versione principale, come `py3`, non è un’abbreviazione di `py30`: significa che chi ha creato il pacchetto ha pubblicato un wheel pensato per funzionare con tutte le versioni 3.x.
- **Tag ABI**: `none` (nessun modulo di estensione legato a un’ABI di Python), `abi3` (l’ABI stabile di CPython, per le build che non sono free-threaded), `abi3t` (l’ABI stabile per le build free-threaded, PEP 803, da Python 3.15), il `cpXY` proprio di CPython con i suoi flag (`d` debug, `t` free-threaded, e i più vecchi `m` e `u`), oppure il `pypyXY_ppNN` di PyPy.
- **Tag di piattaforma**: `any`; `win_amd64`, `win32`, `win_arm64`; `manylinux_x_y_arch` (glibc x.y o successiva, PEP 600) e i suoi nomi legacy `manylinux1` (glibc 2.5), `manylinux2010` (2.12) e `manylinux2014` (2.17); `musllinux_x_y_arch` (musl x.y o successiva, PEP 656; packaging elenca solo la stessa versione principale di musl); `macosx_x_y_arch` (macOS x.y o successivo; `10_y` per macOS 10, `x_0` da macOS 11, con x da 10 a 15 o da 26 in poi), compresi i nomi multiarchitettura come `universal2` (arm64 e x86_64); `ios_x_y_arch_sdk`; `android_apilevel_abi`; `pyemscripten_YEAR_PATCH_wasm32` (PEP 783, accettata); e il semplice `linux_arch`, che la specifica giudica insufficiente per la distribuzione pubblica. Qualsiasi altra cosa viene letta come il valore `sysconfig.get_platform()` di un altro sistema.
- **Insiemi di tag compressi**: ogni tag può essere una raccolta ordinata separata da `.`, e il wheel vale allora per ogni combinazione. `py2.py3-none-any` corrisponde a due combinazioni; fino a 400 vengono spiegate una per una, e le altre vengono contate.

## Quali interpreti e sistemi

La specifica dei tag di compatibilità della piattaforma (platform compatibility tags) dice che un installer tiene un elenco dei tag (python, ABI, piattaforma) che supporta, ordinato per preferenza, e installa un wheel quando uno dei tag del wheel è nell’elenco. Questo strumento costruisce quell’elenco come lo costruisce packaging 26.3 per l’interprete e il sistema che descrivi, confronta con esso i tag espansi del wheel e riporta la corrispondenza migliore e la sua posizione. Per CPython 3.13 su glibc 2.39, x86-64, l’elenco ha 1147 tag, lo stesso numero che `python -m pip debug --verbose` ha stampato nel container in cui è stato realizzato questo strumento. pip 26.2 incorpora ancora packaging 26.2, e packaging 26.3 ha cambiato una cosa nell’ordine: preferisce il tag di piattaforma semplice `linux_*` a quelli manylinux e musllinux, quindi in ogni gruppo il tag `linux_x86_64` ora viene per primo invece che per ultimo. L’elenco di pip contiene quindi gli stessi tag quasi nello stesso ordine: si sposta solo il tag semplice `linux_*` di ogni gruppo, e il fatto che un wheel si installi o no non cambia mai.

Ogni combinazione riceve anche una lettura in chiaro della sua regola sull’interprete: `py3-none` è qualsiasi Python 3; `cp311-abi3` è CPython 3.11 o successivo, build che non sono free-threaded; `cp313-cp313t` è solo la build free-threaded di CPython 3.13. Alcune combinazioni sono nomi validi che nessun installer elenca mai, e lo strumento lo dice con il motivo: `abi3` con un tag python diverso da `cp`, un’ABI compilata con la piattaforma `any`, un’ABI che indica una versione diversa da quella del tag python, o un tag `cp3` con un’ABI.

Cosa non modella la verifica rispetto a un interprete: i target iOS, Android ed Emscripten, implementazioni diverse da CPython e PyPy (PyPy viene considerato 7.3, ABI `pp73`), e le regole per singola distribuzione che un installer può aggiungere, come una discordanza con `Requires-Python` o un indice che nasconde un file. Le versioni di Python offerte sono i rami supportati secondo la guida per gli sviluppatori di Python: dalla 3.11 alla 3.15.

## Rilievi

| Codice | Gravità | Significato |
|---|---|---|
| `not-a-distribution` | errore | Il nome non termina con `.whl`, `.tar.gz` o `.zip` |
| `suffix-case` | errore | Il suffisso non è in minuscolo |
| `wrong-part-count` | errore | Un nome di wheel senza quattro o cinque trattini |
| `sdist-no-hyphen` | errore | Un nome di distribuzione sorgente senza trattino |
| `empty-name`, `bad-name` | errore | Nessun nome, o un nome di progetto non valido |
| `double-underscore` | errore | `__` nella parte del nome |
| `bad-version` | errore | Non è una versione PEP 440 |
| `bad-build-tag` | errore | Un build tag che non inizia con una cifra |
| `empty-tag` | errore | Un tag vuoto o un membro vuoto di un insieme compresso |
| `python-tag-not-identifier` | errore | Un tag python che inizia con una cifra (pip rifiuta il nome) |
| `name-not-escaped` | avviso | Accettato, ma non nella forma con escape che gli strumenti scrivono oggi |
| `version-not-normalized` | avviso | La versione non è in forma normale |
| `build-tag-used` | avviso | È presente un build tag |
| `tags-not-sorted`, `tags-uppercase` | avviso | Un insieme compresso non ordinato, o lettere maiuscole in un tag |
| `impossible-combination` | avviso | Una combinazione che nessun installer elenca |
| `unknown-python-tag` | avviso | Un tag python che non è composto da lettere seguite da una versione |
| `linux-simple-tag` | avviso | `linux_arch` invece di manylinux o musllinux |
| `legacy-arch-mismatch` | avviso | Un nome manylinux legacy su un’architettura per cui non è mai stato definito |
| `macos-version-shape`, `android-abi`, `ios-multiarch` | avviso | Un tag di piattaforma al di fuori delle forme dichiarate per la sua famiglia |
| `sdist-zip`, `sdist-hyphens` | avviso | Un nome di distribuzione sorgente vecchio o non standard |
| `local-version` | nota | Un’etichetta di versione locale (PyPI non accetta versioni locali) |
| `legacy-manylinux` | nota | Un nome manylinux legacy e il tag che indica |
| `unknown-platform` | nota | Una piattaforma al di fuori delle famiglie descritte |
| `too-many-tags` | nota | Più di 400 combinazioni; le altre vengono contate |

## Versioni PEP 440

Una versione ha la forma `[N!]N(.N)*[{a|b|rc}N][.postN][.devN][+local]`. Lo strumento analizza le forme che la specifica accetta e fornisce la forma normale, indicando cosa è cambiato: spazi bianchi e una `v` iniziale rimossi, maiuscole convertite in minuscole, zeri iniziali rimossi, `alpha`, `beta`, `c`, `pre` e `preview` scritti come `a`, `b` e `rc`, separatori rimossi o scritti come un solo punto, un numero mancante di pre-release, post-release o release di sviluppo considerato 0, `-1` dopo la release letto come `.post1`, `-` e `_` in un’etichetta locale scritti come `.`, e un epoch `0!` rimosso. Un epoch diverso da zero viene mostrato; la specifica lo sconsiglia.

L’ordinamento segue la specifica: i numeri di release si confrontano come numeri, con quelli mancanti contati come zero, quindi `1.0`, `1.0.0` e `1` sono uguali; all’interno di una stessa release vengono prima le release di sviluppo, poi `a`, `b` e `rc`, poi la release finale, poi le post-release; una versione con un’etichetta locale viene dopo la stessa versione senza etichetta.

## Insiemi di specificatori

Ogni clausola viene spiegata a parole: `~=2.2` equivale a `>=2.2, ==2.*`; `==1.1.*` è una corrispondenza di prefisso; `==1.1` ignora l’etichetta locale di una candidata e completa con zeri i numeri di release; `<V` esclude le pre-release di V a meno che V non sia essa stessa una pre-release; `>V` esclude le post-release di V a meno che V non sia essa stessa una post-release, e le versioni locali di V; `===` confronta il testo (le lettere senza distinguere maiuscole e minuscole) ed è fortemente sconsigliato. Le clausole vengono rifiutate per i motivi indicati dalla specifica e da packaging 26.3: `~=` con un solo numero di release, `.*` con un operatore diverso da `==` e `!=` o dopo una parte di pre-release, post-release o sviluppo, un’etichetta locale con un operatore diverso da `==` e `!=`, due clausole senza virgola.

La gestione delle pre-release segue la specifica e packaging 26.3: le pre-release, comprese le release di sviluppo, vengono escluse a meno che una clausola non ne nomini una o che ogni versione nell’intervallo sia una pre-release; la tabella mostra sia ciò che rientra nell’intervallo sia ciò che viene scelto per impostazione predefinita, e segnala l’ultima versione scelta.

## Dove segue packaging, e dove è più rigoroso

Ogni verdetto è stato confrontato con packaging 26.3 durante lo sviluppo (vedi Provenienza). Lo strumento segue le scelte di packaging dove la specifica lascia margine, come le regole esclusive di `<` e `>` e l’elenco dei tag dell’installer. È più rigoroso in un punto, e lo dichiara: un nome di file la cui parte del nome non è un nome di progetto valido (un `_` o un `.` iniziale o finale, una lettera non ASCII, uno spazio nel nome di una sdist) viene rifiutato qui, mentre i parser dei nomi di file di packaging lo accettano.

## Esempi svolti

- **Il pulsante Esempio**: `cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl`. CPython 3.11 o successivo, ABI stabile, build che non sono free-threaded, su Linux con glibc 2.34 o successiva su x86-64. Rispetto a CPython 3.13 su glibc 2.39 si installa, come tag 163 su 1147 (pip 26.2.2, con packaging 26.2, lo stampa in posizione 162); su glibc 2.31 no; su una 3.14 free-threaded no, perché `abi3` non viene elencato per le build free-threaded.
- `markupsafe-3.0.4-cp313-cp313-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl` si espande in tre combinazioni; `manylinux2014` viene indicato come nome legacy di `manylinux_2_17`.
- `Foo.Bar-1.0-py2.py3-none-any.whl` viene accettato con un avviso: oggi gli strumenti scrivono `foo_bar`.
- **Versioni**: l’elenco di esempio `2.1 2.2 2.9.1 3.0 2.10rc1` con `~=2.2` mette nell’intervallo `2.2`, `2.9.1` e `2.10rc1` e sceglie `2.2` e `2.9.1`, perché nell’intervallo c’è una release finale.

## Provenienza

Il motore è puro: scanner di stringhe e confronti, senza orologio, senza rete, senza casualità, senza espressioni regolari con quantificatori annidati. L’input è limitato a 20.000 caratteri, 256 per versione, 1024 per insieme di specificatori e 500 versioni. Include vettori di test di riferimento (golden vectors, insieme `wheel-filename-explainer/2026-10-27a`): 134 righe che coprono 40 versioni accettate e 12 rifiutate, due elenchi di ordinamento (uno dei quali è quello della specifica stessa), 22 insiemi di specificatori (molti dei quali sono esempi della specifica stessa) e 13 rifiutati, 33 nomi di file e 12 interpreti di destinazione, con ogni verdetto tratto da packaging 26.3. Durante lo sviluppo il motore è stato anche confrontato con packaging 26.3 su input generati: 60.059 versioni, 59.963 insiemi di specificatori, 30.000 nomi di file, 230 target e 607.200 verifiche da tag a regola, senza alcuna discordanza oltre alla regola più rigorosa sui nomi descritta sopra.

## API

Lo stesso motore risponde all’operazione `/api/v1/wheel-filename-explainer` dell’API HTTP del sito, descritta nel contratto OpenAPI della [pagina dell’API](/api); il contratto indica anche se questo sito offre l’API.

- **Richiesta.** Testo, nel corpo di una richiesta POST o nel parametro di query `input` di una richiesta GET. Un singolo token che termina con `.whl`, `.tar.gz` o `.zip` (o un URL che punta a uno di questi) viene letto come nome di file; qualsiasi altra cosa viene letta come versioni, una per riga o separate da spazi o virgole, e la prima riga che inizia con `~`, `=`, `!`, `<` o `>` è l’insieme di specificatori.
- **Risposta.** `mode` (`filename`, `versions`, `empty` o `too-long`). In modalità nome file, `filename` contiene `kind`, `fileName`, `parts`, `name`, `expectedName`, `version` (con `normalized`, `epoch`, `release`, `pre`, `post`, `dev`, `local` e le `notes` della normalizzazione), `build`, i `pythonTags`, `abiTags` e `platformTags` analizzati, le combinazioni `expanded` con la loro regola `interpreter`, `expandedCount`, `findings` e `valid`. In modalità versioni, `versions` contiene `entries`, l’ordine `sorted`, `equalGroups`, lo `specifier` analizzato e la `selection`. La verifica rispetto a un interprete è solo una funzionalità della pagina.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il nome del file così come l’hai inserito e, quando la verifica rispetto a un interprete è aperta, le sue sei scelte (implementazione, versione di Python, build free-threaded, sistema operativo, sua versione, architettura); in modalità Versioni contiene le versioni e l’insieme di specificatori. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. La casella accetta anche un URL che punta a un wheel, e l’URL di un indice privato può contenere credenziali prima della `@`: pip legge `https://username:password@...`, e un token in una sola parte usato come nome utente («as the “username”»), senza password ([pip, Authentication](https://pip.pypa.io/en/stable/topics/authentication/), consultata il 01/11/2026). La lettura richiede solo il nome del file alla fine del percorso, quindi un URL con qualcosa prima della sua `@` non ottiene il link: incolla solo il nome del file. L’utente di un URL ssh è un nome di accesso e non conta.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** La modalità viene selezionata e i suoi campi vengono compilati così come sono stati inseriti; un target apre la verifica con quelle scelte. Ogni scelta deve essere tra quelle che la pagina offre, altrimenti il link viene ignorato. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

Tutte consultate il 27/10/2026.

- [Python Packaging User Guide: Binary distribution format](https://packaging.python.org/en/latest/specifications/binary-distribution-format/): la convenzione per i nomi dei file, l’escape, il build tag
- [Python Packaging User Guide: Source distribution format](https://packaging.python.org/en/latest/specifications/source-distribution-format/): il nome del file sdist
- [Python Packaging User Guide: Platform compatibility tags](https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/): tag python, ABI e di piattaforma, tag manylinux, musllinux, macOS, iOS e Android, insiemi di tag compressi, come li usano gli installer
- [Python Packaging User Guide: Names and normalization](https://packaging.python.org/en/latest/specifications/name-normalization/)
- [Python Packaging User Guide: Version specifiers](https://packaging.python.org/en/latest/specifications/version-specifiers/) e [PEP 440](https://peps.python.org/pep-0440/)
- [PEP 427](https://peps.python.org/pep-0427/), [PEP 600](https://peps.python.org/pep-0600/), [PEP 656](https://peps.python.org/pep-0656/), [PEP 803](https://peps.python.org/pep-0803/), [PEP 3149](https://peps.python.org/pep-3149/), [PEP 703](https://peps.python.org/pep-0703/), [PEP 783](https://peps.python.org/pep-0783/)
- [Documentazione di Python: C API Stability](https://docs.python.org/3/c-api/stable.html): `abi3` e `abi3t`
- [packaging 26.3: Tags](https://packaging.pypa.io/en/stable/tags.html): l’ordine dell’elenco dei tag dell’installer; [changelog](https://packaging.pypa.io/en/stable/changelog.html): la 26.3 preferisce i tag di piattaforma nativi `linux_*`
- [Guida per gli sviluppatori di Python: Status of Python versions](https://devguide.python.org/versions/): i rami supportati offerti nella verifica rispetto a un interprete
