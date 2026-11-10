## Ce que fait l’outil

L’ASCII compte 128 codes, de 0 à 127, et la plupart des gens n’en ont besoin que d’un à la fois : le code d’un caractère, le caractère derrière un code, ou la façon de l’écrire dans un fichier de configuration, une chaîne JSON ou une iRule. L’explorateur répond à ces questions pour chaque code, et dit clairement quand ce que vous avez sous les yeux n’est pas du tout de l’ASCII.

Il comporte quatre parties :

- **Recherche** lit un code dans n’importe quelle notation et en montre tout : les nombres, les bits, les noms, l’usage pour lequel le code a été défini en 1968 et ce qu’en fait Linux aujourd’hui, la façon de l’écrire dans sept contextes, et les langages qui le comptent comme caractère d’espacement.
- **La table** dispose les 128 codes comme les dessine la RFC 20, huit colonnes sur seize lignes, ou sous forme de liste. Choisissez un code pour l’afficher dans la recherche.
- **Du texte aux codes** prend un texte collé et affiche le code de chaque caractère, en listant par son nom tout ce qui sort de l’ASCII, avec la raison pour laquelle il peut poser problème.
- **Caractères d’espacement comparés** confronte les dix codes susceptibles d’être des espaces à sept définitions qui ne s’accordent pas à leur sujet.

## Ce que lit la zone de recherche

| Vous saisissez | Lu comme |
|---|---|
| `A` | le caractère lui-même (entre apostrophes, `'A'` fonctionne aussi) |
| `65` | décimal |
| `0x41`, `41h`, `x41` | hexadécimal |
| `0o101` | octal |
| `1000001`, `00100101` | sept ou huit chiffres binaires, lus comme des bits |
| `0b1000001` | binaire avec son préfixe |
| `4/1` | colonne/ligne de la RFC 20 : colonne 4, ligne 1 |
| `U+0041` | notation Unicode |
| `&#65;`, `&#x41;`, `&excl;` | références HTML numériques et nommées |
| `%41` | encodage-pourcent |
| `\x41`, `\101`, `\n`, `A`, `\u{1F600}` | séquences d’échappement avec barre oblique inverse |
| `^A`, `^[`, `^?` | notation caret (accent circonflexe) |
| `NUL`, `LF`, `line feed`, `Reverse Slant` | abréviations et noms, tirés de la RFC 20, d’Unicode 1.0 et de l’Unicode actuel |
| `en dash`, `minus sign` | tout nom ou alias Unicode (comparaison souple : la casse, les espaces, les traits de soulignement et les traits d’union médians sont ignorés, comme le prévoit la règle UAX44-LM2 de l’UAX #44) |

Sept ou huit chiffres binaires isolés sont lus comme des bits, car une suite de 0 et de 1 de cette longueur en est presque toujours une. Un nombre décimal plus long, comme `1000`, est lu en décimal et tombe hors de l’ASCII.

## Lecture d’un code

- **Nombres.** Décimal, hexadécimal, octal, sept bits et l’octet complet. Le bit de poids fort de l’octet vaut 0 : la RFC 20 place l’ASCII 7 bits dans un octet dont le bit de poids fort est toujours nul (« in an 8 bit byte whose high order bit is always 0 »).
- **Colonne/ligne.** La RFC 20 désigne chaque position par sa colonne et sa ligne : `K` est en `4/11`. La colonne correspond aux bits b7 b6 b5 et la ligne aux bits b4 b3 b2 b1 : 4/11 s’écrit donc 100 1011.
- **Inverser un bit.** Chacun des sept bits est un bouton qui l’inverse et affiche le résultat. Deux d’entre eux expliquent l’essentiel de la table : b6 (32) est la seule différence entre majuscules et minuscules, et b7 (64) sépare un caractère de contrôle du caractère auquel il est associé en notation caret (`A` et `^A`, `[` et `^[`, qui est ESC).
- **Noms.** Le nom Unicode actuel, le nom Unicode 1.0 quand il diffère (`BACKSLASH`, `SPACING UNDERSCORE`), le nom de la RFC 20 (`Reverse Slant`, `Underline`, `Overline`) et ses variantes. Les caractères de contrôle n’ont aucun nom Unicode : la propriété Name d’Unicode est vide pour eux, et ils sont désignés par des alias formels tirés de l’ISO 6429 (`LINE FEED`, `NEW LINE`, `END OF LINE`, abrégés `LF`, `NL`, `EOL`). La table de la RFC 20 appelle le code 25 `EM` ; la première abréviation qu’Unicode lui donne est `EOM`.
- **Catégorie et classe.** La General_Category de l’Unicode Character Database, et la classe que la RFC 20 attribue aux caractères de contrôle : commande de transmission (CC, communication control), effecteur de format (FE, format effector) ou séparateur d’information (IS, information separator).
- **Remarques.** La note 3 de la RFC 20 désigne onze positions (`#` `@` `[` `\` `]` `^` `` ` `` `{` `|` `}` `~`) à ne pas employer dans les échanges internationaux sans accord préalable ; la note 4 permet au signe livre sterling de remplacer `#`.
- **Rôle d’origine et rôle actuel.** Pour chaque caractère de contrôle, un résumé de la définition de la RFC 20 et, quand Linux lui confie une tâche, cette tâche : Ctrl-C (ETX) interrompt, Ctrl-D (EOT) termine la saisie, Ctrl-S et Ctrl-Q (DC3, DC1) arrêtent et relancent la sortie, Ctrl-Z (SUB) suspend, et ESC ouvre une séquence d’échappement sur la console Linux. Ces comportements viennent des pages de manuel Linux termios(3) et console_codes(4).
- **Écriture.** La forme d’un littéral de chaîne en C, JSON, JavaScript, Python et Tcl (iRules), les références HTML et la forme URL avec sa classe RFC 3986. Une courte remarque suit quand un langage tend un piège (voir ci-dessous).
- **Espacement ?** Oui ou non pour chacune des sept définitions.
- **Relations.** La notation caret, l’autre casse, la valeur d’un chiffre, et les caractères ASCII que l’UTS #39 tient pour confondables avec lui (`1`, `I`, `l` et `|` partagent un même prototype ; `0` et `O` en partagent un autre).

## Les pièges que ces échappements évitent

- **En C, les échappements hexadécimaux ne s’arrêtent pas après deux chiffres.** `"\x1Bfoo"` continue de lire des chiffres hexadécimaux : l’outil écrit donc les caractères de contrôle C en octal (`\033`), qui s’arrête à trois chiffres.
- **Tcl 8.4, et donc les iRules, ne garde que les deux derniers chiffres hexadécimaux de `\x`.** `"\x1Bfoo"` lit `\x1Bf` et garde `Bf` : le résultat est l’octet 0xBF suivi de `oo`, et non ESC suivi de `foo`. L’outil écrit donc aussi les caractères de contrôle Tcl en octal. Ce comportement a été vérifié sous Tcl 8.4.6.
- **JSON doit échapper le guillemet, la barre oblique inverse (reverse solidus) et les caractères de contrôle 0 à 31**, et peut laisser DEL tel quel (RFC 8259, section 7).
- **En JavaScript, `\0` ne désigne NUL que si aucun chiffre ne suit.**
- **HTML transforme `&#0;` en U+FFFD**, le caractère de remplacement, et traite les références à la plupart des caractères de contrôle comme des erreurs d’analyse (analyseur du WHATWG).

## Quand ce n’est pas de l’ASCII

Une valeur supérieure à 127 est nommée, avec le nombre d’octets UTF-8 qu’elle occupe et le type de problème qu’elle peut causer : caractère invisible, espace qui n’est pas l’espace ASCII, guillemet typographique, tiret qui n’est pas le trait d’union-signe moins (hyphen-minus), ou caractère dont la forme de compatibilité est de l’ASCII. Quand l’UTS #39 le donne pour confondable avec un texte ASCII, l’outil indique lequel et propose le caractère ASCII que vous vouliez probablement.

Deux cas sont assez courants pour figurer parmi les valeurs proposées. `&minus;` est U+2212 MINUS SIGN et `&tilde;` est U+02DC SMALL TILDE : aucun des deux n’est de l’ASCII, et le trait d’union-signe moins (45) et le tilde (126) de l’ASCII n’ont aucune référence nommée. Écrivez `&#45;` et `&#126;`, ou les caractères eux-mêmes. Certaines tables ASCII publiées associent `&minus;` et `&tilde;` à 45 et à 126 ; la liste des références nommées du WHATWG, non.

Pour toutes les propriétés d’un point de code hors ASCII, le résultat renvoie vers l’[inspecteur Unicode](/tools/unicode-inspector).

## La zone de texte

Collez une ligne tirée d’une configuration, d’une iRule ou d’un e-mail. Chaque caractère s’affiche dans une cellule avec son code (hexadécimal pour l’ASCII, point de code pour le reste), et tout ce qui sort de l’ASCII est listé avec sa position, ses octets UTF-8, son nom et la raison pour laquelle il peut poser problème. Au plus 2000 caractères sont lus.

## Méthode de vérification

Chaque échappement, chaque référence et chaque réponse sur l’espacement, pour les 128 codes, a été exécuté dans les implémentations réelles le 3 octobre 2026, et toutes concordent avec l’outil : littéraux de chaîne sous CPython 3.11, Node 22, GCC (C11) et Tcl 8.4.6 ; références HTML (décimales, hexadécimales et nommées) sous Chromium ; espacement avec `isspace()` en C, `str.isspace()` en Python, `\s` et `trim()` en JavaScript, un analyseur JSON strict, l’analyseur de commandes de Tcl 8.4.6 et le découpage que fait le DOM sur les espaces ASCII. Chaque cellule de la table des codes de la RFC 20 a été comparée aux données de l’outil. Les noms Unicode ont été vérifiés par rapport au fichier de données Unicode 18.0.0, pour chacun des 1 114 112 points de code.

## Partage des résultats

Sous la réponse de la recherche, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la valeur de la zone de recherche telle que vous l’avez saisie : `/tools/ascii-table#input=%26tilde%3B`. La zone Du texte aux codes est une partie distincte de la page et n’est pas transmise. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la valeur n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** La zone de recherche contient au plus 200 caractères, bien en deçà des 16 384 que le site autorise après le `#`.
- **Ouverture d’un lien.** Le lien a la forme `#input=` que les liens de l’inspecteur Unicode utilisent déjà pour ouvrir un code ici ; il s’ouvre donc exactement comme ces liens l’ont toujours fait : la valeur remplit la zone, la page la lit, et elle reste dans l’adresse jusqu’à ce que vous modifiiez ou effaciez la zone.

## Limites

- L’ASCII est ici le code 7 bits. Les codes 128 à 255 relèvent du jeu de caractères 8 bits qu’utilise chaque système (Latin-1, Windows-1252, une page de code DOS) ; l’explorateur ne devine pas lequel.
- Le comportement du terminal est celui de Linux, d’après ses pages de manuel. D’autres systèmes peuvent attribuer autrement les touches de contrôle.
- La zone de recherche lit une valeur à la fois. Pour un texte, utilisez la zone de texte ou l’[inspecteur Unicode](/tools/unicode-inspector).

## Sources

- [RFC 20: ASCII format for Network Interchange (1969), reproduisant USAS X3.4-1968](https://www.rfc-editor.org/rfc/rfc20) (consultée le 03/10/2026)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/18.0.0/ucd/UnicodeData.txt) (consulté le 03/10/2026)
- [Unicode Character Database 18.0.0: NameAliases.txt](https://www.unicode.org/Public/18.0.0/ucd/NameAliases.txt) (consulté le 03/10/2026)
- [Unicode Character Database 18.0.0: DerivedName.txt](https://www.unicode.org/Public/18.0.0/ucd/extracted/DerivedName.txt) (consulté le 03/10/2026)
- [The Unicode Standard 18.0.0, chapter 4: Character Properties (la propriété Name)](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-4/) (consulté le 03/10/2026)
- [UAX #44: Unicode Character Database (UAX44-LM2, valeurs de General_Category)](https://www.unicode.org/reports/tr44/) (consulté le 03/10/2026)
- [UTS #39: Unicode Security Mechanisms, confusables.txt 18.0.0](https://www.unicode.org/Public/18.0.0/security/confusables.txt) (consulté le 03/10/2026)
- [WHATWG HTML: named character references (entities.json)](https://html.spec.whatwg.org/entities.json) (consulté le 03/10/2026)
- [WHATWG HTML: parsing (numeric character reference end state)](https://html.spec.whatwg.org/multipage/parsing.html) (consulté le 03/10/2026)
- [WHATWG Infra: ASCII whitespace](https://infra.spec.whatwg.org/) (consulté le 03/10/2026)
- [ISO/IEC 9899:2011, projet de comité N1570 (C11)](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (consulté le 03/10/2026)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (consultée le 03/10/2026)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (consulté le 03/10/2026)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (consulté le 03/10/2026)
- [Tcl 8.4 manual: Tcl (substitution des barres obliques inverses)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consulté le 03/10/2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 03/10/2026) ; section 3.5 (consultée le 27/10/2026) : le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
- [RFC 5234: ABNF (règles de base)](https://www.rfc-editor.org/rfc/rfc5234) (consultée le 03/10/2026)
- [RFC 5321: SMTP (les lignes se terminent par CR LF)](https://www.rfc-editor.org/rfc/rfc5321) (consultée le 03/10/2026)
- [RFC 9112: HTTP/1.1 (format des messages)](https://www.rfc-editor.org/rfc/rfc9112) (consultée le 03/10/2026)
- [POSIX.1-2024: Definitions (line, newline)](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html) (consulté le 03/10/2026)
- [Page de manuel Linux termios(3)](https://man7.org/linux/man-pages/man3/termios.3.html) (consulté le 03/10/2026)
- [Page de manuel Linux console_codes(4)](https://man7.org/linux/man-pages/man4/console_codes.4.html) (consulté le 03/10/2026)
