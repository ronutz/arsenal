## Ce que fait l’outil

Collez un bloc de configuration FortiOS : l’outil en restitue la structure sous forme d’arbre, avec chaque verbe expliqué, c’est-à-dire ce que font `config`, `edit`, `set`, `unset`, `append`, `next`, `end` et `abort`, et où se situe le bloc à chaque ligne. Local et hors ligne : il lit la structure, pas la sémantique.

## Le piège que l’outil est fait pour détecter

**`set` sur un champ multivalué remplace toute la liste.** `set srcaddr "internal-net"` sur une politique qui avait quatre adresses sources lui en laisse une seule, avec succès, en silence, sans que rien dans la sortie ne le mentionne. La commande qui ajoute, c’est **`append`**.

L’outil avertit à chaque `set` sur un champ de liste connu, en nommant le champ et la ligne. C’est l’habitude la plus coûteuse du travail en CLI FortiOS, et elle est invisible dans un bloc lu en diagonale, c’est-à-dire précisément la façon dont les blocs sont lus.

## Deux autres rappels systématiques

- **`edit` crée ce qu’il ne trouve pas.** Un ID de politique mal saisi ne produit pas d’erreur, il produit une politique.
- **`end` est la seule ligne qui valide.** `next` ferme une entrée et reste dans la table ; `abort` ferme et annule. Un bloc qui utilise `end` là où `next` était voulu quitte la table trop tôt, et toutes les modifications restantes atterrissent ailleurs.

Il signale aussi les **blocs non fermés**, car un bloc non fermé n’a rien validé, et le coller dans une session active vous laisse dans un contexte inattendu.

## Ce que l’outil ne fait pas

Il ne connaît ni vos objets d’adresse, ni vos politiques, ni l’organisation de vos VDOM, et ne peut pas dire si une valeur est judicieuse. Il répond à la question de savoir si la forme de la commande fait ce que la personne qui la saisit attendait probablement, ce qui est une autre question, souvent plus utile.

Il ne peut pas non plus savoir ce que contenait un champ auparavant. Quand il avertit qu’un `set` remplace une liste, **la question qu’il vous demande de vous poser, c’est ce que contenait cette liste.**

## Partage des résultats

En tête de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, une copie du bloc où la valeur de chaque paramètre secret de FortiOS est remplacée par un repère numéroté, jamais le bloc tel que collé, car l’arbre affiche la valeur de chaque ligne. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. La fenêtre contextuelle indique aussi combien de valeurs ont été remplacées.

Les paramètres remplacés sont ceux que la [référence CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) définit comme mots de passe (de type `password`, `password-2`, `password-3` ou `password_aes256` ; consultée le 01/11/2026) : les `psksecret`, `psksecret-remote` et `ppk-secret` d’une phase 1 IPsec, le `password` d’un administrateur et le `passwd` d’un utilisateur local, l’`api-key` d’un utilisateur d’API, les valeurs `secret` RADIUS (Remote Authentication Dial-In User Service), les valeurs `key` de TACACS+ et de la HA, les `auth-pwd` et `priv-pwd` SNMPv3, le `password` BGP (Border Gateway Protocol) et LDAP (Lightweight Directory Access Protocol), l’`authentication-key` et la `key-string` OSPF (Open Shortest Path First), une `passphrase` Wi-Fi et les clés secrètes des connecteurs cloud ; tout paramètre dont le nom se termine par un mot comme password, secret ou token ; le `name` d’une communauté SNMP, qui est la chaîne de communauté elle-même ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5 ; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), section 5.2.1) ; et toute valeur `ENC`, quel que soit son paramètre. L’avis [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) de Fortinet (consulté le 01/11/2026) indique qu’une configuration publiée volontairement sur un forum pour un dépannage (« willingly posted on a forum for troubleshooting purpose ») peut voir ses données `ENC` déchiffrées en clair, et que ces données doivent être considérées comme faciles à déchiffrer (« should currently be considered “easy to decrypt” ») : une valeur `ENC` est donc traitée comme le secret qu’elle contient. Chaque valeur devient un repère numéroté (`[redacted-1]`, `[redacted-2]`, etc.), le même numéro pour la même valeur ; le mot `ENC`, les guillemets et tous les autres caractères restent. Aucune option ne permet de remettre les valeurs : aucune ne change la lecture, et chacune constitue des identifiants.

Une valeur qui déborde de sa ligne ne peut pas y être remplacée (une clé privée PEM entre guillemets sur plusieurs lignes, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), et la copie peut encore contenir des identifiants qu’elle ne sait pas nommer (un JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1 ; une ligne `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2 ; un mot de passe dans une URL, RFC 3986, section 3.2.1 ; un ID de clé d’accès AWS). Dans les deux cas, pas de lien : la fenêtre contextuelle nomme la ligne, vous y mettez une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom évoque un secret (un mot dans un commentaire, par exemple) n’empêche pas le lien ; la fenêtre contextuelle nomme la première. Les noms d’interfaces, d’adresses, d’objets et d’utilisateurs partent tels que collés, et la fenêtre contextuelle vous demande de les relire d’abord.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme le ferait un collage, et la page l’explique : l’arbre, les avertissements et les remarques se lisent comme pour la personne qui a partagé le lien, avec les repères à la place des valeurs. Un lien qui contient encore un secret est un lien que le bouton ne crée jamais : il est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Outils associés

Pour récupérer par script la configuration d’un FortiGate, le [générateur de scripts Expect](/tools/expect-script-builder) écrit un script de connexion et d’exécution avec un profil FortiOS. Par défaut, il répond au pager `--More--` par un appui sur Espace au lieu de modifier le paramètre de sortie de la console, un changement global que verrait la session de chaque administrateur.
