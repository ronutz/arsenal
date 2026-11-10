## Ce que fait l’outil

Collez une chaîne de chiffrement F5 BIG-IP : l’outil explique chacun de ses mots-clés et de ses opérateurs, et signale les choix faibles ou obsolètes. Il lit la chaîne, c’est-à-dire la valeur du champ `cipher` d’une règle de chiffrement (cipher rule) ou d’un profil SSL, et traduit sa syntaxe compacte en une description claire de ce qu’elle sélectionne et dans quel ordre. Il s’exécute entièrement dans votre navigateur.

## Construction d’une chaîne de chiffrement F5

Une chaîne de chiffrement BIG-IP est une liste ordonnée d’ensembles de suites (cipher sets), séparés par un deux-points, une virgule ou un espace, et l’ordre compte, car il exprime la préférence du serveur. Au sein d’un ensemble, les mots-clés se combinent avec `+` : `ECDHE+AES-GCM` désigne ainsi les suites qui sont à la fois ECDHE et AES-GCM. Les mots-clés nomment les composants d’une suite : la version du protocole, l’échange de clés, l’authentification, l’algorithme de chiffrement des données et le MAC. `DEFAULT` représente l’ensemble par défaut intégré de F5, un point de départ courant.

## Les opérateurs, la partie subtile

Un ensemble peut commencer par un opérateur, et la différence entre eux compte :

- **`!`** exclut définitivement les suites correspondantes ; une fois exclues de cette façon, aucun terme ultérieur ne peut les rajouter.
- **`-`** supprime les suites correspondantes mais, contrairement à `!`, un terme ultérieur peut les rajouter.
- **`+`** n’ajoute rien ; il déplace les suites correspondantes à la fin, ce qui abaisse leur priorité.

Enfin, `@STRENGTH` trie de nouveau toute la liste selon la longueur de clé. Confondre `!` et `-`, ou oublier que `+` réordonne au lieu d’ajouter, est une source fréquente de chaînes de chiffrement qui ne font pas ce que leur auteur voulait, et c’est exactement ce que l’outil rend visible.

## La lecture de sécurité, et une limite assumée

L’outil signale les éléments faibles et obsolètes, comme les suites de niveau export, RC4 ou 3DES et les versions de protocole périmées, pour qu’une chaîne risquée saute aux yeux. Il y a une chose qu’il ne fait pas, délibérément : il ne reproduit pas la liste ordonnée finale exacte des suites de chiffrement que produirait un BIG-IP donné, car elle dépend de la table des suites de la version logicielle installée sur le boîtier. Il explique la chaîne ; il ne remplace pas l’équipement.

## Utilisation

Collez une chaîne de chiffrement issue d’une règle de chiffrement ou d’un profil SSL et lisez l’explication de chaque mot-clé et de chaque opérateur, avec les choix faibles signalés. L’analyse est déterministe et locale.

## Partage des résultats

Sous la lecture de sécurité, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la chaîne de chiffrement ou le nom de règle tel que vous l’avez saisi : `/tools/f5-cipher-string-expander#input=ECDHE%3ARSA%3A!SSLv3...`. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la chaîne n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Ouverture d’un lien.** La chaîne remplit la zone comme le ferait un collage, et la page l’explique. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
