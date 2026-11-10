## Ce que fait l’outil

Collez une `service_policy` F5XC (F5 Distributed Cloud) au format JSON : l’outil détaille exactement comment elle effectue la correspondance, c’est-à-dire la portée serveur à laquelle elle s’applique, l’ordre d’évaluation de ses règles et, pour chaque règle, son action et les conditions qui doivent être remplies. Il lit la définition de la politique entièrement dans votre navigateur et n’évalue rien sur du trafic réel.

## Le rôle d’une service policy

Sur la plateforme F5 Distributed Cloud, une service policy décide quelles requêtes atteignent un équilibreur de charge et lesquelles sont refoulées : c’est l’équivalent, sur la plateforme, de la logique de correspondance des requêtes que vous écririez dans une iRule sur un BIG-IP classique. Une politique a une **portée serveur** qui indique les serveurs qu’elle régit, un **traitement** (disposition) qui fixe le comportement par défaut, et une **liste de règles** ordonnée. L’ordre compte : les règles sont évaluées en séquence et la première qui correspond décide de l’issue ; c’est en les lisant de haut en bas que vous comprenez ce que fait réellement la politique.

## La correspondance d’une règle

Chaque règle associe une **action**, comme autoriser ou refuser, à un ensemble de conditions qui doivent toutes être remplies pour que la règle s’applique. L’outil restitue chaque condition comme le schéma la définit :

- Le **comparateur** (matcher) et ce qu’il inspecte (une source, un en-tête, un chemin, etc.)
- Ses **critères** : correspondance par valeur exacte, par expression régulière ou par préfixe
- La **logique ET/OU** qui combine plusieurs valeurs
- L’éventuelle **inversion**, qui nie la correspondance
- La **sensibilité à la casse** de la comparaison

Tout l’intérêt est de les rendre lisibles : une service policy en JSON brut se lit difficilement, et un seul comparateur mal lu ou une condition inversée suffit précisément à autoriser ou à bloquer le mauvais trafic.

## Fondé sur le schéma

Les noms et les structures de champs que comprend l’outil suivent le schéma OpenAPI officiel de F5 Distributed Cloud pour la service policy et ses règles : le décodage reflète donc l’objet réel, et non une supposition. L’outil est local et n’émet aucun trafic sortant : il analyse et explique le JSON que vous collez, sans jamais contacter la plateforme ni tester la politique sur de vraies requêtes. Une entrée mal formée est signalée au lieu de provoquer une erreur.

## Utilisation

Collez une spec JSON `service_policy` et lisez la portée serveur, les règles dans leur ordre, ainsi que l’action et les conditions de chaque règle. Le décodage est déterministe et local.

## Partage des résultats

Sous la vue d’ensemble, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la politique telle que collée, dès que la page la reconnaît. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Une politique peut nommer des hôtes internes, des plages d’adresses, des ASN, ainsi que des noms d’en-têtes et de cookies : la fenêtre contextuelle vous demande de les vérifier. La page affiche chaque comparateur avec ses valeurs : rien ne peut donc être retiré sans changer la lecture, et ce sont les identifiants qui, au lieu d’être retirés, bloquent le lien. Avant qu’un lien soit proposé, la politique est examinée à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4 : les serveurs stockent couramment un nonce, ou identifiant de session, dans un cookie, « commonly store a nonce (or “session identifier”) in a cookie »), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un ID de clé d’accès AWS ou une valeur FortiOS `ENC`, ainsi que deux éléments que définit le schéma propre de F5 Distributed Cloud : un secret SecretType, c’est-à-dire une URL `clear_secret_info` ou un emplacement `blindfold_secret_info` (la [référence de l’API XC](https://docs.cloud.f5.com/docs-v2/api/views-http-loadbalancer) : SecretType signale dans un objet un champ sensible ou confidentiel, « SecretType is used in an object to indicate a sensitive/confidential field »), et un comparateur d’en-tête `Authorization` avec une valeur littérale ; toutes consultées le 01/11/2026. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom évoque un secret (un membre JSON `token`, un `token=` dans une chaîne de requête, un comparateur `X-Api-Key` ou de cookie) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La politique remplit la zone comme le ferait un collage, et la page la lit (elle la décode, sans jamais l’évaluer). Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
