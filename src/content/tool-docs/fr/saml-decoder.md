## Ce que fait l’outil

Collez une Response ou une assertion SAML, en XML brut, en base64 ou encodée en URL, et l’outil la décode : l’émetteur, le statut, le sujet, les conditions, l’audience et les attributs. Il effectue en parallèle une évaluation de sécurité fondée sur des règles, et il analyse le XML d’une façon durcie contre les attaques XXE. Tout se passe dans votre navigateur.

## SAML en bref

SAML (Security Assertion Markup Language) est la norme fondée sur XML qui sous-tend une grande partie de l’authentification unique (SSO, single sign-on) en entreprise. Après votre authentification, un fournisseur d’identité (IdP) émet une **Assertion** signée, généralement enveloppée dans une **Response**, qui atteste votre identité auprès d’un fournisseur de services. Les éléments qu’extrait l’outil sont ceux qui décident si cette assertion mérite confiance : l’**Issuer** (quel IdP), le **Status** (si l’authentification a réussi), le **Subject** et son NameID (qui), les **Conditions** (la fenêtre de validité et l’**AudienceRestriction**, qui nomme le destinataire de l’assertion) et les **Attributes** (les claims relatives à l’utilisateur). Comme SAML circule encodé en base64 avec le binding HTTP-POST, souvent encodé pour l’URL dans un champ de formulaire, l’outil commence par défaire ces encodages ; un message compressé par DEFLATE pour le binding HTTP-Redirect est refusé, avec une erreur qui demande le XML brut ou le formulaire HTTP-POST.

## Le modèle de sécurité : rejet des XXE

La propriété phare de l’outil est sa manière d’analyser. Le XML non fiable est dangereux en raison des attaques XXE (XML External Entity) et des attaques par expansion d’entités comme billion laughs, et toutes deux exigent que le document déclare une DTD, par un `DOCTYPE` ou une déclaration `<!ENTITY>`, pour définir leurs entités. Un message SAML légitime n’a jamais besoin de DTD : l’analyseur rejette donc d’emblée tout document qui en contient une. Cette seule règle neutralise par construction les XXE classiques et l’expansion billion laughs, au lieu d’essayer de les assainir après coup.

## Ce que vérifie l’évaluation

Au-delà du décodage, l’outil évalue le message au regard des recommandations de sécurité SAML : s’il est signé, s’il s’appuie sur des algorithmes de signature ou d’empreinte faibles (comme SHA-1), et si ses conditions et son audience sont présentes et cohérentes. Si l’assertion est chiffrée, l’outil détecte l’`EncryptedAssertion` et le signale au lieu de tenter de la déchiffrer. Ces vérifications reprennent les questions des recommandations SAML de l’OWASP : la sortie pointe donc vers ce qui cause réellement les vulnérabilités SAML.

## Utilisation

Collez une Response ou une assertion SAML sous l’une de ses formes courantes et lisez l’émetteur, le statut, le sujet, les conditions, l’audience et les attributs décodés, ainsi que l’évaluation de sécurité. L’analyse est déterministe et locale, et l’analyseur qui rejette les XXE permet d’inspecter sans risque des messages non fiables.

Pour lire un long message mis en forme ligne par ligne, le [formateur et validateur XML](/tools/xml-formatter) l’indente ; sa documentation explique pourquoi un message signé ne doit pas être transmis une fois reformaté.

## Partage des résultats

Sous les badges principaux, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le message tel que collé (XML brut, encodé en URL ou base64), une fois que la page l’a décodé. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Un message SAML nomme votre fournisseur d’identité et votre fournisseur de services, et un sujet peut nommer une personne : la fenêtre contextuelle vous demande donc de le vérifier avant d’envoyer le lien.

Un message qui contient des identifiants n’obtient aucun lien : une assertion signée, une assertion dans une Response signée, ou une `EncryptedAssertion`. Le document [SAML 2.0 Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf) (OASIS, consulté le 01/11/2026) dit de la méthode bearer que le sujet de l’assertion en est le porteur (« the subject of the assertion is the bearer of the assertion », section 3.3), et que les assertions remises avec le binding HTTP POST doivent être signées (« MUST be signed », section 4.1.4.5) ; le fournisseur de services ne mémorise les ID déjà utilisés que pendant la durée de validité de l’assertion. Une assertion signée ouvre donc une session au nom de son sujet, et un lien la remettrait à quiconque le reçoit jusqu’à son expiration ; une assertion chiffrée ([SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf), section 2.3.4) est une assertion que le fournisseur de services peut ouvrir. Retirer la signature changerait ce qu’affiche cette page : le message n’est donc pas copié non plus. Une AuthnRequest, une LogoutRequest ou une LogoutResponse, des métadonnées, une Response d’erreur (qui ne doit contenir aucune assertion, « MUST NOT include any assertions », Profiles, section 4.1.4.2) et une assertion non signée obtiennent toutes un lien.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le message remplit la zone comme un collage et la page le décode, localement ; elle ne vérifie, ne récupère et ne déchiffre jamais rien. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
