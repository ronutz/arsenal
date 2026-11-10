## Ce que fait l’outil

Collez un bloc ltm pool : l’outil explique sa méthode d’équilibrage de charge dans les termes mêmes de F5, c’est-à-dire ce que la méthode prend en compte, comment elle se comporte, quand le constructeur recommande de la choisir et les pièges à surveiller. Il confronte ensuite la méthode au reste du pool et signale les combinaisons qui dysfonctionnent en silence, comme des poids ratio sous un mode qui les ignore ou un mode pondéré privé des limites de connexions dont il a besoin. Vous pouvez aussi saisir un seul nom de méthode pour obtenir son explication complète, le mot « methods » pour tout le catalogue, ou répondre à deux questions dans le panneau Aide au choix pour obtenir une recommandation sourcée. Tout s’exécute dans votre navigateur, et aucun équipement n’est contacté.

## Statique et dynamique, membre et nœud

Les 19 modes documentés se répartissent selon deux axes. Les modes statiques, Round Robin et Ratio, décident à partir de la seule configuration et ne voient jamais l’état réel des serveurs. Les modes dynamiques réagissent à une mesure : connexions ouvertes, sessions, rapidité de réponse ou métriques serveur fournies par les moniteurs. Le second axe est le suffixe de portée. Un mode de portée membre compte le travail d’un serveur dans ce seul pool ; un mode de portée nœud le compte sur tous les pools auxquels le serveur appartient, ce qui donne le décompte équitable quand les mêmes machines servent plusieurs pools.

## Le critère de chaque famille

Round Robin ne tient compte que du tour de chacun, et c’est la méthode par défaut. Ratio suit une proportion que vous déclarez. Least Connections choisit le membre qui a le moins de connexions ouvertes à cet instant précis, ce qui absorbe les durées de connexion inégales. Observed lisse ce décompte instantané en un ratio par seconde, et Predictive y ajoute la tendance, en privilégiant les membres qui s’améliorent. Weighted Least Connections lit le connection-limit de chaque membre comme sa capacité et équilibre selon le pourcentage de cette capacité. Ratio Least Connections combine le ratio que vous déclarez et le décompte en temps réel. Dynamic Ratio vous retire entièrement la main sur la proportion et la recalcule en permanence à partir des mesures des serveurs. Least Sessions et Ratio (session) comptent les sessions de persistance au lieu des connexions, et Fastest suit la rapidité de réponse, mesurée par les requêtes de couche 7 en attente.

## Les vérifications croisées

Les observations sont des lectures déterministes de la configuration collée au regard des règles documentées. Des ratios de membres sous un mode qui n’est pas un mode ratio sont signalés car, selon le K6406, les ratios ne s’appliquent qu’avec une méthode ratio. Weighted Least Connections (member) avec un membre laissé au connection-limit par défaut de 0 est signalé, car la référence exige une limite sur chaque membre. Un pool en least-connections reçoit la remarque sur le slow ramp (montée en charge progressive), car la référence met en avant cette association et la rampe par défaut est de 10 secondes. Least Sessions fait apparaître son prérequis côté serveur virtuel : un profil de persistance qui suit les sessions. ignore-persisted-weight est expliqué quand il s’applique, et signalé quand le mode sort de son périmètre documenté. Les groupes de priorité sont lus avec min-active-members, le paramètre qui arme réellement l’activation par priorité.

## L’aide au choix

Deux questions alimentent une table de décision fixe : en quoi les capacités des membres diffèrent (égales, déclarées sous forme de ratio, chiffrées sous forme de limites de connexions, ou mesurées pour vous) et à quoi la méthode doit réagir (à rien, aux connexions en temps réel, à la tendance, aux sessions ou à la rapidité de réponse). Mêmes réponses, même recommandation, toujours, avec le raisonnement et les prérequis exposés. La table traduit les recommandations du constructeur lui-même, issues du K42275060, et non une opinion.

## Partage des résultats

La page a deux points d’entrée : le bouton **Partager les résultats** existe donc en deux exemplaires, chacun créant, seulement quand vous appuyez dessus, un lien vers cette page qui contient une partie après le `#`. Chaque fenêtre contextuelle indique d’abord ce que contient son lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

- **En tête de la réponse de la zone** : la zone telle que saisie (`#input=`), un pool, un nom de méthode, `methods` ou une ligne `choose`. Les noms de pools et de membres peuvent identifier vos serveurs : la fenêtre contextuelle ajoute donc une mise en garde avant toute copie. Un pool ne contient aucun paramètre secret ([référence tmsh de F5, ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html), consultée le 27/10/2026).
- **Sous la recommandation Aide au choix** : vos deux réponses, par leur identifiant, `capacity` (`equal`, `ratio`, `connlimit`, `measured`) et `react` (`none`, `connections`, `trend`, `sessions`, `response`), seulement quand les deux sont choisies.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce que contient le lien n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Ce que contient le lien est rempli : la zone comme le ferait un collage, les deux listes déroulantes comme si vous les aviez choisies ; ce que le lien ne contient pas conserve sa valeur. Une réponse que les listes ne proposent pas, ou une réponse sans l’autre, fait ignorer le lien en entier. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

Les 19 mots-clés, leurs descriptions et les options du pool viennent de la référence tmsh ltm pool. Les recommandations sur le choix et le prérequis de least-sessions viennent du K42275060. La mécanique des modes dynamiques, l’exclusion de OneConnect et la règle selon laquelle les ratios exigent une méthode ratio viennent du K6406.

- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
