## Ce que fait l’outil

Collez une liste de règles Firewall Filtering de Zscaler Internet Access (ZIA) dans une petite grammaire pédagogique (une règle par ligne, sous la forme `order | name | action | criteria`), avec une ligne `flow:` facultative, et le simulateur exécute devant vous la sémantique documentée de la politique : les règles sont triées par ordre numérique croissant, le flux est suivi règle par règle et l’évaluation s’arrête à la première correspondance, le verdict est nommé (une règle, ou la Default Firewall Filtering Rule pour tout ce qui est passé au travers), et une analyse de masquage deux à deux liste les règles qui ne peuvent jamais se déclencher, parce qu’une règle antérieure couvre déjà tout ce à quoi elles pourraient correspondre.

## La grammaire

Règles : `10 | allow-web | allow | proto=tcp port=443 dest=203.0.113.0/24 src=any`, avec les actions `allow`, `block` (suppression silencieuse) ou `block-icmp` (blocage avec notification du client), et un mot-clé `disabled` facultatif. Les critères omis valent Any, et Any est ignoré pendant l’évaluation, exactement comme le documente l’éditeur. Lignes facultatives : `flow: proto=tcp port=8443 dest=203.0.113.7 src=10.0.0.5` pour suivre un flux, et `default: allow|block` pour modéliser la modification, par un super-administrateur, de l’action de la règle Default. Les lignes qui commencent par `#` sont des commentaires.

## Ce que traduit la sémantique

Tout ce qui est simulé correspond au comportement publié par Zscaler : l’évaluation suit le Rule Order par ordre croissant et s’arrête à la première correspondance ; une règle désactivée n’est pas appliquée mais garde sa place (le service l’ignore et passe à la suivante) ; la Default Firewall Filtering Rule ne peut pas être supprimée, a toujours la priorité la plus basse, ses critères sont fixes et seule son action est modifiable. Telle qu’elle est livrée, elle bloque tout le trafic : c’est pourquoi, en l’absence de ligne `default:`, le simulateur retient block par défaut.

## Limites assumées

Le modèle de critères est ici un sous-ensemble pédagogique délibéré : protocole, ports, source, destination. Les vraies règles Firewall Filtering ajoutent les utilisateurs, les groupes, les départements, les sites, les services réseau et les applications, les pays de destination, les niveaux de confiance des appareils et les plages horaires ; la sémantique d’ordre qu’enseigne l’outil s’applique à tous de la même façon. L’analyse de masquage se fait uniquement deux à deux : une règle couverte conjointement par plusieurs règles antérieures, mais par aucune à elle seule, n’est pas signalée. Les règles système prédéfinies (Office 365, trafic des services Zscaler) et les bornes d’ordre liées à l’Admin Rank sont décrites dans l’article associé, mais pas simulées.

## Partage des résultats

Sous la carte du verdict (en tête de la lecture quand il n’y a pas de ligne de flux), le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les règles et le flux tels que collés. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les noms de règles et les adresses peuvent identifier votre infrastructure (c’est pourquoi la fenêtre contextuelle ajoute une ligne de mise en garde). Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par une norme : une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), une ligne `Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un identifiant de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. La grammaire ne prévoit de place pour aucun d’eux, mais les noms de règles et les lignes de commentaire sont du texte libre. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret ne bloque pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage et la page simule les règles. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

Le simulateur s’appuie sur trois pages de l’aide Zscaler, chacune fixée avec sa date de consultation dans le manifeste de l’outil : About Firewall Filtering (ordre d’évaluation, règle Default qui refuse par défaut, ensemble des verbes d’action), Configuring the Firewall Filtering Policy (Rule Order, convention selon laquelle Any est ignoré, Admin Rank) et Editing the Default Firewall Filtering Rule (priorité la plus basse, suppression impossible, critères fixes, modification de l’action par un super-administrateur).

La règle du fragment sur laquelle repose le partage des résultats est celle de la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.5 (consultée le 01/11/2026), et les identifiants que recherche son contrôle sont définis dans les RFC 7468, RFC 9110, RFC 6265 et RFC 7519 (consultées le même jour).
