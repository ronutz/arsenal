# Analyseur de codes de statut HTTP

Collez des codes de statut, seuls (`404`), plusieurs à la fois (`301 302 307`) ou par familles entières (`5xx`), et obtenez le décodage de chacun : la famille à laquelle il appartient, son nom enregistré, sa signification documentée, et les remarques d’exploitation qui comptent quand le code apparaît dans un journal à 3 h du matin.

## Ce qu’explique l’outil

Le registre qui sous-tend l’outil s’appuie sur le catalogue des statuts de la RFC 9110 et sur les extensions enregistrées (428/429/431/511 de la RFC 6585, 451 de la RFC 7725, 103 de la RFC 8297). Les remarques reprennent les distinctions qu’enseigne l’[article associé](/learn/http-status-codes-the-five-families) du site : quelles redirections préservent la méthode (307/308) et lesquelles, historiquement, ne le faisaient pas (301/302), pourquoi 304 est un échange de validation avec le cache plutôt qu’une redirection, pourquoi 401 doit arriver avec `WWW-Authenticate` alors que 403 refuse quoi qu’il arrive, et la lecture du trio des proxys lors du tri d’un incident : 502 met en cause la conversation avec le backend, 503 la capacité du service, 504 l’horloge.

## La règle de repli, comme fonctionnalité

Collez un code valide que le registre n’a jamais rencontré, un `599` venu d’un équipement intermédiaire, et l’outil ne renvoie pas d’erreur. Il répond avec la règle de compatibilité ascendante du protocole lui-même : un client qui ne reconnaît pas un code doit le traiter comme le `x00` de sa famille, si bien que le premier chiffre suffit à définir le comportement requis. C’est grâce à cette règle que le registre des statuts a pu s’enrichir pendant trente ans sans casser un seul ancien client, et l’outil la considère comme une réponse qui mérite d’être affichée, pas comme une lacune dont il faudrait s’excuser.

## Syntaxe de l’entrée

Des éléments séparés par des espaces, des virgules ou des sauts de ligne. Chaque élément est soit un nombre de trois chiffres compris entre 100 et 599, soit une famille de la forme `1xx` à `5xx`. Les doublons sont supprimés en préservant l’ordre ; la limite est de vingt éléments par exécution. Tout s’exécute localement dans votre navigateur.

## Partage des résultats

En haut de la lecture, au-dessus des cartes, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone telle que saisie, et rien d’autre : des codes de statut et des familles, qui ne disent rien de vous. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Les liens du décodeur de messages HTTP qui transmettent un code de statut à cette page utilisent le même `#input=` et remplissent la zone de la même façon.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone comme une saisie, et la page l’explique ; rien n’est envoyé nulle part. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultée le 09/11/2026) : le catalogue de base, les règles des familles et le repli sur x00
- [RFC 6585, Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585) (consultée le 09/11/2026) : 428, 429, 431 et 511
- [RFC 7725, An HTTP Status Code to Report Legal Obstacles](https://www.rfc-editor.org/rfc/rfc7725) (consultée le 09/11/2026) : 451 Unavailable For Legal Reasons
- [RFC 8297, An HTTP Status Code for Indicating Hints](https://www.rfc-editor.org/rfc/rfc8297) (consultée le 09/11/2026) : 103 Early Hints
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 01/11/2026) : section 3.5, le fragment, qu’utilise un lien Partager les résultats
