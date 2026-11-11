## Cosa fa

Incolla un traceback stampato da CPython e lo strumento lo scompone: ogni frame con il suo file, la riga, la funzione e la riga di codice sorgente, e ciò a cui puntano i marcatori `^` e `~` sotto di essa; ogni eccezione con la catena delle sue classi nella gerarchia integrata, il suggerimento di CPython stesso quando c’è, i dettagli sull’errno o sul codec e un consiglio tratto dalla sua documentazione; la catena tra le eccezioni («direct cause» contro «during handling»); i gruppi di eccezioni con i loro membri e le loro note; dove guardare per prima cosa; a quali release rimanda il formato; e cosa nel testo incollato potrebbe essere sensibile, con una copia oscurata da condividere al posto dell’originale. Tutto viene eseguito nel tuo browser: il testo incollato viene letto, mai eseguito, e non viene mai inviato da nessuna parte.

Legge i formati di CPython dalla 3.11 alla 3.15, le release che la Python Developer's Guide elenca come supportate al 27 ottobre 2026: la 3.15 e la 3.14 in stato bugfix, la 3.13, la 3.12 e la 3.11 in stato security, con fine del ciclo di vita a ottobre 2031, 2030, 2029, 2028 e 2027. La 3.10 ha raggiunto la fine del ciclo di vita il 1º ottobre 2026. Ogni comportamento descritto qui sotto è stato verificato su traceback stampati quel giorno da CPython 3.11.17, 3.12.3 e 3.13.16, e da CPython 3.14.2 nella build del [Playground Python](/tools/python-playground) del sito. Non era disponibile alcun interprete 3.15, quindi qui nulla è stato provato sulla 3.15; dove si cita la 3.15, la fonte è la sua documentazione. L’[articolo sugli errori e sui traceback di Python](/learn/python-errors-and-tracebacks) tratta lo stesso argomento con degli esempi.

## Cosa legge

**L’intestazione e i frame.** Un traceback inizia con `Traceback (most recent call last):` ed elenca i frame dalla chiamata più esterna alla più interna: l’ultimo frame è quello in cui è stata sollevata l’eccezione. Ogni frame è una riga `  File "<file>", line <n>, in <function>`, seguita dalla riga di codice sorgente rientrata di quattro spazi quando CPython è riuscito a leggere il file. La funzione è il nome del code object, quindi il livello superiore di uno script è `<module>`, una lambda è `<lambda>` e una generator expression è `<genexpr>`. Il numero di riga può essere `None`.

**I marcatori (PEP 657, dalla 3.11 in poi).** Sotto la riga di codice sorgente di un frame CPython stampa `^` sotto l’espressione che il frame stava eseguendo. Quando l’espressione ha più parti, `~` marca le parti e `^` l’operazione: l’operatore di un’operazione binaria (`a / b` dà `~^~`), le parentesi quadre di un’indicizzazione (`cfg["hostname"]` dà `~~~^^^^^^^^^^^^`) e, dalla 3.13, le parentesi di una chiamata (`int(port)` dà `~~~^^^^^^`). Lo strumento ritrasforma i marcatori in testo: l’espressione, la parte sotto `^` e le parti sotto `~`. CPython posiziona i marcatori per colonna di visualizzazione, contando un carattere largo o a larghezza piena (East Asian Width W o F) come due colonne, e lo strumento fa lo stesso, con la tabella delle larghezze di Unicode 15.1.0 usata da CPython 3.13. Non vengono stampati marcatori quando CPython è stato avviato con `-X no_debug_ranges` o `PYTHONNODEBUGRANGES`, quando l’espressione occupa l’intera riga e, dalla 3.13, anche per `x = f(...)` e `return name(...)` quando la chiamata è l’intero valore (la 3.12 marca `json.loads(body)` in `data = json.loads(body)`; la 3.13 no).

**Espressioni su più righe (dalla 3.13 in poi).** Un frame può mostrare un’espressione che occupa più righe di codice sorgente, con i marcatori sotto ciascuna e `...<N lines>...` per le righe omesse. La 3.11 e la 3.12 mostrano solo la prima riga.

**Frame ripetuti.** Dopo tre frame identici (stesso file, riga e funzione) CPython stampa `[Previous line repeated N more times]` al posto degli altri. Lo strumento li conta sul frame sopra.

**Variabili locali.** `unittest --locals` e `traceback.TracebackException(..., capture_locals=True)` stampano righe `name = value` sotto un frame. Lo strumento le elenca e avvisa che i valori possono contenere segreti.

**La riga dell’eccezione.** `<type>: <message>`, oppure `<type>` da solo quando il messaggio è vuoto. CPython scrive il tipo come `module.qualname`, tranne per le classi integrate e le classi dello script eseguito (`__main__`), che scrive senza modulo. Quindi `ValueError` è integrata, `json.decoder.JSONDecodeError` viene dalla libreria standard e `PollError` è stata molto probabilmente definita nello script.

**Note e messaggi su più righe.** Le note aggiunte con `add_note()` (PEP 678, dalla 3.11 in poi) vengono stampate subito dopo il messaggio dell’eccezione, nell’ordine in cui sono state aggiunte, ognuna su una nuova riga («immediately after the exception message, in the order in which they were added, with each note starting on a new line»). Un messaggio che contiene degli a capo viene stampato allo stesso modo, quindi dal solo testo non si può distinguere il resto di un messaggio da una nota; lo strumento mostra quelle righe insieme e lo dice.

**La posizione di un SyntaxError.** Quando il codice non si compila, CPython stampa `  File "<file>", line <n>` senza funzione, la riga incriminata e i marcatori `^`, poi `SyntaxError: <message>`. Se è lo script stesso a non compilarsi, non è stato eseguito nulla e non c’è alcuna intestazione `Traceback`; se a non compilarsi è un modulo importato, la posizione viene dopo i frame del codice che lo ha importato. Questi marcatori contano i caratteri, non le colonne di visualizzazione.

**Catene (PEP 3134).** Quando un’eccezione viene sollevata mentre se ne gestisce un’altra, CPython le stampa entrambe, dalla più vecchia, unite da un banner:

- `The above exception was the direct cause of the following exception:` significa `raise new from original`: una traduzione voluta, e l’eccezione precedente è il `__cause__` di quella nuova.
- `During handling of the above exception, another exception occurred:` significa che il gestore dell’eccezione precedente ne ha sollevata una nuova: è fallito il gestore stesso, e l’eccezione precedente è diventata il `__context__` di quella nuova.
- `raise new from None` stampa la nuova eccezione da sola (PEP 409, PEP 415).

Un’eccezione creata ma mai sollevata, come la causa in `raise ValueError(...) from KeyError(...)`, viene stampata senza intestazione e senza frame.

**Gruppi di eccezioni (PEP 654, dalla 3.11 in poi).** Un gruppo viene stampato come un riquadro: `+ Exception Group Traceback (most recent call last):`, un margine `|` su ogni riga del gruppo e ogni membro sotto un titolo `+-+---------------- 1 ----------------`, `+---------------- 2 ----------------` e così via, ciascuno con il proprio traceback, la propria catena e le proprie note, annidato di un margine in più per ogni livello. Il messaggio del gruppo termina con `(N sub-exceptions)`. Per impostazione predefinita CPython stampa 15 membri e poi `and N more exceptions` (`max_group_width`), e dieci livelli di annidamento e poi `... (max_group_depth is 10)`. Lo strumento legge i gruppi fino a 40 livelli, quindi si legge anche un traceback stampato con limiti più alti.

**Cosa viene prima del traceback.** `Exception in thread <name>:` significa che `threading.excepthook` ha stampato un’eccezione sollevata in un thread, e il programma potrebbe essere andato avanti. `Exception ignored in: ...` significa che `sys.unraisablehook` ha stampato un’eccezione che non poteva propagarsi, ad esempio da un distruttore. Una riga di log come `ERROR:netops.poller:...`, un prompt della shell o `>>> ` prima dell’intestazione non viene letta, e una nota lo segnala.

**Cosa non legge.** I report di IPython e di pytest hanno formati propri, non quello di CPython; lo strumento lo dice e legge solo ciò che è nel formato di CPython (da IPython, la riga dell’eccezione). Un log in cui ogni riga ha un prefisso (un timestamp, un livello) non viene letto. Quando il testo incollato contiene due traceback, viene letto il primo e una nota indica la riga in cui inizia il secondo. Le righe subito dopo una riga di eccezione vengono considerate il suo messaggio o le sue note fino a una riga vuota, un banner, una nuova intestazione o un prompt `>>> `.

## Dove le release differiscono

Osservato nei traceback fissati dai vettori (3.11.17, 3.12.3, 3.13.16 e 3.14.2) e nella documentazione di ogni release.

| Cosa | 3.11 | 3.12 | 3.13 | 3.14 | 3.15 |
| --- | --- | --- | --- | --- | --- |
| `^` sotto l’espressione che fallisce, `~` attorno a un operatore o a un’indicizzazione | sì | sì | sì | sì | non provato |
| `~` sotto una funzione chiamata, `^` sotto le sue parentesi | no: solo `^` | no: solo `^` | sì | sì | non provato |
| Nessun marcatore per un’espressione che occupa l’intera riga | sì | sì | sì, e anche per `x = f(...)` e `return name(...)` | come la 3.13 | non provato |
| Un’espressione su più righe, con `...<N lines>...` | solo la prima riga | solo la prima riga | sì | sì | non provato |
| Un frame per una list, dict o set comprehension (`<listcomp>`) | sì | no (PEP 709) | no | no | non provato |
| Gruppi di eccezioni, note | sì | sì | sì | sì | non provato |
| «Did you forget to import 'sys'?» | no | sì | sì | sì | non provato |
| Uno script con il nome di un modulo della libreria standard | «partially initialized module ... (most likely due to a circular import)» | lo stesso | «(consider renaming '...' since it has the same name as the standard library module ...)» | non provato | non provato |
| Un argomento keyword scritto male | «'max_split' is an invalid keyword argument for split()» | lo stesso | «got an unexpected keyword argument 'max_split'. Did you mean 'maxsplit'?» | come la 3.13 | non provato |
| Il nome del file della shell interattiva | `<stdin>` | `<stdin>` | `<python-input-0>` | `<python-input-N>` negli esempi della documentazione | lo stesso nella documentazione |
| Colori su un terminale | no | no | sì | sì | sì |
| Nuove eccezioni integrate | | | `PythonFinalizationError` | | `ImportCycleError` |

Nelle esecuzioni sono emerse altre due differenze. Sulla 3.11 il suggerimento «Did you mean» di un `NameError` viene stampato dalla visualizzazione dell’interprete stesso ma non da `traceback.print_exc()`; dalla 3.12 lo stampano entrambi. E la build Pyodide della 3.14.2 ha stampato le eccezioni ssl come `_ssl.SSLError` (senza `ValueError` nella catena di `SSLCertVerificationError`), mentre dalla 3.11 alla 3.13 viene stampato `ssl.SSLError`; lo strumento conosce entrambe le grafie. In 26 dei 34 scenari eseguiti su entrambe, il testo della 3.14.2 era identico byte per byte a quello della 3.13.16; gli altri otto differiscono solo nei percorsi, nella profondità a cui si è fermata la ricorsione e in ciò che WebAssembly non può fare (socket, thread e processi). La documentazione dei traceback della 3.15 è uguale a quella della 3.14, a parte la riga della versione; i nuovi messaggi della 3.15 (suggerimenti attraverso attributi interni, nomi Python per i metodi di altri linguaggi, import lazy segnalati al primo uso) sono stati letti ma non eseguiti.

## La classe dell’eccezione

Lo strumento conosce ogni eccezione integrata documentata e le eccezioni della libreria standard che gli script di rete e di sicurezza incontrano più spesso: `socket.gaierror` e `socket.herror`; gli errori di `ssl`; `json.decoder.JSONDecodeError`; `asyncio.exceptions.CancelledError`, `InvalidStateError`, `IncompleteReadError` e `LimitOverrunError`; gli errori di `subprocess`; `urllib.error.URLError`, `HTTPError` e `ContentTooShortError`; e `http.client.HTTPException`, `RemoteDisconnected`, `IncompleteRead`, `BadStatusLine`, `InvalidURL` e `LineTooLong`. Per ciascuna mostra la catena delle classi, a partire dalla base più vicina (ad esempio `ConnectionRefusedError → ConnectionError → OSError → Exception → BaseException`), una frase su cosa significa, la release che l’ha aggiunta quando è successiva alla 3.11 e un link alla sua voce nella documentazione. Le catene sono state stampate dagli interpreti stessi (il `__mro__` di ogni classe sulla 3.11.17, 3.12.3, 3.13.16 e 3.14.2, identico per ogni classe integrata) e corrispondono all’albero della gerarchia nella pagina delle eccezioni di ogni release; `ImportCycleError` viene dalla sola documentazione della 3.15. Gli alias vengono stampati con il nome della classe a cui rimandano: `socket.timeout` e `asyncio.TimeoutError` come `TimeoutError`, `IOError` e `EnvironmentError` come `OSError`, `ssl.CertificateError` come `ssl.SSLCertVerificationError`.

Per una classe sconosciuta, lo strumento dice cosa implica il nome stampato: un nome senza modulo è una classe dello script eseguito (o una classe integrata più recente dello strumento), e un nome con un modulo è documentato da quel modulo.

**Consigli.** Per 36 classi di eccezioni frequenti, e per qualsiasi messaggio su `'NoneType'`, lo strumento aggiunge cosa controllare per prima cosa, ogni volta ricavato dalla documentazione della classe: `ModuleNotFoundError` (un ambiente virtuale vede solo ciò che vi è stato installato), `KeyError` (`dict.get(key, default)` restituisce invece un valore predefinito), `AttributeError` o `TypeError` su `'NoneType'` (una funzione senza `return` restituisce `None`, e `re.match()` e `re.search()` restituiscono `None` quando non trovano corrispondenze), `UnboundLocalError` (un’assegnazione in un punto qualsiasi di una funzione rende il nome locale in tutta la funzione), `ConnectionRefusedError`, `TimeoutError`, `socket.gaierror`, `ssl.SSLCertVerificationError` (verify_message dice perché; `CERT_NONE` accetta praticamente qualsiasi certificato), `subprocess.CalledProcessError`, `asyncio.exceptions.CancelledError` (un `TaskGroup` annulla gli altri task quando uno fallisce), `AssertionError` (`python -O` rimuove le istruzioni `assert`), `SyntaxError` (i marcatori mostrano dove il parser ha rilevato l’errore, che non sempre è il punto da correggere, «is not always the place that needs to be fixed») e altre.

**Dal messaggio.** I suggerimenti di CPython stesso («Did you mean», «Did you forget to import», «consider renaming»); l’errno e il suo testo per `[Errno N] text` e `[WinError N] text` (i numeri sono quelli del sistema operativo e cambiano da un sistema all’altro; un numero negativo su `socket.gaierror` è uno dei codici `EAI_*` di getaddrinfo); e il codec, il byte o il carattere, la posizione e il motivo di un `UnicodeDecodeError` o di un `UnicodeEncodeError`.

## Dove guardare per prima cosa

Per l’eccezione con cui termina il traceback (per un gruppo, per ogni membro foglia, fino a venti):

- sollevata nel tuo codice: quel frame, e i valori che vi sono arrivati;
- sollevata da un’istruzione `raise`: il messaggio dice perché; quando un banner la collega a un’eccezione precedente, la lettura segue la catena anche fino a quella (la causa diretta è l’errore originale; con «during handling», il primo errore è quello precedente e il gestore è fallito dopo);
- sollevata all’interno della libreria standard, di un pacchetto installato o di un modulo frozen: l’ultimo frame del tuo codice prima di essa, che ha passato ciò che la libreria non riusciva a gestire;
- un SyntaxError: la posizione, e il frame che ha importato il file, quando c’è;
- un `RecursionError`: il frame che si ripete; un `KeyboardInterrupt`: il punto in cui il programma era in attesa;
- nessun frame: l’eccezione non è mai stata sollevata di per sé, oppure è stata incollata solo la sua ultima riga.

Il «tuo codice» è qualsiasi frame che non sta nella libreria standard (`.../lib/python3.X/...`, `...\Lib\...`), in un pacchetto installato (`site-packages`, o `dist-packages` di Debian) o in un modulo frozen (`<frozen ...>`); `<stdin>`, `<string>` e la shell interattiva contano come codice tuo. È una lettura, non un verdetto: il frame che solleva l’eccezione non è sempre quello in cui sta l’errore.

## Quale release l’ha stampato

Lo strumento raccoglie gli indizi e li interseca: un percorso che nomina la libreria standard (`/usr/lib/python3.13/`, `python314.zip`, `Python313\`) dà la release esatta; la sola presenza di marcatori indica la 3.11 o successiva; `~` sotto una chiamata o un’espressione su più righe, la 3.13 o successiva; un frame di comprehension, la 3.11 o precedente; un gruppo di eccezioni, la 3.11 o successiva; `<python-input-N>`, la 3.13 o successiva; «Did you forget to import», la 3.12 o successiva; «consider renaming» o «Did you mean '...'?» senza due punti, la 3.13 o successiva; `PythonFinalizationError`, la 3.13 o successiva; `ImportCycleError`, la 3.15. Gli indizi che si contraddicono (un testo incollato che mescola due release, o che è stato modificato) vengono segnalati come tali.

## Che cosa potrebbe essere sensibile

Un traceback è un artefatto di log e contiene di frequente ciò che non andrebbe pubblicato: i percorsi riportano utenti e host, le righe di codice sorgente e i messaggi possono contenere token, password e URL con credenziali, e le variabili locali stampate contengono valori. Lo strumento cerca:

- un nome utente in una home directory: `/home/<name>/`, `/Users/<name>/`, `C:\Users\<name>\`, segnalato una volta per nome con il numero di occorrenze;
- tutto ciò che trova il controllo dei segreti di [Da codice a immagine](/tools/code-to-image), lo strumento del sito: blocchi di chiave privata, intestazioni `Authorization`, ID di chiavi di accesso AWS, JSON Web Token, password negli URL, valori cifrati FortiOS e attributi, membri, chiavi, variabili e assegnazioni che sembrano segreti. Le righe più lunghe di 2000 caratteri non vengono passate a quel controllo (rallenta sulle righe molto lunghe), e una nota lo segnala.

La **copia oscurata** sostituisce ogni nome utente con `<user>` e ogni rilievo con `[redacted]`, ed è ciò che va incollato in una issue o in un ticket. I controlli non sono completi: rileggi la copia prima di pubblicarla.

Per lo stesso motivo la pagina non inserisce mai in un link un traceback così come l’hai incollato (la sua impostazione di condivisione è «never»). Il suo pulsante **Condividi i risultati**, in questa sezione, crea un link solo quando lo premi, e il link contiene dopo il `#` la copia oscurata descritta sopra, mai il testo incollato; quando alcune righe superavano i 2000 caratteri e quindi non sono state controllate, non offre alcun link e spiega perché. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando si apre il link, ma chiunque abbia il link può leggerla: rileggi prima la copia. Un link compila la casella come farebbe un incolla e la pagina la spiega; il valore lascia poi l’indirizzo della pagina, senza alcuna richiesta. La copia è limitata a 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`. Lo strumento non è nemmeno offerto tramite l’API del sito: inviare un traceback a un server per farlo spiegare invierebbe anche i suoi segreti, e un programma che ha un traceback ha già l’oggetto eccezione, che `traceback.TracebackException` della libreria standard legge con esattezza.

## Limiti

Al massimo 200.000 caratteri, 5000 righe e 5000 caratteri per riga; gruppi di eccezioni fino a 40 livelli di annidamento. L’input più lungo dei test ha richiesto circa 0,4 secondi.

## Esempio svolto

Il pulsante Esempio carica il traceback stampato da CPython 3.13.16 per questo script, che interroga un dispositivo di laboratorio su una porta su cui non è in ascolto nulla:

```python
# poll.py: open an SSH session to each device in the inventory; nothing listens on the lab's port here.
import socket  # TCP

INVENTORY = {"r1": "127.0.0.1"}  # device name and management address
SSH_PORT = 2222  # the lab's SSH port


class PollError(Exception):
    """A device could not be polled."""


def open_session(host, port):
    # Connect with a short timeout.
    return socket.create_connection((host, port), timeout=2)


def poll(inventory):
    # Turn a refusal into the application's own error, keeping the original as its cause.
    for name, host in inventory.items():
        try:
            open_session(host, SSH_PORT)
        except ConnectionRefusedError as err:
            err.add_note(f"device {name} ({host})")
            raise PollError(f"{name}: SSH port {SSH_PORT} closed") from err


poll(INVENTORY)
```

Lo strumento legge due eccezioni unite dal banner della «direct cause». La prima, `ConnectionRefusedError: [Errno 111] Connection refused`, ha quattro frame, due in `poll.py` e due in `/usr/lib/python3.13/socket.py`, e una riga dopo la sua riga di eccezione, `device r1 (127.0.0.1)`, che è la nota. La seconda, `PollError: r1: SSH port 2222 closed`, è una classe dello script (nessun modulo nel nome) sollevata da un’istruzione `raise`. Dove guardare per prima cosa: `PollError` è stata sollevata di proposito; la sua causa diretta è il rifiuto, sollevato all’interno della libreria standard, e l’ultimo frame dello script prima di esso è `open_session`, riga 14. Il percorso indica la libreria standard della 3.13, e il `~` sotto ogni funzione chiamata conferma la 3.13 o successiva. Il nome utente in `/home/ana/` viene segnalato, e nella copia oscurata al suo posto c’è `/home/<user>/`.

## Provenienza

Il comportamento è fissato dall’insieme di vettori di test di riferimento (golden vectors) `python-traceback-explainer-golden-2026-10-27b`: 57 vettori di traceback (45 stampati dalla 3.13.16, tra cui una sessione interattiva, un thread, logging, `sys.unraisablehook`, `unittest --locals`, `-X no_debug_ranges`, i colori, `python -m` e un nome di file in stile Windows passato a `compile()`; sei stampati dalle altre release, quattro sulla 3.11.17, uno sulla 3.12.3 e uno sulla 3.14.2; il report di IPython 9.17.1; l’ultima riga da sola di un traceback della 3.13.16; e quattro traceback della 3.13.16 trasformati con a capo CR LF, spazi indivisibili, un rientro e un taglio), otto rifiuti, 26 larghezze di visualizzazione e 14 catene di classi. La struttura attesa di ogni traceback (tipi, messaggi, note, collegamenti, frame, posizioni, se sono stati stampati i marcatori e il tipo di espressione sotto di essi) non è stata prodotta dallo strumento: un harness ha rieseguito ogni script e l’ha scritta a partire dagli oggetti eccezione (`traceback.TracebackException`, `FrameSummary` e il testo per frame di CPython stesso), e su ogni scenario e ogni release la lettura del testo stampato da parte dello strumento ha concordato con essa in tutti i 3971 confronti. Le letture (dove guardare per prima cosa, l’intervallo di release, le note e i rilievi, le copie oscurate) sono state scritte a mano a partire dalle regole descritte sopra. Sei vettori di condivisione fissano cosa contiene un link creato con Condividi i risultati: le copie oscurate dell’Esempio, del vettore dei segreti e del vettore del percorso Windows, e nessun link per una riga saltata dal controllo dei segreti, per un testo incollato che non è un traceback o per una casella vuota. 100.000 testi incollati casuali e mutati non lo hanno mai fatto fallire.

## API

Non è esposto tramite l’API, di proposito: vedi «Che cosa potrebbe essere sensibile» più sopra.

## Fonti

Tutte consultate il 27/10/2026.

- Documentazione di Python 3.15: [traceback](https://docs.python.org/3/library/traceback.html) (confrontata con le edizioni [3.11](https://docs.python.org/3.11/library/traceback.html), [3.12](https://docs.python.org/3.12/library/traceback.html), [3.13](https://docs.python.org/3.13/library/traceback.html) e [3.14](https://docs.python.org/3.14/library/traceback.html)), [Built-in Exceptions](https://docs.python.org/3/builtins/exceptions.html) (con le edizioni dalla 3.11 alla 3.14), [Command line and environment](https://docs.python.org/3/using/cmdline.html), [sys](https://docs.python.org/3/library/sys.html), [threading](https://docs.python.org/3/library/threading.html), [sysconfig](https://docs.python.org/3/library/sysconfig.html), [unittest](https://docs.python.org/3/library/unittest.html), [venv](https://docs.python.org/3/library/venv.html), [codecs](https://docs.python.org/3/library/codecs.html), [re](https://docs.python.org/3/library/re.html), [Built-in Types](https://docs.python.org/3/builtins/stdtypes.html), [socket](https://docs.python.org/3/library/socket.html), [ssl](https://docs.python.org/3/library/ssl.html), [json](https://docs.python.org/3/library/json.html), [asyncio exceptions](https://docs.python.org/3/library/asyncio-exceptions.html), [Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html), [subprocess](https://docs.python.org/3/library/subprocess.html), [urllib.error](https://docs.python.org/3/library/urllib.error.html), [http.client](https://docs.python.org/3/library/http.client.html)
- [The Python Tutorial: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) e [More Control Flow Tools](https://docs.python.org/3/tutorial/controlflow.html); [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) e [Execution model](https://docs.python.org/3/reference/executionmodel.html); [Programming FAQ: UnboundLocalError](https://docs.python.org/3/faq/programming.html)
- What's New in Python [3.11](https://docs.python.org/3/whatsnew/3.11.html), [3.12](https://docs.python.org/3/whatsnew/3.12.html), [3.13](https://docs.python.org/3/whatsnew/3.13.html), [3.14](https://docs.python.org/3/whatsnew/3.14.html), [3.15](https://docs.python.org/3/whatsnew/3.15.html)
- [PEP 657](https://peps.python.org/pep-0657/), [PEP 654](https://peps.python.org/pep-0654/), [PEP 678](https://peps.python.org/pep-0678/), [PEP 3134](https://peps.python.org/pep-3134/), [PEP 409](https://peps.python.org/pep-0409/), [PEP 415](https://peps.python.org/pep-0415/), [PEP 709](https://peps.python.org/pep-0709/), [PEP 3151](https://peps.python.org/pep-3151/)
- [Python Developer's Guide: Status of Python versions](https://devguide.python.org/versions/)
- [Debian Python Policy](https://www.debian.org/doc/packaging-manuals/python-policy/): `dist-packages`
- Unicode Character Database [15.1.0 EastAsianWidth.txt](https://www.unicode.org/Public/15.1.0/ucd/EastAsianWidth.txt) (confrontato con 16.0.0 e 17.0.0) e [UAX #11, East Asian Width](https://www.unicode.org/reports/tr11/)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
