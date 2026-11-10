# Sélecteur de flux OAuth

La première question de toute intégration OAuth ou OpenID Connect (PingFederate, PingAM, PingOne ou autre) est de savoir *quel flux* utiliser. L’outil encode la réponse moderne sous forme de décision déterministe, et cite la RFC qui fonde chacune de ses lignes.

## Trois questions

De quel type d’application s’agit-il (application web côté serveur, SPA, application native, service à service ou appareil à saisie limitée) ? A-t-elle besoin de savoir **qui** est l’utilisateur (c’est le rôle d’OpenID Connect, superposé au même flux) ? A-t-elle besoin d’un accès en l’absence de l’utilisateur (jetons de rafraîchissement, refresh tokens) ?

## Les réponses de l’outil

Les applications serveur, SPA et natives reçoivent toutes le flux **authorization code** : client confidentiel avec un secret quand un backend existe, client public **avec PKCE** (RFC 7636) quand il n’y en a pas, et, pour les applications natives, la règle du navigateur système de la RFC 8252 explicitée. Le service à service reçoit **client credentials** (RFC 6749 §4.4), avec la remarque que des jetons de rafraîchissement ne devraient pas y être émis (SHOULD NOT). Les téléviseurs et les bornes reçoivent le **device grant** (RFC 8628), avec sa chorégraphie du user_code saisi sur un second appareil.

## L’autre moitié, tout aussi importante

Chaque résultat comprend la liste des flux *à éviter* : **implicit** et **ROPC (password)** sont écartés nommément, conformément à l’OAuth 2.0 Security Best Current Practice (RFC 9700), avec leurs raisons clairement énoncées (des jetons dans des fragments, des identifiants dans des applications). Les clients publics qui demandent un accès hors ligne reçoivent l’exigence de **rotation** des jetons de rafraîchissement ; demander l’identité de l’utilisateur final à un flux de machine à machine déclenche un avertissement de contradiction au lieu d’une mauvaise réponse.

Tout est décidé localement ; les trois réponses ne contiennent aucun secret et rien n’est transmis.

## Partage des résultats

Sous le nom et le type d’autorisation du flux recommandé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, vos trois réponses : le type d’application par son nom stable (`app=spa`), et chaque question à laquelle vous avez répondu oui (`identity=1`, `offline=1`). Rien de ce que vous tapez ne part, puisqu’il n’y a rien à taper. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les réponses ne sont donc pas envoyées au serveur à l’ouverture du lien ; elles restent dans la barre d’adresse et l’historique de la personne qui l’ouvre.

- **Ouverture d’un lien.** Les trois réponses remplacent celles du formulaire et la page recommande le même flux, dans le navigateur. Un type d’application que la page ne propose pas, ou une réponse autre que 1 ou 0, fait ignorer tout le lien. Dans tous les cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
