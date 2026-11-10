# Suivi de la transformation numérique

Trente jalons répartis dans sept domaines de la vie courante, des premiers paquets de l’ARPANET jusqu’à des prévisions qui ne se sont pas encore réalisées. L’intérêt de l’outil n’est pas la chronologie. C’est le **niveau de certitude** associé à chaque ligne.

## Raison d’être des niveaux

Un suivi doté d’une rubrique « ce qui vient ensuite » devient un support de prévision, et la règle du site veut que les outils calculent plutôt qu’ils ne devinent. La solution : une prévision n’a jamais le droit de ressembler à un fait.

- **Réalisé** : c’est arrivé, c’est daté et vérifiable.
- **En vigueur** : une obligation légale qui s’impose aujourd’hui.
- **Programmé** : une date future fixée par la loi ou par un calendrier publié. Grande confiance dans la date, aucune affirmation sur les conséquences.
- **Programmé, mais en cours de modification** : une date qui existe bel et bien dans la loi *et* qui est en train d’être modifiée. L’outil montre la date d’origine, la date proposée et le fait que la modification n’a pas encore force de loi.
- **Prévision** : la projection de quelqu’un, qui nomme toujours son auteur et s’accompagne d’un signal contraire quand il en existe un.

Ce quatrième niveau, personne d’autre ne le montre. Les obligations de l’AI Act européen pour les systèmes à haut risque en sont l’exemple commenté : programmées pour le 2 août 2026, elles ont fait l’objet le 7 mai 2026 d’un accord provisoire pour un report au 2 décembre 2027, qui n’a pas encore force de loi ; c’est donc toujours la date d’origine qui gouverne la planification.

## Contenu de chaque ligne

Chaque jalon répond à deux questions : ce qui a changé pour une personne ordinaire, et ce qui est devenu possible alors que cela ne l’était pas auparavant. Filtrer par domaine montre à quel point la transformation est arrivée différemment dans l’argent, le travail, la santé et l’État.

## Partage des résultats

Sous le décompte, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les filtres activés, par identifiant : `domains` et `certainties`, dans l’ordre de la page (une rangée sans filtre activé ne transmet rien, ce qui signifie « tous », comme sur la page). Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Sans filtre activé, la vue est celle de la page à son ouverture, vers laquelle pointe déjà le bouton Partager de la page : le bouton reste donc inactif. Les jalons ne voyagent jamais : la page qui ouvre le lien lit le même jeu de données, si bien que le lien reste court et qu’une ligne corrigée profite aussi aux anciens liens.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la vue n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Ouverture d’un lien.** Les pastilles de filtre sont positionnées et la frise se redessine, comme lorsque vous les touchez. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Confidentialité

Les filtres sont évalués localement. Rien n’est transmis, et le jeu de données est livré avec la page.
