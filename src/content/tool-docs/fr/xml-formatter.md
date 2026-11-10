## Ce que fait l’outil

Collez un document XML : l’outil vous dit d’abord s’il est bien formé. S’il ne l’est pas, vous obtenez la ligne, la colonne (comptée en caractères), un code d’erreur stable, un message clair qui nomme la règle et sa section dans la recommandation XML 1.0, et la ligne fautive avec un accent circonflexe sous la colonne. S’il est bien formé, vous le récupérez indenté avec deux espaces, quatre espaces ou une tabulation par niveau, ou minifié, avec les commentaires conservés ou supprimés. Tout s’exécute dans votre navigateur.

Ses règles viennent de la recommandation du W3C [Extensible Markup Language (XML) 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/) du 26 novembre 2008. Il voisine avec le [formateur JSON](/tools/json-formatter) et le [convertisseur JSON et YAML](/tools/json-yaml-convert). Le [décodeur XML](/tools/xml-decoder) est un autre outil : il lit la structure d’un document et sa surface d’attaque (DOCTYPE, entités externes, expansion d’entités) et ne le réécrit pas.

## Ce que vérifie le verdict

Ces règles, toutes tirées de la recommandation, décident ici de la bonne formation :

- **Un seul élément racine** (section 2.1) : exactement un élément au premier niveau ; avant et après lui, uniquement des commentaires, des instructions de traitement et des espaces.
- **Caractères autorisés** (section 2.2) : la tabulation, le saut de ligne, le retour chariot et les plages Unicode de la production `Char`. Un caractère de contrôle comme U+0001, un demi-codet (surrogate) isolé, U+FFFE ou U+FFFF est refusé où qu’il apparaisse.
- **Noms** (section 2.3) : les noms d’éléments et d’attributs, les cibles d’instructions de traitement et les noms d’entités suivent la production `Name`, lettres hors ASCII comprises.
- **Données textuelles** (section 2.4) : `&` et `<` n’apparaissent jamais seuls dans le texte, et la séquence `]]>` n’apparaît jamais dans le texte.
- **Commentaires** (section 2.5) : pas de `--` à l’intérieur, et pas de `--->` à la fin.
- **Instructions de traitement** (section 2.6) : un nom de cible, puis des espaces ou `?>` ; la cible n’est jamais `xml`, quelle que soit la casse.
- **Sections CDATA** (section 2.7) : elles se terminent au premier `]]>` et ne figurent qu’à l’intérieur d’un élément.
- **La déclaration XML** (section 2.8) : uniquement tout au début, sans rien avant elle, et sous la forme `<?xml version="1.x" encoding="..." standalone="..."?>`, encoding et standalone étant facultatifs et dans cet ordre.
- **La déclaration de type de document** (section 2.8) : une seule fois, avant l’élément racine, avec un nom, un identifiant `SYSTEM` ou `PUBLIC` facultatif (un identifiant public n’utilise que les caractères qu’autorise la production [13]) et un sous-ensemble interne facultatif qui ne contient que des déclarations de balisage, des commentaires, des instructions de traitement, des références d’entités paramètres et des espaces, sans référence d’entité paramètre à l’intérieur d’une déclaration (la règle PEs in Internal Subset). Les déclarations d’entités du sous-ensemble interne sont vérifiées par rapport à leur grammaire (section 4.2).
- **Balises et attributs** (section 3.1) : balises ouvrantes, balises fermantes et balises d’élément vide ; chaque balise fermante correspond à l’élément ouvert (Element Type Match) ; aucun attribut n’apparaît deux fois dans une balise (Unique Att Spec) ; chaque valeur d’attribut est entre guillemets et ne contient pas de `<`.
- **Références** (section 4.1) : chaque `&` ouvre une référence bien formée ; une référence de caractère désigne un caractère autorisé ; une référence d’entité désigne une entité déclarée quand la règle Entity Declared s’applique, c’est-à-dire sans DTD, avec un sous-ensemble interne seul et sans référence d’entité paramètre, ou avec `standalone="yes"`. Sans déclaration, seules `&amp;`, `&lt;`, `&gt;`, `&apos;` et `&quot;` existent : les noms HTML comme `&nbsp;` sont donc refusés. Une référence à une entité déclarée avec `NDATA` est refusée (Parsed Entity), tout comme une référence directe à une entité externe dans une valeur d’attribut (No External Entity References).

Ce que l’outil ne vérifie **pas**, sans détour :

- **La validité.** Savoir si le document respecte une DTD, un XML Schema ou tout autre schéma est une autre question ; l’outil ne vérifie que la bonne formation.
- **La grammaire interne des déclarations `<!ELEMENT`, `<!ATTLIST` et `<!NOTATION`**, ni rien de ce que contient une DTD externe, qui n’est jamais lue.
- **Les règles qui exigent le texte de remplacement d’une entité**, car aucune entité n’est jamais développée : une référence indirecte à une entité externe dans une valeur d’attribut, un `<` qui atteint une valeur d’attribut par l’intermédiaire d’une entité, la récursion entre entités et la bonne formation du texte de remplacement lui-même.
- **Les noms quand le DOCTYPE renvoie ailleurs.** Quand le DOCTYPE désigne une DTD externe ou que le sous-ensemble interne utilise des entités paramètres (et que la déclaration ne dit pas `standalone="yes"`), un nom d’entité peut être déclaré là où l’outil ne lit jamais : les noms inconnus sont donc acceptés, et une remarque le signale.
- **Les espaces de noms.** Les préfixes restent partie intégrante des noms ; savoir si chaque préfixe est déclaré relève de la recommandation distincte Namespaces in XML, et non de XML 1.0, et n’est pas vérifié.
- **La déclaration d’encodage.** Ce que vous collez est déjà du texte : le nom d’encodage est conservé tel qu’écrit et n’est comparé à rien.

## Ce que « non significatif » veut dire ici

La section 2.10 de la recommandation dit qu’un processeur XML doit toujours transmettre à l’application tous les caractères d’un document qui ne relèvent pas du balisage (« MUST always pass all characters in a document that are not markup through to the application »). Les espaces d’un document sont des données, sauf indication contraire. Un formateur doit donc décider quels espaces il peut traiter comme de la mise en page, et celui-ci tranche de façon restrictive :

- **Le seul texte qu’il modifie, ce sont les espaces entre éléments** : un nœud texte composé uniquement d’espaces, de tabulations et de sauts de ligne, à l’intérieur d’un élément qui a au moins un élément enfant et ne contient aucune autre donnée textuelle. Le mode Indenté remplace chacun de ces nœuds par un saut de ligne suivi de l’indentation de la ligne suivante ; le mode Minifié le supprime. Les espaces en dehors de l’élément racine relèvent du balisage selon la section 2.4 : ils sont donc mis en page de la même façon.
- **Le contenu mixte n’est jamais touché.** La section 3.2.2 dit qu’un élément a un contenu mixte quand il peut contenir des données textuelles, éventuellement entremêlées d’éléments enfants (« may contain character data, optionally interspersed with child elements »). Quand un élément contient du texte autre que des espaces, une référence de caractère ou d’entité, ou une section CDATA, tout son contenu, éléments enfants compris, est recopié exactement tel qu’écrit : y insérer un saut de ligne changerait le texte.
- **`xml:space="preserve"` est respecté.** La section 2.10 définit l’attribut spécial `xml:space`, avec les valeurs `default` et `preserve` ; `preserve` signale que les applications devraient conserver tous les espaces, et cette intention s’applique à chaque élément contenu, sauf si une autre occurrence de l’attribut la remplace (« unless overridden with another instance of the xml:space attribute »). Le contenu placé sous `preserve` est recopié tel qu’écrit, et un élément intérieur qui porte `xml:space="default"` est de nouveau mis en forme. Toute autre valeur est une erreur dont la recommandation permet à un processeur de se remettre en ignorant l’attribut ; l’outil l’ignore pour la mise en forme, le conserve tel qu’écrit et ajoute une remarque.
- **Un élément sans élément enfant garde son contenu tel qu’écrit**, même quand ce contenu se compose uniquement d’espaces, ou d’espaces et de commentaires. `<a>   </a>` reste `<a>   </a>`, et quand les commentaires sont supprimés, un `<a>` qui contient un commentaire entre deux sauts de ligne garde les deux sauts de ligne.

**Un schéma peut tout de même rendre ces espaces significatifs.** Sans lire de DTD ni de schéma, un analyseur ne peut pas savoir si un élément a un contenu d’éléments ou un contenu mixte ; la section 2.10 ne demande qu’à un processeur validant d’indiquer à l’application quels espaces figurent dans un contenu d’éléments. Un schéma qui déclare un élément comme du texte pourrait faire entrer dans sa valeur jusqu’aux espaces situés entre ses enfants. Si un destinataire de votre document y est sensible, conservez l’original.

## Ce qui est conservé tel qu’écrit

- Le texte, les sections CDATA, les commentaires (sauf si vous les supprimez) et les instructions de traitement, caractère pour caractère.
- La déclaration XML, telle que saisie, guillemets compris.
- Chaque valeur d’attribut entre ses guillemets, avec le guillemet employé à l’écriture : les guillemets simples restent simples et les doubles restent doubles. Seuls les espaces à l’intérieur d’une balise sont remis en ordre : un espace avant chaque attribut, aucun autour de `=` et aucun avant `>` ou `/>`.
- Les balises d’élément vide restent des balises d’élément vide (`<b/>`), et une balise ouvrante suivie d’une balise fermante reste telle quelle (`<c></c>`).
- Les références de caractères (`&#169;`, `&#x2122;`) et les références d’entités (`&amp;`, `&org;`) sont recopiées telles qu’écrites, jamais remplacées par les caractères qu’elles représentent.
- Le DOCTYPE, sous-ensemble interne compris, est recopié comme du texte, sauts de ligne inclus.

Deux modifications ont toujours lieu, et le résultat le signale quand elles se produisent : un indicateur d’ordre des octets (U+FEFF) en tête est supprimé, et un retour chariot suivi d’un saut de ligne, ou un retour chariot seul, est lu comme un saut de ligne, ce que la section 2.11 exige de tout processeur XML. La sortie se termine sans saut de ligne final.

## Sécurité : rien n’est développé, rien n’est récupéré

L’outil ne développe jamais une entité, ne lit jamais une DTD externe et ne récupère jamais un identifiant `SYSTEM` ou `PUBLIC` : le DOCTYPE est conservé comme du texte, et la seule chose que l’outil tire d’un sous-ensemble interne, c’est quelles entités générales sont déclarées, et comment. Un document conçu pour une attaque par entité externe XML ou par expansion d’entités n’est donc ici que du texte. La saisie est limitée à 2 000 000 caractères et à 1000 niveaux d’imbrication, et l’analyseur ne lit le texte qu’une fois : un document hostile ne peut donc pas bloquer la page. Le décodeur XML ne développe rien non plus, mais il nomme ce qu’un tel document ferait à un analyseur qui, lui, développe les entités : il signale les entités externes, les entités paramètres et les entités qui font référence à d’autres entités.

## Documents signés

Ne remettez pas en forme un document signé, comme une assertion SAML signée. Pour valider une référence, un vérificateur obtient les données signées, applique les transformations de la signature, calcule le condensat du résultat et le compare à la valeur de condensat qui figure dans la signature ; toute différence fait échouer la validation ([XML Signature 1.1, section 3.2.1](https://www.w3.org/TR/xmldsig-core1/)). La spécification SAML Core dit que les implémentations devraient (SHOULD) utiliser Exclusive XML Canonicalization, aussi bien pour les informations signées que comme transformation ([SAML 2.0 core, section 5.4.3](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf)). La canonisation exclusive traite les espaces comme le fait Canonical XML ([Exclusive XML Canonicalization, sections 1.1 et 3](https://www.w3.org/TR/xml-exc-c14n/)), et Canonical XML conserve tous les espaces du contenu textuel (« all whitespace in character content »), y compris les espaces entre balises ([Canonical XML 1.1, section 1.1 et exemple 3.2](https://www.w3.org/TR/xml-c14n/)). Réindenter un document signé change donc le condensat, et la signature ne se vérifie plus. Lire une copie mise en forme ne pose aucun problème ; la transmettre, si. Pour lire ce qu’affirme un message SAML, et s’il est signé et comment, utilisez le [décodeur SAML](/tools/saml-decoder).

## Options

- **Mode.** Le mode Indenté place chaque enfant d’un élément à contenu d’éléments sur sa propre ligne, indenté d’un niveau de plus que son parent, la balise fermante revenant au niveau du parent. Le mode Minifié supprime les mêmes espaces et n’en ajoute aucun.
- **Indentation.** Deux espaces, quatre espaces ou une tabulation par niveau (mode Indenté uniquement).
- **Conserver les commentaires.** Activé par défaut. Désactivé, chaque commentaire est omis, à l’intérieur comme à l’extérieur de la racine, et les compteurs indiquent combien.

## Codes d’erreur

| Code | Signification | Section |
|---|---|---|
| `empty` | Rien que des espaces (signalé par l’API ; la page se contente d’attendre) | |
| `too-large` | Plus de 2 000 000 caractères | |
| `too-deep` | Plus de 1000 éléments imbriqués | |
| `illegal-character` | Un caractère hors de `Char` | 2.2 |
| `bad-xml-declaration` | Une déclaration XML mal formée, ou `<?XML` au début | 2.8 |
| `misplaced-xml-declaration` | Une déclaration XML ailleurs que tout au début | 2.6, 2.8 |
| `bad-pi` | Une instruction de traitement sans cible valide | 2.6 |
| `unterminated-pi` | Pas de `?>` | 2.6 |
| `unterminated-comment` | Pas de `-->` | 2.5 |
| `comment-double-hyphen` | `--` dans un commentaire, ou `--->` | 2.5 |
| `unterminated-cdata` | Pas de `]]>` | 2.7 |
| `cdata-outside-root` | Une section CDATA en dehors de tout élément | 2.7 |
| `bad-doctype` | Un DOCTYPE mal formé | 2.8 |
| `unterminated-doctype` | Un DOCTYPE jamais fermé | 2.8 |
| `bad-internal-subset` | Dans le sous-ensemble interne, autre chose que des déclarations, des commentaires, des instructions de traitement, des références d’entités paramètres et des espaces, une référence d’entité paramètre à l’intérieur d’une déclaration, ou une déclaration d’entité mal formée | 2.8, 4.2 |
| `misplaced-doctype` | Un DOCTYPE après le début de la racine, ou un deuxième DOCTYPE | 2.8 |
| `unknown-markup` | `<!` qui n’ouvre ni un commentaire, ni une section CDATA, ni le DOCTYPE | |
| `bad-start-tag` | Une balise ouvrante sans nom valide, ou contenant un caractère parasite | 3.1 |
| `bad-attribute` | Pas de `=`, pas de guillemets, ou pas d’espace avant un attribut | 3.1 |
| `duplicate-attribute` | Le même attribut deux fois dans une balise | 3.1 |
| `lt-in-attribute` | Un `<` dans une valeur d’attribut | 3.1 |
| `unterminated-tag` | La saisie se termine à l’intérieur d’une balise | 3.1 |
| `bad-end-tag` | Autre chose que des espaces entre le nom d’une balise fermante et son `>` | 3.1 |
| `mismatched-end-tag` | Une balise fermante qui ne correspond pas à l’élément ouvert | 3.1 |
| `unexpected-end-tag` | Une balise fermante sans élément ouvert | 3.1 |
| `unclosed-element` | Un élément jamais fermé (signalé là où il s’ouvre) | 3.1 |
| `bad-reference` | `&` qui n’est pas suivi d’une référence bien formée | 2.4, 4.1 |
| `illegal-char-reference` | Une référence de caractère vers un caractère hors de `Char` | 4.1 |
| `undeclared-entity` | Une référence à une entité non déclarée, quand Entity Declared s’applique | 4.1 |
| `unparsed-entity-reference` | Une référence à une entité déclarée avec `NDATA` | 4.1 |
| `external-entity-in-attribute` | Une référence directe à une entité externe dans une valeur d’attribut | 3.1 |
| `cdata-end-in-text` | `]]>` dans le texte | 2.4 |
| `text-outside-root` | Du texte avant ou après l’élément racine | 2.1, 2.8 |
| `multiple-roots` | Un deuxième élément de premier niveau | 2.1 |
| `no-root` | Aucun élément | 2.1 |

## Exemples commentés

- **Le bouton Exemple** : une Response de type SAML 2.0 sur une seule ligne, telle qu’elle arrive d’un binding, avec les espaces de noms `samlp` et `saml`, un code de statut `Success` et un NameID `emailAddress` (les noms de la norme [OASIS SAML 2.0 core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) ; le message n’est pas signé). Indentée avec deux espaces, elle occupe 18 lignes ; minifier ces lignes redonne la ligne unique, octet pour octet. Le `&amp;` de `<saml:AttributeValue>admin &amp; auditor</saml:AttributeValue>` reste `&amp;`.
- **Contenu mixte** : dans `<para>Use <code>--force</code> only when <emphasis>all</emphasis> nodes agree.</para>`, rien n’est réindenté, et un `<para>` dont le texte s’étend sur trois lignes garde ses sauts de ligne, ses espaces et la position de sa balise fermante.
- **`xml:space`** : sous `<poem xml:space="preserve">`, le saut de ligne et les trois espaces qui précèdent le second `<line>` restent en place ; dans `<listing xml:space="preserve">`, un enfant `<meta xml:space="default">` qui a deux éléments enfants est de nouveau mis en page.
- **CDATA, commentaires, instructions de traitement** : `<step id="1"><![CDATA[if (a < b && c) { go(); }]]></step>` reste sur une seule ligne, tel qu’écrit ; `<?xml-stylesheet type="text/xsl" href="view.xsl"?>` est une instruction de traitement (sa cible commence par `xml-`, qui n’est pas le `xml` réservé) et elle est conservée ; `<step id='2'>` garde ses guillemets simples.
- **Un DOCTYPE avec des références** : `<from>&org;</from>` garde `&org;` (déclarée dans le sous-ensemble interne, jamais développée), `<sign>&#169; 2026 &#x2122;</sign>` garde ses deux références de caractères, et `<to   lang = "pt-BR" >` devient `<to lang="pt-BR">`.
- **Refus** : `<a>AT&T</a>` s’arrête à la ligne 1, colonne 6, avec `bad-reference` ; `<a>&nbsp;</a>` avec `undeclared-entity` ; un saut de ligne avant `<?xml version="1.0"?>` avec `misplaced-xml-declaration` à la ligne 2, colonne 1.

## Provenance

Le moteur fait une seule passe sur le texte avec une pile d’éléments explicite, sans horloge, sans réseau et sans aléa. Il est livré avec des vecteurs de référence (golden vectors, ensemble `xml-formatter-golden-2026-10-26`) : 20 documents acceptés dont la sortie est fixée octet pour octet, écrite à la main à partir des règles ci-dessus avant toute exécution du moteur, et 42 refus fixés par code, ligne et colonne, au moins un pour chaque code d’erreur. Chaque document accepté est aussi vérifié pour deux propriétés : remettre la sortie en forme ne change rien, et minifier la sortie donne le même texte que minifier l’entrée. Pendant le développement, les verdicts ont été comparés à ceux de l’analyseur Expat 2.6.1 fourni avec Python 3.13, sur environ 500 000 documents générés, et concordaient pour tous sauf une classe : Expat accepte un numéro de version qui n’est pas « 1. » suivi de chiffres, comme `"10"` ou `"2.0"`, ce que la production [26] de la recommandation (`'1.' [0-9]+`) n’autorise pas. La page des errata de la recommandation a été lue le même jour : sa correction proposée S01 reformule les noms réservés et déclare interdite la cible `xml`, que la production [17] exclut déjà, et E01 ajoute une remarque sur la normalisation Unicode ; aucune ne modifie une règle qu’applique le moteur.

## API

Le même moteur répond à l’opération `/api/v1/xml-formatter` de l’API HTTP du site, décrite dans le contrat OpenAPI de la [page API](/api) ; le contrat indique aussi si ce site sert l’API.

- **Requête.** Le document XML sous forme de texte, dans le corps d’un POST ou dans le paramètre de requête `input` d’un GET. L’API applique les options par défaut : indenté, deux espaces, commentaires conservés.
- **Réponse.** `ok` ; si le document est bien formé, `output` et `stats` (`elements`, `attributes`, `comments`, `commentsDropped`, `cdataSections`, `processingInstructions`, `maxDepth`, `mixedContentElements`, `preserveElements`, `insignificantWhitespaceNodes`) ; sinon `error`, avec `code`, un `message` en anglais, `line`, `column`, `offset`, `excerpt`, `excerptColumn` et `params`. Les deux formes contiennent `notes` (`bom-removed`, `line-endings-normalised`, `doctype-kept`, `entities-unchecked`, `xml-space-invalid`) et les `options` appliquées. Un document mal formé est une réponse normale avec `ok` à false, pas une erreur HTTP.

## Partage des résultats

Sous le verdict (ou sous la ligne fautive, qui est aussi le verdict), le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le document tel que collé et les trois choix (Indenté ou Minifié, l’indentation, les commentaires conservés ou supprimés). Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Un document XML peut contenir des jetons, des hôtes internes et des noms de personnes : la fenêtre contextuelle vous demande donc de le relire avant d’envoyer le lien. Avant qu’un lien soit proposé, le texte est examiné à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 et 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 : la forme « user:password » est déconseillée, « is deprecated »), un identifiant de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret (un élément `password`, un attribut `apiKey`) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier. Deux autres emplacements comptent comme des identifiants, comme sur le décodeur XML : le `Password` d’un `UsernameToken` WS-Security ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html) : il fournit le mot de passe ou un équivalent, comme une empreinte, « provides password information (or equivalent such as a hash) »), et une assertion SAML signée ou chiffrée. L’Exemple de la page, une Response de type SAML non signée, ne contient ni l’un ni l’autre : son lien est créé.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone et les choix sont réglés comme vous le feriez, puis la page le vérifie et le met en forme, localement : aucune entité n’est développée et rien n’est récupéré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [W3C, Extensible Markup Language (XML) 1.0 (Fifth Edition), recommandation du W3C du 26 novembre 2008](https://www.w3.org/TR/xml/) (consultée le 26/10/2026) : sections 2.1 à 2.11, 3.1, 3.2.2, 4.1 et 4.2 ; [errata](https://www.w3.org/XML/xml-V10-5e-errata) (consultés le 26/10/2026)
- [W3C, Canonical XML Version 1.1, recommandation du W3C du 2 mai 2008](https://www.w3.org/TR/xml-c14n/) (consultée le 26/10/2026 ; cette adresse sert désormais la version 1.1) : section 1.1 et exemple 3.2
- [W3C, Exclusive XML Canonicalization Version 1.0, recommandation du W3C du 18 juillet 2002](https://www.w3.org/TR/xml-exc-c14n/) (consultée le 26/10/2026) : sections 1.1 et 3
- [W3C, XML Signature Syntax and Processing Version 1.1, recommandation du W3C du 11 avril 2013](https://www.w3.org/TR/xmldsig-core1/) (consultée le 26/10/2026) : section 3.2.1
- [OASIS, Assertions and Protocols for the OASIS Security Assertion Markup Language (SAML) V2.0, norme OASIS du 15 mars 2005](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) (consultée le 26/10/2026) : section 5.4.3, ainsi que les noms d’espaces de noms, le code de statut Success et le format de NameID emailAddress utilisés dans l’Exemple
