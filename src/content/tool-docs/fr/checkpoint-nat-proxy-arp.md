## Ce que fait l’outil

Il répond à une seule question : le trafic destiné à l’adresse traduite atteindra-t-il réellement la passerelle ? Non pas si la politique l’autorise, mais si le paquet arrive tout court.

Cette distinction compte, car la panne habituelle se situe une couche en dessous de la base de règles. Si l’adresse traduite se trouve dans un sous-réseau auquel la passerelle est directement connectée, un équipement va émettre une requête ARP pour elle et, à moins que la passerelle ne réponde, rien n’est jamais envoyé.

## La règle

**Le NAT automatique (traduction d’adresses réseau, Network Address Translation)** ajoute lui-même l’entrée proxy ARP à l’installation de la politique, à condition que *Automatic ARP configuration* soit activé dans Global Properties.

**Le NAT manuel ne le fait pas.** Il ne l’a jamais fait. C’est l’administrateur qui crée l’entrée.

**Ni l’un ni l’autre n’importe** si l’adresse traduite n’appartient pas à un sous-réseau connecté. Dans ce cas, personne sur le segment n’émettra de requête ARP pour elle, et c’est un équipement en amont qui doit la router ; le proxy ARP n’est pas la bonne piste.

## La signature du problème

Un NAT statique manuel vers une adresse du propre sous-réseau de la passerelle, sans entrée proxy ARP, produit un silence très particulier. La politique s’installe sans erreur. La base de règles paraît correcte. Le serveur est en bonne santé.

Et il n’y a **absolument rien dans les journaux du pare-feu**, ni drop, ni reject. Rien n’est arrivé qui puisse être journalisé. Une capture sur l’interface externe montre des requêtes ARP restées sans réponse.

## Un cas où « il suffit d’utiliser le NAT automatique » ne suffit pas

Le NAT automatique ne crée toujours rien si *Automatic ARP configuration* est désactivé dans Global Properties. L’outil traite cette combinaison exactement comme une règle manuelle, car le résultat est identique.

Si vous ajoutez des entrées à la main à côté des entrées automatiques, *Merge manual proxy ARP configuration* doit être activé, sinon elles ne peuvent pas coexister.

## Ce que l’outil ne fait pas, délibérément

**Il ne classe pas la base de règles NAT.** Les sources publiées se contredisent sur la question de savoir si les règles manuelles sont évaluées avant ou après les règles automatiques : un guide affirme que les manuelles passent en premier, un autre que les niveaux automatiques passent d’abord, et le guide d’administration de Check Point lui-même décrit les deux types comme appliqués différemment sans trancher sur l’ordre.

Les classer reviendrait à prendre parti et à présenter une supposition comme un calcul. Le comportement du proxy ARP est décrit de façon cohérente partout : c’est donc à cette question que l’outil répond.

## Limites, en toute franchise

Une interface à la fois ; une passerelle dont plusieurs interfaces voient le même trafic pose une question de topologie que l’outil ne modélise pas. IPv4 uniquement. Et il raisonne sur la joignabilité en couche 2, pas sur l’autorisation de la connexion par la politique d’accès une fois qu’elle est arrivée.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient le formulaire après le `#` sous forme de valeurs nommées, tous les champs, toujours : `method`, `type`, `natip`, `gateway`, `prefix` et `autoarp` (1 ou 0). Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Le formulaire contient deux adresses, un préfixe et trois choix, dont aucun n’est un secret : la fenêtre contextuelle n’ajoute donc rien à l’avertissement standard du site. Tous les champs sont transmis, pas seulement ceux qui diffèrent des valeurs par défaut, si bien qu’un ancien lien garde son sens si une valeur par défaut change.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les valeurs du lien remplacent tout le formulaire et la page l’évalue (calcul de sous-réseau ; aucune requête ARP n’est envoyée et rien n’est interrogé). Une méthode ou un type inconnus, un `autoarp` autre que 1 ou 0, ou des adresses que la page refuse font ignorer tout le lien. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
