## Ce que fait l’outil

Saisissez un nombre (de 1 à 3999) pour lire son écriture en chiffres romains ; saisissez des chiffres romains pour lire leur valeur. L’outil affiche toujours la forme soustractive canonique et sa construction rang par rang : 1994 s’écrit M + CM + XC + IV. Tout est calculé dans votre navigateur.

## Une validation honnête

Les écritures additives historiques qu’employaient les Romains eux-mêmes, IIII sur les cadrans d’horloge, MDCCCCX sur les façades, sont acceptées, correctement évaluées et signalées, avec la forme canonique à côté. Les chaînes réellement mal formées sont refusées avec la règle précise qu’elles enfreignent : IL n’est pas une paire soustractive admise (seules IV, IX, XL, XC, CD et CM soustraient), VV répète un symbole qui ne se répète jamais, IIX soustrait deux symboles là où un seul peut l’être.

## Pourquoi l’outil s’arrête à 3999

Le système classique compte sept symboles, aucun zéro, et rien au-dessus de M (1000). Pour les valeurs plus grandes, les Romains traçaient un vinculum, une barre suscrite qui multiplie par 1000 et n’a pas d’équivalent en texte brut. Plutôt que d’inventer une convention, l’outil indique la limite.

## Partage des résultats

Sous le résultat, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le nombre ou les chiffres romains tels que saisis, une fois que la page les a convertis ; une valeur refusée n’a rien à partager. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** La valeur remplit la zone comme un collage et la page la convertit. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
