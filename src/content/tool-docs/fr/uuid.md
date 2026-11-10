## Ce que fait l’outil

Générez des UUID, ou collez-en un existant pour l’inspecter. La génération produit soit un UUID version 4 aléatoire, soit un UUID version 7 ordonné dans le temps, avec la source aléatoire sûre du navigateur (`crypto.getRandomValues`). L’inspection prend n’importe quel UUID et indique s’il est valide, quelles sont sa version et sa variante et, pour une valeur version 7, l’instant de création qu’elle contient. Tout s’exécute dans votre navigateur.

## Ce qu’est un UUID

Un UUID est un identifiant de 128 bits, écrit sous la forme de 32 chiffres hexadécimaux selon le groupement familier 8-4-4-4-12, par exemple `f47ac10b-58cc-4372-a567-0e02b2c3d479`. Son but est d’être unique sans qu’une autorité centrale distribue les numéros : n’importe qui peut en créer un et compter sur le fait qu’il n’entrera en collision avec celui de personne d’autre. Deux champs fixes encodent sa structure : un quartet de version, qui indique comment l’UUID a été produit, et un champ de variante, qui le marque comme un UUID RFC 4122/9562.

## Version 4 et version 7

- **La version 4** est presque entièrement aléatoire : 122 de ses 128 bits proviennent de la source aléatoire, et les 6 autres sont les bits fixes de version et de variante. C’est le bon choix par défaut quand il vous faut simplement un identifiant imprévisible et résistant aux collisions, sans souci d’ordre.
- **La version 7** est ordonnée dans le temps. Ses 48 bits de poids fort sont un horodatage Unix en millisecondes, suivi de 74 bits aléatoires. Comme l’horodatage est en tête, les UUID version 7 se trient dans l’ordre de création, ce qui les rend bien meilleurs que la version 4 comme clés primaires de base de données : des insertions séquentielles gardent un index compact au lieu d’éparpiller les écritures.

La version 7 est apparue avec la RFC 9562, la spécification de 2024 qui a mis à jour et rendu obsolète la RFC 4122 d’origine.

## Inspection d’un UUID

Collez n’importe quel UUID : l’outil l’analyse sans rien générer. Il confirme le format, lit la version et la variante à leurs positions fixes et, pour un UUID version 7, décode l’horodatage de 48 bits qu’il contient pour en refaire une date. Cette dernière partie est l’astuce utile : un identifiant version 7 porte discrètement le moment de sa création, si bien que vous pouvez lire l’heure de création d’un enregistrement directement dans sa clé.

## Utilisation

Générez un UUID v4 ou v7 d’un clic, ou collez un UUID existant pour lire sa version, sa variante et, pour v7, son horodatage. La génération s’appuie sur la source aléatoire sûre : les valeurs v4 sont donc imprévisibles ; l’inspection est une simple analyse et ne révèle que ce que l’UUID encode lui-même.

## Partage des résultats

Sous la lecture de la zone Inspecter, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la valeur de la zone Inspecter. Les UUID que vous avez générés n’y figurent pas : chacun est tiré de la source aléatoire de votre navigateur, et la personne qui ouvre le lien appuie sur Générer pour obtenir les siens. Un UUID ne désigne rien qui vous concerne. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** La valeur remplit la zone Inspecter comme le ferait un collage, et la page la lit (une valeur qui n’est pas un UUID affiche UUID non valide, comme lors d’une saisie). Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
