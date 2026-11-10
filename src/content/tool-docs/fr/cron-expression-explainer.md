# Analyseur d’expressions cron

Collez une planification crontab à cinq champs, ou l’une des macros `@`, et l’outil vous la relit : chaque champ est expliqué en langage clair avec l’ensemble exact des valeurs auxquelles il correspond, les cinq prochaines occurrences sont calculées, et les pièges propres au dialecte sont signalés au fil de la saisie.

## Les cinq champs

`minute hour day-of-month month day-of-week`, avec des plages `a-b`, des listes `a,b`, des pas `*/n` et `a-b/n`, et des noms (`JAN`–`DEC`, `SUN`–`SAT`). Les macros `@` (`@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` et consorts) se développent en leur forme à cinq champs ; `@reboot` n’a aucune planification, et l’outil le dit au lieu d’en inventer une.

## Les pièges signalés

Le principal : quand le jour du mois **et** le jour de la semaine sont tous deux restreints, cron exécute la commande quand **l’un ou l’autre** correspond, un OU et non le ET qu’attend presque tout le monde. Également : `0` et `7` désignent tous deux le dimanche ; un pas qui ne divise pas sa plage de façon exacte retombe de façon irrégulière (`*/7` en minutes s’arrête à 56, puis revient à 0) ; les noms à l’intérieur de plages avec pas sont historiquement peu fiables d’une implémentation à l’autre ; et une saisie à six champs est reconnue comme le dialecte Quartz avec secondes, et nommée comme telle.

## À propos des heures calculées

cron évalue les planifications dans l’heure **locale** du démon. Les occurrences affichées ici sont calculées sur l’heure qu’indique l’horloge de votre navigateur à l’instant présent, sans base de données de fuseaux horaires, avec le même moteur déterministe que les vecteurs de référence (golden vectors) figent à partir d’un instant de référence fixe.

Tout s’exécute localement ; la planification ne quitte jamais la page. Fondé sur `crontab(5)` et la spécification POSIX.

## Partage des résultats

Au-dessus des panneaux des champs, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la planification telle que saisie après le `#`, une fois que la page l’a lue. La page ne lit qu’une planification, cinq champs horaires ou une macro @ : une ligne crontab accompagnée de sa commande est refusée (le nombre de champs est incorrect), si bien qu’une commande, et tout mot de passe ou jeton qui y serait écrit, ne se retrouve jamais dans un lien. Les prochaines exécutions sont calculées à partir de l’horloge de la personne qui ouvre le lien. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** La planification remplit la zone comme lors d’un collage, et la page l’explique. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
