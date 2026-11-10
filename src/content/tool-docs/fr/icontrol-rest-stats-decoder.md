## Ce que fait l’outil

Collez une réponse de statistiques iControl REST et l’outil l’aplatit en une ligne par statistique. Il déballe les enveloppes `entries`, `nestedStats`, `value` et `description`, réduit les clés en forme d’URL aux objets qu’elles désignent, et regroupe le résultat par objet. Une pure transformation locale : rien n’est récupéré et rien ne quitte le navigateur.

## Pourquoi aplatir la réponse

Une charge utile de statistiques BIG-IP enveloppe chaque feuille dans `value` ou `description`, chaque niveau dans `entries` et `nestedStats`, et indexe l’objet extérieur par une URL complète. Trois enveloppes autour d’un seul nombre. Cette forme est autodescriptive plutôt que perverse, mais elle ne se lit pas d’un coup d’œil, et un pool avec ses membres peut s’imbriquer sur quatre niveaux.

## La scission en 64 bits, le point qui compte

F5 scinde les grands compteurs en deux moitiés, `.high` et `.low`, car les nombres JSON ne peuvent pas transporter un entier de 64 bits en toute sécurité. `serverside.bitsIn.high = 3` et `serverside.bitsIn.low = 1000000` ne sont **pas deux statistiques** : c’est un seul compteur, dont la valeur est `(high << 32) + low`, soit 12 885 901 888.

**L’outil recombine les deux moitiés et marque les valeurs recombinées**, pour que vous puissiez vérifier le calcul plutôt que de lui faire confiance. Un outil d’aplatissement qui affiche les moitiés séparément sous-estimera sans bruit vos compteurs les plus chargés.

## Des totaux, pas des débits

Chaque compteur est un total depuis la dernière remise à zéro, et la charge utile ne contient aucun intervalle. **Un seul échantillon ne permet pas de calculer un débit.** L’outil le rappelle à chaque décodage, car tracer un compteur au lieu de sa dérivée est une façon classique de construire un tableau de bord qui monte indéfiniment.

## Ce que l’outil ne fait pas

Il n’interprète pas les statistiques et ne connaît pas votre intervalle d’interrogation. Il refuse une réponse de configuration avec un message clair au lieu de produire une sortie vide, car l’absence d’objet `entries` est l’indice fiable.

## Partage des résultats

Sous le texte aplati, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la réponse de statistiques telle que collée. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Une réponse de statistiques contient des compteurs et les objets auxquels ils appartiennent, pas des identifiants : iControl REST transporte le jeton dans l’en-tête `X-F5-Auth-Token` de la requête ([guide AS3 de F5, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), consulté le 27/10/2026). La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la réponse n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; les statistiques d’une collection peuvent la dépasser, et la fenêtre contextuelle indique alors la longueur du partage au lieu de proposer un lien.
- **Ouverture d’un lien.** Le JSON remplit la zone comme un collage, et la page l’aplatit. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
