## Ce que fait l’outil

Un texte peut contenir bien plus qu’il n’en montre. Un espace de largeur nulle (zero-width space) se glisse entre deux lettres sans laisser de trace, un forçage de droite à gauche (right-to-left override) fait afficher une ligne de code dans un ordre différent de celui que lit le compilateur, un « а » cyrillique passe pour un « a » latin, et un séparateur de ligne commence une nouvelle ligne dans votre éditeur mais pas dans votre analyseur. L’inspecteur montre ce qui est réellement là, un point de code à la fois.

Il a quatre modes :

- **Inspecter un texte** compte le texte, indique si quelque chose mérite un examen, liste ce qu’il a trouvé par type, signale les contrôles bidirectionnels laissés ouverts en fin de ligne et les mots qui mélangent les écritures, dessine le texte dans l’ordre où il est stocké en montrant chaque caractère caché sous forme d’étiquette, liste chaque point de code, propose une copie nettoyée et écrit le texte sous forme d’échappements dans huit langages.
- **Un point de code** prend un point de code dans n’importe quelle notation (`U+00E9`, `é`, `0xE9`, `&eacute;`, `\u00e9`, `zero width space`, `BOM`) et affiche son nom et ses alias, ses propriétés, ses encodages, ses échappements et ce qu’il faut savoir à son sujet.
- **Recherche par nom** liste les points de code dont le nom ou un alias contient des mots commençant par les mots que vous saisissez.
- **Normaliser** affiche un texte en NFC, NFD, NFKC et NFKD avec les points de code et les octets UTF-8 de chaque forme, et le compare à un second texte sous chaque forme.

## Ce que l’outil signale dans un texte

| Constat | Nature | Pourquoi c’est important |
|---|---|---|
| Contrôle bidirectionnel | L’un des douze caractères Bidi_Control (LRM, RLM, ALM, LRE, RLE, LRO, RLO, PDF, LRI, RLI, FSI, PDI) | Change l’ordre d’affichage du texte qui l’entoure ; c’est la classe d’attaque Trojan Source (CVE-2021-42574) |
| Laissé ouvert en fin de ligne | Un enchâssement, un forçage ou un isolat sans PDF ni PDI avant la fin de la ligne | Tout ce qui le suit sur cette ligne peut s’afficher dans un ordre différent de l’ordre de lecture |
| Invisible | Default_Ignorable_Code_Point : caractères de largeur nulle, BOM, sélecteurs de variante, caractères d’étiquette (tags) | Ne s’affiche pas, mais les comparaisons de chaînes, les longueurs et les hachages le voient |
| Contrôle | Un code de contrôle autre que TAB, LF et CR | Ce n’est pas du texte ; les outils le suppriment, affichent un carré ou s’arrêtent |
| Saut de ligne autre que LF ou CR | VT, FF, NEL (U+0085), LINE SEPARATOR (U+2028), PARAGRAPH SEPARATOR (U+2029) | Un éditeur et un langage peuvent ne pas s’accorder sur la fin d’une ligne (UTS #55, usurpation par saut de ligne) |
| Surrogate isolé, non-caractère | Des points de code qui ne sont pas des caractères | Non valides en UTF-8 (surrogates) ou jamais destinés aux échanges (non-caractères) |
| Usage privé, non attribué | Pas de signification publique, ou pas encore de caractère | Les polices et les systèmes diffèrent, ou le texte vient d’une version d’Unicode plus récente que la vôtre |
| Caractère de remplacement | U+FFFD | Marque souvent un échec de décodage antérieur |
| Espace, guillemet ou tiret non ASCII | Espaces insécables et autres espaces, guillemets typographiques, tirets demi-cadratin et cadratin, signe moins | Ressemblent à de l’ASCII ; les analyseurs et les comparaisons divergent |
| Confondable avec l’ASCII | Un caractère que l’UTS #39 associe à un prototype ASCII | Homoglyphes : а cyrillique pour a, ο grec pour o |
| ASCII stylisé | Un caractère dont la décomposition de compatibilité est de l’ASCII | Lettres pleine chasse, ligatures et formes similaires |
| Mot à écritures mélangées | Un mot dont les lettres n’ont aucun système d’écriture en commun | `pаypal` avec un а cyrillique ; le japonais qui mélange Han, Hiragana et Katakana n’est pas signalé |

La détection des mélanges d’écritures suit l’UTS #39 : l’ensemble d’écritures augmenté de chaque caractère est son Script_Extensions plus les systèmes d’écriture qui combinent plusieurs écritures (Han ajoute Hanb, Hntl, Jpan et Kore ; Hiragana et Katakana ajoutent Jpan ; Hangul ajoute Kore ; Bopomofo ajoute Hanb ; Latin ajoute Hntl), un caractère Common ou Inherited correspond à n’importe quelle écriture, et un mot est mélangé quand l’intersection de ces ensembles sur ses caractères est vide.

## Le texte, dans l’ordre de stockage

Le panneau de révélation dessine le texte de gauche à droite dans l’ordre de la mémoire, avec le forçage bidirectionnel désactivé pour le panneau lui-même : aucun contrôle présent dans le texte ne peut donc réordonner ce que vous voyez. Chaque caractère qui mérite un examen devient une étiquette avec son point de code ; les étiquettes rouges changent le sens ou l’ordre, les étiquettes orange imitent autre chose. Survolez une étiquette ou donnez-lui le focus pour voir son nom.

## Nettoyage

La copie nettoyée peut supprimer les caractères invisibles et bidirectionnels, remplacer les espaces non ASCII par SPACE (et LINE SEPARATOR, PARAGRAPH SEPARATOR et NEL par LF), transformer les guillemets et tirets typographiques en `'`, `"` et `-`, et, si vous le demandez, remplacer les homoglyphes par l’ASCII qu’ils imitent. Cette dernière option est désactivée par défaut, car elle modifie aussi des mots authentiques en cyrillique, en grec et dans d’autres écritures.

## Échappements

Le texte entier peut s’écrire en JSON, en JavaScript, en Python, en HTML, en CSS, sous forme d’URL, en chaîne C `u8` ou en mot entre guillemets Tcl (iRules). Chaque forme échappe les caractères que son langage réserve et tout ce qui sort de l’ASCII imprimable. Lors de la construction de cet outil, chaque forme de 4000 points de code répartis sur les dix-sept plans, ainsi que de deux textes conçus pour les mettre à l’épreuve, a été redécodée par le langage lui-même (CPython, Node, GCC, Tcl 8.4.6, et Chromium pour HTML et CSS), et tout est revenu inchangé.

Certaines formes ne peuvent pas contenir tous les caractères, et l’outil le dit au lieu d’écrire quelque chose de faux :

- **Tcl 8.4 et iRules** n’ont pas d’échappement pour un caractère au-delà de U+FFFF : `\u` prend au plus quatre chiffres hexadécimaux, et l’interpréteur Tcl 8.4.6 lit les quatre octets UTF-8 d’un tel caractère comme quatre caractères distincts.
- **HTML** ne peut pas contenir de surrogate isolé, et une référence de U+0080 à U+009F donne un caractère différent : 27 de ces 32 références sont lues en Windows-1252 (`&#x85;` donne des points de suspension) ; l’outil écrit donc ces caractères tels quels.
- **CSS** transforme un 0 ou un surrogate échappé en U+FFFD.
- **C** : les noms de caractères universels ne peuvent désigner ni un caractère inférieur à U+00A0 autre que `$`, `@` et `` ` ``, ni un surrogate ; l’outil écrit à la place, en octal, les octets UTF-8 de U+0080 à U+009F.
- **Les URL** appliquent l’encodage-pourcent aux octets UTF-8, qu’un surrogate isolé n’a pas.

## Un point de code

- **Nom.** La propriété Name ; pour un caractère de contrôle, son premier alias formel (les contrôles n’ont pas de nom) ; pour tout autre caractère sans nom, son étiquette de point de code, comme `<surrogate-D800>` ou `<reserved-0378>`.
- **Alias.** Chaque alias formel avec son type : correction, nom de contrôle, variante, fictif (figment) ou abréviation (`BOM` et `ZWNBSP` pour U+FEFF).
- **Propriétés.** General_Category, Block, Script et Script_Extensions, ainsi que la version d’Unicode qui l’a ajouté.
- **Encodages.** Les octets UTF-8, les unités de code UTF-16 (une paire de surrogates au-delà de U+FFFF) et l’UTF-32.
- **Échappements et références.** Les huit formes ci-dessus pour ce seul point de code, plus les références HTML décimale, hexadécimale et nommée, avec une remarque quand une référence ne redonne pas ce point de code.

## Normalisation

Un même texte visible peut être stocké sous forme de suites différentes de points de code : é comme U+00E9, ou comme e suivi de U+0301 COMBINING ACUTE ACCENT. Le mode **Normaliser** affiche un texte sous les quatre formes de normalisation de l’UAX #15, chacune avec ses points de code, ses octets UTF-8 et l’indication qu’elle diffère ou non du texte tel que saisi : NFD (décomposition canonique), NFC (décomposition canonique, puis composition canonique), NFKD (décomposition de compatibilité) et NFKC (décomposition de compatibilité, puis composition canonique).

NFC et NFD conservent les caractères de compatibilité comme la ligature ﬁ (U+FB01) et les lettres pleine chasse ; NFKC et NFKD les remplacent par leurs équivalents simples, ce qui, prévient l’UAX #15, peut effacer des distinctions importantes : les formes K ont donc leur place là où cet effacement est voulu. Les singletons comme U+212B ANGSTROM SIGN et U+2126 OHM SIGN ne survivent à aucune forme, et les diacritiques combinants sont mis dans l’ordre canonique : A, U+030A, U+0323 devient ainsi U+1EA0 U+030A en NFC.

Saisissez un second texte sous **Comparer avec** et l’outil indique si les deux sont égaux tels que saisis et sous chaque forme : identiques, canoniquement équivalents (égaux sous NFC et NFD), égaux seulement sous NFKC et NFKD, ou différents sous toutes les formes. Tout l’intérêt est de normaliser les deux côtés dans une même forme avant de les comparer ; l’[article sur la normalisation Unicode](/learn/unicode-normalisation) explique pourquoi.

Les formes sont calculées par `String.prototype.normalize` (ECMA-262, section 22.1.3.15) avec les tables Unicode du moteur JavaScript qui exécute l’outil : sur cette page, votre navigateur. Ces tables peuvent être plus anciennes que les données 18.0.0 qu’utilisent les autres modes. La politique de stabilité d’Unicode garantit qu’un texte composé de caractères que connaît un moteur se normalise de la même façon dans toutes les versions ultérieures : la seule différence que peut faire un moteur plus ancien est de laisser passer inchangé un caractère plus récent que ses tables. Chaque texte est lu jusqu’à ses 1000 premiers points de code.

## Partage des résultats

Sous la première réponse du mode utilisé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone de ce mode telle que vous l’avez saisie et les choix propres au mode. Le nom de la zone indique le mode : `text` pour Inspecter un texte, avec les quatre options de nettoyage (`invisible`, `spaces`, `punct`, `fold`) et `escape`, le langage dans lequel le texte est écrit ; `cp` pour Un point de code ; `query` pour Recherche par nom ; `norm` pour Normaliser, avec `compare` quand un second texte a été saisi. Un choix laissé à sa valeur par défaut est omis. Les caractères cachés, comme les contrôles bidirectionnels et les espaces de largeur nulle, sont transmis exactement. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le mode est défini, sa zone se remplit comme le ferait un collage, ses choix sont appliqués, et la page calcule (la table des noms se charge dans la page, comme pour un collage). Deux zones à la fois, un choix qui appartient à un autre mode, une valeur que la page ne propose pas, ou une zone plus longue que son champ font ignorer tout le lien. Dans tous les cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
- **Liens venant de la table ASCII.** Un point de code transmis par `#input=` ouvre toujours Un point de code exactement comme avant ; Partager les résultats utilise ses propres noms, si bien que les deux ne se mélangent jamais.

## Limites

- Les colonnes sont comptées en points de code, tout comme les positions. Les éditeurs peuvent compter à la place en unités UTF-16 ou en caractères perçus par l’utilisateur.
- La détection des mélanges d’écritures fonctionne mot par mot ; elle ne vérifie pas des identifiants entiers à travers la ponctuation, et elle ne juge pas si un mélange est légitime.
- Les données de confusion couvrent les caractères qui ressemblent à du texte ASCII. Les confusions entre deux écritures non ASCII sont hors du périmètre.
- L’outil montre la vision d’Unicode 18.0.0. Un système aux données plus anciennes peut ignorer des caractères ajoutés depuis (18.0 en a apporté 13 007).
- La normalisation utilise la version d’Unicode du moteur JavaScript qui l’exécute, et non 18.0.0 : voir Normalisation ci-dessus.

## Sources

- [Unicode Character Database 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/) : UnicodeData.txt, DerivedName.txt, NameAliases.txt, PropList.txt, DerivedCoreProperties.txt, Blocks.txt, DerivedAge.txt, Scripts.txt, ScriptExtensions.txt, LineBreak.txt, PropertyValueAliases.txt (consulté le 03/10/2026)
- [UTS #39: Unicode Security Mechanisms (18.0.0) and confusables.txt](https://www.unicode.org/reports/tr39/) (consulté le 03/10/2026)
- [UTS #55: Unicode Source Code Handling](https://www.unicode.org/reports/tr55/) (consulté le 03/10/2026)
- [UAX #9: Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/) (consulté le 03/10/2026)
- [UAX #44: Unicode Character Database](https://www.unicode.org/reports/tr44/) (consulté le 03/10/2026)
- [The Unicode Standard 18.0.0, chapters 3, 4, 5 and 23](https://www.unicode.org/versions/Unicode18.0.0/) (consulté le 03/10/2026)
- [NVD: CVE-2021-42574](https://nvd.nist.gov/vuln/detail/CVE-2021-42574) (consulté le 03/10/2026)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (consultée le 03/10/2026)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (consultée le 03/10/2026)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (consultée le 03/10/2026)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (consulté le 03/10/2026)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (consulté le 03/10/2026)
- [ISO/IEC 9899:2011 committee draft N1570 (C11), 6.4.3](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (consulté le 03/10/2026)
- [Tcl 8.4 manual: Tcl](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consulté le 03/10/2026)
- [WHATWG HTML: parsing (numeric character references)](https://html.spec.whatwg.org/multipage/parsing.html) (consulté le 03/10/2026)
- [WHATWG HTML: named character references](https://html.spec.whatwg.org/entities.json) (consulté le 03/10/2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 03/10/2026) ; section 3.5 (consultée le 27/10/2026) : le fragment, qui contient les valeurs d’un lien Partager les résultats
- [UAX #15: Unicode Normalization Forms, revision 58 (Unicode 18.0.0)](https://www.unicode.org/reports/tr15/) (consulté le 26/10/2026)
- [Unicode Character Encoding Stability Policies: Normalization Stability](https://www.unicode.org/policies/stability_policy.html) (consulté le 26/10/2026)
- [ECMA-262: String.prototype.normalize, section 22.1.3.15](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize) (consulté le 26/10/2026)
