# Planificateur de contournement SSL ZIA

## Ce que fait l’outil

Collez une liste d’applications ou de destinations (une par ligne, dans une grammaire à quatre champs) et obtenez un plan d’inspection TLS déterministe. Chaque actif reçoit l’un de trois verdicts : **Inspecter** (le choix par défaut, qui alimente chaque moteur d’analyse de contenu), **Do Not Inspect par une règle de politique** (l’exemption au niveau de l’Edge pour les catégories de gouvernance et pour les applications épinglées sur des chemins qu’aucun agent ne contrôle) ou **Contournement Client Connector** (l’exemption la plus propre pour les applications épinglées dont ZCC contrôle le chemin : le trafic n’entre jamais dans le tunnel, et une règle de politique s’y ajoute par défense en profondeur). Chaque verdict s’accompagne de sa justification sourcée ; chaque contournement, d’un registre des angles morts qui nomme ce qui cesse de voir ce flux ; et dès que quelque chose échappe à l’inspection, le plan ajoute la liste des garde-fous extérieurs : l’action Untrusted Server Certificates, OCSP (Online Certificate Status Protocol) par agrafage (stapling), le plancher Minimum TLS Version et Block No-SNI.

## La grammaire

Un actif par ligne, quatre champs séparés par des barres verticales ; les lignes qui commencent par `#` sont des commentaires :

```
<name> | pinned|clean | regulated|general | agent|no-agent
```

`pinned` marque une application à épinglage de certificat (elle n’accepte pas un certificat régénéré sous l’AC d’inspection et échoue en mode fermé en cas d’interception). `regulated` marque une catégorie de gouvernance qu’une politique ou la loi exige de garder scellée. `agent` marque un chemin que contrôle Zscaler Client Connector.

## Lecture du plan

La synthèse compte les verdicts ; les cartes déroulent le raisonnement pour chaque actif ; la remarque sur l’ordre rappelle la doctrine : les exceptions Do Not Inspect se placent en position prioritaire, au-dessus du corps des règles Inspect, car les règles de la politique SSL s’évaluent par ordre croissant, à la première correspondance. Quand tous les actifs sont inspectés, il n’y a ni registre de contournements ni dette de garde-fous, et le plan le dit. Chaque exemption de politique que recommande le planificateur est une règle Do Not Inspect réglée sur **Evaluate Other Policies**, car c’est la forme qui maintient en vigueur les garde-fous extérieurs et les politiques web ; une remarque du plan explique que **Bypass Other Policies** n’offre aucun garde-fou et ignore aussi URL Filtering et Cloud App Control, et que le trafic contourné au niveau du Client Connector n’atteint jamais l’Edge.

## Limites assumées

La grammaire est un sous-ensemble pédagogique délibéré : une vraie planification des contournements limite aussi les règles par utilisateurs, groupes et sites, et pèse des particularités applicatives que ce planificateur ne modélise pas. La logique de décision (l’épinglage impose une exemption, la gouvernance scelle une catégorie, tout le reste est inspecté, et chaque contournement est un angle mort qui a un prix) en est la partie durable. Tout le calcul est local ; les noms d’actifs ne quittent jamais la page.

## Partage des résultats

Sous les compteurs de la synthèse, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les actifs tels que collés. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les noms d’actifs peuvent identifier vos applications internes (c’est pourquoi la fenêtre contextuelle ajoute une ligne de mise en garde). Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par une norme : une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), une ligne `Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un identifiant de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. La grammaire ne prévoit de place pour aucun d’eux, mais les noms d’actifs et les lignes de commentaire sont du texte libre. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret ne bloque pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage et la page établit le plan d’inspection. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

Le planificateur s’appuie sur la documentation de Zscaler consacrée à l’inspection SSL (Configuring the SSL/TLS Inspection Policy ; About SSL Inspection) et sur l’architecture de référence Data Protection, consultées le 21/07/2026. Les deux formes de Do Not Inspect, et les paramètres que propose chacune, ont été relues sur [Configuring SSL/TLS Inspection Policy](https://help.zscaler.com/zia/configuring-ssltls-inspection-policy) (consulté le 26/10/2026). L’article associé de la rubrique Apprendre est [*TLS Inspection in ZIA: The Policy, the Bypasses, and the Bill*](/learn/zia-ssl-inspection-policy-and-bypasses).

La règle du fragment sur laquelle repose le partage des résultats est celle de la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.5 (consultée le 01/11/2026), et les identifiants que recherche son contrôle sont définis dans les RFC 7468, RFC 9110, RFC 6265 et RFC 7519 (consultées le même jour).
