## Ce que fait l’outil

Lisez les deux propriétés que F5 publie pour chaque signature d’attaque de F5 AWAF (Advanced WAF, anciennement BIG-IP ASM, Application Security Manager) : son Accuracy (précision) et son Risk (risque). Indiquez en plus si la signature s’applique seulement à vos systèmes et si elle est appliquée : l’outil vous dit dans quelle mesure la signature est sujette aux faux positifs, quels dégâts causerait une vraie correspondance, et quel réglage en découle. Il est déterministe et s’exécute entièrement dans votre navigateur.

## Pourquoi des propriétés et non une recherche par ID de signature

Le jeu de signatures de F5 est propriétaire et gigantesque : une base de données par ID ne serait ni réalisable ni honnête. En revanche, F5 documente ce que signifient l’Accuracy et le Risk pour chaque signature, et ce sont ces deux propriétés qui pilotent réellement le réglage des faux positifs : l’outil part donc d’elles. Vous lisez l’Accuracy, le Risk et les Systems directement dans l’entrée de la signature dans la politique.

## La précision, c’est la sensibilité aux faux positifs

F5 définit la précision comme la capacité d’une signature à identifier l’attaque, y compris sa sensibilité aux fausses alarmes, et indique clairement qu’une précision plus élevée entraîne moins de faux positifs. Une signature de précision faible (Low) a donc une forte probabilité de faux positifs, une signature de précision moyenne (Medium) une probabilité modérée, et une signature de précision élevée (High) une faible probabilité. Le risque est un axe distinct : les dégâts potentiels si l’attaque réussit, de la reconnaissance (Low) à l’exposition de données sensibles ou à des dégâts modérés (Medium), jusqu’à la compromission complète du système ou au déni de service (High).

## Le quadrant précision et risque

L’outil place la signature dans une grille 2x2. Précision faible et risque faible : c’est la candidate idéale à l’assouplissement, avec des faux positifs fréquents et peu à perdre en assouplissant. Précision faible et risque élevé : sujette aux faux positifs mais dangereuse, si bien que vous examinez la requête réelle avant de désactiver la signature, au lieu de laisser passer une attaque peut-être réelle. Précision élevée et risque élevé : un blocage fiable et à fort enjeu, que vous n’assouplissez pas. Précision élevée et risque faible : fiable, mais à faible enjeu. L’outil signale aussi comme du simple bruit une signature qui cible un système que votre application n’utilise pas, et présente la précision comme un levier : la précision étant un critère de filtrage des jeux de signatures, un jeu orienté vers des signatures de précision élevée produit moins de faux positifs.

## Fondements

Les définitions de la précision et du risque proviennent de la documentation Working with Attack Signatures de F5 et de la référence classique des signatures d’attaque de BIG-IP ASM (qui détaille les probabilités faible, moyenne et élevée de faux positifs, et le découpage des jeux de signatures par système et par précision), ainsi que de l’article K70544352 sur la réduction des faux positifs. Rien de ce que vous sélectionnez n’est envoyé ni ne quitte la page.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les quatre choix par leurs identifiants : `accuracy`, `risk`, `system` et `enforcement`. Les quatre partent toujours, si bien que le lien continue d’ouvrir la même lecture. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Les quatre choix sont réglés et la page calcule comme lors d’une modification. Un choix que la page ne propose pas fait ignorer le lien dans son ensemble. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
