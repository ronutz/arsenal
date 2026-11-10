## Ce que fait l’outil

Décrivez une décision sous forme de règles ordonnées (« les chemins qui commencent par /api vont vers api_pool, /login va vers login_pool, tout le reste vers web_pool ») et l’outil l’écrit de trois façons :

- une chaîne `if` / `elseif`,
- un `switch` (avec `-glob` quand une règle l’exige, et `--` avant la valeur),
- une recherche `class match` dans des data groups, avec les définitions `tmsh` de ces data groups.

Une valeur de test passe ensuite dans chaque règle générée, exécutée par l’interpréteur pédagogique, et la page montre le pool que chaque forme a choisi.

## Pourquoi les formes peuvent diverger

`if` et `switch` prennent la **première** règle qui correspond, dans l’ordre d’écriture. `class match` avec `starts_with` ou `ends_with` renvoie l’entrée correspondante la **plus longue**, quel que soit l’ordre (la référence `class` de F5 l’indique). Avec les règles `/api` et `/api/v2`, la valeur de test `/api/v2/users` va vers `api_pool` avec `if` et `switch`, mais vers `api_v2_pool` avec `class match`. L’outil signale aussi une règle qui ne peut jamais se déclencher, parce qu’une règle antérieure correspond toujours avant elle.

## Bon à savoir

- Passer la valeur en minuscules (`string tolower`) rend la comparaison insensible à la casse, mais une valeur de règle qui contient des majuscules ne peut alors plus jamais correspondre ; l’outil le signale.
- `class match` n’a pas de comparaison glob : une règle glob exclut donc la forme data group.
- Une valeur de règle qui contient une accolade sans sa partenaire est écrite précédée d’une barre oblique inverse (`\{`). Tcl compte les accolades à l’intérieur d’un corps entre accolades, même entre guillemets droits doubles (règle 5 de la page de syntaxe de Tcl 8.4) : une accolade isolée casserait donc la règle ; un vrai Tcl 8.4.6 s’arrête sur `missing close-brace`.
- Pour `HTTP::path`, une valeur de test est coupée à son premier point d’interrogation : `HTTP::path` n’inclut pas la chaîne de requête (référence `HTTP::path` de F5), si bien que les règles ne comparent que la partie qui le précède.
- Les noms d’enregistrements qui contiennent d’autres caractères que des lettres, des chiffres et `_ . / : -` sont écrits entre guillemets droits doubles dans les définitions `tmsh`. Ces guillemets n’ont pas été testés sur un BIG-IP : listez le data group dans `tmsh` après l’avoir créé et vérifiez les enregistrements.
- Le code généré suit l’iRules Style Guide de DevCentral (indentation de 4 espaces, une priorité sur l’évènement, expressions entre accolades, noms de variables entre accolades, `--` sur `switch` et `class`), et il passe le vérificateur de style du site sans aucun constat.

## Partage des résultats

Sous le verdict sur la valeur de test, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient toute la décision, désignée par nom : `#subject=` (et `&header=` pour un en-tête), `&lower=1` ou `0`, les règles dans l’ordre sous forme d’une seule liste Tcl de listes `{comparison value pool}` (`&rules={starts_with /api api_pool} {equals /login login_pool}`, en encodage-pourcent dans le lien), ainsi que le pool par défaut, le nom du data group et la valeur de test (`&default=`, `&group=`, `&test=`) quand ils sont définis. Les noms de pools, de data groups et d’en-têtes sont les vôtres ; l’avertissement standard de la fenêtre contextuelle s’y applique. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; même 50 règles restent largement en deçà.
- **Ouverture d’un lien.** La décision du lien remplace tout le formulaire, y compris l’Exemple que la page affiche à l’ouverture (un champ que le lien ne contient pas est vidé ; une décision sur un en-tête sans nom utilise `User-Agent`, celui de la page), et les trois formes sont générées. Une valeur de requête ou une comparaison inconnue, une valeur rules qui n’est pas une liste de listes à trois éléments, plus de 50 règles ou une valeur plus longue que ce que la page admet font ignorer le lien en entier. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## Sources

- [F5 iRules reference: class](https://clouddocs.f5.com/api/irules/class.html) (consulté le 02/10/2026)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (consulté le 02/10/2026)
- [Tcl 8.4 manual: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (consulté le 03/10/2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consulté le 03/10/2026)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (consulté le 03/10/2026)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (consulté le 03/10/2026)
- [F5 iRules reference: HTTP::path](https://clouddocs.f5.com/api/irules/HTTP__path.html) (consulté le 03/10/2026)
- [Tcl 8.4 manual: Tcl (les règles de substitution)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consulté le 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
