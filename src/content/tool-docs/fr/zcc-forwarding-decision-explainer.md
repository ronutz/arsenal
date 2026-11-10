# Analyseur de décision de transfert ZCC

Collez une posture de Zscaler Client Connector (l’état réseau détecté, l’action de transfert ZIA, la version de Z-Tunnel et, en option, l’action ZPA) et relisez l’ossature documentée de la décision, couche par couche, exactement comme la décrivent l’architecture de référence et le portail d’aide de l’éditeur.

## Pourquoi expliquer plutôt que simuler

L’outil existe sous la forme que prévoyait sa clause de ratification, et la raison en est donnée ici avant toute autre chose. La vérification (le 21 juillet 2026, sur l’architecture de référence Secure Mobile Access with Zscaler Client Connector et sur help.zscaler.com) a trouvé l’**ossature** de la décision documentée publiquement de bout en bout : la façon dont l’état de réseau de confiance est déterminé, ce que fait chacune des quatre actions de ZIA par état, ce que capture chaque version de Z-Tunnel, le basculement automatique de Z-Tunnel 2.0 vers 1.0, le web-split hybride et les deux actions de ZPA. Cette ossature est déterministe, et l’outil la calcule.

Ce qui n’est **pas** publié, c’est un ordre de priorité unique pour la couche de contournement. Chaque mécanisme est documenté séparément : Application Bypass, Destination et Domain Exclusions et Inclusions, VPN Gateway Bypass (VPN : virtual private network, réseau privé virtuel), le PAC du profil d’application, le PAC du profil de transfert avec sa macro de contournement Z-Tunnel 2.0. Mais quand plusieurs d’entre eux visent le même flux, Zscaler publie des recettes, pas une matrice de résolution des conflits. Un simulateur devrait inventer cette matrice. L’outil s’y refuse : il présente chaque mécanisme documenté sous forme de registre commenté et ne tranche rien. C’est la même règle de non-invention que pour les autres outils du site.

## Grammaire de saisie

Un paramètre par ligne, `key = value`. Les lignes qui commencent par `#` sont des commentaires.

- `network` : trusted | vpn | off-trusted (obligatoire)
- `zia-action` : tunnel | twlp | enforce-proxy | none (obligatoire)
- `tunnel` : zt2 | zt1 (uniquement avec les actions qui créent un tunnel)
- `web-split` : on | off (le mode hybride documenté de Z-Tunnel 2.0)
- `zpa-action` : tunnel | none (facultatif)

## Ce que vous obtenez

L’ossature s’affiche sous forme de cartes en couches : l’état du réseau avec les critères de détection documentés (DNS Server et Search Domains recommandés comme les plus stables, correspondance ANY/ALL, exclusivité de Pre-Defined Trusted Networks, mode de défaillance documenté de la résolution dynamique) ; la signification documentée de l’action ZIA ; la sémantique de Z-Tunnel pour votre choix, c’est-à-dire le tunnel proxy de Z-Tunnel 1.0, limité au web sur 80/443, face à la capture de tous les ports en DTLS/TLS de Z-Tunnel 2.0, avec le basculement automatique et, s’il est activé, le web-split hybride ; et la décision volontairement plus restreinte de la couche ZPA, à deux actions. Sous l’ossature viennent le registre des contournements et les remarques permanentes, dont le tableau de recommandations propre à l’architecture de référence (Trusted = None, VPN = Tunnel with Local Proxy, Off-Trusted = Tunnel, Z-Tunnel 2.0) et les surcouches fail-open/fail-close.

Tout s’exécute localement dans votre navigateur ; rien de ce que vous collez ne quitte la page.

## Partage des résultats

En tête de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les paramètres tels que collés. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Chaque paramètre est l’un de quelques choix documentés, sans adresse, hôte, utilisateur ni clé : la fenêtre contextuelle n’ajoute donc aucune ligne de mise en garde qui lui soit propre. Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par une norme : une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), une ligne `Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un identifiant de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. La grammaire ne prévoit de place pour aucun d’eux, mais une ligne de commentaire est du texte libre. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret ne bloque pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage et la page parcourt l’ossature. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [Zscaler Reference Architecture: Secure Mobile Access with Zscaler Client Connector](https://www.zscaler.com/resources/reference-architectures/secure-mobile-access-with-zcc.pdf) : les états, les actions, les critères, la sémantique des tunnels, le basculement et le tableau de recommandations (consulté le 09/11/2026)
- [Zscaler Help: About Z-Tunnel 1.0 & Z-Tunnel 2.0](https://help.zscaler.com/zscaler-client-connector/about-z-tunnel-1.0-z-tunnel-2.0) (consulté le 09/11/2026)
- [Zscaler Help: Best Practices for Adding Bypasses for Z-Tunnel 2.0](https://help.zscaler.com/zscaler-client-connector/best-practices-adding-bypasses-z-tunnel-2.0) : la répartition des rôles entre les deux PAC (consulté le 09/11/2026)
- [Zscaler Help: Configuring Forwarding Profiles for Zscaler Client Connector](https://help.zscaler.com/zscaler-client-connector/configuring-forwarding-profiles-zscaler-client-connector) (consulté le 09/11/2026)

La règle du fragment sur laquelle repose le partage des résultats est celle de la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.5 (consultée le 01/11/2026), et les identifiants que recherche son contrôle sont définis dans les RFC 7468, RFC 9110, RFC 6265 et RFC 7519 (consultées le même jour).
