## Ce que fait l’outil

Collez un chemin RESTCONF F5OS : l’outil le décode segment par segment, avec la racine de l’API, les préfixes de modules YANG, la hiérarchie des conteneurs et les éventuelles clés de liste comme `tenant=tenant1`. Il nomme les modules qu’il reconnaît et indique ce que régit chacun. Il n’analyse que le texte du chemin : rien n’est récupéré, aucun schéma n’est consulté, et rien ne quitte le navigateur.

## Pourquoi un chemin F5OS doit être décodé

F5OS, la couche de plateforme située sous les tenants sur VELOS et rSeries, se pilote par **RESTCONF** (RFC 8040) sur des données modélisées en **YANG**, et non par iControl REST sur le modèle objet de TMOS. Quelqu’un qui maîtrise `/mgmt/tm/ltm/virtual` tombe sur `/restconf/data/f5-tenants:tenants/tenant=tenant1/config` et n’a aucun moyen de savoir quelle partie est un module, laquelle est un conteneur et laquelle sélectionne une instance. C’est un problème de vocabulaire plus que de difficulté, et c’est ce que cet outil élimine.

## Le préfixe de module et la convention de préfixage

`f5-tenants:tenants` est le nœud `tenants` du module YANG `f5-tenants`. F5OS utilise des modules **OpenConfig**, indépendants des constructeurs (`openconfig-system`, `openconfig-interfaces`, `openconfig-vlan`), aux côtés des modules `f5-` propres à F5. **Seul le premier nœud d’un module porte le préfixe** ; les nœuds situés en dessous s’écrivent sans préfixe, car ils en héritent. Un préfixe qui réapparaît au milieu d’un chemin signifie que le chemin est passé dans un autre module : c’est le point le plus utile à remarquer à la lecture d’un chemin.

## Les clés de liste, et la dualité des ports

RESTCONF désigne une entrée de liste en plaçant sa clé dans le chemin, plutôt que par un paramètre de requête : `tenant=tenant1` sélectionne ainsi un tenant de la liste `tenants`. L’outil les distingue des simples conteneurs.

Il explique aussi la disposition des ports qui piège bien des gens : F5OS exposait à l’origine RESTCONF sur le **port 8888** sous `/restconf`, et à partir de **F5OS 1.8**, la même API est joignable sur le port HTTPS standard sous `/api`. Deux chemins d’apparence différente peuvent donc désigner la même ressource. La version est celle qu’indique DevCentral, le site de F5 lui-même, où un codeshare de décembre 2022 sur l’automatisation des sauvegardes F5OS note qu’à partir de F5OS 1.8, la forme `:8888/restconf` peut être remplacée par `:443/api` ; les notes de version de F5OS-A 1.8.0 mentionnent un correctif correspondant, 1572137-2, pour l’API d’envoi et de téléchargement de fichiers, qui fonctionne avec `/api` comme avec `/restconf`. Les guides d’automatisation rSeries et VELOS de F5 documentent les deux points d’entrée sans nommer de version. L’authentification utilise un en-tête `X-Auth-Token`, et ce jeton est lui-même un JWT : il expire donc.

## Ce que l’outil ne fait pas

La table des modules est finie et volontairement courte. Si un chemin utilise un module que l’outil ne connaît pas, il en décode la structure et **indique que le module n’est pas reconnu plutôt que de le décrire au jugé**. Il ne valide rien non plus par rapport à un schéma, car il n’en a pas : il ne peut pas vous dire si un nœud existe dans votre version de F5OS, seulement comment est construit le chemin que vous avez saisi.

## Utilisation

Collez un chemin seul, une URL complète ou un chemin avec une chaîne de requête. Les paramètres de requête sont mis de côté et nommés, car ils qualifient la requête au lieu d’identifier la ressource.

## Partage des résultats

Sous la vue d’ensemble, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone telle que saisie, et rien d’autre. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis ajoute une mise en garde qui lui est propre : une adresse complète nomme l’hôte et le port d’administration de votre plateforme, relisez-la donc avant d’envoyer le lien. Elle propose ensuite le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Une adresse peut aussi contenir un mot de passe avant son `@` (`https://admin:secret@host:8888/...`). La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.2.1, consultée le 27/10/2026) rend obsolète le format « user:password » dans le champ userinfo, et indique que les applications ne devraient pas afficher en clair les données situées après le premier deux-points (« should not render as clear text any data after the first colon »). Cette page l’afficherait comme une partie de l’hôte : tant que le collage en contient un, aucun lien n’est créé ; supprimez-le et appuyez de nouveau sur le bouton. Un nom d’utilisateur seul (`admin@host`) passe.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage et la page le lit ; rien n’est envoyé nulle part. La valeur quitte ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
