## Ce que fait l’outil

Collez la sortie de la commande F5 `iqdump`, des lignes de `/var/log/gtm` ou le nom d’un sujet, et l’outil explique le protocole iQuery de F5 sans toucher à un équipement. iQuery est le protocole propriétaire, fondé sur XML, que BIG-IP DNS (anciennement GTM) utilise pour dialoguer avec l’agent `big3d` sur lui-même et sur chaque autre BIG-IP qu’il connaît. L’outil décode ce que vous collez et explique l’architecture qui se trouve derrière. C’est un outil de décodage et d’explication qui s’exécute entièrement dans votre navigateur, fondé sur la documentation BIG-IP DNS/GTM de F5 elle-même.

## Décodage de la sortie d’iqdump

`iqdump` diffuse en continu les données iQuery échangées entre deux systèmes, pour que vous puissiez vérifier le chemin et l’authentification SSL. Collez sa sortie et l’outil restitue les lignes de commentaire d’en-tête, le nom d’hôte local depuis lequel vous l’avez lancée, le pair `big3d` auquel elle s’est connectée et le port (4353), le groupe de synchronisation auquel elle s’est abonnée et l’horodatage, puis les champs de la stanza `<xml_connection>`, comme `version`, la chaîne de build de `big3d` et `connection_id`. Chaque champ est expliqué, et la présence d’une ligne de pair `big3d` est mise en avant comme preuve que le chemin TCP et la confiance SSL vers cet agent fonctionnent, car un chemin rompu ferait renvoyer une erreur à `iqdump`.

## Décodage des lignes de /var/log/gtm

Le processus `gtmd` journalise la santé du maillage iQuery dans `/var/log/gtm`. Collez ces lignes et l’outil décode les messages de changement d’état des équipements, par exemple une transition `green --> red` qui signifie qu’un BIG-IP est devenu indisponible via iQuery, ainsi que les entrées `SNMP_TRAP` et les messages d’établissement ou de perte de connexion `big3d`. Une transition `green --> red` est signalée avec ce qu’il faut vérifier ensuite : le chemin iQuery (TCP 4353, confiance SSL) vers cet équipement, et si son `big3d` tourne et a une version compatible.

## Explication de l’architecture

Saisissez ou choisissez un sujet et l’outil l’explique dans les termes de F5 : le maillage iQuery de connexions de longue durée, le port TCP 4353, la confiance SSL fondée sur des certificats qu’amorcent `bigip_add`, `big3d_install` et `gtm_add`, la commande `iqdump` elle-même, ce que transporte iQuery (la disponibilité des objets ainsi que les métriques d’équilibrage de charge dont a besoin le GSLB dynamique, global server load balancing ou équilibrage de charge global), les agents `gtmd` et `big3d`, et la règle selon laquelle iQuery n’est envoyé que sur le VLAN sur lequel un système le reçoit.

## Partage des résultats

En haut de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone telle que saisie, et rien d’autre. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis une mise en garde qui lui est propre : la sortie peut nommer vos systèmes BIG-IP, vos self IP et vos versions, relisez-la donc avant d’envoyer le lien. Elle propose ensuite le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

L’index des sujets n’est pas un résultat : tant qu’il est affiché (une zone vide, `list`, ou un texte que l’outil ne reconnaît pas), le bouton est désactivé. Ni la sortie d’`iqdump` ni ces lignes de journal ne contiennent d’identifiants : la confiance iQuery repose sur les certificats que s’échangent les systèmes.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone comme un collage, et la page le lit ; rien n’est envoyé nulle part. La valeur quitte ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Portée et fondements

L’outil explique et décode ; il n’ouvre jamais de socket, ne lance pas `iqdump` et ne récupère rien, et la même entrée produit toujours la même sortie. Il lit la forme du texte d’`iqdump` et des journaux sans valider un échange iQuery complet. Chaque fait provient des manuels de concepts et d’implémentation BIG-IP DNS/GTM de F5, du guide d’exploitation LTM-DNS et des articles K sur la confiance iQuery et son dépannage ; l’exemple est un véritable échantillon d’`iqdump` publié par F5. À noter : le module Link Controller a été retiré dans BIG-IP 21.0.0. Rien de ce que vous collez ne quitte la page.
