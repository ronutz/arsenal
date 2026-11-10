## Ce que fait l’outil

Tout message syslog commence par une valeur de priorité, la PRI, un petit nombre entre chevrons comme `<134>`, tout au début de la ligne. Ce seul nombre réunit deux informations. L’outil décode une PRI en sa facility (catégorie syslog) et sa gravité, et encode une facility et une gravité en une PRI et sa forme `<PRI>` telle qu’elle circule sur le réseau. Tout s’exécute dans votre navigateur.

## La formule de la PRI

La PRI combine une facility et une gravité selon l’arithmétique définie dans la RFC 5424 :

    PRI = Facility * 8 + Severity
    Facility = PRI / 8   (integer division)
    Severity = PRI % 8

Comme la gravité n’occupe que les trois bits de poids faible, une PRI se lit d’un coup d’œil une fois ses composantes connues. La plage valide va de 0 à 191, puisque la facility va de 0 à 23 et la gravité de 0 à 7.

## Facility et gravité

- La **facility** (de 0 à 23) désigne le sous-système qui a produit le message : le noyau, la messagerie, le système d’authentification, le démon syslog lui-même, etc., jusqu’aux huit emplacements `local0` à `local7` que les équipements réseau et les appliances utilisent généralement pour leurs propres messages.
- La **gravité** (de 0 à 7) indique l’urgence, et dans le sens contre-intuitif : 0 est la plus grave (Emergency) et 7 la moins grave (Debug), avec Error à 3 et Informational à 6 entre les deux.

## Exemple commenté

- `<134>` se décode en facility 16 (`local0`) et gravité 6 (Informational), car `134 = 16 * 8 + 6`. Cette valeur est une valeur par défaut courante des équipements réseau qui journalisent des évènements de routine.

## Utilisation

Saisissez une PRI pour la décomposer en facility et gravité, ou choisissez une facility et une gravité pour obtenir la PRI et la chaîne `<PRI>` que vous verriez sur le réseau. La RFC 5424 définit le format syslog moderne ; l’ancien format BSD de la RFC 3164 utilise la même arithmétique pour la PRI.

## Partage des résultats

Sous le résultat, dans les deux modes, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient une PRI et rien d’autre : en mode décodage, le champ tel que saisi (`#input=%3C34%3E`) ; en mode encodage, la PRI que forment la facility et la gravité, sous sa forme réseau (`#input=%3C134%3E` pour local0 et informational), si bien que le lien s’ouvre en mode décodage sur la même facility et la même gravité. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; une PRI fait au plus cinq caractères.
- **Ouverture d’un lien.** Le lien a la même adresse que les autres liens qui mènent à cet outil : la PRI remplit le champ de décodage comme une saisie. Comme pour tout lien vers cet outil, la valeur reste après le `#` jusqu’à ce que vous modifiiez ou effaciez le champ, puis quitte l’adresse sans aucune requête.
