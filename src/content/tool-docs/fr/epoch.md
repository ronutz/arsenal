## Ce que fait l’outil

Saisissez un horodatage Unix ou une date ISO-8601 et lisez le même instant sous toutes les formes courantes. Quand vous saisissez un nombre, l’outil détecte automatiquement son unité (secondes, millisecondes, microsecondes ou nanosecondes) d’après son ordre de grandeur : vous pouvez donc coller une valeur issue de presque n’importe quel système sans préciser son unité. Il restitue ensuite l’instant sous forme de date et heure UTC détaillées, de chaîne ISO-8601, d’horodatage RFC 3339, de date au format HTTP, et d’horodatage dans les quatre unités. Tout est calculé dans votre navigateur.

## Signification de l’heure Unix

L’heure Unix, définie par POSIX, est le nombre de secondes écoulées depuis l’epoch (1970-01-01 00:00:00 UTC), sans compter les secondes intercalaires. Selon les systèmes, elle est stockée avec des résolutions différentes : l’Unix classique et la plupart des API utilisent les secondes ; JavaScript et de nombreuses bases de données, les millisecondes ; certaines interfaces de traçage et du noyau, les microsecondes ou les nanosecondes. Ces ordres de grandeur étant séparés d’un facteur mille environ, l’unité peut se déduire du nombre de chiffres du nombre : c’est ce que fait la détection automatique.

## Formats produits

- **Date et heure UTC détaillées** : l’année, le mois, le jour et l’heure en UTC.
- **ISO 8601 et RFC 3339** : le format d’horodatage d’Internet, par exemple `2026-07-01T20:00:00Z`.
- **Date HTTP** : la forme IMF-fixdate utilisée dans les en-têtes HTTP (RFC 9110, section 5.6.7), par exemple `Wed, 01 Jul 2026 20:00:00 GMT`.
- **Les quatre unités** : le même instant exprimé en secondes, millisecondes, microsecondes et nanosecondes.

## Plage et déterminisme

Les dates sont traitées dans la plage que peut représenter une valeur de date JavaScript, soit environ 273 000 ans de part et d’autre de l’epoch (une limite de 8,64 x 10^15 millisecondes de chaque côté). La conversion est une fonction pure de la valeur saisie et ne lit jamais l’horloge courante : un horodatage donné s’affiche donc toujours de la même façon. Une indication « par rapport à maintenant » a forcément besoin de l’horloge réelle ; elle se trouve donc dans l’interface de l’outil et non dans ce cœur déterministe.

## Utilisation

Saisissez un horodatage Unix comme `1751400000` (une valeur à dix chiffres, donc lue en secondes) ou `1751400000000` (treize chiffres, lue en millisecondes), ou une date ISO-8601 comme `2026-07-01T20:00:00Z`, et lisez d’un coup toutes les formes équivalentes.

## Partage des résultats

Sous le titre du résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, l’horodatage ou la date tel que saisi, une fois que la page l’a lu. La ligne qui indique depuis combien de temps l’instant est passé, ou dans combien de temps il arrivera, dépend de l’horloge de la personne qui ouvre le lien, comme pour un collage ; les conversions elles-mêmes sont identiques partout. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** La valeur remplit la zone comme le ferait un collage, et la page la convertit. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
