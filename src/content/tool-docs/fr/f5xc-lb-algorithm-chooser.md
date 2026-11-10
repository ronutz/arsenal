## Ce que fait l’outil

Cet outil est un sélecteur guidé de l’algorithme d’équilibrage de charge d’un origin pool F5 Distributed Cloud (XC). Répondez à trois questions : les sessions doivent-elles rester sur la même origine ? Qu’est-ce qui identifie une session (l’IP source, un cookie, un en-tête personnalisé, ou « cela varie selon la route ») ? L’origin pool est-il dynamique ? L’outil recommande alors l’un des algorithmes de XC, nomme l’équivalent BIG-IP, liste les mises en garde qui s’appliquent à vos réponses et vous indique où le définir. Tout s’exécute dans votre navigateur.

## Le modèle de persistance de XC, pour les habitués de BIG-IP

C’est la raison d’être de l’outil. Sur BIG-IP, la méthode d’équilibrage de charge (Round Robin, Least Connections, etc.) et le profil de persistance (Source Address Affinity, Cookie) sont deux réglages indépendants du serveur virtuel. XC les fusionne. Les algorithmes à hachage cohérent (Source IP Stickiness, Cookie Based Stickiness et Ring Hash) ne sont pas que des méthodes de répartition : chacun est aussi, par définition, la méthode de persistance. En choisir un vous donne les deux à la fois. Les algorithmes sans hachage (Round Robin, Least Active Request, Random) n’assurent aucune persistance. Il n’existe pas d’objet profil de persistance distinct à rattacher.

## Les sept algorithmes

Round Robin envoie les requêtes aux origines à tour de rôle. Least Active Request envoie chaque requête à l’origine qui a le moins de requêtes en cours, ce qui convient aux requêtes de coût inégal ou aux connexions de longue durée. Random choisit une origine au hasard et répartit de façon statistiquement équitable sur les grands pools. Source IP Stickiness, Cookie Based Stickiness et Ring Hash forment la famille du hachage cohérent : ils hachent l’IP source, un cookie ou une politique de hachage que vous définissez (généralement un en-tête d’ID de session), et maintiennent un client sur la même origine. Load Balancer Override est la porte de sortie : il délègue le choix au HTTP Load Balancer, pour que vous définissiez la persistance par route ou par domaine.

## L’intérêt des mises en garde

Une recommandation ne vaut que si elle correspond au cas : l’outil fait donc apparaître les pièges. Le hachage sur l’IP source concentre sur une seule origine les clients qui partagent une IP (derrière un NAT ou un proxy), ce qui déséquilibre la charge. La persistance par cookie exige un nom, un TTL et un chemin, et ne tient que si le client renvoie le cookie. Un hachage sur un en-tête personnalisé exige une valeur stable pendant la session, et non une valeur qui change à chaque requête. Enfin, pour un pool dynamique (des pods Kubernetes dont le nombre augmente et diminue), le hachage cohérent est la bonne famille, car il réaffecte le moins de clients possible quand la composition du pool change.

## Partage des résultats

Sous le nom de l’algorithme recommandé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, vos réponses sous forme d’identifiants : si vous avez besoin de persistance ; la répartition ou la clé de session, selon celle que lit la recommandation ; et si le pool est dynamique, une fois que vous y avez répondu. Le questionnaire ne comporte aucune saisie : rien de ce que vous avez tapé ne circule. Le bouton est disponible dès que la recommandation est complète. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les réponses sont sélectionnées comme si vous aviez cliqué dessus, et la recommandation suit. Un lien qui contient une réponse inconnue, ou des réponses des deux branches, est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
