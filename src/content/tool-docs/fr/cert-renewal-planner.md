## Ce que fait l’outil

Donnez à l’outil les dates de début et de fin d’un certificat, ses `notBefore` et `notAfter`, et il en déduit les conséquences pratiques : la durée de validité du certificat, la phase du calendrier de réduction des durées de validité du CA/Browser Forum sous laquelle il a été émis et si sa durée respecte le plafond de cette phase, le nombre de renouvellements par an qu’implique ce rythme, les fenêtres de réutilisation des validations de domaine et d’identité à cette époque, ainsi qu’un délai d’anticipation recommandé et une date « renouveler avant le ». C’est un pur calcul de dates, qui s’exécute entièrement hors ligne.

## Pourquoi la durée de vie des certificats raccourcit

Les certificats TLS de confiance publique raccourcissent depuis des années, et le vote (ballot) SC-081v3 du CA/Browser Forum fixe un calendrier qui abaisse la validité maximale de 398 jours à 200 puis à 100 jours, et enfin à 47 jours d’ici 2029. Des certificats plus courts limitent la durée pendant laquelle un certificat compromis ou émis à tort reste utilisable, mais ils rendent aussi le renouvellement manuel impraticable, et c’est le but : le calendrier impose de fait l’automatisation. Deux fenêtres associées raccourcissent en même temps que la validité : la période pendant laquelle une validation du contrôle du domaine (DCV, domain control validation) peut être réutilisée, et celle pendant laquelle les informations d’identité du sujet (SII, Subject Identity Information), c’est-à-dire l’identité validée du sujet du certificat, peuvent l’être ; une plus grande part du processus doit donc être répétée plus souvent.

## Ce que le plan vous indique

À partir des deux dates seulement, l’outil reconstitue l’ensemble :

- la **durée de validité** et la phase SC-081v3 à laquelle elle correspond, avec un oui ou un non clair sur le respect du plafond de cette phase ;
- le **rythme de renouvellement**, exprimé en renouvellements par an, pour le plafond actuel comme pour chaque plafond à venir, pour que vous voyiez la charge de travail augmenter ;
- les **fenêtres de réutilisation DCV et SII** applicables à l’époque d’émission ; et
- un **délai de renouvellement recommandé** et la date « renouveler avant le » qui en découle, pour qu’un renouvellement aboutisse avant l’expiration plutôt qu’à la dernière minute.

## L’automatisation, la vraie réponse

Comme ce calendrier aboutit à des certificats de 47 jours, renouveler chaque certificat à la main de nombreuses fois par an ne passe pas à l’échelle. La réponse standard est le protocole ACME (RFC 8555), l’émission et le renouvellement automatisés qu’utilisent des outils comme certbot ; les chiffres de rythme du planificateur sont en réalité un argument pour l’adopter.

## Utilisation

Saisissez les dates `notBefore` et `notAfter` du certificat, puis lisez la validité, la conformité au calendrier, le rythme de renouvellement, les fenêtres de réutilisation et la date de renouvellement recommandée. Le calcul est une fonction pure de ces deux dates ; le fait qu’un certificat soit expiré à l’instant présent s’affiche à part, d’après l’horloge de votre appareil.

## Partage des résultats

À la fin du résumé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les deux dates, d’émission et d’expiration : `/tools/cert-renewal-planner#input=2026-01-01&notafter=2027-02-02`. Les jours restants ne sont pas transmis : la page les compte d’après l’horloge de la personne qui ouvre le lien. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les dates ne sont donc pas envoyées au serveur à l’ouverture du lien ; elles restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Ouverture d’un lien.** Les deux dates sont réglées et la page établit le plan. Chacune doit être un jour réel au format AAAA-MM-JJ, le seul que puisse contenir un champ de date ; toute autre valeur fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
