## Ce que fait l’outil

Décrivez la situation (appareil géré ou non, sur un site ou en mobilité, possibilité d’installer le bundle de certificats, besoin pour la politique de nommer l’utilisateur) et l’outil indique quelle méthode d’aiguillage (steering) convient : le client sur le poste, un tunnel IPsec ou GRE, un proxy explicite, ou le chaînage depuis un proxy déjà en place. **Chaque méthode indique ce qu’elle coûte, qu’elle soit choisie ou non**, car un outil qui ne listerait que les inconvénients des options écartées ferait de la publicité pour celle qu’il a retenue.

## L’interaction contre laquelle l’outil met en garde

**Le client détecte les autres méthodes d’aiguillage et, par défaut, se désactive quand il trouve IPsec, GRE ou un proxy explicite.** Utiliser les deux n’apporte donc pas automatiquement une double sécurité : c’est l’un ou l’autre, selon un paramètre que la plupart des gens n’ont jamais ouvert.

L’outil propose aussi la troisième organisation : déployer le client à côté du tunnel **non pour aiguiller**, mais pour provisionner les certificats et fournir l’identité de l’utilisateur. Le tunnel transporte le trafic ; le client indique qui est l’utilisateur.

## La limite stricte qu’il énonce

**Sans les certificats racine et intermédiaire de Netskope sur le terminal, il n’y a ni inspection TLS ni authentification SAML.** Le trafic arrive, et la politique s’exécute sur les seules métadonnées. Une règle écrite comme si le contenu était visible paraîtra correcte dans la console et ne fera pas ce que croit la personne qui l’a écrite.

## Différence avec l’analyseur de décision d’aiguillage

Les deux outils répondent à des questions différentes, et tous deux figurent sur ce site :

- **Cet outil répond à une question de conception** : quelle voie d’accès (on-ramp) déployer dans cette situation ?
- **L’analyseur de décision d’aiguillage répond à une question d’exécution** : avec une configuration d’aiguillage déjà en place, qu’advient-il de *ce flux précis* : aiguillé, contourné, bloqué ou direct ?

Choisissez la méthode ici ; suivez le flux là-bas.

## Ce que l’outil ne fait pas

Il ne connaît ni vos licences, ni votre tenant, ni votre configuration existante. L’aiguillage DNS, par exemple, exige des licences spécifiques et ne s’applique qu’à certains types de configuration, ce que l’outil ne peut pas vérifier pour vous.

## Partage des résultats

Sous le titre des méthodes, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les sept réponses, chacune sous forme de 1 ou de 0, toujours : un lien garde ainsi son sens même si une valeur par défaut change. Les réponses décrivent une situation et ne nomment aucun système ni aucune personne. La page affiche des méthodes dès son ouverture : le bouton est donc disponible immédiatement. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les cases sont cochées comme si vous les aviez sélectionnées, et les méthodes suivent. Un lien auquel il manque une réponse est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
