## Ce que fait l’outil

Donnez-lui un instant de réunion (avec Z ou un décalage explicite, car une heure de réunion sans décalage est ambiguë) et une liste de fuseaux horaires IANA, un par ligne. Il lit cet instant unique dans chaque fuseau : date et heure locales, jour de la semaine, décalage UTC que tzdata indique pour cette date, changement de date par rapport au premier fuseau, et un indicateur d’heures ouvrées. Les données de fuseaux sont la propre base IANA de votre navigateur, celle que le système d’exploitation tient à jour.

## Les indicateurs, explicités

Les heures ouvrées sont signalées de 09:00 à 17:59, heure locale, du lundi au vendredi : la plage habituelle, nommée plutôt que cachée. Une colonne de changement de date signale les participants qui se trouvent à une autre date du calendrier, la surprise classique du participant de Tokyo qui rejoint la réunion le lendemain, qu’il vaut mieux mentionner expressément dans l’invitation.

## Pourquoi la date compte

L’heure d’été dépend de ce que disent les règles du fuseau pour cette date précise : Berlin est à UTC+2 en juillet et à UTC+1 en janvier ; São Paulo est à UTC-3 toute l’année depuis que le Brésil a aboli l’heure d’été en 2019. Tout l’intérêt est de planifier avec une vraie date.

Sous l’instant, un sélecteur de date et d’heure permet de le définir sans saisie : une sélection conserve les secondes et le décalage du champ, et écrit Z (UTC) quand il n’en avait pas. Sous les fuseaux, une liste de tous les fuseaux IANA que connaît le navigateur ajoute celui que vous choisissez sur une nouvelle ligne.

## Partage des résultats

Sous le tableau, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, l’instant de la réunion et les fuseaux, un par ligne, tels que saisis, dès que la page a établi un planning. Les heures locales sont calculées à partir des données de fuseaux horaires du navigateur qui ouvre le lien, celles que la page utilise toujours. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** L’instant et les fuseaux se remplissent comme si vous les saisissiez, et la page établit le planning. Les deux doivent être présents, sinon le lien est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
