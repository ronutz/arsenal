## Ce que fait l’outil

Collez deux configurations FortiOS séparées par une ligne `---` et obtenez un diff **structurel** : ce qui a changé par section, par objet et par paramètre. Tout s’exécute dans votre navigateur.

## Pourquoi un diff ligne à ligne n’est pas le bon outil ici

Un diff textuel trouve un **script d’édition** minimal, ce qui n’est pas la même chose que le changement qu’a fait un humain. Appliqué à une sortie FortiOS, cela produit trois désagréments précis :

- Un bloc qui a **bougé** est signalé comme une suppression plus une insertion : la relecture d’un objet inchangé coûte autant d’attention qu’une vraie modification.
- Un objet semble modifié parce qu’un voisin a gagné une ligne et que l’alignement s’est décalé.
- Trois vraies modifications restent enfouies dans quatre cents lignes de contexte inchangé.

L’outil analyse les deux côtés en sections, objets et paramètres, puis compare les structures. Un bloc qui a bougé n’est pas un changement. Un paramètre modifié tient en une ligne qui nomme l’ancienne valeur et la nouvelle.

## Le seul endroit où l’ordre n’est pas du bruit

Pour la plupart des sections, l’ordre des objets est sans importance : objets d’adresse, objets de service, interfaces. Y signaler un réordonnancement serait du bruit : il est donc ignoré.

Pour **firewall policy** et ses semblables, l’ordre **est** le comportement. La première correspondance l’emporte : déplacer une politique au-dessus d’une autre change ce que fait l’équipement sans modifier un seul paramètre. C’est la modification qu’un diff ligne à ligne enfouit le plus profondément, car rien, de part et d’autre du déplacement, ne diffère textuellement, hormis la position.

Ces sections sont traitées comme sensibles à l’ordre d’après leur nom, et un réordonnancement y est signalé comme un vrai constat :

`firewall policy` · `firewall policy6` · `firewall proxy-policy` · `firewall local-in-policy` · `firewall shaping-policy` · `firewall security-policy` · `router policy` · `router policy6` · `system sdwan`

Traiter les deux cas de la même façon, dans un sens ou dans l’autre, rendrait l’outil faux : les deux comportements sont donc figés par des vecteurs de référence (golden vectors).

## Entrée

Deux configurations, soit séparées par une ligne qui ne contient que `---`, soit étiquetées par `BEFORE:` et `AFTER:` sur leurs propres lignes. Chaque côté est une sortie ordinaire de `show` ou de `show full-configuration`.

Les blocs `config` imbriqués dans un objet sont analysés, et leurs paramètres sont préfixés par le chemin d’imbrication pour ne pas entrer en collision avec un paramètre du même nom sur l’objet parent.

## Ce que l’outil ne fait pas

**Il compare, il ne juge pas.** Il vous dira qu’une politique a bougé ou qu’une adresse a changé ; il ne vous dira pas si c’était une bonne idée, car cela dépend d’une intention qu’il ne peut pas voir.

Il ne modélise pas non plus le poids sémantique d’un paramètre. Modifier un commentaire et modifier une action se lisent tous deux comme un paramètre modifié, et c’est à vous de savoir lequel compte.

Une entrée identique produit le silence plutôt qu’une bannière rassurante. Un outil de diff qui trouve des changements fantômes n’est pas fiable sur ceux qui comptent : un vecteur fige donc aussi ce cas.

## Partage des résultats

En tête de la comparaison, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, une copie de la zone, c’est-à-dire les deux configurations avec la valeur de chaque paramètre secret de FortiOS remplacée par un repère numéroté, jamais la zone telle que collée. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. La fenêtre contextuelle indique aussi combien de valeurs ont été remplacées.

Les paramètres remplacés sont ceux que la [référence CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) définit comme mots de passe (de type `password`, `password-2`, `password-3` ou `password_aes256` ; consultée le 01/11/2026) : les `psksecret`, `psksecret-remote` et `ppk-secret` d’une phase 1 IPsec, le `password` d’un administrateur et le `passwd` d’un utilisateur local, l’`api-key` d’un utilisateur d’API, les valeurs `secret` RADIUS (Remote Authentication Dial-In User Service), les valeurs `key` de TACACS+ et de la HA, les `auth-pwd` et `priv-pwd` SNMPv3, le `password` BGP (Border Gateway Protocol) et LDAP (Lightweight Directory Access Protocol), l’`authentication-key` et la `key-string` OSPF (Open Shortest Path First), une `passphrase` Wi-Fi et les clés secrètes des connecteurs cloud ; tout paramètre dont le nom se termine par un mot comme password, secret ou token ; le `name` d’une communauté SNMP, qui est la chaîne de communauté elle-même ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5 ; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), section 5.2.1) ; et toute valeur `ENC`, quel que soit son paramètre. L’avis [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) de Fortinet (consulté le 01/11/2026) indique qu’une configuration publiée volontairement sur un forum pour un dépannage (« willingly posted on a forum for troubleshooting purpose ») peut voir ses données `ENC` déchiffrées en clair, et que ces données doivent être considérées comme faciles à déchiffrer (« should currently be considered “easy to decrypt” ») : une valeur `ENC` est donc traitée comme le secret qu’elle contient. Chaque valeur devient un repère numéroté (`[redacted-1]`, `[redacted-2]`, etc.), le même numéro pour la même valeur ; le mot `ENC`, les guillemets et tous les autres caractères restent. Aucune option ne permet de remettre les valeurs : aucune ne change la lecture, et chacune constitue des identifiants. Comme des valeurs égales gardent des repères égaux et des valeurs différentes des repères différents, un secret qui a changé entre les deux côtés apparaît toujours comme un paramètre modifié (`psksecret: ENC [redacted-1] → ENC [redacted-3]`), et un secret inchangé, toujours pas.

Une valeur qui déborde de sa ligne ne peut pas y être remplacée (une clé privée PEM entre guillemets sur plusieurs lignes, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), et la copie peut encore contenir des identifiants qu’elle ne sait pas nommer (un JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1 ; une ligne `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2 ; un mot de passe dans une URL, RFC 3986, section 3.2.1 ; un ID de clé d’accès AWS). Dans les deux cas, pas de lien : la fenêtre contextuelle nomme la ligne, vous y mettez une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom évoque un secret (un mot dans un commentaire, par exemple) n’empêche pas le lien ; la fenêtre contextuelle nomme la première. Les adresses, les noms d’objets et le reste des deux configurations partent tels que collés, et la fenêtre contextuelle vous demande de les relire d’abord.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme le ferait un collage, et la page compare les deux côtés, avec les mêmes sections, objets et paramètres modifiés que pour la personne qui a partagé le lien. Un lien qui contient encore un secret est un lien que le bouton ne crée jamais : il est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Contexte d’utilisation

Associez-le à l’article sur les politiques de pare-feu et le NAT de FortiGate, qui explique pourquoi l’ordre détermine le comportement dans les sections que l’outil traite comme sensibles à l’ordre.
