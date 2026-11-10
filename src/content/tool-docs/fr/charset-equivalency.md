## Ce que fait l’outil

Un octet ne veut rien dire tant que personne n’a dit dans quel jeu de caractères il est écrit. `E9` vaut é en windows-1252, Ú en IBM 850 et Z en EBCDIC, et en UTF-8 ce n’est pas un caractère du tout, seulement le premier octet d’un caractère. Cet outil montre le même texte et les mêmes octets à travers quatorze jeux de caractères à la fois, décode les octets exactement comme un navigateur les décode, et répare les dégâts quand un texte a été lu dans le mauvais jeu.

Il a trois modes :

- **Texte vers octets** écrit un texte dans un jeu de caractères, en six notations, caractère par caractère, et indique ce qu’il advient de chaque caractère que le jeu ne peut pas représenter. Il montre ensuite le même texte dans chaque jeu de caractères, et la relecture de ces octets dans chaque jeu : le mojibake que produit chaque mauvaise supposition.
- **Octets vers texte** lit des octets saisis en hexadécimal ou collés depuis un dump hexadécimal, sous forme de séquences d’échappement, de %XX ou de Base64, les décode avec le jeu de caractères choisi ou celui qu’il détecte, et liste chaque séquence qu’il a dû remplacer, avec la raison. Il montre aussi ce que chaque jeu de caractères fait des mêmes octets.
- **Corriger le mojibake** prend un texte altéré, comme `cafÃ©`, trouve le jeu de caractères qui l’a mal lu et celui dans lequel les octets étaient réellement écrits, et rend le texte d’origine, avec les étapes et la force des éléments probants.

## Les quatorze jeux de caractères

| Jeu de caractères | Octets par caractère | Ce qu’en fait un navigateur |
|---|---|---|
| UTF-8 | 1 à 4 | Le décode ; le WHATWG Encoding Standard l’impose pour tout nouveau contenu |
| UTF-16LE, UTF-16BE | 2 ou 4 | Décode les deux (« utf-16 » est une étiquette de UTF-16LE) ; ne les encode jamais |
| UTF-32LE, UTF-32BE | 4 | Non pris en charge |
| US-ASCII | 1 (sept bits) | Les étiquettes « ascii » et « us-ascii » désignent windows-1252 |
| ISO-8859-1 (Latin-1) | 1 | Les étiquettes « iso-8859-1 » et « latin1 » désignent windows-1252 |
| windows-1252 | 1 | Le décode |
| ISO-8859-15 (Latin-9) | 1 | Le décode |
| Mac OS Roman | 1 | Le décode (étiquette « macintosh ») |
| IBM 437 (DOS, US) | 1 | Non pris en charge |
| IBM 850 (DOS, Europe de l’Ouest) | 1 | Non pris en charge |
| IBM 037 et IBM 500 (EBCDIC) | 1 | Non pris en charge |

Les tables windows-1252, ISO-8859-15 et Mac OS Roman sont les index du WHATWG Encoding Standard : elles correspondent donc à ce que décode un navigateur. Les tables IBM sont les tables de correspondance des constructeurs archivées par le Consortium Unicode, qui ne les conserve qu’à titre historique et d’archive (« only for historical and archival purposes »), sans garantie qu’elles correspondent à une plateforme donnée. Chaque table a été comparée octet par octet avec les codecs de CPython 3.11 et l’iconv de la glibc 2.39 le 3 octobre 2026. Les différences :

- **windows-1252, octets 0x81, 0x8D, 0x8F, 0x90 et 0x9D.** Le standard WHATWG les associe aux caractères de contrôle C1 U+0081, U+008D, U+008F, U+0090 et U+009D ; la table de Microsoft, CPython et iconv les laissent non définis. L’outil suit le standard WHATWG : chaque octet se décode, et le décodage ne perd jamais d’information.
- **Mac OS Roman dans iconv.** La glibc associe 0xC6 à U+0394 et 0xF0 à U+E01E, là où la table d’Apple et le standard WHATWG donnent U+2206 et U+F8FF.

## Décodage à la manière d’un navigateur

Les décodeurs UTF-8 et UTF-16 suivent le WHATWG Encoding Standard pas à pas. Quand une séquence est mal formée, un seul U+FFFD remplace sa sous-partie maximale : la plus longue suite d’octets qui aurait encore pu commencer un caractère bien formé, ou un octet unique. Le standard Unicode décrit la même pratique à la section 3.9.6, et ses tableaux 3-8 à 3-11 font partie des préréglages. Chaque séquence remplacée est nommée :

| Raison | Octets UTF-8 | Signification |
|---|---|---|
| Octet de continuation isolé | 80 à BF là où commence un caractère | son premier octet manque, ou les données ne sont pas en UTF-8 |
| C0 ou C1 | C0, C1 | ne pourrait commencer qu’une forme sur deux octets d’un caractère ASCII |
| F5 à FF | F5 à FF | n’apparaît jamais en UTF-8 |
| Trop longue | E0 80-9F, F0 80-8F | une forme plus longue d’un point de code qui en a une plus courte |
| Surrogate | ED A0-BF | U+D800 à U+DFFF, que l’UTF-8 ne peut pas transporter |
| Au-delà de U+10FFFF | F4 90-BF | après le dernier point de code |
| Tronquée | un octet de tête, puis autre chose | les octets lus jusque-là deviennent un seul U+FFFD |

L’UTF-16 remplace les surrogates (demi-codes d’indirection) non appariés et un octet impair restant ; l’UTF-32, que les navigateurs ne décodent pas, suit les définitions D99 et D100 du standard Unicode et remplace chaque unité de quatre octets qui est un surrogate ou qui dépasse U+10FFFF.

**Indicateurs d’ordre des octets (BOM, byte order mark).** Avec « Laisser un indicateur d’ordre des octets choisir le jeu de caractères » activé (le réglage par défaut), des données qui commencent par EF BB BF, FE FF ou FF FE sont décodées en UTF-8, UTF-16BE ou UTF-16LE quel que soit le jeu de caractères choisi, et l’indicateur ne fait pas partie du texte : le standard WHATWG considère l’indicateur comme plus fiable qu’une étiquette. L’outil reconnaît aussi les indicateurs UTF-32 00 00 FE FF et FF FE 00 00, ce que ne fait pas un navigateur : celui-ci prend le FF FE de FF FE 00 00 pour l’indicateur d’UTF-16LE et décode le reste en UTF-16LE (Chromium 141, mesuré le 3 octobre 2026).

**Détection.** Quand le jeu de caractères est réglé sur Détecter, l’outil explique son choix : un indicateur d’ordre des octets ; des octets tous ASCII (tous les jeux compatibles ASCII lisent alors le même texte) ; de l’UTF-8 bien formé avec des caractères au-delà de l’ASCII ; des octets nuls là où un texte ASCII en UTF-16 ou en UTF-32 les place ; ou le profil de l’EBCDIC (0x40 fréquent, aucun espace ASCII, la plupart des octets au-dessus de 0x80). Sinon, il indique qu’il n’y a pas de réponse unique, et c’est le tableau des lectures qui fait office de réponse.

## Lecture des octets saisis dans la zone

| Format | Exemple |
|---|---|
| Hexadécimal, avec n’importe quels séparateurs, avec ou sans 0x ou \x | `C3 A9`, `c3a9`, `0xC3, 0xA9`, `{ 0xC3, 0xA9 }` |
| Un dump hexadécimal | la sortie de `hexdump -C`, `xxd` ou `od -Ax -tx1` : les décalages et la colonne ASCII sont ignorés |
| Séquences d’échappement | `\xC3\xA9`, `b'caf\xc3\xa9'` (Python), `caf\303\251` (c’est ainsi que git cite les noms de fichiers) |
| Encodage-pourcent | `caf%C3%A9`, lu comme le lit le WHATWG URL Standard : un % qui n’est pas suivi de deux chiffres hexadécimaux reste un % |
| Base64 | alphabet standard ou URL-safe, remplissage facultatif |

Un dump hexadécimal est reconnu quand chaque ligne commence par un décalage et que les décalages progressent de la largeur d’une ligne, si bien que la colonne ASCII n’est jamais lue comme des octets, même quand elle ressemble par hasard à de l’hexadécimal.

## Écriture des octets

Les six notations : paires hexadécimales ; la présentation de `hexdump -C` ; un tableau C ; un littéral bytes Python (exactement tel que l’écrit `repr()` en Python) ; Base64 (RFC 4648, section 4) ; et l’encodage-pourcent, qui laisse tels quels les caractères non réservés de la RFC 3986. Chacune a été comparée à sa référence : `hexdump -C` d’util-linux, et `repr()`, `base64` et `urllib.parse.quote` de CPython.

**Les caractères qu’un jeu de caractères ne peut pas représenter** s’écrivent `?` (ce que font la plupart des convertisseurs), sous forme de référence HTML décimale comme `&#8364;` (ce que fait un navigateur quand un formulaire est envoyé dans un tel jeu : le mode d’erreur « html » du standard WHATWG, que le serveur ne peut pas distinguer d’une personne qui aurait saisi ces caractères), ou ne s’écrivent pas du tout (strict).

## Correction du mojibake

Le mojibake est réversible quand le mauvais jeu de caractères n’a rien perdu : il suffit de réencoder le texte altéré avec le jeu qui l’a mal lu, puis de décoder les octets avec le bon. L’outil tente cette opération en deux niveaux :

1. **UTF-8 lu comme un jeu de caractères sur un octet** (windows-1252, ISO-8859-1, ISO-8859-15, Mac OS Roman, IBM 437, IBM 850). L’annulation doit produire de l’UTF-8 bien formé, ce que des octets au-delà de l’ASCII forment rarement par hasard : c’est un élément probant solide. Jusqu’à trois passes réparent un texte mal lu plus d’une fois (`Ã¢â‚¬â„¢` est ’ mal lu deux fois).
2. **Un jeu de caractères sur un octet lu comme un autre**, par exemple un fichier IBM 850 affiché en windows-1252 (`a‡Æo` pour ação), ou de l’EBCDIC affiché en Latin-1. Dans ces jeux, chaque octet se décode : l’outil ne retient donc une lecture que si elle obtient un meilleur score sur une mesure de mojibake (les paires que laisse l’UTF-8, des symboles au milieu des mots, des majuscules au milieu de mots en minuscules, des caractères de contrôle, des caractères de dessin de cadres, des mots qui mélangent des écritures), et il qualifie les éléments probants de plus faibles.

Quand un octet s’est perdu en route (souvent le dernier octet de ” ou de ™, que windows-1252 transforme en caractère de contrôle invisible), une passe tolérante récupère le reste et marque chaque caractère perdu par U+FFFD. **Voir l’altération** bascule vers Texte vers octets avec le texte réparé, et le tableau de relecture montre exactement comment il a été altéré.

Vérifié le 3 octobre 2026 : 104 des 106 échantillons de mojibake produits à partir de quinze textes (UTF-8 mal lu dans cinq jeux de caractères, mal lu deux fois, IBM 850 et windows-1252 lus l’un pour l’autre, EBCDIC lu comme du Latin-1) ont été restitués à l’identique, et les quinze textes eux-mêmes n’ont pas été modifiés. Les deux échecs portent sur des textes courts : AÇÃO en EBCDIC lu comme du Latin-1 (`ÁhfÖ`), où une autre lecture arrive en tête, et Ça va en windows-1252 lu comme de l’IBM 850 (`Ãa va`), qui reste tel quel. Sur 12 087 textes corrects (des paragraphes des articles Learn du site en anglais et en portugais, plus seize phrases dans d’autres langues, écritures et jeux de symboles), aucun ne s’est vu proposer de réparation.

## Partage des résultats

Sous la première réponse du mode utilisé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la zone de ce mode telle que vous l’avez saisie et les choix propres au mode, après le `#`. Le nom de la zone indique le mode, si bien que le lien ouvre exactement le mode dans lequel vous étiez : `text` pour Texte vers octets, avec `charset`, `policy`, `bom` et `style` (la notation des octets) ; `bytes` pour Octets vers texte, avec `format`, `charset` et `sniff` (si un indicateur d’ordre des octets décide ou non) ; `garbled` pour Corriger le mojibake. Un choix laissé à sa valeur par défaut est omis. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le mode est sélectionné, sa zone se remplit comme lors d’un collage, ses choix sont appliqués, et la page calcule. Deux zones à la fois, un choix qui appartient à un autre mode ou une valeur que la page ne propose pas font ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
- **Pourquoi pas `#input=` ?** Une valeur transmise sous la forme `#input=` ouvre toujours le mode auquel elle ressemble, exactement comme avant. Un partage n’utilise pas cette forme, car l’apparence peut tromper : un texte comme `cafe` se lit aussi comme deux octets hexadécimaux.

## Limites

- La réparation porte sur le texte entier. Un texte qui mélange des caractères corrects et des caractères altérés est laissé tel quel : collez la partie altérée seule.
- Les octets remplacés par `?` ou U+FFFD, ou supprimés, ne peuvent pas être récupérés ; la réparation indique combien de caractères ont été perdus.
- La détection et le second niveau de réparation sont des heuristiques. Les éléments probants solides viennent des indicateurs d’ordre des octets et de l’UTF-8 bien formé ; tout le reste est qualifié de plus faible.
- Seuls les quatorze jeux de caractères ci-dessus. Les jeux multioctets d’Asie de l’Est (Shift_JIS, GBK, Big5, EUC-KR) ne sont pas inclus.
- Au plus 64 Kio d’octets décodés et 20 000 caractères encodés à la fois ; les tableaux listent les 2000 premières lignes ; la réparation examine les 2000 premiers caractères.

## Sources

- [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) : les décodeurs UTF-8 et UTF-16, la détection du BOM, le décodeur et l’encodeur sur un octet, les étiquettes, les modes d’erreur ; standard évolutif (living standard) mis à jour pour la dernière fois le 21 mai 2026 (consulté le 03/10/2026)
- [Index WHATWG : windows-1252](https://encoding.spec.whatwg.org/index-windows-1252.txt), [ISO-8859-15](https://encoding.spec.whatwg.org/index-iso-8859-15.txt), [macintosh](https://encoding.spec.whatwg.org/index-macintosh.txt) (consulté le 03/10/2026)
- [The Unicode Standard 18.0.0, chapitre 3 : Conformance](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-3/) : tableau 3-7, section 3.9.6 et tableaux 3-8 à 3-11, définitions D95 à D100 (consulté le 03/10/2026)
- [FAQ Unicode : UTF-8, UTF-16, UTF-32 & BOM](https://www.unicode.org/faq/utf_bom.html) (consulté le 03/10/2026)
- [Tables de correspondance Unicode](https://www.unicode.org/Public/MAPPINGS/) : [ReadMe](https://www.unicode.org/Public/MAPPINGS/ReadMe.txt), [CP437](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP437.TXT), [CP850](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP850.TXT), [CP037](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP037.TXT), [CP500](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP500.TXT), [CP1252](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP1252.TXT), [8859-1](https://www.unicode.org/Public/MAPPINGS/ISO8859/8859-1.TXT), [Apple ROMAN](https://www.unicode.org/Public/MAPPINGS/VENDORS/APPLE/ROMAN.TXT) (consulté le 03/10/2026)
- [RFC 3629 : UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (consulté le 03/10/2026)
- [RFC 2781 : UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (consulté le 03/10/2026)
- [RFC 4648 : Base16, Base32 et Base64](https://www.rfc-editor.org/rfc/rfc4648) (consulté le 03/10/2026)
- [RFC 3986 : URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consulté le 03/10/2026) ; section 3.5 (consulté le 27/10/2026) : le fragment, qui transporte les valeurs d’un lien Partager les résultats
- [WHATWG URL Standard : percent-decode](https://url.spec.whatwg.org/) (consulté le 03/10/2026)
