## Ce que fait l’outil

Collez une liste de politiques de pare-feu FortiGate et un paquet : l’outil effectue l’évaluation que ferait FortiOS, de haut en bas, chaque critère devant correspondre, la première correspondance l’emportant. Il indique la politique qui correspond, une trace qui nomme le **premier critère qui a écarté** chacune des politiques précédentes, et les politiques situées sous la correspondance qui auraient également correspondu. Tout s’exécute dans votre navigateur, sans jamais contacter d’équipement.

## Pourquoi la trace compte plus que le verdict

Savoir que la politique 7 a correspondu n’est qu’une petite partie de la réponse. La partie utile, c’est pourquoi les politiques 1 à 6 n’ont pas correspondu, car c’est ce qui vous dit si la liste est écrite comme prévu. Une politique avec les bonnes adresses et la mauvaise interface de sortie ne correspond pas, en silence, et rien dans l’interface d’administration ne le signale ; le compteur d’utilisation ne s’incrémente simplement jamais.

La trace nomme un critère par politique : le premier qui a échoué. FortiOS les exige tous : un seul échec suffit donc à écarter une politique, et ne signaler que le premier garde le résultat lisible sur une longue liste.

## Masquée ou attrape-tout, une distinction essentielle

Une fois qu’une politique correspond, les politiques suivantes qui auraient aussi correspondu se répartissent en deux catégories très différentes, que l’outil distingue.

**Masquée** signifie que la politique suivante est au moins aussi spécifique que celle qui l’a emporté. C’est une véritable anomalie : elle est active dans la configuration, paraît correcte à l’écran, et ne peut jamais s’appliquer à ce trafic dans l’ordre actuel. C’est le problème de politique FortiGate le plus courant, et la correction consiste à la placer au-dessus de la gagnante.

**Attrape-tout** signifie que la politique suivante est plus large que la gagnante. Une autorisation générale sous un ensemble de règles spécifiques relève d’une conception correcte, pas d’une erreur : l’outil la mentionne donc sans la signaler comme un problème. Confondre les deux, c’est ce qui fait crier au loup ce genre d’outil sur toute liste de politiques bien ordonnée ; c’est pourquoi la spécificité est calculée et non présumée.

## Formats d’entrée

Deux formes sont acceptées, car vous pouvez disposer de l’une ou de l’autre.

**CLI FortiOS** : la sortie de `show firewall policy` ou un bloc `config firewall policy`. Les membres sont lus dans les listes entre guillemets, et une politique avec `set status disable` est signalée comme non évaluée plutôt qu’ignorée en silence.

**Un tableau à barres verticales ou à tabulations** : `id | srcintf | dstintf | srcaddr | dstaddr | service | action`, ce à quoi ressemble une copie depuis l’interface graphique ou une liste écrite à la main. Plusieurs membres dans une cellule sont séparés par des virgules.

Dans les deux formats, le paquet figure sur sa propre ligne :

```
packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS
```

## La limite, énoncée clairement

La correspondance compare des **noms d’objets**, pas des adresses résolues. Une liste de politiques collée ne contient pas les définitions des objets d’adresse : la question « 10.1.1.5 fait-il partie de l’objet LAN_Subnet ? » ne peut donc pas trouver de réponse dans cette saisie. Indiquez le nom de l’objet, ou `all`.

C’est un choix délibéré. L’outil pourrait deviner en extrayant des adresses des noms d’objets, et il se tromperait avec aplomb chaque fois qu’un nom ne décrirait pas son contenu. Une limite énoncée est plus utile qu’une réponse fausse mais plausible, et c’est pour cela que vous pouvez vous fier à l’outil sur ce à quoi il répond.

Il ne modélise par ailleurs que **la décision de correspondance**. Les résultats de la traduction d’adresses réseau (NAT, network address translation), l’issue des profils de sécurité, le routage et l’état des sessions dépendent d’une configuration que cette saisie ne contient pas, et ne sont pas déduits.

## Partage des résultats

Sous la réponse principale (en tête de la lecture s’il n’y a pas de paquet), le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, une copie de la zone. La page lit les politiques et la ligne `packet:` et ignore tout le reste : une configuration complète collée ici obtient donc elle aussi une lecture ; la copie y remplace la valeur de chaque paramètre secret de FortiOS par un repère numéroté, et le lien ne contient jamais la zone telle que collée. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. La fenêtre contextuelle indique aussi combien de valeurs ont été remplacées.

Les paramètres remplacés sont ceux que la [référence CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) définit comme mots de passe (de type `password`, `password-2`, `password-3` ou `password_aes256` ; consultée le 01/11/2026) : les `psksecret`, `psksecret-remote` et `ppk-secret` d’une phase 1 IPsec, le `password` d’un administrateur et le `passwd` d’un utilisateur local, l’`api-key` d’un utilisateur d’API, les valeurs `secret` RADIUS (Remote Authentication Dial-In User Service), les valeurs `key` de TACACS+ et de la HA, les `auth-pwd` et `priv-pwd` SNMPv3, le `password` BGP (Border Gateway Protocol) et LDAP (Lightweight Directory Access Protocol), l’`authentication-key` et la `key-string` OSPF (Open Shortest Path First), une `passphrase` Wi-Fi et les clés secrètes des connecteurs cloud ; tout paramètre dont le nom se termine par un mot comme password, secret ou token ; le `name` d’une communauté SNMP, qui est la chaîne de communauté elle-même ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5 ; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), section 5.2.1) ; et toute valeur `ENC`, quel que soit son paramètre. L’avis [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) de Fortinet (consulté le 01/11/2026) indique qu’une configuration publiée volontairement sur un forum pour un dépannage (« willingly posted on a forum for troubleshooting purpose ») peut voir ses données `ENC` déchiffrées en clair, et que ces données doivent être considérées comme faciles à déchiffrer (« should currently be considered “easy to decrypt” ») : une valeur `ENC` est donc traitée comme le secret qu’elle contient. Chaque valeur devient un repère numéroté (`[redacted-1]`, `[redacted-2]`, etc.), le même numéro pour la même valeur ; le mot `ENC`, les guillemets et tous les autres caractères restent. Aucune option ne permet de remettre les valeurs : aucune ne change la lecture, et chacune constitue des identifiants.

Une valeur qui déborde de sa ligne ne peut pas y être remplacée (une clé privée PEM entre guillemets sur plusieurs lignes, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), et la copie peut encore contenir des identifiants qu’elle ne sait pas nommer (un JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1 ; une ligne `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2 ; un mot de passe dans une URL, RFC 3986, section 3.2.1 ; un ID de clé d’accès AWS). Dans les deux cas, pas de lien : la fenêtre contextuelle nomme la ligne, vous y mettez une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom évoque un secret (un mot dans un commentaire, par exemple) n’empêche pas le lien ; la fenêtre contextuelle nomme la première. La recherche ne lit jamais ces paramètres : elle donne donc exactement la même lecture à partir de la copie ; les noms d’interfaces, d’adresses et de politiques partent tels que collés, et la fenêtre contextuelle vous demande de les relire d’abord.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme le ferait un collage, et la page effectue la recherche. Un lien qui contient encore un secret est un lien que le bouton ne crée jamais : il est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Contexte d’utilisation

Il se combine avec l’article sur les politiques de pare-feu et le NAT de FortiGate, qui explique la chaîne d’évaluation que parcourt l’outil, notamment pourquoi le NAT de destination via une VIP intervient avant l’évaluation des politiques, et le NAT source après. Pour la préparation à l’examen NSE 4, il couvre les objectifs 2.01 et 2.02.
