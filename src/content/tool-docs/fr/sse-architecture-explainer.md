## Ce que fait l’outil

Décrivez une requête (sa destination, son mode d’aiguillage, si l’appareil est géré, si le TLS est déchiffré, si elle contient une charge utile) et l’outil montre le passage unique : quels services interviennent, dans quel ordre, lesquels sont des **piliers** et lesquels sont **transverses**, et ce qu’aurait fait à la place une chaîne d’appliances distinctes. Déterministe et hors ligne, il décrit une architecture au lieu d’en interroger une.

## La démonstration qui justifie l’outil

**La prévention des pertes de données (DLP, data loss prevention) et la protection contre les menaces ne sont pas des piliers.** Elles sont transverses : elles s’exécutent dans le même passage et reçoivent tout ce que les piliers ont déchiffré. C’est pourquoi un seul profil de données couvre aussi bien le web que les applications SaaS (software as a service) et les applications privées, et pourquoi, dans une architecture chaînée, la même règle doit être écrite quatre fois dans quatre dialectes.

Les piliers dépendent de la **destination du trafic** : la passerelle web sécurisée pour le web général, le courtier de sécurité d’accès au cloud (CASB) pour l’activité SaaS, l’accès réseau Zero Trust pour une application privée, le pare-feu cloud pour les ports que les autres ne couvrent pas. Changez la destination dans l’outil et observez quels piliers interviennent, tandis que les moteurs transverses restent les mêmes.

## L’affirmation vérifiable

Passage unique signifie que **la charge utile est déchiffrée une seule fois** et que le même flux est remis à chaque moteur. Des appliances chaînées déchiffrent et rechiffrent à chaque saut, et cette répétition représente l’essentiel de la latence que l’on impute à l’inspection.

L’outil énonce ce contraste dans chaque résultat, car « convergé » relève souvent de l’argument de packaging plutôt que de l’architecture. La question à poser à un fournisseur est de savoir si la charge utile est déchiffrée une seule fois, ou une fois par moteur.

## Ce que l’outil ne fait pas

Il ne modélise aucun tenant particulier et n’est pas un simulateur de politique. Désactivez le déchiffrement : l’outil indique alors que tout ce qui suit l’identification de l’application travaille à partir de métadonnées. C’est le mode de défaillance qu’il tient le plus à faire comprendre aux apprenants, car une politique écrite comme si le contenu était visible restera dans la console, en apparence correcte.

## Périmètre fournisseur

Les noms des étapes suivent la description publiée par Netskope de son Zero Trust Engine, puisque c’est la plateforme que couvrent les formations du site. L’argument structurel (passage unique, inspection transverse, pleine capacité de calcul en périphérie) vaut pour le SSE en général et il est présenté comme tel.

## Partage des résultats

Sous la synthèse, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, tous les champs du formulaire, toujours : la destination et la méthode d’aiguillage par leurs identifiants, et les quatre cases sous la forme 1 ou 0, pour qu’un lien garde son sens si une valeur par défaut change. Les champs décrivent une requête et ne nomment aucun système ni aucune personne. La page affiche un passage dès son ouverture : le bouton est donc disponible immédiatement. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les champs sont réglés comme si vous les aviez choisis, et le passage suit. Un lien qui contient un choix inconnu est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
