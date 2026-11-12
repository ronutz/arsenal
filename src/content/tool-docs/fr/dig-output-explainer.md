## Ce que fait l’outil

Collez la sortie d’une commande `dig` : l’outil reconstitue le message DNS qu’elle représente, section par section, et en explique chaque partie. Il lit l’en-tête, la ligne des indicateurs et les compteurs de sections, la pseudo-section OPT d’EDNS, les quatre sections d’enregistrements, chaque enregistrement de ressource étant décomposé en ses champs, et les statistiques de requête affichées à la fin. Il se contente d’analyser le texte : rien n’est résolu et rien n’est envoyé nulle part.

## Pourquoi décoder la sortie de dig

`dig` affiche un rendu fidèle mais laconique d’un message DNS, et beaucoup de sens tient dans des éléments très courts. L’**en-tête** porte l’opération, un code de statut et un identifiant de message ; la ligne des **indicateurs** (flags) porte des indicateurs d’un seul mot dont la présence ou l’absence change tout. `aa` signifie que la réponse fait autorité : elle vient d’un serveur responsable de la zone et non d’un cache ; `rd` signifie que la récursion était demandée, et `ra` qu’elle est disponible ; `ad` marque des données validées par DNSSEC ; `tc` signifie que la réponse a été tronquée et qu’il faut la redemander en TCP. Le code de statut est l’autre élément à lire en premier : `NOERROR`, `NXDOMAIN` pour un nom qui n’existe pas, ou `SERVFAIL` pour une défaillance du serveur.

## Les sections et EDNS

Un message DNS comporte quatre sections, que dig nomme : **QUESTION** (ce qui a été demandé), **ANSWER** (les enregistrements qui y répondent), **AUTHORITY** (les serveurs de noms responsables) et **ADDITIONAL** (des enregistrements complémentaires utiles). L’outil décompose chaque enregistrement de ressource en ses parties : le nom, le TTL en secondes (converti quand dig l’a affiché avec des unités), la classe (presque toujours `IN`), le type (`A`, `AAAA`, `MX`, etc.) et les données de l’enregistrement. Il décode aussi la **pseudo-section OPT**, l’extension EDNS(0) (RFC 6891), qui annonce par exemple la plus grande réponse UDP que le résolveur acceptera et la prise en charge de DNSSEC, et qui n’est pas un véritable enregistrement mais des métadonnées sur l’échange.

## Les statistiques

Le pied de page qu’affiche dig est réellement utile au diagnostic : la durée de la requête indique combien de temps le résolveur a mis, la ligne du serveur indique quel résolveur a répondu, et la taille du message et l’horodatage complètent le tout. Lire ces éléments ensemble explique souvent une résolution lente ou surprenante plus vite que les enregistrements eux-mêmes.

## Utilisation

Collez une réponse `dig` complète et lisez l’en-tête, les indicateurs, les sections et les statistiques décodés. L’analyse est déterministe et entièrement locale ; l’outil n’effectue jamais de résolution par lui-même.

## Formats lus

Outre le format par défaut, l’analyseur lit les formes que produisent les options de sortie de dig, chacune fixée par un test sur une sortie réelle de dig 9.20.29 :

- `+ttlunits` : les TTL affichés avec des unités (`1h30m`, `1d`, `2w`, `4m16s` ; le manuel énumère s, m, h, d et w) sont convertis en secondes et affichés sous les deux formes, par exemple `1h30m = 5400s`.
- `+nottlid` : les enregistrements affichés sans colonne TTL sont tout de même lus, et le TTL est marqué comme absent.
- `+multiline` : les enregistrements répartis entre parenthèses sur plusieurs lignes, avec des commentaires `;`, sont réassemblés en une seule ligne, si bien qu’un SOA se décompose toujours en ses sept champs.
- Opcode 6 et RCODE 11 : dig 9.20 n’a pas de nom pour eux et affiche `RESERVED6` et `RESERVED11`. L’IANA les a attribués à DNS Stateful Operations (DSO) et à DSOTYPENI (RFC 8490), et l’outil affiche les deux noms.

Pour une réponse négative (NXDOMAIN, ou NOERROR avec une section ANSWER vide) qui contient le SOA de la zone, l’outil calcule aussi le TTL de cache négatif. La RFC 2308, section 5, indique que le serveur faisant autorité fixe le TTL du SOA au minimum entre le TTL propre du SOA et son champ MINIMUM, et qu’un cache le décompte à partir de là.

## Exemples

Le bouton Charger un exemple et les tests utilisent de véritables sorties de dig 9.20.29 capturées le 19 octobre 2026, pour la plupart via un relais local qui envoyait chaque requête à un résolveur public en DNS over HTTPS (la ligne SERVER montre le relais, `127.0.0.1`), le reste auprès d’un serveur de lab local qui détient une copie de `example.com` avec des adresses de documentation, plus un répondeur de lab conçu pour renvoyer le RCODE 11. Les noms qui n’existent pas sont sous `.invalid` : la RFC 6761, section 6.4, permet de considérer qu’ils renvoient toujours NXDOMAIN, alors qu’`example.com` répond désormais NOERROR sans données pour les noms qui n’existent pas (le déni d’existence compact de la RFC 9824).

## Partage des résultats

En tête de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la sortie de dig telle que collée (`#input=...`), et rien d’autre. Avant toute copie, la fenêtre contextuelle ajoute une mise en garde : la sortie de dig peut nommer des hôtes internes, des adresses et le résolveur interrogé ; relisez-la donc avant d’envoyer le lien. Tout ce que contient le lien se trouve après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur qu’il aurait.
- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage, et la page l’explique de nouveau ; rien n’est résolu ni envoyé. Un texte qui n’est pas une sortie de dig reçoit la remarque habituelle de la page. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## API

Le même moteur répond à l’opération `/api/v1/dig-output-explainer` de l’API HTTP du site, détaillée champ par champ dans le contrat OpenAPI de la [page API](/api), avec des exemples tirés des vecteurs de référence (golden vectors). Le contrat indique aussi si ce site sert l’API.

- **Requête.** La sortie de dig sous forme de texte, sauts de ligne et tabulations compris.
- **Réponse.** `versionLine`, `digVersion`, `queryArgs`, `header` (`opcode`, `status` et `id` tels qu’affichés, plus `opcodeName` ou `statusName` quand dig affiche RESERVED6 ou RESERVED11), `flags` avec les quatre compteurs de sections, `opt`, `sections` (chaque enregistrement avec `name`, `ttl` en secondes ou `null`, `ttlText` quand dig a affiché le TTL avec des unités, `class`, `type`, `rdata` et `isQuestion`), `footer`, `negative` (`owner`, `soaTtl`, `minimum` et `ttl`) pour une réponse négative avec un SOA dans AUTHORITY, `warnings` (des codes stables) et `hadHeader`.
- **Erreurs.** Un texte qui n’est pas une sortie de dig n’est pas une erreur HTTP : `hadHeader` vaut `false`.

`ttlText`, `negative`, `opcodeName`, `statusName` et les avertissements `ttl-units` et `ttl-absent` ont été ajoutés le 19 octobre 2026 ; un TTL affiché `1d` renvoie désormais un `ttl` de 86400, alors qu’il était auparavant lu comme 1.

## Sources

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (consultée le 19/10/2026) : le format des messages et les indicateurs de l’en-tête
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (consultée le 19/10/2026) : la pseudo-section OPT
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (consultée le 19/10/2026) : section 5, le TTL de cache négatif
- [RFC 4034: Resource Records for the DNS Security Extensions](https://www.rfc-editor.org/rfc/rfc4034) (consultée le 19/10/2026) : RRSIG, DNSKEY, DS, NSEC
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (mars 2024, rend obsolète la RFC 8499 ; consultée le 19/10/2026)
- [RFC 8490: DNS Stateful Operations](https://www.rfc-editor.org/rfc/rfc8490) (consultée le 19/10/2026) : sections 10.1 et 10.2, l’opcode 6 (DSO) et le RCODE 11 (DSOTYPENI)
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (consultée le 19/10/2026) : section 6.4, les noms sous `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (consultée le 19/10/2026) : NOERROR sans données pour un nom qui n’existe pas
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/v9.20.29/manpages.html) (consulté le 19/10/2026) : `+ttlunits`, `+ttlid`, `+multiline`, `+opcode`
- [BIND 9 source at tag v9.20.29, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dig.c) (consulté le 19/10/2026) : les noms d’opcode qu’affiche dig, dont `RESERVED6` ; `RESERVED11` vient de lib/dns/rcode.c
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien Partager les résultats
