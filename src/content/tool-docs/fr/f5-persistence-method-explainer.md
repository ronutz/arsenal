## Ce que fait l’outil

Collez des profils de persistance et des serveurs virtuels BIG-IP sous forme d’extrait tmsh : l’outil explique la persistance derrière chacun, c’est-à-dire la méthode, ce sur quoi elle se fonde, son comportement, les champs qui comptent et la façon dont elle échoue en pratique. Pour chaque serveur virtuel, il présente aussi la chaîne de persistance : la méthode principale et le repli (fallback) utilisé quand la méthode principale ne produit aucun enregistrement. Il analyse la configuration dans votre navigateur et ne contacte aucun équipement.

## La persistance, et pourquoi la méthode compte

La persistance, aussi appelée affinité de session, maintient un client sur le même membre du pool d’une connexion à l’autre, ce dont les applications avec état ont besoin pour qu’une session commencée sur un serveur se poursuive sur ce serveur. BIG-IP propose plusieurs méthodes, et l’essentiel est que chacune se fonde sur une clé différente : chacune a donc son propre mode de défaillance. Choisir une méthode, c’est en réalité choisir sur quoi fonder la clé, et accepter la façon dont cette clé peut se rompre.

## Les méthodes courantes et leurs défaillances

- La persistance **Source-address** se fonde sur l’adresse IP du client. Sa défaillance classique : de nombreux clients arrivent derrière un même NAT ou un même proxy ; ils partagent une adresse, s’attachent donc tous au même membre du pool, et la charge se déséquilibre. Elle échoue aussi si l’adresse d’un client change en cours de session.
- La persistance **Cookie** se fonde sur un cookie HTTP que gère le BIG-IP, dans des modes qui l’insèrent, le réécrivent ou le lisent passivement. Elle est précise, mais elle exige HTTP et un client qui accepte les cookies : elle ne s’applique donc pas au trafic non HTTP.
- La persistance **SSL** se fonde sur l’identifiant de session TLS. Elle échoue quand les clients renouvellent ou renégocient leurs identifiants de session, ou quand ceux-ci ont une courte durée de vie : c’est pourquoi elle est si souvent associée à un repli.
- La persistance **Universal** se fonde sur une valeur qu’une iRule extrait du trafic, ce qui permet de persister sur presque n’importe quoi (un jeton, un en-tête, un champ), au prix de l’écriture de la règle.

Des paramètres comme match-across-services, match-across-virtuals et match-across-pools élargissent la portée sur laquelle s’applique un enregistrement de persistance, et l’outil les lit là où ils sont définis.

## La chaîne principale et de repli

Un serveur virtuel peut désigner un profil de persistance principal et un profil de repli. Quand la méthode principale ne trouve aucun enregistrement existant pour une connexion, BIG-IP utilise le repli pour la placer. Une association bien connue est la persistance par identifiant de session SSL avec source-address en repli : un client dont l’identifiant de session n’est pas encore connu reste ainsi attaché par son IP. L’outil montre cette chaîne pour chaque serveur virtuel, pour que vous voyiez ce qui décide réellement du membre. Pour les octets contenus dans un cookie de persistance précisément, l’outil compagnon est le décodeur de cookies de persistance BIG-IP ; celui-ci explique la méthode qui l’entoure.

## Utilisation

Collez des profils de persistance, des serveurs virtuels, ou les deux, et lisez pour chacun la méthode, la clé, les champs et les modes de défaillance, ainsi que la chaîne du principal au repli pour chaque serveur virtuel. L’analyse est déterministe et locale.

## Partage des résultats

En tête de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les profils et les serveurs virtuels avec la valeur de chaque paramètre secret remplacée par `[redacted]`, jamais tels que collés. Un profil cookie peut en contenir un : [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html) définit une phrase secrète servant au chiffrement du cookie (« Specifies a passphrase to be used for cookie encryption », référence tmsh de F5, ltm persistence cookie, consultée le 27/10/2026). Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La copie est celle de l’[analyseur de configuration tmsh](/tools/f5-tmsh-config-explainer), réalisée avec le même analyseur syntaxique que celui qu’utilise cette page : chaque mot de passe, phrase secrète, secret et valeur de communauté SNMP d’un collage plus large est donc remplacé lui aussi, et la fenêtre contextuelle indique combien l’ont été. `[redacted]` est un seul mot tmsh : la page qui reçoit le lien lit donc les mêmes profils, chaînes et champs. Les noms de profils, de serveurs virtuels, de pools et de cookies partent tels que collés ; le corps d’une iRule aussi, et la fenêtre contextuelle le signale quand il y en a une. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme le ferait un collage, et la page l’explique. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
