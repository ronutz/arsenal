## Ce que fait l’outil

Deux modes d’arithmétique exacte sur le temps. Entre deux instants : l’intervalle signé, décomposé de la plus grande unité à la plus petite (semaines, jours, heures, minutes, secondes) et totalisé intégralement dans chaque unité, avec la durée ISO 8601 canonique. Instant ± durée : l’horodatage obtenu. Les durées se lisent en ISO 8601 (P1DT2H30M, PT90M, P1W) ou en notation abrégée simple (1d 2h 30m ; 90min). Tout est calculé sur l’échelle de temps UTC, dans votre navigateur.

## Ce que l’outil refuse, et pourquoi

Ajouter « un mois » relève de l’arithmétique calendaire : un mois compte de 28 à 31 jours et une année 365 ou 366, si bien que P1M n’a pas de longueur exacte unique. L’outil refuse les mois et les années avec cette explication, au lieu de choisir discrètement une convention. Ici, un jour fait exactement 24 heures et une semaine exactement 7 jours : du temps exact, annoncé comme tel.

## Décalages

Un horodatage sans décalage est lu comme UTC, et cette hypothèse est signalée. Ajoutez Z ou un décalage explicite (par exemple -03:00) et la réponse ne dépend plus jamais de la machine sur laquelle l’outil s’exécute.

Sous chaque instant, un sélecteur de date et d’heure permet de le définir sans saisie. Une sélection conserve les secondes et le décalage que le champ contenait déjà, et écrit Z (UTC) quand il n’en avait pas ; un décalage autre que Z, ou une date seule, se saisit toujours au clavier.

## Partage des résultats

Sous le résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le mode et ses champs, dès que la page a un résultat : les deux instants pour l’intervalle qui les sépare, ou l’instant de départ, la durée et l’opération (ajouter ou soustraire). Les champs de l’autre mode n’y figurent pas. Les instants et les durées ne désignent rien qui vous concerne. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le mode est choisi, ses champs se remplissent comme si vous les saisissiez, et la page calcule ; les champs de l’autre mode gardent ce que vous y aviez mis. Un mode ou une opération inconnus, un champ manquant ou un champ de l’autre mode font ignorer le lien. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
