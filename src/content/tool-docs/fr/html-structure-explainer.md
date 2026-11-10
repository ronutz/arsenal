## Ce que fait l’outil

L’outil lit du HTML (un document entier ou un fragment) avec l’analyseur que la spécification impose aux navigateurs, et montre ce qui en sort : l’arbre (chaque élément, nœud texte et commentaire, indenté selon sa profondeur, avec la ligne de sa balise), les éléments que l’analyseur a créés sans balise, les balises de fin qu’il a ajoutées, les éléments de mise en forme qu’il a scindés, le contenu qu’il a sorti d’un tableau, le mode du document (no-quirks, limited-quirks ou quirks), le DOCTYPE, le titre, la langue et l’encodage que déclare le document, chaque erreur d’analyse sous le code que lui donne le standard, avec sa ligne et sa colonne, le plan des titres, et une liste de constats sur la structure et l’accessibilité, chacun rattaché à une phrase du HTML Standard ou des WCAG 2.2. Il compte aussi ce qui se serait exécuté et ne l’a pas été : éléments script, gestionnaires d’évènements en ligne, URL javascript:, éléments style, iframes.

L’analyseur est parse5, l’analyseur HTML conforme à la spécification qu’utilisent jsdom, Cheerio et le compilateur Angular, exécuté avec les positions dans la source et la fonction de rappel des erreurs d’analyse activées, et avec l’indicateur de script (scripting flag) désactivé (comme le fait DOMParser). Rien n’est exécuté, récupéré ni affiché. L’API hébergée exécute le même code et renvoie le même arbre.

## Lecture de l’arbre

- Un **point** dans la marge des numéros de ligne signale un nœud sans position dans la source : c’est l’analyseur qui l’a créé. Le standard précise que l’omission d’une balise d’ouverture ne supprime pas l’élément, qui reste implicite mais bien présent (« Omitting an element's start tag in the situations described below does not mean the element is not present; it is implied, but it is still there. »). html, head, body et tbody sont les cas habituels.
- **fin ajoutée** signale un élément dont la balise de fin ne figure pas dans la source. Le standard l’autorise pour 19 éléments (13.1.2.4 Optional tags : html, head, body, li, dt, dd, p, rt, rp, optgroup, option, colgroup, caption, thead, tbody, tfoot, tr, td, th) ; pour tout autre élément, cela signifie que la balise de fin manquait ou qu’une autre balise de fin l’a fermé d’abord, et le constat D13 précise lequel des deux.
- **morceau n** signale le résultat de l’algorithme de l’agence d’adoption (adoption agency algorithm) : quand une balise de fin ferme un élément de mise en forme (a, b, i, em, strong, font, small, s, u, code, nobr, big, tt, strike) qui n’est pas l’élément ouvert le plus interne, l’analyseur le ferme et en rouvre une copie autour de ce qui suit, si bien qu’un seul élément de la source en devient plusieurs (constat D14).
- **déplacé** signale le foster parenting : du texte ou des éléments écrits à l’intérieur d’un tableau, là où seules des parties de tableau peuvent figurer, sont insérés avant le tableau (constat D15).
- **vide** signale les 13 éléments qui n’ont jamais de balise de fin (area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr). Une barre oblique finale y est inutile et sans aucun effet (« unnecessary and has no effect of any kind ») ; sur tout autre élément HTML, c’est une erreur d’analyse, et l’élément reste ouvert.

## Les erreurs d’analyse

Le standard définit exactement le traitement des erreurs : un document qui en contient a donc toujours un seul arbre exact. Les erreurs d’analyse n’y sont que des erreurs de syntaxe HTML (« Parse errors are only errors with the syntax of HTML. »). Sa table des erreurs nommées (13.2.2) compte 52 codes, chacun avec une description non normative ; la page cite cette description à côté de chaque erreur. Les erreurs de construction de l’arbre (une balise de fin isolée, des éléments restés ouverts à la fin, un second body) sont décrites dans le texte du standard, sans code ; parse5 les nomme lui-même (missing-doctype, end-tag-without-matching-open-element, open-elements-left-after-eof et neuf autres), et la page indique quelle autorité a nommé chaque code.

## Les constats

D1, pas de DOCTYPE, et D2, un DOCTYPE hérité (mode quirks) ; D3, pas de lang sur la racine (WCAG 3.1.1) ; D4, le titre absent, répété ou vide (modèle de contenu de head, WCAG 2.4.2) ; D5, la déclaration d’encodage des caractères absente, placée au-delà des 1024 premiers octets, ou autre que UTF-8 ; D6, img sans alt, et D7, img avec un alt vide (WCAG 1.1.1 et les règles du standard sur le texte alternatif) ; D8, un lien ou un bouton fait uniquement d’images sans texte alternatif ; D9, les sauts de niveau de titre et l’absence de h1 (4.3.11 : « less than, equal to, or 1 greater ») ; D10, les id en double ; D11 et D12, les éléments et attributs obsolètes de la section 16.2, chacun avec le remplacement que conseille le standard ; D13 à D16, ce que l’analyseur a réparé ; D17, un contrôle étiquetable sans label ; D18, ce qui ne s’est pas exécuté ; D19, les titres vides (WCAG 2.4.6) ; D20, les éléments créés par l’analyseur.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le HTML tel que collé : l’arbre, les erreurs d’analyse et les constats dépendent de chacun de ses caractères, et rien ne peut donc être remplacé sans changer la lecture. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis une mise en garde qui lui est propre (un HTML collé peut nommer des hôtes et des chemins internes), puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. L’option « valeurs d’attribut complètes » n’est pas transmise.

Une page enregistrée depuis une session authentifiée peut encore contenir des identifiants : avant qu’un lien soit proposé, le texte passe donc par le contrôle des secrets du site. Une valeur que son format désigne comme un secret empêche la création du lien, et la fenêtre contextuelle nomme sa ligne : une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sections 10 et 11), un JWS ou un JWE ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), section 7.1, la sérialisation qu’utilisent les JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), des identifiants Authorization écrits sous forme de ligne d’en-tête ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1) ou un identifiant de clé d’accès AWS. Remplacez-la par une valeur fictive, puis appuyez de nouveau sur le bouton. Une valeur dont seul le nom ressemble à un secret (un membre JSON comme `apiToken`) obtient tout de même un lien, et la ligne de mise en garde nomme sa ligne pour que vous la vérifiiez d’abord.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le HTML n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le HTML remplace le contenu de la zone comme un collage, et la page l’analyse ; rien n’est exécuté, récupéré ni affiché. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Limites

- parse5 8.0.1 implémente le standard tel qu’il était à sa publication. La tokenisation des instructions de traitement (processing instructions) ajoutée au standard en 2026 n’y figure pas : `<?…>` est signalé sous l’ancien nom unexpected-question-mark-instead-of-tag-name et devient un commentaire, ce que fait aussi le standard actuel pour une cible xml.
- Les constats lisent la structure, pas le sens : la qualité d’un texte alternatif, la pertinence d’un titre pour sa section ou la justesse d’une balise lang ne sont pas des questions auxquelles un analyseur peut répondre. headingoffset et headingreset ne sont pas appliqués au plan.
- La liste de l’arbre s’arrête à 2000 nœuds (les décomptes couvrent tout) ; les entrées de plus de 200 000 caractères sont refusées.

## Sources

- [HTML Living Standard, 13 The HTML syntax: 13.2.2 Parse errors](https://html.spec.whatwg.org/multipage/parsing.html#parse-errors) (consulté le 05/10/2026)
- [HTML Living Standard, 4.3.11 Headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines) (consulté le 05/10/2026)
- [HTML Living Standard, 16.2 Non-conforming features](https://html.spec.whatwg.org/multipage/obsolete.html#non-conforming-features) (consulté le 05/10/2026)
- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (consulté le 05/10/2026)
- [parse5](https://github.com/inikulin/parse5) (consulté le 05/10/2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 01/11/2026) : section 3.5, le fragment, qu’utilise un lien Partager les résultats
