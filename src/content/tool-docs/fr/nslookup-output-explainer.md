## Ce que fait l’outil

Collez la sortie d’une commande `nslookup`, et l’outil la décode en une analyse structurée et expliquée : le résolveur qui a répondu, le caractère faisant autorité ou non de la réponse, chaque enregistrement avec le détail de ses champs, et tout échec signalé. Il n’analyse que le texte ; rien n’est résolu et rien n’est envoyé nulle part.

## Lecture de la présentation de nslookup

`nslookup` affiche les réponses DNS dans une présentation lâche, proche de la prose, très différente de celle de `dig`, et cette présentation porte un sens qu’il vaut la peine d’expliciter. Chaque réponse commence par un en-tête **Server** et **Address** qui nomme le résolveur interrogé. Une ligne **Non-authoritative answer:** signifie que le bit AA était à zéro : la réponse vient d’un résolveur, et non d’un serveur faisant autorité pour le nom. La RFC 1035 (section 4.1.1) et la RFC 2181 (section 6) définissent l’autorité par le nom, pas par la mise en cache : la ligne ne dit donc pas si le résolveur a répondu depuis son cache ou est allé chercher la réponse pour vous ; les deux cas se présentent de la même façon. Son absence, pour une requête directe, implique une réponse faisant autorité. Quand une résolution échoue, nslookup affiche une ligne comme `** server can't find NAME: NXDOMAIN`, et l’outil fait ressortir cet échec et la signification du statut.

## Les enregistrements et leurs champs

Pour la plupart des types d’enregistrement, nslookup affiche une simple ligne `name = value`, mais quelques-uns regroupent plusieurs champs dans une ligne ou un bloc, et ce sont ceux-là qu’il vaut la peine de décoder :

- Les enregistrements **MX** se lisent `mail exchanger = 10 mail.example.com`, où le nombre est la préférence (la plus basse est préférée) et le nom l’hôte de messagerie. L’outil sépare les deux.
- Les enregistrements **SRV** (RFC 2782) portent la priorité, le poids, le port et la cible sur une seule ligne ; l’outil les sépare pour que vous voyiez vers quel hôte et quel port de service ils pointent.
- Les enregistrements **SOA** s’étendent sur plusieurs lignes : le serveur de noms primaire de la zone, la boîte aux lettres du responsable, le numéro de série et les temporisateurs (refresh, retry, expire, minimum). L’outil présente ces champs un par un.

## Utilisation

Collez une réponse `nslookup` et lisez le résolveur, le statut d’autorité, chaque enregistrement avec ses champs, et toute erreur. L’analyse est déterministe et entièrement locale ; l’outil n’effectue jamais de résolution lui-même, ce qui en fait aussi un moyen sûr de lire une sortie capturée ailleurs.

## Exemples

Le bouton Charger un exemple et les tests de l’outil utilisent une vraie sortie `nslookup` du build BIND 9.20.29, capturée le 19 octobre 2026 au travers d’un relais local qui envoyait chaque requête à un résolveur public en DNS over HTTPS : la ligne Server affiche donc l’adresse du relais, `127.0.0.1#5311`. L’exemple d’échec résout `nonexistent.invalid` : la RFC 6761, section 6.4, permet aux utilisateurs de supposer que les requêtes portant sur des noms sous `.invalid` renvoient toujours NXDOMAIN, alors que `example.com` répond désormais NOERROR sans données pour les noms qui n’existent pas (le déni d’existence compact de la RFC 9824).

## Partage des résultats

En haut de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la sortie nslookup telle que collée (`#input=...`), et rien d’autre. Avant que vous copiiez quoi que ce soit, la fenêtre contextuelle ajoute une mise en garde : une sortie nslookup peut nommer des hôtes internes, des adresses et le serveur interrogé, relisez-la donc avant d’envoyer le lien. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur qu’il aurait.
- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage, et la page l’explique de nouveau ; rien n’est résolu ni envoyé. Un texte qui n’est pas une sortie nslookup reçoit la remarque propre à la page. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.

## API

Le même moteur répond à l’opération `/api/v1/nslookup-output-explainer` de l’API HTTP du site, détaillée champ par champ dans le contrat OpenAPI de la [page API](/api), avec des exemples tirés des vecteurs de référence (golden vectors). Le contrat indique aussi si ce site sert l’API.

- **Requête.** La sortie nslookup sous forme de texte, sauts de ligne et tabulations compris.
- **Réponse.** `server` (`server` et `address`), `authority` (`authoritative`, `non-authoritative` ou `unknown`), `records` (`name`, `type`, `value`, et `fields` pour MX, SRV et SOA), `errors` (`name` et `code`), `referralNote`, `warnings` (codes stables) et `recognized`.
- **Erreurs.** Un texte qui n’est pas une sortie nslookup ne provoque pas d’erreur HTTP : `recognized` vaut `false`.

La réponse n’a pas changé le 19 octobre 2026 ; les exemples ont été remplacés par des captures faites ce jour-là.

## Sources

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (consultée le 19/10/2026) : le bit AA, section 4.1.1
- [RFC 2181: Clarifications to the DNS Specification](https://www.rfc-editor.org/rfc/rfc2181) (consultée le 19/10/2026) : l’autorité de zone, section 6
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (consultée le 19/10/2026) : NXDOMAIN, NODATA et le minimum du SOA
- [RFC 2782: A DNS RR for specifying the location of services (DNS SRV)](https://www.rfc-editor.org/rfc/rfc2782) (consultée le 19/10/2026) : les champs SRV
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (mars 2024, rend obsolète la RFC 8499 ; consultée le 19/10/2026) : serveur faisant autorité et résolveur
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (consultée le 19/10/2026) : section 6.4, les noms sous `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (consultée le 19/10/2026) : NOERROR sans données pour un nom qui n’existe pas
- [RFC 7505: A "Null MX" No Service Resource Record for Domains That Accept No Mail](https://www.rfc-editor.org/rfc/rfc7505) (consultée le 19/10/2026) : l’exemple MX, préférence 0 et échangeur `.`
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien de partage des résultats
