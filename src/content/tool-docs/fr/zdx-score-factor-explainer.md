# Analyseur des facteurs du score ZDX

Collez les métriques qu’expose Zscaler Digital Experience (le score composite, les métriques Web Probe, les métriques CloudPath) et relisez ce que chacune représente selon la documentation de l’éditeur : la famille de sondes qui la mesure, ce qu’elle signifie et la façon dont s’applique la sémantique documentée du score.

## Un périmètre honnête, annoncé d’emblée

Zscaler documente les facteurs du score ZDX, la cadence de ses sondes, sa règle de la valeur la plus basse de l’heure, son échelle de 0 à 100 et ses trois plages (Good de 66 à 100, Okay de 34 à 65, Poor de 0 à 33), mais ne publie **pas** la formule composite exacte. L’outil **ne calcule donc aucun score à partir des métriques**. Il classe un score donné par rapport aux trois plages documentées, explique la signification documentée de chaque métrique et la famille de sondes à laquelle elle se rattache, et dit clairement où s’arrête la documentation. Pour les métriques brutes, aucun seuil publié ne rend une valeur bonne ou mauvaise en soi (les critères d’alerte de ZDX sont définis par l’administrateur, règle par règle) : l’outil explique donc la métrique et refuse de la noter. C’est la même règle de non-invention que pour les autres outils du site.

## Grammaire de saisie

Une métrique par ligne, `metric = value`. Les lignes qui commencent par `#` sont des commentaires.

- `score` : le score ZDX composite, un nombre entier de 0 à 100 (Zscaler arrondit chaque score à l’entier le plus proche)
- `pft`, `dns`, `srt` : des temps Web Probe en millisecondes (Page Fetch Time, DNS Time, Server Response Time)
- `availability` : la disponibilité Web Probe, en pourcentage de 0 à 100
- `path-latency`, `path-loss` : les métriques CloudPath (millisecondes, pourcentage)

## Ce que vous obtenez

Chaque métrique s’affiche sous forme de carte de lecture : son badge de famille de sondes (Web Probe / CloudPath / score composite), sa signification documentée (Page Fetch Time ne demande que le document de la page de premier niveau, Server Response Time correspond au temps jusqu’au premier octet) et, pour le score, son classement dans la plage documentée Good, Okay ou Poor, avec, pour Poor, la remarque sur l’analyse automatique des causes racines. Quand les deux familles de sondes sont présentes, la répartition du diagnostic s’affiche : de mauvaises métriques web sur un chemin propre désignent l’application ; un mauvais chemin met en cause le réseau. Les remarques permanentes rappellent la sémantique documentée sur laquelle repose chaque lecture : des sondes toutes les cinq minutes ; la valeur la plus basse de l’heure retenue comme valeur horaire ; des scores d’application qui font la moyenne de la valeur la plus basse de chaque utilisateur, tandis que les scores par département, site, ville et organisation font la moyenne de la valeur la plus basse de chaque intervalle de temps ; les trois types de score (Synthetic Probe, RUM et Combined), qui peuvent diverger pour une même application ; le retard de télémétrie d’une vingtaine de minutes environ ; et le léger écart entre l’API et le tableau de bord, dû à l’agrégation approximative.

Tout s’exécute localement dans votre navigateur ; rien de ce que vous collez ne quitte la page.

## Partage des résultats

En tête de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les métriques telles que collées. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les métriques peuvent décrire les performances d’une application interne (c’est pourquoi la fenêtre contextuelle ajoute une ligne de mise en garde). Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par une norme : une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), une ligne `Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un identifiant de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. La grammaire ne prévoit de place pour aucun d’eux, mais une ligne de commentaire est du texte libre. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret ne bloque pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage et la page lit chaque métrique. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [Zscaler Reference Architecture: Zscaler Digital Experience (ZDX)](https://help.zscaler.com/downloads/zdx/reference-architecture/zscaler-digital-experience-zdx/zscaler-digital-experience-zdx-reference-architecture.pdf) : les métriques des sondes, leur cadence, la sémantique de la valeur la plus basse de l’heure et des moyennes par groupe (consulté le 09/11/2026)
- [Zscaler Help: Evaluating User Details](https://help.zscaler.com/zdx/evaluating-user-details) : la plage Poor documentée (de 0 à 33) et son analyse automatique des causes racines (consulté le 09/11/2026)
- [Zscaler Help: Understanding the ZDX API](https://help.zscaler.com/legacy-apis/understanding-zdx-api) : les étalonnages du retard de télémétrie et de l’écart des agrégats (consulté le 09/11/2026)
- [Zscaler Help: Understanding the ZDX Score](https://help.zscaler.com/zdx/understanding-zdx-score) : l’échelle de 0 à 100, les trois plages, les règles d’agrégation, l’arrondi à l’entier et les types de score (consulté le 26/10/2026)

La règle du fragment sur laquelle repose le partage des résultats est celle de la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.5 (consultée le 01/11/2026), et les identifiants que recherche son contrôle sont définis dans les RFC 7468, RFC 9110, RFC 6265 et RFC 7519 (consultées le même jour).
