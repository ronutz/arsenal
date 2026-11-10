## Ce que fait l’outil

Collez le nom de fichier d’un wheel (`.whl`) ou d’une distribution source (`.tar.gz`), ou une URL qui se termine par l’un d’eux, et l’outil le décompose : le nom du projet et sa forme normalisée, la version et sa forme normale PEP 440, l’étiquette de build facultative, et chaque étiquette python, ABI et de plateforme, avec ce que chacune exige. Les ensembles d’étiquettes compressés sont développés, et chaque combinaison indique les interpréteurs et les systèmes qu’elle couvre. Ouvrez **Vérifier pour un interpréteur**, décrivez-en un (CPython ou PyPy, la version de Python, un build free-threaded (sans GIL) ou non, Linux avec glibc ou musl, macOS ou Windows, la version de la bibliothèque C ou de macOS, l’architecture), et l’outil indique si le wheel s’y installe et laquelle de ses étiquettes l’emporte.

Le mode **Versions** lit plutôt une liste de versions : chacune est analysée et normalisée, avec ce que la normalisation a modifié ; la liste est triée dans l’ordre PEP 440, les versions égales étant signalées ; et, quand vous ajoutez un ensemble de spécificateurs comme `>= 1.0, != 1.3.*, < 2`, l’outil indique quelles versions sont dans la plage et lesquelles un installateur retient par défaut. Tout s’exécute dans votre navigateur ; une URL est seulement réduite à son dernier segment, et rien n’est téléchargé. L’outil se place à côté de l’[analyseur de pyproject.toml](/tools/pyproject-toml-explainer), qui lit le fichier qui produit ces noms, et du [bac à sable Python](/tools/python-playground).

## Lecture d’un nom de fichier

Le format de distribution binaire donne le nom de fichier d’un wheel sous la forme `{distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl` : un nom valide comporte donc quatre ou cinq traits d’union. Les règles appliquées ici :

- **Le nom** est un nom de projet valide (lettres ASCII, chiffres, `.`, `_` et `-`, commençant et se terminant par une lettre ou un chiffre), comparé sous sa forme normalisée : en minuscules, chaque suite de `-`, `_` et `.` étant remplacée par un seul `-`. Dans un nom de fichier, les outils l’écrivent en minuscules, chaque suite de ce type étant remplacée par un seul `_` ; les outils qui lisent les wheels doivent tout de même accepter le `.` et les majuscules des fichiers plus anciens, qui sont donc acceptés avec un avertissement. Un double tiret bas est refusé, comme le refuse pip.
- **La version** est une version PEP 440. Les outils l’écrivent sous forme normalisée ; un nom dont la version ne l’est pas est accepté avec un avertissement qui donne la forme normale.
- **L’étiquette de build** doit commencer par un chiffre. Elle ne sert qu’à départager des wheels identiques en tout le reste, en triant d’abord sur ses chiffres de tête, lus comme un nombre, puis sur le reste, lu comme du texte. Elle ne fait pas partie de la version, et la spécification indique qu’une publication à laquelle on doit pouvoir faire référence de l’extérieur, comme un correctif de sécurité, devrait recevoir une nouvelle version plutôt qu’un numéro de build.
- **Une distribution source** s’écrit `{name}-{version}.tar.gz`, avec exactement un trait d’union. Un nom qui en comporte davantage est lu comme le lit pip (la version suit le dernier trait d’union), avec un avertissement ; un `.zip` est lu comme l’ancienne forme, lui aussi avec un avertissement.

## Les étiquettes

- **Étiquette python** : un code d’implémentation (`py` pour toute implémentation, `cp` CPython, `pp` PyPy, `ip` IronPython, `jy` Jython) suivi de la version sans son point (`cp313` correspond à CPython 3.13). Une étiquette réduite à la version majeure, comme `py3`, n’est pas un raccourci de `py30` : elle signifie que le mainteneur du paquet a publié un wheel conçu pour fonctionner sur les différentes versions 3.x.
- **Étiquette ABI** : `none` (aucun module d’extension lié à une ABI de Python), `abi3` (l’ABI stable de CPython, pour les builds qui ne sont pas free-threaded), `abi3t` (l’ABI stable des builds free-threaded, PEP 803, à partir de Python 3.15), l’étiquette propre à CPython `cpXY` avec ses indicateurs (`d` débogage, `t` free-threaded, et les anciens `m` et `u`), ou l’étiquette `pypyXY_ppNN` de PyPy.
- **Étiquette de plateforme** : `any` ; `win_amd64`, `win32`, `win_arm64` ; `manylinux_x_y_arch` (glibc x.y ou ultérieure, PEP 600) et ses anciens noms `manylinux1` (glibc 2.5), `manylinux2010` (2.12) et `manylinux2014` (2.17) ; `musllinux_x_y_arch` (musl x.y ou ultérieure, PEP 656 ; packaging ne liste que la même version majeure de musl) ; `macosx_x_y_arch` (macOS x.y ou ultérieur ; `10_y` pour macOS 10, `x_0` à partir de macOS 11, avec x de 10 à 15 ou 26 et au-delà), y compris les noms multi-architectures comme `universal2` (arm64 et x86_64) ; `ios_x_y_arch_sdk` ; `android_apilevel_abi` ; `pyemscripten_YEAR_PATCH_wasm32` (PEP 783, acceptée) ; et le simple `linux_arch`, que la spécification juge insuffisant pour une distribution publique. Tout le reste est lu comme la valeur `sysconfig.get_platform()` d’un autre système.
- **Ensembles d’étiquettes compressés** : chaque étiquette peut être une collection triée d’éléments séparés par des `.`, et le wheel représente alors toutes les combinaisons. `py2.py3-none-any` donne deux combinaisons ; jusqu’à 400 sont expliquées une par une, et les autres sont comptées.

## Quels interpréteurs et quels systèmes

La spécification des étiquettes de compatibilité de plateforme indique qu’un installateur tient une liste des étiquettes (python, ABI, plateforme) qu’il prend en charge, classées par ordre de préférence, et installe un wheel quand l’une des étiquettes du wheel figure dans cette liste. Cet outil construit cette liste comme packaging 26.3 la construit pour l’interpréteur et le système que vous décrivez, compare à cette liste les étiquettes développées du wheel, et donne la meilleure correspondance et sa position. Pour CPython 3.13 sur glibc 2.39, en x86-64, la liste compte 1147 étiquettes, le même nombre que celui qu’a affiché `python -m pip debug --verbose` dans le conteneur où cet outil a été construit. pip 26.2 intègre encore packaging 26.2, et packaging 26.3 a changé une seule chose dans l’ordre : il préfère l’étiquette de plateforme simple `linux_*` aux étiquettes manylinux et musllinux, si bien que, dans chaque groupe, l’étiquette `linux_x86_64` arrive désormais en premier au lieu d’arriver en dernier. La liste de pip contient donc les mêmes étiquettes, dans presque le même ordre : seule l’étiquette simple `linux_*` de chaque groupe se déplace, et le fait qu’un wheel s’installe ou non ne change jamais.

Chaque combinaison reçoit aussi une lecture en clair de sa règle d’interpréteur : `py3-none` désigne n’importe quel Python 3 ; `cp311-abi3`, CPython 3.11 ou ultérieur, pour les builds qui ne sont pas free-threaded ; `cp313-cp313t`, uniquement le build free-threaded de CPython 3.13. Certaines combinaisons sont des noms valides qu’aucun installateur ne liste jamais, et l’outil le dit, avec la raison : `abi3` avec une étiquette python autre que `cp`, une ABI compilée avec la plateforme `any`, une ABI qui désigne une autre version que l’étiquette python, ou une étiquette `cp3` avec une ABI.

Ce que la vérification de cible ne modélise pas : les cibles iOS, Android et Emscripten, les implémentations autres que CPython et PyPy (PyPy est considéré comme la version 7.3, ABI `pp73`), et les règles par distribution qu’un installateur peut ajouter par-dessus, comme une incompatibilité de `Requires-Python` ou un index qui masque un fichier. Les versions de Python proposées sont les branches prises en charge selon le guide des développeurs de Python : de 3.11 à 3.15.

## Constats

| Code | Gravité | Signification |
|---|---|---|
| `not-a-distribution` | erreur | Le nom ne se termine pas par `.whl`, `.tar.gz` ou `.zip` |
| `suffix-case` | erreur | Le suffixe n’est pas en minuscules |
| `wrong-part-count` | erreur | Un nom de wheel qui n’a pas quatre ou cinq traits d’union |
| `sdist-no-hyphen` | erreur | Un nom de distribution source sans trait d’union |
| `empty-name`, `bad-name` | erreur | Pas de nom, ou pas un nom de projet valide |
| `double-underscore` | erreur | `__` dans la partie nom |
| `bad-version` | erreur | Pas une version PEP 440 |
| `bad-build-tag` | erreur | Une étiquette de build qui ne commence pas par un chiffre |
| `empty-tag` | erreur | Une étiquette vide, ou un élément vide d’un ensemble compressé |
| `python-tag-not-identifier` | erreur | Une étiquette python qui commence par un chiffre (pip refuse le nom) |
| `name-not-escaped` | avertissement | Accepté, mais ce n’est pas la forme échappée qu’écrivent les outils actuels |
| `version-not-normalized` | avertissement | La version n’est pas sous forme normale |
| `build-tag-used` | avertissement | Une étiquette de build est présente |
| `tags-not-sorted`, `tags-uppercase` | avertissement | Un ensemble compressé dans le désordre, ou des majuscules dans une étiquette |
| `impossible-combination` | avertissement | Une combinaison qu’aucun installateur ne liste |
| `unknown-python-tag` | avertissement | Une étiquette python qui n’est pas formée de lettres suivies d’une version |
| `linux-simple-tag` | avertissement | `linux_arch` au lieu de manylinux ou musllinux |
| `legacy-arch-mismatch` | avertissement | Un ancien nom manylinux sur une architecture pour laquelle il n’a jamais été défini |
| `macos-version-shape`, `android-abi`, `ios-multiarch` | avertissement | Une étiquette de plateforme hors des formes définies pour sa famille |
| `sdist-zip`, `sdist-hyphens` | avertissement | Un nom de distribution source ancien ou non standard |
| `local-version` | remarque | Une étiquette de version locale (PyPI n’accepte pas les versions locales) |
| `legacy-manylinux` | remarque | Un ancien nom manylinux et l’étiquette qu’il désigne |
| `unknown-platform` | remarque | Une plateforme hors des familles décrites |
| `too-many-tags` | remarque | Plus de 400 combinaisons ; les autres sont comptées |

## Versions PEP 440

Une version s’écrit `[N!]N(.N)*[{a|b|rc}N][.postN][.devN][+local]`. L’outil analyse les formes que la spécification accepte et donne la forme normale, en indiquant ce qui a changé : espaces et `v` initial supprimés, majuscules mises en minuscules, zéros initiaux supprimés, `alpha`, `beta`, `c`, `pre` et `preview` écrits `a`, `b` et `rc`, séparateurs supprimés ou réduits à un point, numéro de préversion, de post-version ou de version de développement manquant pris comme 0, `-1` après le segment release lu comme `.post1`, `-` et `_` d’une étiquette locale écrits `.`, et époque `0!` supprimée. Une époque non nulle est affichée ; la spécification la déconseille.

Le tri suit la spécification : les numéros du segment release se comparent comme des nombres, les numéros manquants comptant pour zéro, si bien que `1.0`, `1.0.0` et `1` sont égaux ; au sein d’une même release, les versions de développement viennent d’abord, puis `a`, `b` et `rc`, puis la version finale, puis les post-versions ; une version dotée d’une étiquette locale se trie après la même version sans étiquette locale.

## Ensembles de spécificateurs

Chaque clause est expliquée en toutes lettres : `~=2.2` équivaut à `>=2.2, ==2.*` ; `==1.1.*` est une correspondance de préfixe ; `==1.1` ignore l’étiquette locale d’un candidat et complète les numéros du segment release par des zéros ; `<V` exclut les préversions de V, sauf si V en est une ; `>V` exclut les post-versions de V, sauf si V en est une, ainsi que les versions locales de V ; `===` compare le texte (les lettres sans tenir compte de la casse) et est vivement déconseillé. Les clauses sont refusées pour les raisons que donnent la spécification et packaging 26.3 : `~=` avec un seul numéro de release, `.*` avec un opérateur autre que `==` et `!=` ou après une partie préversion, post-version ou développement, une étiquette locale avec un opérateur autre que `==` et `!=`, deux clauses sans virgule.

La gestion des préversions suit la spécification et packaging 26.3 : les préversions, versions de développement comprises, sont exclues, sauf si une clause en nomme une ou si toutes les versions de la plage sont des préversions ; le tableau montre à la fois ce qui est dans la plage et ce qui est retenu par défaut, et signale la plus récente des versions retenues.

## Où l’outil suit packaging, et où il est plus strict

Chaque verdict a été comparé à packaging 26.3 pendant le développement (voir Provenance). L’outil suit les choix de packaging là où la spécification laisse de la latitude, comme les règles exclusives de `<` et `>` et la liste d’étiquettes de l’installateur. Il est plus strict sur un point, et le dit : un nom de fichier dont la partie nom n’est pas un nom de projet valide (un `_` ou un `.` en tête ou en fin, une lettre non ASCII, un espace dans un nom de sdist) est refusé ici, alors que les analyseurs de noms de fichiers de packaging l’acceptent.

## Exemples commentés

- **Le bouton Exemple** : `cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl`. CPython 3.11 ou ultérieur, ABI stable, builds qui ne sont pas free-threaded, sur Linux avec glibc 2.34 ou ultérieure, en x86-64. Face à CPython 3.13 sur glibc 2.39, il s’installe, comme étiquette 163 sur 1147 (pip 26.2.2, avec packaging 26.2, l’affiche en 162e position) ; sur glibc 2.31, il ne s’installe pas ; sur un 3.14 free-threaded non plus, car `abi3` n’est pas listé pour les builds free-threaded.
- `markupsafe-3.0.4-cp313-cp313-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl` se développe en trois combinaisons ; `manylinux2014` est signalé comme l’ancien nom de `manylinux_2_17`.
- `Foo.Bar-1.0-py2.py3-none-any.whl` est accepté avec un avertissement : les outils actuels écrivent `foo_bar`.
- **Versions** : la liste de l’Exemple, `2.1 2.2 2.9.1 3.0 2.10rc1`, avec `~=2.2`, place `2.2`, `2.9.1` et `2.10rc1` dans la plage et retient `2.2` et `2.9.1`, car une version finale est dans la plage.

## Provenance

Le moteur est pur : des analyseurs de chaînes et des comparaisons, sans horloge, sans réseau, sans aléa, sans expression régulière à quantificateurs imbriqués. L’entrée est limitée à 20 000 caractères, 256 par version, 1024 par ensemble de spécificateurs et 500 versions. Il est livré avec des vecteurs de référence (golden vectors, jeu `wheel-filename-explainer/2026-10-27a`) : 134 lignes couvrant 40 versions acceptées et 12 refusées, deux listes de tri (dont celle de la spécification elle-même), 22 ensembles de spécificateurs (dont de nombreux exemples de la spécification) et 13 refusés, 33 noms de fichiers et 12 cibles d’interpréteur, chaque verdict étant tiré de packaging 26.3. Pendant le développement, le moteur a aussi été comparé à packaging 26.3 sur des entrées générées : 60 059 versions, 59 963 ensembles de spécificateurs, 30 000 noms de fichiers, 230 cibles et 607 200 contrôles d’étiquettes par rapport aux règles, sans autre désaccord que la règle de nom plus stricte décrite ci-dessus.

## API

Le même moteur répond à l’opération `/api/v1/wheel-filename-explainer` de l’API HTTP du site, décrite dans le contrat OpenAPI de la [page API](/api) ; le contrat indique aussi si ce site sert l’API.

- **Requête.** Du texte, dans le corps d’un POST ou dans le paramètre de requête `input` d’un GET. Un élément unique qui se termine par `.whl`, `.tar.gz` ou `.zip` (ou une URL vers un tel fichier) est lu comme un nom de fichier ; tout le reste est lu comme des versions, une par ligne ou séparées par des espaces ou des virgules, et la première ligne qui commence par `~`, `=`, `!`, `<` ou `>` est l’ensemble de spécificateurs.
- **Réponse.** `mode` (`filename`, `versions`, `empty` ou `too-long`). En mode nom de fichier, `filename` contient `kind`, `fileName`, `parts`, `name`, `expectedName`, `version` (avec `normalized`, `epoch`, `release`, `pre`, `post`, `dev`, `local` et les `notes` de normalisation), `build`, les `pythonTags`, `abiTags` et `platformTags` analysés, les combinaisons `expanded` avec leur règle `interpreter`, `expandedCount`, `findings` et `valid`. En mode versions, `versions` contient `entries`, l’ordre `sorted`, `equalGroups`, le `specifier` analysé et la `selection`. La vérification de cible est une fonctionnalité de la page uniquement.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le nom de fichier tel que saisi et, quand la vérification de cible est ouverte, ses six choix (implémentation, version de Python, build free-threaded, système d’exploitation, version de celui-ci, architecture) ; en mode Versions, il contient les versions et l’ensemble de spécificateurs. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. La zone accepte aussi une URL vers un wheel, et l’URL d’un index privé peut contenir des identifiants avant le `@` : pip lit `https://username:password@...`, ainsi qu’un jeton en une seule partie, pris comme nom d’utilisateur (« as the “username” ») et sans mot de passe ([pip, Authentication](https://pip.pypa.io/en/stable/topics/authentication/), consulté le 01/11/2026). La lecture n’a besoin que du nom de fichier en fin de chemin : une URL qui contient quoi que ce soit avant son `@` n’obtient donc pas de lien ; collez le nom de fichier seul. L’utilisateur d’une URL ssh est un nom de connexion et ne compte pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le mode est choisi et ses champs se remplissent tels que saisis ; une cible ouvre la vérification avec ces choix. Chaque choix doit faire partie de ceux que propose la page, sinon le lien est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

Toutes consultées le 27/10/2026.

- [Python Packaging User Guide: Binary distribution format](https://packaging.python.org/en/latest/specifications/binary-distribution-format/) : la convention de nommage des fichiers, l’échappement, l’étiquette de build
- [Python Packaging User Guide: Source distribution format](https://packaging.python.org/en/latest/specifications/source-distribution-format/) : le nom de fichier d’une sdist
- [Python Packaging User Guide: Platform compatibility tags](https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/) : les étiquettes python, ABI et de plateforme, les étiquettes manylinux, musllinux, macOS, iOS et Android, les ensembles d’étiquettes compressés, la façon dont les installateurs les utilisent
- [Python Packaging User Guide: Names and normalization](https://packaging.python.org/en/latest/specifications/name-normalization/)
- [Python Packaging User Guide: Version specifiers](https://packaging.python.org/en/latest/specifications/version-specifiers/) et [PEP 440](https://peps.python.org/pep-0440/)
- [PEP 427](https://peps.python.org/pep-0427/), [PEP 600](https://peps.python.org/pep-0600/), [PEP 656](https://peps.python.org/pep-0656/), [PEP 803](https://peps.python.org/pep-0803/), [PEP 3149](https://peps.python.org/pep-3149/), [PEP 703](https://peps.python.org/pep-0703/), [PEP 783](https://peps.python.org/pep-0783/)
- [Python documentation: C API Stability](https://docs.python.org/3/c-api/stable.html) : `abi3` et `abi3t`
- [packaging 26.3: Tags](https://packaging.pypa.io/en/stable/tags.html) : l’ordre de la liste d’étiquettes de l’installateur ; [changelog](https://packaging.pypa.io/en/stable/changelog.html) : la version 26.3 préfère les étiquettes de plateforme natives `linux_*`
- [Python developer's guide: Status of Python versions](https://devguide.python.org/versions/) : les branches prises en charge proposées dans la vérification de cible
