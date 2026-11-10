## Ce que fait l’outil

Manipulez les deux valeurs au cœur de l’extension PKCE d’OAuth 2.0. L’outil génère un `code_verifier` aléatoire et en dérive le `code_challenge` avec la méthode S256, ou prend un `code_verifier` que vous collez et le vérifie selon les règles de longueur et de caractères de la RFC 7636, en dérivant le challenge qu’attendra votre serveur d’autorisation. La dérivation est exactement l’étape SHA-256 puis Base64url définie par la norme, et tout s’exécute dans votre navigateur.

## Ce contre quoi PKCE protège

Le flux du code d’autorisation d’OAuth 2.0 renvoie un code de courte durée de vie en passant par le navigateur de l’utilisateur, et, sur une application mobile ou monopage, cette redirection peut être interceptée par une autre application. PKCE (Proof Key for Code Exchange) comble cette faille. Au début du flux, le client invente un secret, le `code_verifier`, et n’envoie avec la requête initiale qu’une version transformée de celui-ci, le `code_challenge`. Quand il échange ensuite le code contre des jetons, il présente le `code_verifier` d’origine ; le serveur redérive alors le challenge et vérifie qu’il correspond. Un attaquant qui vole le code ne peut pas s’en servir, car il n’a jamais vu le verifier.

## Le verifier et le challenge

- Le **code_verifier** est une chaîne aléatoire à forte entropie de 43 à 128 caractères, tirée de l’ensemble non réservé `A-Z a-z 0-9 - . _ ~`.
- Le **code_challenge** en est dérivé. La méthode recommandée, `S256`, calcule `BASE64URL(SHA256(ASCII(verifier)))`, l’encodage Base64url de l’empreinte SHA-256 du verifier, sans remplissage (padding). La méthode `plain`, où le challenge est simplement égal au verifier, existe pour les clients contraints mais est déconseillée, car elle n’offre aucune protection si le challenge est observé.

## Pourquoi c’est important aujourd’hui

PKCE a d’abord servi de correctif pour les applications mobiles, mais c’est désormais la base. La bonne pratique de sécurité OAuth actuelle, la RFC 9700, exige PKCE pour tout client qui utilise le flux du code d’autorisation, pas seulement pour les clients publics. Si vous développez ou déboguez un client OAuth, générer ici un verifier et confirmer son challenge S256 vous permet de vérifier directement votre implémentation par rapport à la spécification.

## Utilisation

Générez un nouveau `code_verifier` et lisez son `code_challenge` `S256`, ou collez un verifier existant pour valider sa longueur et ses caractères et dériver le challenge correspondant. Comme S256 est un hachage à sens unique, le challenge ne révèle rien du verifier.

## Partage des résultats

Sous les badges de validité, le bouton **Partager les résultats** ne propose un lien vers cette page que pour un seul verifier : l’exemple que la [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) donne en annexe B (`dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`, l’exemple de la page), qu’il place après le `#`. Pour tout autre verifier, la fenêtre contextuelle indique qu’il n’y a pas de lien, et pourquoi.

Un code_verifier est le secret du flux. La RFC 7636 (consultée le 01/11/2026) le présente comme une clé aléatoire au sens cryptographique (« cryptographically random key ») qui neutralise un code d’autorisation intercepté, puisque l’attaquant ne connaît pas cette clé à usage unique (« since the attacker would not know this one-time key », section 1), et fait reposer la sécurité du protocole sur le fait que l’attaquant ne puisse ni apprendre ni deviner le verifier (« learned or guessed by the attacker », section 7.1). Aucune valeur dérivée ne peut le remplacer, car cette page calcule tout à partir du verifier lui-même : le challenge sans le verifier ne laisserait rien à afficher. Un lien ne contient donc le verifier que lorsqu’il s’agit de la valeur de test de la norme elle-même.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la valeur n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Ouverture d’un lien.** L’exemple remplit la zone et la page dérive les deux challenges, avec Web Crypto dans le navigateur. Un lien qui contient toute autre valeur est ignoré et ne remplit jamais la zone. Dans les deux cas, la valeur quitte aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
