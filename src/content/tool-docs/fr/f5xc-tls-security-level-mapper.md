## Ce que fait l’outil

Cet outil établit la correspondance, dans les deux sens, entre les niveaux de sécurité TLS de F5 Distributed Cloud (XC) et les suites de chiffrement qu’ils négocient. Choisissez un niveau, **High**, **Medium** ou **Low** : il affiche les versions TLS minimale et maximale exactes et la liste complète des suites, chacune annotée de son échange de clés, de sa confidentialité persistante et de sa robustesse. Ou collez une suite de chiffrement (forme IANA `TLS_*` ou forme OpenSSL à tirets) ou une ligne entière de scanner : il vous indique quels niveaux incluent cette suite. Tout s’exécute dans votre navigateur.

## La table de référence

Les listes de suites sont reprises telles quelles de la TLS Reference de F5. Deux points de cette table piègent souvent. D’abord, **Default est le niveau High** : au minimum TLS 1.2, au maximum TLS 1.3, et c’est celui qu’utilise un équilibreur de charge HTTPS doté d’un certificat automatique. Ensuite, les niveaux sont **cumulatifs** : Medium reprend toutes les suites High plus quatre suites ECDHE-CBC, et Low toutes les suites Medium plus quatre suites RSA statiques. Tous les niveaux plafonnent à TLS 1.3.

## Pourquoi votre scanner signale un équilibreur de charge

Deux questions de terrain reviennent sans cesse, et l’outil répond aux deux. Si un scanner signale **TLS 1.0 ou 1.1 activés**, l’équilibreur de charge est en **Medium ou Low** : ces niveaux ont TLS 1.0 pour minimum. Le niveau Default/High a TLS 1.2 pour minimum et ne présente donc pas les anciens protocoles (K000148226). Si un scanner signale des **suites faibles**, ce sont presque toujours les **suites RSA statiques qu’ajoute le niveau Low** : elles n’offrent pas de confidentialité persistante, précisément ce qu’un scanner pénalise (K000148079).

## Lecture des annotations

Chaque suite est étiquetée avec son échange de clés (TLS 1.3, ECDHE-ECDSA, ECDHE-RSA ou RSA), la présence ou non de confidentialité persistante (PFS) et une note de robustesse. Les suites ECDHE sont PFS ; les suites RSA statiques ne le sont pas. TLS 1.3 et les suites AEAD (GCM / ChaCha20) sont robustes ; les suites CBC-SHA sont moyennes ; les suites RSA statiques sont faibles.

## Partage des résultats

Chaque mode a son propre bouton **Partager les résultats**, sous sa propre réponse, qui crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la valeur de ce mode : sous les suites du niveau, le niveau choisi ; sous les niveaux de la suite, la ligne de suite de chiffrement saisie, dès qu’une suite y est reconnue. Un niveau ou une suite de chiffrement ne désigne aucun système ni aucune personne. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le niveau est sélectionné et la ligne de suite se remplit, comme si vous aviez cliqué et saisi ; les deux lectures suivent. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
