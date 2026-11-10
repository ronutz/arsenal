# Analyseur de décision d’aiguillage Netskope

Collez une description compacte d’une configuration d’aiguillage (steering) et d’un flux, et suivez l’ordre de décision documenté jusqu’à un verdict (**aiguillé**, **contourné**, **bloqué** ou **direct**), avec un registre qui explique chaque contrôle en chemin. L’outil explique le pourquoi, il ne simule pas : chaque étape du registre cite un comportement documenté, et là où la documentation publique ne publie aucune règle, le registre le dit au lieu d’en inventer une.

## La grammaire

Des lignes clé-valeur, une donnée de décision par ligne :

```
mode: web                     # cloud-apps | web | all
dynamic: on                   # optional; then mode-on-prem / mode-off-prem (none allowed)
location: off-prem            # on-prem | off-prem
tunnel: up                    # up | down
fail-close: off               # on | off
flow: web app.example.com     # web <host> | app <name> | non-web <proto/port> | rfc1918 <ip> | loopback
non-standard-port: ip         # optional; fqdn | ip - how a non-standard web port is reached
exception: domain *.example.com          # 0+ lines; kinds: cert-pinned, domain, category, dest-location, firewall-app
flow-matches: domain          # which configured exception kinds this flow matches (or none)
```

La ligne `flow-matches` est un choix d’honnêteté délibéré : savoir si un flux réel correspond à une catégorie ou à un objet d’emplacement de destination dépend de données du tenant que cet outil local ne peut pas voir ; vous déclarez donc la correspondance, et le moteur explique la conséquence documentée.

## Ce que sait le registre

Les trois modes de trafic et le public de chacun (Cloud Apps Only pour les déploiements Cloud Inline ou CASB seul, Web Traffic pour la plupart des organisations, All Traffic pour les abonnés à Cloud Firewall). Le contournement par défaut, toujours actif, de l’espace RFC1918. Les familles d’exceptions et leurs comportements documentés, dont l’option par profil **Steer and decrypt at Netskope Cloud** de la famille des certificats épinglés, la seule correspondance qui aiguille au lieu de contourner. Les modes par emplacement de l’aiguillage dynamique, dont **None** : pas de tunnel, et des exceptions non traitées. La distinction documentée de **Fail Close** : les exceptions par domaine, par adresse IP et pour certificat épinglé s’appliquent toujours, tandis que les exceptions par catégorie sont bloquées. Et le piège du port non standard : un port configuré par FQDN mais atteint par adresse IP est traité comme du trafic non web, avec le remède documenté, qui consiste à configurer les deux.

## Où l’outil passe le relais

Un verdict **aiguillé** marque le début de la décision suivante : le déchiffrement de la session relève de la politique TLS, et [l’article sur le déchiffrement TLS en ligne](/learn/netskope-inline-tls-decryption) reprend exactement à ce point. Le paysage de l’aiguillage lui-même (Client, proxy explicite et PAC, tunnels, proxy inverse) fait l’objet de [l’article sur les méthodes d’aiguillage](/learn/netskope-steering-methods) ; la couche PAC a [son propre analyseur](/tools/pac-file-explainer).

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la spécification telle que saisie, dès que la page a une décision. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Un flux et ses exceptions nomment des hôtes, des applications et des domaines, et la page de Netskope sur le [profil d’aiguillage](https://docs.netskope.com/en/configure-a-steering-profile) (consultée le 01/11/2026) prévoit des exceptions pour le trafic au contenu personnel ou privé (« personal or private content ») : la fenêtre contextuelle vous demande de les vérifier. Le registre lit chaque ligne : rien n’est donc retiré. Avant qu’un lien soit proposé, la spécification est examinée à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4 : les serveurs stockent couramment un nonce, ou identifiant de session, dans un cookie, « commonly store a nonce (or “session identifier”) in a cookie »), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un identifiant de clé d’accès AWS ou une valeur `ENC` de FortiOS ; toutes consultées le 01/11/2026. Un seul d’entre eux empêche la création du lien : la fenêtre contextuelle nomme sa ligne, et vous le remplacez par une valeur fictive avant d’appuyer de nouveau sur le bouton. Une valeur dont seul le nom ressemble à un secret (un membre JSON `token`, un `token=` dans une chaîne de requête) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La spécification remplit la zone comme le ferait un collage, et la page l’explique. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [Netskope docs: Configure a Steering Profile](https://docs.netskope.com/en/configure-a-steering-profile) : modes, contournements par défaut (consulté le 09/11/2026)
- [Netskope docs: Creating a Steering Configuration](https://docs.netskope.com/en/creating-a-steering-configuration) : Fail Close, ports non standard (consulté le 09/11/2026)
- [Netskope docs: Enabling Dynamic Steering](https://docs.netskope.com/en/enabling-dynamic-steering) : modes par emplacement, sémantique de None (consulté le 09/11/2026)
- [Netskope docs: Certificate Pinned Applications](https://docs.netskope.com/en/certificate-pinned-applications) : steer-and-decrypt (consulté le 09/11/2026)
