## Ce que fait l’outil

Choisissez la pile de profils d’un serveur virtuel BIG-IP de type Standard (full proxy) : avec ou sans profil client-SSL, profil HTTP, profil server-SSL et pool. L’outil montre l’ordre dans lequel se déclenchent les évènements iRule courants, de `CLIENT_ACCEPTED` à `CLIENT_CLOSED`, à la fois sous forme de chronologie et de liste. C’est un modèle du comportement documenté de F5, calculé dans votre navigateur ; il ne se connecte jamais à un équipement.

## Pourquoi l’ordre dépend de la pile

Une iRule est pilotée par les évènements : votre code Tcl s’exécute quand un évènement nommé se déclenche, et c’est la configuration du serveur virtuel, et non le script, qui décide des évènements déclenchés et de leur ordre. Un serveur virtuel full proxy traite le côté client et le côté serveur comme deux connexions distinctes : les évènements traversent donc des phases distinctes. La connexion client est acceptée, le handshake TLS côté client se termine, la requête HTTP est analysée, un membre du pool est sélectionné, la connexion côté serveur est ouverte, le handshake TLS côté serveur se termine, la requête est envoyée, la réponse revient, et enfin les deux côtés se ferment. Changez la pile, et l’ensemble des évènements change avec elle.

## Ce qu’apporte chaque profil

- **Sans autre profil qu’un pool**, il reste les évènements de niveau connexion : `CLIENT_ACCEPTED` au début, les évènements d’équilibrage de charge quand un membre est choisi, `SERVER_CONNECTED` côté serveur, et les évènements `CLOSED` à la fin.
- **Un profil client-SSL** ajoute les évènements TLS côté client, comme `CLIENTSSL_CLIENTHELLO` et `CLIENTSSL_HANDSHAKE`, avant le traitement de la requête.
- **Un profil HTTP** ajoute les évènements de requête et de réponse, `HTTP_REQUEST` côté client, `HTTP_REQUEST_SEND` et `HTTP_RESPONSE` côté serveur, pour que vous puissiez agir sur les en-têtes et la charge utile.
- **Un profil server-SSL** ajoute les évènements TLS côté serveur pour la connexion vers le membre du pool.
- **Un profil JSON ou SSE** sort du cadre de ce modèle. BIG-IP 21.0.0 a introduit les évènements JSON ([`JSON_REQUEST`](https://clouddocs.f5.com/api/irules/JSON_REQUEST.html), `JSON_RESPONSE` et leurs variantes d’erreur et d’absence) et [`SSE_RESPONSE`](https://clouddocs.f5.com/api/irules/SSE_RESPONSE.html), qui exigent un profil JSON ou SSE sur le serveur virtuel en plus du profil HTTP ([référence des profils de BIG-IP 21.0](https://techdocs.f5.com/en-us/bigip-21-0-0/big-ip-local-traffic-management-profiles-reference/model-context-protocol.html), consultée le 26/10/2026). L’outil les cite dans ses remarques au lieu de les placer dans la séquence.

L’outil place aussi les évènements conditionnels, les chemins de collecte de données et le chemin d’échec de l’équilibrage de charge (`LB_FAILED`) à leur place dans la séquence.

## Remarque sur les iRules multiples

Quand deux iRules traitent le même évènement, leur ordre relatif n’est pas l’ordre dans lequel elles sont listées : il est déterminé par la commande `priority` au sein de chaque évènement (F5 K12090273), une priorité par défaut s’appliquant quand aucune n’est définie. C’est un axe distinct de l’ordre entre évènements que présente cet outil.

## Utilisation

Activez ou désactivez les profils de votre serveur virtuel et lisez la séquence d’évènements qui en résulte, sous forme de chronologie et de liste. Elle reflète le modèle d’évènements documenté par F5 (la Master List of iRule Events et les références de chaque évènement) : c’est donc une aide à la conception et à l’apprentissage, pas une capture d’un système en production.

## Partage des résultats

Au-dessus de la séquence d’évènements, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient les cinq options de profil, désignées par leur nom, chacune à `1` ou `0` (`#clientssl=1&http=1&serverssl=1&pool=1&fastl4=0`), et rien d’autre ; comme il y a toujours une séquence, une pile dont toutes les options sont désactivées obtient elle aussi un lien. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; cinq options restent bien en deçà.
- **Ouverture d’un lien.** Les options prennent les valeurs du lien (une option que le lien ne contient pas est désactivée) et la séquence est tracée, comme le ferait un clic sur chacune. Une valeur autre que `1` ou `0` fait ignorer le lien en entier. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.
