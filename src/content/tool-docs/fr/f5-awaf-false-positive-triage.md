## Ce que fait l’outil

Choisissez une violation que vous êtes en train de trier dans F5 AWAF (Advanced WAF, anciennement BIG-IP ASM, Application Security Manager) : sa catégorie, sa note de violation moyenne, et si le contrôle est appliqué, en staging ou dans une politique en mode Transparent. L’outil renvoie le verdict de F5 fondé sur la note, indique si la violation bloque du trafic en ce moment, et donne la correction circonscrite propre à cette catégorie s’il s’avère qu’il s’agit d’un vrai faux positif. C’est le pendant de l’estimateur d’empoisonnement : cet outil-là met en garde contre un assouplissement excessif, celui-ci montre comment assouplir correctement face à un vrai faux positif. Il est déterministe et s’exécute entièrement dans votre navigateur.

## Le verdict découle de la note

Advanced WAF attribue à chaque transaction une note de violation de 1 à 5, et c’est cette note qui décide du traitement d’un faux positif présumé. Les notes de 4 ou 5 correspondent probablement à de vraies attaques et bloquent même quand l’indicateur Block de chaque violation est désactivé : l’outil vous indique alors de supprimer la suggestion sans modifier la politique. Une note de 3 est ambiguë et doit d’abord être examinée dans le journal des évènements. Les notes de 1 et 2 correspondent généralement à de vrais faux positifs : l’outil vous indique alors d’appliquer la correction circonscrite (ou d’accepter la suggestion d’apprentissage) une fois que vous avez confirmé que la requête est légitime.

## Prise en compte du staging et du mode Transparent

Qu’une violation bloque réellement dépend de l’application. L’outil ne marque une violation comme bloquante que si la politique est en mode Blocking et que la note vaut 4 ou 5. Une signature en staging journalise mais ne bloque pas, et une politique en mode Transparent ne bloque rien : dans ces cas, l’outil précise que le faux positif est un signal d’apprentissage plutôt qu’une expérience utilisateur dégradée, et que la correction comptera le jour où l’application sera activée.

## Une correction toujours circonscrite

Pour chaque catégorie de violation, l’outil donne la correction documentée, et chaque option est circonscrite à l’URL ou au paramètre concerné, jamais une désactivation à l’échelle de la politique. Désactiver une signature sur une URL, ajouter une entité autorisée, ajouter un métacaractère au jeu de cette entité, relever une longueur précise, marquer un paramètre comme envoi de fichier, associer un profil de contenu XML ou JSON, ou activer Potential False Positive Detection sont autant d’actions circonscrites. L’outil rappelle toujours la discipline qui gouverne l’exercice : n’assouplissez que là où un faux positif s’est réellement produit, jamais là où une vraie attaque a causé la violation.

## Fondements

La logique qui va de la note à l’action et les corrections circonscrites proviennent de l’article K70544352 de F5 (Reducing false positive violations), de la documentation BIG-IP ASM Working with Violations (qui définit comment la note pilote le blocage et quelles violations ne peuvent pas être apprises) et des recommandations Refining Security Policies with Learning. Rien de ce que vous sélectionnez n’est envoyé ni ne quitte la page. Pour un changement en production, vérifiez auprès de la documentation et de la requête concernée dans votre journal des évènements.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les trois choix par leurs identifiants : `category`, `rating` et `state`. Les trois partent toujours, si bien que le lien continue d’ouvrir le même tri même si les choix initiaux de la page changent. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Les trois choix sont réglés et la page calcule comme lors d’une modification. Un choix que la page ne propose pas fait ignorer le lien dans son ensemble. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
