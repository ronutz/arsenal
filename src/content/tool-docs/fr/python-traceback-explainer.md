## Ce que fait l’outil

Collez une trace d’appels (traceback) affichée par CPython : l’outil la décompose. Chaque cadre, avec son fichier, sa ligne, sa fonction et sa ligne de source, et ce que désignent les marqueurs `^` et `~` placés dessous ; chaque exception, avec sa chaîne de classes dans la hiérarchie native, la suggestion de CPython lui-même quand il y en a une, les détails d’errno ou de codec, et une indication tirée de sa documentation ; le lien entre les exceptions (« cause directe » ou « pendant le traitement ») ; les groupes d’exceptions avec leurs membres et leurs notes ; où regarder d’abord ; les versions que désigne le format ; et ce qui, dans le texte collé, peut être sensible, avec une copie caviardée à partager à la place de l’original. Tout s’exécute dans votre navigateur : le texte collé est lu, jamais exécuté, et jamais envoyé nulle part.

L’outil lit les formats de CPython 3.11 à 3.15, les versions que le Python Developer's Guide liste comme prises en charge au 27 octobre 2026 : 3.15 et 3.14 au statut bugfix, 3.13, 3.12 et 3.11 au statut security, avec une fin de vie en octobre 2031, 2030, 2029, 2028 et 2027. La 3.10 a atteint sa fin de vie le 1er octobre 2026. Chaque comportement décrit ci-dessous a été vérifié ce jour-là sur des traces d’appels affichées par CPython 3.11.17, 3.12.3 et 3.13.16, et par CPython 3.14.2 dans le build du [bac à sable Python](/tools/python-playground) du site. Aucun interpréteur 3.15 n’était disponible : rien ici n’a donc été testé sur la 3.15 ; quand la 3.15 est mentionnée, la source est sa documentation. L’[article sur les erreurs et les traces d’appels Python](/learn/python-errors-and-tracebacks) couvre le même terrain avec des exemples.

## Ce que l’outil lit

**L’en-tête et les cadres.** Une trace d’appels commence par `Traceback (most recent call last):` et liste les cadres de l’appel le plus externe au plus interne : le dernier cadre est celui où l’exception a été levée. Chaque cadre est une ligne `  File "<file>", line <n>, in <function>`, suivie de la ligne de source indentée de quatre espaces quand CPython a pu lire le fichier. La fonction est le nom de l’objet code : le niveau supérieur d’un script est donc `<module>`, une lambda `<lambda>` et une expression génératrice `<genexpr>`. Le numéro de ligne peut valoir `None`.

**Les marqueurs (PEP 657, 3.11 et suivantes).** Sous la ligne de source d’un cadre, CPython affiche `^` sous l’expression qu’exécutait le cadre. Quand l’expression comporte plusieurs parties, `~` marque les parties et `^` l’opération : l’opérateur d’une opération binaire (`a / b` donne `~^~`), les crochets d’une indexation (`cfg["hostname"]` donne `~~~^^^^^^^^^^^^`) et, depuis la 3.13, les parenthèses d’un appel (`int(port)` donne `~~~^^^^^^`). L’outil retraduit les marqueurs en texte : l’expression, la partie sous `^` et les parties sous `~`. CPython place les marqueurs par colonne d’affichage, en comptant un caractère large ou pleine chasse (East Asian Width W ou F) pour deux colonnes, et l’outil fait de même, avec la table de largeurs d’Unicode 15.1.0 qu’utilise CPython 3.13. Aucun marqueur n’est affiché quand CPython a été lancé avec `-X no_debug_ranges` ou `PYTHONNODEBUGRANGES`, quand l’expression occupe toute la ligne, et, depuis la 3.13, également pour `x = f(...)` et `return name(...)` quand l’appel constitue toute la valeur (la 3.12 marque `json.loads(body)` dans `data = json.loads(body)` ; la 3.13 ne le fait pas).

**Expressions sur plusieurs lignes (3.13 et suivantes).** Un cadre peut montrer une expression qui s’étend sur plusieurs lignes de source, avec des marqueurs sous chacune et `...<N lines>...` pour les lignes omises. Les versions 3.11 et 3.12 ne montrent que la première ligne.

**Cadres répétés.** Après trois cadres identiques (même fichier, même ligne, même fonction), CPython affiche `[Previous line repeated N more times]` au lieu des suivants. L’outil les compte sur le cadre du dessus.

**Variables locales.** `unittest --locals` et `traceback.TracebackException(..., capture_locals=True)` affichent des lignes `name = value` sous un cadre. L’outil les liste et avertit que les valeurs peuvent contenir des secrets.

**La ligne d’exception.** `<type>: <message>`, ou `<type>` seul quand le message est vide. CPython écrit le type sous la forme `module.qualname`, sauf pour les classes natives et les classes du script exécuté (`__main__`), qu’il écrit sans module. Ainsi, `ValueError` est natif, `json.decoder.JSONDecodeError` vient de la bibliothèque standard, et `PollError` a très probablement été défini dans le script.

**Notes et messages sur plusieurs lignes.** Les notes ajoutées avec `add_note()` (PEP 678, 3.11 et suivantes) sont affichées juste après le message de l’exception, dans l’ordre de leur ajout, chacune sur une nouvelle ligne (« immediately after the exception message, in the order in which they were added, with each note starting on a new line »). Un message qui contient des sauts de ligne s’affiche de la même façon : le texte seul ne permet donc pas de distinguer la suite d’un message d’une note ; l’outil montre ces lignes ensemble et le signale.

**L’emplacement d’une SyntaxError.** Quand du code ne compile pas, CPython affiche `  File "<file>", line <n>` sans fonction, la ligne fautive et des marqueurs `^`, puis `SyntaxError: <message>`. Si c’est le script lui-même qui n’a pas compilé, rien n’a été exécuté et il n’y a aucun en-tête `Traceback` ; si c’est un module importé, l’emplacement suit les cadres du code qui l’a importé. Ces marqueurs comptent des caractères, pas des colonnes d’affichage.

**Chaînes (PEP 3134).** Quand une exception est levée pendant le traitement d’une autre, CPython affiche les deux, la plus ancienne d’abord, reliées par une bannière :

- `The above exception was the direct cause of the following exception:` correspond à `raise new from original` : une traduction délibérée, et l’exception antérieure est le `__cause__` de la nouvelle.
- `During handling of the above exception, another exception occurred:` signifie que le gestionnaire de l’exception antérieure en a levé une nouvelle : le gestionnaire lui-même a échoué, et l’exception antérieure est devenue le `__context__` de la nouvelle.
- `raise new from None` affiche la nouvelle exception seule (PEP 409, PEP 415).

Une exception créée mais jamais levée, comme la cause dans `raise ValueError(...) from KeyError(...)`, est affichée sans en-tête ni cadre.

**Groupes d’exceptions (PEP 654, 3.11 et suivantes).** Un groupe s’affiche sous forme de boîte : `+ Exception Group Traceback (most recent call last):`, une marge `|` sur chaque ligne du groupe, et chaque membre sous un titre `+-+---------------- 1 ----------------`, `+---------------- 2 ----------------` et ainsi de suite, chacun avec sa propre trace d’appels, sa chaîne et ses notes, imbriqué d’une marge de plus par niveau. Le message du groupe se termine par `(N sub-exceptions)`. Par défaut, CPython affiche 15 membres puis `and N more exceptions` (`max_group_width`), et dix niveaux d’imbrication puis `... (max_group_depth is 10)`. L’outil lit les groupes jusqu’à 40 niveaux : une trace d’appels affichée avec des limites plus élevées se lit donc aussi.

**Ce qui précède la trace d’appels.** `Exception in thread <name>:` signifie que `threading.excepthook` a affiché une exception levée dans un thread, et que le programme a peut-être continué. `Exception ignored in: ...` signifie que `sys.unraisablehook` a affiché une exception qui ne pouvait pas se propager, depuis un destructeur par exemple. Une ligne de journal comme `ERROR:netops.poller:...`, une invite de shell ou `>>> ` avant l’en-tête n’est pas lue, et une remarque le signale.

**Ce que l’outil ne lit pas.** Les rapports d’IPython et de pytest sont leurs propres formats, pas celui de CPython ; l’outil le signale et ne lit que ce qui est au format de CPython (pour IPython, la ligne d’exception). Un journal dont chaque ligne porte un préfixe (un horodatage, un niveau) n’est pas lu. Quand le texte collé contient deux traces d’appels, la première est lue et une remarque indique la ligne où commence la seconde. Les lignes qui suivent immédiatement une ligne d’exception sont prises comme son message ou ses notes, jusqu’à une ligne vide, une bannière, un nouvel en-tête ou une invite `>>> `.

## Différences entre versions

Observées dans les traces d’appels que fixent les vecteurs (3.11.17, 3.12.3, 3.13.16 et 3.14.2) et dans la documentation de chaque version.

| Élément | 3.11 | 3.12 | 3.13 | 3.14 | 3.15 |
| --- | --- | --- | --- | --- | --- |
| `^` sous l’expression en échec, `~` autour d’un opérateur ou d’une indexation | oui | oui | oui | oui | non testé |
| `~` sous une fonction appelée, `^` sous ses parenthèses | non : `^` seul | non : `^` seul | oui | oui | non testé |
| Aucun marqueur pour une expression qui occupe toute la ligne | oui | oui | oui, et aussi pour `x = f(...)` et `return name(...)` | comme la 3.13 | non testé |
| Une expression sur plusieurs lignes, avec `...<N lines>...` | première ligne seulement | première ligne seulement | oui | oui | non testé |
| Un cadre pour une compréhension de liste, de dict ou d’ensemble (`<listcomp>`) | oui | non (PEP 709) | non | non | non testé |
| Groupes d’exceptions, notes | oui | oui | oui | oui | non testé |
| « Did you forget to import 'sys'? » | non | oui | oui | oui | non testé |
| Un script qui porte le nom d’un module de la bibliothèque standard | « partially initialized module ... (most likely due to a circular import) » | idem | « (consider renaming '...' since it has the same name as the standard library module ...) » | non testé | non testé |
| Un argument nommé mal orthographié | « 'max_split' is an invalid keyword argument for split() » | idem | « got an unexpected keyword argument 'max_split'. Did you mean 'maxsplit'? » | comme la 3.13 | non testé |
| Le nom de fichier de l’interpréteur interactif | `<stdin>` | `<stdin>` | `<python-input-0>` | `<python-input-N>` dans les exemples de la documentation | idem dans la documentation |
| Couleur dans un terminal | non | non | oui | oui | oui |
| Nouvelles exceptions natives | | | `PythonFinalizationError` | | `ImportCycleError` |

Les exécutions ont révélé deux autres différences. Sur la 3.11, la suggestion « Did you mean » d’une `NameError` est affichée par l’affichage propre de l’interpréteur, mais pas par `traceback.print_exc()` ; depuis la 3.12, les deux l’affichent. Et le build Pyodide de la 3.14.2 a affiché les exceptions ssl sous la forme `_ssl.SSLError` (sans `ValueError` dans la chaîne de `SSLCertVerificationError`), là où les versions 3.11 à 3.13 affichent `ssl.SSLError` ; l’outil connaît les deux graphies. Dans 26 des 34 scénarios exécutés sur les deux, le texte de la 3.14.2 était identique octet pour octet à celui de la 3.13.16 ; les huit autres ne diffèrent que par les chemins, par la profondeur à laquelle la récursion s’est arrêtée, et par ce que WebAssembly ne sait pas faire (sockets, threads et processus). La documentation des traces d’appels de la 3.15 est identique à celle de la 3.14, hormis sa ligne de version ; les nouveaux messages de la 3.15 (suggestions à travers des attributs internes, noms Python des méthodes d’autres langages, imports paresseux signalés à la première utilisation) ont été lus mais pas exécutés.

## La classe de l’exception

L’outil connaît toutes les exceptions natives documentées et les exceptions de la bibliothèque standard que rencontrent le plus souvent les scripts réseau et sécurité : `socket.gaierror` et `socket.herror` ; les erreurs `ssl` ; `json.decoder.JSONDecodeError` ; `asyncio.exceptions.CancelledError`, `InvalidStateError`, `IncompleteReadError` et `LimitOverrunError` ; les erreurs `subprocess` ; `urllib.error.URLError`, `HTTPError` et `ContentTooShortError` ; et `http.client.HTTPException`, `RemoteDisconnected`, `IncompleteRead`, `BadStatusLine`, `InvalidURL` et `LineTooLong`. Pour chacune, il affiche la chaîne des classes, la base la plus proche d’abord (par exemple `ConnectionRefusedError → ConnectionError → OSError → Exception → BaseException`), une phrase sur sa signification, la version qui l’a ajoutée quand elle est postérieure à la 3.11, et un lien vers son entrée dans la documentation. Les chaînes ont été affichées par les interpréteurs eux-mêmes (le `__mro__` de chaque classe sur 3.11.17, 3.12.3, 3.13.16 et 3.14.2, identique pour toutes les exceptions natives) et correspondent à l’arbre de la hiérarchie de la page des exceptions de chaque version ; `ImportCycleError` provient de la seule documentation de la 3.15. Les alias s’affichent sous le nom de leur cible : `socket.timeout` et `asyncio.TimeoutError` comme `TimeoutError`, `IOError` et `EnvironmentError` comme `OSError`, `ssl.CertificateError` comme `ssl.SSLCertVerificationError`.

Pour une classe inconnue, l’outil indique ce qu’implique le nom affiché : un nom sans module désigne une classe du script exécuté (ou une exception native plus récente que l’outil), et un nom avec module est documenté par ce module.

**Indications.** Pour 36 classes d’exceptions fréquentes, et pour tout message qui mentionne `'NoneType'`, l’outil ajoute ce qu’il faut vérifier d’abord, chaque fois d’après la documentation de la classe : `ModuleNotFoundError` (un environnement virtuel ne voit que ce qui y a été installé), `KeyError` (`dict.get(key, default)` renvoie une valeur par défaut à la place), `AttributeError` ou `TypeError` sur `'NoneType'` (une fonction sans `return` renvoie `None`, et `re.match()` et `re.search()` renvoient `None` quand rien ne correspond), `UnboundLocalError` (une affectation n’importe où dans une fonction rend le nom local dans toute la fonction), `ConnectionRefusedError`, `TimeoutError`, `socket.gaierror`, `ssl.SSLCertVerificationError` (verify_message dit pourquoi ; `CERT_NONE` accepte à peu près n’importe quel certificat), `subprocess.CalledProcessError`, `asyncio.exceptions.CancelledError` (un `TaskGroup` annule les autres tâches quand l’une d’elles échoue), `AssertionError` (`python -O` supprime les instructions `assert`), `SyntaxError` (les marqueurs montrent où l’analyseur syntaxique a détecté l’erreur, ce qui n’est pas toujours l’endroit à corriger : « is not always the place that needs to be fixed »), et d’autres.

**D’après le message.** Les suggestions de CPython lui-même (« Did you mean », « Did you forget to import », « consider renaming ») ; l’errno et son texte pour `[Errno N] text` et `[WinError N] text` (les numéros sont ceux du système d’exploitation et diffèrent d’un système à l’autre ; un nombre négatif sur `socket.gaierror` est l’un des codes `EAI_*` de getaddrinfo) ; et le codec, l’octet ou le caractère, la position et la raison d’une `UnicodeDecodeError` ou d’une `UnicodeEncodeError`.

## Où regarder d’abord

Pour l’exception qui termine la trace d’appels (pour un groupe, pour chaque membre feuille, jusqu’à vingt) :

- levée dans votre propre code : ce cadre, et les valeurs qui l’ont atteint ;
- levée par une instruction `raise` : le message dit pourquoi ; quand une bannière la relie à une exception antérieure, la lecture suit aussi la chaîne jusqu’à celle-ci (la cause directe est l’échec d’origine ; avec « during handling », le premier échec est l’exception antérieure, et le gestionnaire a échoué après elle) ;
- levée dans la bibliothèque standard, dans un paquet installé ou dans un module gelé : le dernier cadre de votre propre code qui la précède, qui a transmis ce que la bibliothèque n’a pas pu traiter ;
- une SyntaxError : l’emplacement, et le cadre qui a importé le fichier quand il y en a un ;
- une `RecursionError` : le cadre qui se répète ; une `KeyboardInterrupt` : l’endroit où le programme attendait ;
- aucun cadre : l’exception n’a jamais été levée elle-même, ou seule sa dernière ligne a été collée.

« Votre propre code » désigne tout cadre qui ne se trouve ni dans la bibliothèque standard (`.../lib/python3.X/...`, `...\Lib\...`), ni dans un paquet installé (`site-packages`, ou `dist-packages` chez Debian), ni dans un module gelé (`<frozen ...>`) ; `<stdin>`, `<string>` et l’interpréteur interactif comptent comme votre code. C’est une lecture, pas un verdict : le cadre qui lève l’exception n’est pas toujours celui où se trouve l’erreur.

## La version qui l’a affichée

L’outil réunit des indices et en fait l’intersection : un chemin qui nomme la bibliothèque standard (`/usr/lib/python3.13/`, `python314.zip`, `Python313\`) donne la version exacte ; la simple présence de marqueurs signifie 3.11 ou ultérieure ; un `~` sous un appel ou une expression sur plusieurs lignes, 3.13 ou ultérieure ; un cadre de compréhension, 3.11 ou antérieure ; un groupe d’exceptions, 3.11 ou ultérieure ; `<python-input-N>`, 3.13 ou ultérieure ; « Did you forget to import », 3.12 ou ultérieure ; « consider renaming », ou « Did you mean '...'? » sans deux-points, 3.13 ou ultérieure ; `PythonFinalizationError`, 3.13 ou ultérieure ; `ImportCycleError`, 3.15. Des indices qui se contredisent (un texte collé qui mélange deux versions, ou qui a été modifié) sont signalés comme tels.

## Ce qui peut être sensible

Une trace d’appels est un artefact de journalisation et contient couramment ce qui ne devrait pas être publié : les chemins nomment des utilisateurs et des hôtes, les lignes de source et les messages peuvent contenir des jetons, des mots de passe et des URL avec des identifiants, et les variables locales affichées contiennent des valeurs. L’outil recherche :

- un nom d’utilisateur dans un répertoire personnel : `/home/<name>/`, `/Users/<name>/`, `C:\Users\<name>\`, signalé une fois par nom, avec un décompte ;
- tout ce que trouve le contrôle des secrets de l’outil [Code en image](/tools/code-to-image) du site : blocs de clé privée, en-têtes `Authorization`, ID de clé d’accès AWS, JSON Web Tokens, mots de passe dans des URL, valeurs chiffrées FortiOS, et attributs, membres, clés, variables et affectations dont le nom évoque un secret. Les lignes de plus de 2000 caractères ne sont pas soumises à ce contrôle (il ralentit sur les lignes très longues), et une remarque le signale.

La **copie caviardée** remplace chaque nom d’utilisateur par `<user>` et chaque constat par `[redacted]` : c’est elle qu’il faut coller dans une issue ou un ticket. Les contrôles ne sont pas exhaustifs : relisez la copie avant de la publier.

Pour la même raison, la page ne place jamais une trace d’appels dans un lien telle que vous l’avez collée (son réglage de partage est « never »). Son bouton **Partager les résultats**, dans cette section, crée un lien seulement quand vous appuyez dessus, et ce lien contient, après le `#`, la copie caviardée ci-dessus, jamais le texte collé ; quand certaines lignes dépassaient 2000 caractères et n’ont donc pas été contrôlées, il ne propose aucun lien et en donne la raison. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien, mais quiconque possède le lien peut la lire. Relisez donc d’abord la copie. Un lien remplit la zone comme un collage et la page l’explique ; la valeur quitte ensuite l’adresse de la page, sans aucune requête. La copie est limitée à 16 384 caractères, la limite que le site applique à toute valeur placée après le `#`. L’outil n’est pas non plus proposé par l’API du site : envoyer une trace d’appels à un serveur pour la faire expliquer enverrait ses secrets avec elle, et un programme qui détient une trace d’appels dispose déjà de l’objet exception, que `traceback.TracebackException` de la bibliothèque standard lit exactement.

## Limites

Au plus 200 000 caractères, 5000 lignes et 5000 caractères par ligne ; groupes d’exceptions jusqu’à 40 niveaux d’imbrication. L’entrée la plus longue des tests a pris environ 0,4 seconde.

## Exemple commenté

Le bouton Exemple charge la trace d’appels que CPython 3.13.16 a affichée pour ce script, qui interroge un équipement de lab sur un port où rien n’écoute :

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

L’outil lit deux exceptions reliées par la bannière « direct cause ». La première, `ConnectionRefusedError: [Errno 111] Connection refused`, a quatre cadres : deux dans `poll.py` et deux dans `/usr/lib/python3.13/socket.py`, ainsi qu’une ligne après sa ligne d’exception, `device r1 (127.0.0.1)`, qui est la note. La seconde, `PollError: r1: SSH port 2222 closed`, est une classe du script (pas de module dans son nom) levée par une instruction `raise`. Où regarder d’abord : `PollError` a été levée délibérément ; sa cause directe est le refus, levé dans la bibliothèque standard, et le dernier cadre du script avant lui est `open_session`, ligne 14. Le chemin désigne la bibliothèque standard de la 3.13, et le `~` sous chaque fonction appelée confirme la 3.13 ou une version ultérieure. Le nom d’utilisateur de `/home/ana/` est signalé, et la copie caviardée contient `/home/<user>/` à sa place.

## Provenance

Le comportement est fixé par l’ensemble de vecteurs de référence (golden vectors) `python-traceback-explainer-golden-2026-10-27b` : 57 vecteurs de traces d’appels (45 affichées par la 3.13.16, dont une session interactive, un thread, logging, `sys.unraisablehook`, `unittest --locals`, `-X no_debug_ranges`, la couleur, `python -m` et un nom de fichier de style Windows transmis à `compile()` ; six affichées par les autres versions, quatre sur la 3.11.17, une sur la 3.12.3 et une sur la 3.14.2 ; le rapport d’IPython 9.17.1 ; la dernière ligne seule d’une trace d’appels 3.13.16 ; et quatre traces d’appels 3.13.16 transformées avec des sauts de ligne CR LF, des espaces insécables, une indentation et une coupure), huit refus, 26 largeurs d’affichage et 14 chaînes de classes. La structure attendue de chaque trace d’appels (types, messages, notes, liens, cadres, positions, présence ou non de marqueurs et type d’expression placé dessous) n’a pas été produite par l’outil : un harnais a réexécuté chaque script et l’a écrite à partir des objets exception (`traceback.TracebackException`, `FrameSummary` et le texte par cadre de CPython lui-même), et, pour chaque scénario et chaque version, la lecture du texte affiché par l’outil a concordé avec elle dans les 3971 comparaisons. Les lectures (où regarder d’abord, plage de versions, remarques et constats, copies caviardées) ont été écrites à la main à partir des règles ci-dessus. Six vecteurs de partage fixent ce que contient un lien Partager les résultats : les copies caviardées de l’exemple, du vecteur des secrets et du vecteur de chemin Windows, et l’absence de lien pour une ligne que le contrôle des secrets a ignorée, pour un texte collé qui n’est pas une trace d’appels ou pour une zone vide. 100 000 textes collés aléatoires ou mutés ne l’ont jamais fait échouer.

## API

Non exposé par l’API, délibérément : voir « Ce qui peut être sensible » ci-dessus.

## Sources

Toutes consultées le 27/10/2026.

- Documentation de Python 3.15 : [traceback](https://docs.python.org/3/library/traceback.html) (avec les éditions [3.11](https://docs.python.org/3.11/library/traceback.html), [3.12](https://docs.python.org/3.12/library/traceback.html), [3.13](https://docs.python.org/3.13/library/traceback.html) et [3.14](https://docs.python.org/3.14/library/traceback.html), comparées), [Built-in Exceptions](https://docs.python.org/3/builtins/exceptions.html) (avec les éditions 3.11 à 3.14), [Command line and environment](https://docs.python.org/3/using/cmdline.html), [sys](https://docs.python.org/3/library/sys.html), [threading](https://docs.python.org/3/library/threading.html), [sysconfig](https://docs.python.org/3/library/sysconfig.html), [unittest](https://docs.python.org/3/library/unittest.html), [venv](https://docs.python.org/3/library/venv.html), [codecs](https://docs.python.org/3/library/codecs.html), [re](https://docs.python.org/3/library/re.html), [Built-in Types](https://docs.python.org/3/builtins/stdtypes.html), [socket](https://docs.python.org/3/library/socket.html), [ssl](https://docs.python.org/3/library/ssl.html), [json](https://docs.python.org/3/library/json.html), [asyncio exceptions](https://docs.python.org/3/library/asyncio-exceptions.html), [Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html), [subprocess](https://docs.python.org/3/library/subprocess.html), [urllib.error](https://docs.python.org/3/library/urllib.error.html), [http.client](https://docs.python.org/3/library/http.client.html)
- [The Python Tutorial: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) et [More Control Flow Tools](https://docs.python.org/3/tutorial/controlflow.html) ; [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) et [Execution model](https://docs.python.org/3/reference/executionmodel.html) ; [Programming FAQ: UnboundLocalError](https://docs.python.org/3/faq/programming.html)
- What's New in Python [3.11](https://docs.python.org/3/whatsnew/3.11.html), [3.12](https://docs.python.org/3/whatsnew/3.12.html), [3.13](https://docs.python.org/3/whatsnew/3.13.html), [3.14](https://docs.python.org/3/whatsnew/3.14.html), [3.15](https://docs.python.org/3/whatsnew/3.15.html)
- [PEP 657](https://peps.python.org/pep-0657/), [PEP 654](https://peps.python.org/pep-0654/), [PEP 678](https://peps.python.org/pep-0678/), [PEP 3134](https://peps.python.org/pep-3134/), [PEP 409](https://peps.python.org/pep-0409/), [PEP 415](https://peps.python.org/pep-0415/), [PEP 709](https://peps.python.org/pep-0709/), [PEP 3151](https://peps.python.org/pep-3151/)
- [Python Developer's Guide: Status of Python versions](https://devguide.python.org/versions/)
- [Debian Python Policy](https://www.debian.org/doc/packaging-manuals/python-policy/) : `dist-packages`
- Unicode Character Database [15.1.0 EastAsianWidth.txt](https://www.unicode.org/Public/15.1.0/ucd/EastAsianWidth.txt) (versions 16.0.0 et 17.0.0 comparées) et [UAX #11, East Asian Width](https://www.unicode.org/reports/tr11/)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
