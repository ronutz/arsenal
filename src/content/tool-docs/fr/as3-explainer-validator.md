## Ce que fait l’outil

Collez une déclaration AS3 pour F5 BIG-IP, le JSON que vous envoyez par POST à `/mgmt/shared/appsvcs/declare`, et l’outil vous la restitue en clair : s’il s’agit d’une requête AS3 complète ou d’une déclaration ADC seule, les options de premier niveau, les métadonnées ADC, et l’arborescence Tenant, Application puis ressources, chaque classe étant nommée et expliquée. Il vérifie aussi les règles structurelles que documente F5. Cet outil ne fait que décoder, s’exécute entièrement dans votre navigateur et s’appuie sur le guide utilisateur et la référence de schéma AS3 de F5.

## Requête ou déclaration

L’outil commence par indiquer laquelle des deux formes vous avez collée. Une requête AS3 complète porte `class: "AS3"` et contient `action` (deploy, dry-run, retrieve, remove, patch) et `persist`, qui enveloppent la déclaration. Une déclaration ADC seule porte `class: "ADC"` au premier niveau et omet cette enveloppe : les options action et persist ne sont alors pas disponibles. L’outil affiche action et persist pour une requête, et, dans tous les cas, les propriétés schemaVersion, id, label et remark de la déclaration ADC.

## L’arborescence parcourue

Sous les métadonnées, l’outil parcourt la hiérarchie fixe d’AS3 : chaque Tenant (qui devient une partition BIG-IP), chaque Application (avec son template, en signalant quand generic s’applique par défaut, à partir d’AS3 3.20) et chaque objet ressource qu’elle contient. Pour chaque objet, il affiche la classe et une explication en langage clair, de Service_HTTP et Service_HTTPS à Pool, Monitor, TLS_Server, TLS_Client, Certificate, Persist, WAF_Policy, Endpoint_Policy et iRule. Une classe que l’outil ne reconnaît pas est quand même listée et signalée, jamais masquée.

## Les contrôles structurels

En plus de l’explication, l’outil applique les règles documentées qui rendent une déclaration valide : une classe AS3 ou ADC au premier niveau, une propriété schemaVersion obligatoire, au moins un Tenant contenant au moins une Application contenant au moins une ressource, et la règle de correspondance entre template et classe de service (un template http, https, tcp, udp ou l4 exige un objet Service correspondant nommé service, anciennement serviceMain). Il signale aussi les noms réservés (Common, Shared, service), à titre informatif, et vérifie que les noms d’objets respectent la règle : de 1 à 64 caractères, alphanumériques, commençant par une lettre.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, une copie de la déclaration, jamais le texte collé lui-même : chaque valeur que la [référence de schéma](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/schema-reference.html) d’AS3 (consulté le 27/10/2026) définit comme secrète est remplacée par `[redacted]`. Cela concerne le `ciphertext` d’un objet Secret (avec l’en-tête `protected` par défaut, c’est le secret lui-même, simplement encodé en base64url), une valeur `passphrase`, `password`, `secret`, `sharedSecret` ou `token` écrite comme chaîne simple, les phrases secrètes nommées (`cookiePassphrase`, `md5SignaturePassphrase`, `javaSignKeyPassphrase`), les propriétés `privateKey` et `pkcs12` d’un Certificate, incluses directement ou fournies en `base64` ou en `text`, la `targetPassphrase` de la requête AS3 et chaque valeur de `targetTokens`, ainsi que les identifiants de Service Discovery (`secretAccessKey`, `apiAccessKey`, `encodedCredentials`, `encodedToken`). Sa fenêtre contextuelle indique d’abord ce que contient le lien et combien de valeurs ont été remplacées, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Cette page n’affiche jamais ces valeurs : la page qui reçoit le lien lit donc la même déclaration ; la copie conserve tous les autres octets, espacement et ordre compris. Une clé fournie sous forme de chemin `bigip` ou d’`url` est conservée, de même que `accessKeyId`, les noms, les adresses, les iRules et les chaînes `send` des moniteurs, que le schéma ne marque pas comme secrets : vérifiez-les vous-même avant de partager.

Un texte collé qui n’est pas du JSON valide ne peut pas être découpé sans risque : s’il nomme l’une de ces propriétés à un endroit quelconque, aucun lien n’est créé et la fenêtre contextuelle demande de corriger d’abord le JSON ; s’il n’en nomme aucune, il part tel que saisi et la page qui le reçoit affiche la même erreur d’analyse.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme un collage et la page l’explique ; rien n’est envoyé nulle part. La valeur quitte ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Portée et fondements

Cet outil explique la structure et en vérifie la cohérence ; ce n’est pas un validateur JSON Schema complet. Il ne reproduit pas l’intégralité du schéma AS3 et ne vérifie pas chaque propriété : une déclaration acceptée ici peut encore être rejetée par AS3 lui-même ; voyez un résultat sans erreur comme un bon signe plutôt que comme une garantie. Rien de ce que vous collez n’est envoyé ni ne quitte la page. L’outil s’appuie sur la documentation AS3 de F5 ; avant un déploiement, validez la déclaration avec votre version d’AS3 et la référence de schéma.
