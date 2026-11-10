## Ce que fait l’outil

Collez une politique Access Control de Check Point écrite dans une petite grammaire pédagogique (une ou plusieurs déclarations `layer`, leurs règles et une ligne `test`), et l’évaluateur fait traverser les couches à la connexion sous vos yeux. Chaque étape nomme la règle qui correspond, explique ce que signifie réellement cette correspondance et signale les drops qui ne journalisent rien. La sortie est une trace plutôt qu’un verdict, car le verdict seul n’apprend rien : tout l’intérêt est de voir une connexion acceptée par une couche puis supprimée par la suivante.

## La phrase qu’il est là pour enseigner

**Les couches ordonnées forment un ET, pas un OU.** Accept dans une couche signifie que la connexion *passe à la couche suivante* ; elle n’est autorisée que lorsque la dernière couche ordonnée l’accepte. Un drop dans n’importe quelle couche met immédiatement fin à l’évaluation : une autorisation dans une couche précoce ne peut donc pas sauver un trafic qu’une couche ultérieure refuse, et l’exception doit figurer dans la couche qui, sinon, le refuserait. C’est le comportement que les personnes habituées à FortiGate, à BIG-IP ou à une simple chaîne iptables comprennent le plus souvent de travers, et c’est pourquoi la trace affiche « acceptée, passe à la couche suivante » plutôt qu’une coche.

## La grammaire

Couches : `layer Network ordered` ou `layer DMZ inline`. Règles : `1 | permit internal | accept | src=10.0.0.0/8 dst=any svc=443`, avec les actions `accept`, `drop` ou `inline:<layer>` pour conditionner une sous-politique. Ajoutez `nolog` pour modéliser une règle dont Track vaut None. Tout ce qui est omis vaut Any. Une ligne `test src=... dst=... svc=...` fournit la connexion. Les lignes qui commencent par `#` sont des commentaires.

## Ce qu’il signale d’autre

Au-delà de la trace, l’évaluateur inspecte la politique elle-même : une règle de nettoyage (cleanup rule) explicite manquante, une règle de nettoyage sans journalisation (ce qui annule sa seule raison d’être), des règles dont Track vaut None, et le masquage (shadowing) deux à deux : une règle qui ne peut jamais se déclencher parce qu’une règle antérieure correspond déjà à tout ce à quoi elle correspondrait.

L’avertissement sur les drops silencieux mérite une mention à part. Quand rien ne correspond, la règle de nettoyage implicite supprime la connexion et n’enregistre absolument rien. C’est le fait le plus coûteux d’une base de règles Check Point pour qui doit la dépanner, car le symptôme est une connexion qui échoue sans aucune entrée de journal pour l’expliquer, et cela ressemble à une panne réseau plutôt qu’à une décision de la politique.

## Limites, en toute franchise

Les **noms** de services ne sont pas résolus : `443` est un numéro de port, pas `https`. Associer des noms à des ports reviendrait à faire une supposition sur la base d’objets de quelqu’un d’autre. L’analyse du masquage se fait **deux à deux** : une règle couverte conjointement par plusieurs règles antérieures, mais par aucune isolément, n’est pas signalée. IPv4 uniquement. La grammaire est un sous-ensemble pédagogique délibéré (les vraies règles ajoutent VPN, Virtual Private Network, contenu, horaire, install-on et négation), mais la sémantique des couches enseignée ici s’applique à toutes de la même manière.

## Partage des résultats

Sous le verdict et la connexion évaluée, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la politique telle que collée, après le `#`. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les noms de règles, les sous-réseaux et la connexion de test décrivent votre réseau (c’est pourquoi la fenêtre contextuelle ajoute une ligne de mise en garde). Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par une norme : une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), une ligne `Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un ID de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. La grammaire ne prévoit de place pour aucun d’eux, mais les noms de règles et les lignes de commentaire sont du texte libre. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom évoque un secret n’empêche pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage et la page évalue les couches. Aucun serveur n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
