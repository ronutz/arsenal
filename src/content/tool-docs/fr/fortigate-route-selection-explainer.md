## Ce que fait l’outil

Indiquez une destination et un ensemble de routes : l’outil effectue la sélection que ferait FortiOS, c’est-à-dire quelles routes s’installent, laquelle le trafic emprunte réellement et lesquelles sont des routes de secours flottantes. Tout s’exécute dans votre navigateur.

## La distinction qui justifie l’outil

La distance administrative et la priorité sont couramment traitées comme une seule et même notion. Ce n’est pas le cas, et elles interviennent à des moments différents.

**La distance décide quelle route est INSTALLÉE.** Les routes vers une même destination entrent en concurrence, la distance la plus faible l’emporte, et la perdante est **absente** de la table de transfert : pas classée plus bas, pas un repli utilisé sous charge, simplement absente. C’est pourquoi « ma route ne fonctionne pas » se révèle si souvent être « ma route ne s’est jamais installée », et pourquoi une route que vous avez configurée est introuvable dans `get router info routing-table all`.

**La priorité décide laquelle de plusieurs routes DÉJÀ INSTALLÉES est préférée.** Elle ne s’applique jamais qu’aux routes qui ont survécu à la comparaison des distances. Une priorité de 0 ne peut pas sauver une route qui a perdu sur la distance, et un vecteur de référence (golden vector) fige précisément ce cas.

## Les conséquences

| Configuration | Résultat |
|---|---|
| Même préfixe, même distance | Les deux s’installent ; la priorité tranche |
| Même préfixe, distance différente | Une seule s’installe ; l’autre est une route de secours flottante |
| Même préfixe, même distance, même priorité | ECMP répartit la charge entre les deux |

La route de secours flottante permet de construire une route par défaut de secours : même préfixe, distance plus élevée. Elle n’apparaît dans la table que lorsque la route principale est retirée, ce que fait le **link health monitoring**, et c’est pourquoi une route statique qui en est dépourvue reste dans la table alors que le chemin au-delà de l’interface est coupé.

L’outil modélise une route inactive pour que vous puissiez voir la route de secours prendre le relais.

## Le transfert retient la correspondance la plus longue

Parmi les routes **installées**, le préfixe le plus spécifique l’emporte, quelles que soient la distance ou la priorité. Un /16 l’emporte sur une route par défaut pour une adresse qu’il contient, même si la route par défaut a de meilleures valeurs, car la spécificité est comparée en premier au moment du transfert.

C’est aussi pour cela que le détournement de préfixe (prefix hijacking) fonctionne, et pourquoi cet ordre mérite d’être gardé en tête au-delà d’un seul équipement.

## Ce que l’outil ne modélise pas

La table de routage seulement. Deux éléments sont consultés **avant** elle et l’emportent sur elle :

- Une **route de politique** (policy route), qui correspond sur la source, le protocole et le port aussi bien que sur la destination. Une route de politique oubliée est la cause classique d’un trafic qui ignore une route statique manifestement correcte : si la table dit une chose et que le trafic en fait une autre, regardez là en premier.
- Une **règle SD-WAN (software-defined wide area network)**, qui choisit un membre selon les performances mesurées avant même que la table soit consultée.

Il ne traite que l’IPv4 et n’évalue pas si une passerelle est réellement joignable ; il prend l’ensemble de routes tel qu’il est fourni.

## Partage des résultats

Sous la route sélectionnée, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la destination et les routes telles que collées. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les routes nomment vos préfixes internes, vos prochains sauts et vos interfaces, comme le fait une table de routage (d’où la ligne de mise en garde qu’ajoute la fenêtre contextuelle). Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par FortiOS ou par une norme : une ligne `set` d’un paramètre dont la [référence CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) fait un mot de passe (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd`, etc. ; consultée le 01/11/2026) ou le `name` d’une communauté SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), toute valeur `ENC` (l’avis [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) de Fortinet, consulté le 01/11/2026 : publiées là où d’autres peuvent les lire, ces données doivent être considérées comme faciles à déchiffrer, « should currently be considered “easy to decrypt” »), une paire `psksecret=` ou `password=` de mêmes noms sur une ligne de directive, une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), un mot de passe dans une URL ou un ID de clé d’accès AWS. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau ; ce que vous partagez est ainsi exactement ce que vous avez choisi (une valeur n’est jamais remplacée à l’intérieur d’une zone collée, ce qui changerait ce qui a été envoyé). Une valeur dont seul le nom évoque un secret n’empêche pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage, et la page sélectionne la route. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Contexte d’utilisation

Il se combine avec l’article sur le routage et le SD-WAN de FortiGate, qui couvre l’ordre complet de consultation et la couche SD-WAN que l’outil laisse de côté. Pour la préparation à l’examen NSE 4, il couvre l’objectif 4.01.
