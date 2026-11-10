## Ce que fait l’outil

L’outil calcule un HMAC, une empreinte à clé, sur un message à l’aide d’une clé secrète, et affiche le résultat en hexadécimal et en Base64. Vous choisissez la fonction de hachage sous-jacente : SHA-256, SHA-384 ou SHA-512. Le calcul utilise le Web Crypto natif du navigateur, et votre clé ne quitte jamais votre navigateur. C’est la même construction, par le même chemin de code, que celle qu’utilise le vérificateur de JWT pour contrôler une signature HS256 : les deux concordent donc par conception.

## Rôle du HMAC

Une simple empreinte prouve que des données n’ont pas changé, mais n’importe qui peut la recalculer : elle ne peut donc pas prouver qui l’a produite. Le HMAC ajoute une clé secrète au hachage, ce qui en fait un code d’authentification de message : une valeur qui prouve à la fois que le message est intact et qu’il provient de quelqu’un qui détient la clé. L’émetteur calcule le HMAC et l’envoie avec le message ; le destinataire, qui partage la clé, le recalcule et vérifie que les deux correspondent. Il est défini dans la RFC 2104 et la FIPS 198-1, avec des vecteurs de test dans la RFC 4231.

## Symétrique par nature

Le HMAC utilise un seul secret partagé pour produire et pour vérifier le code. C’est ce qui le rend rapide et simple, mais cela signifie aussi que quiconque peut vérifier un HMAC peut aussi en forger un, puisque les deux opérations utilisent la même clé. C’est le bon outil quand la même partie, ou deux parties qui partagent déjà un secret de confiance, produisent et vérifient les codes. Quand des parties indépendantes doivent pouvoir vérifier sans pouvoir forger, une signature asymétrique convient mieux : c’est le même compromis qui sépare HS256 de RS256 dans les JWT.

## Construction du HMAC

Le HMAC n’est pas simplement l’empreinte de la clé accolée au message, qui serait vulnérable aux attaques par extension de longueur. C’est une construction imbriquée : le message est haché avec une première forme dérivée de la clé, puis ce résultat est haché de nouveau avec une seconde forme dérivée. C’est cette structure qui donne au HMAC sa preuve de sécurité, et c’est pourquoi il vaut mieux utiliser le HMAC qu’inventer sa propre empreinte à clé.

## Utilisation

Saisissez un message et une clé secrète, choisissez la fonction de hachage, puis lisez le HMAC en hexadécimal ou en Base64. Donnez le même message et la même clé à deux systèmes, et les codes concordent ; modifiez le message ou la clé d’un seul caractère, et le code change entièrement.

## Partage des résultats

Sous le MAC, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le message tel que saisi et l’algorithme, mais jamais la clé. La personne qui reçoit le lien saisit la clé que vous lui transmettez par un autre moyen, et obtient le même MAC ; le MAC lui-même ne figure pas non plus dans le lien, car, à côté du message, il permettrait à quiconque de tester hors ligne des hypothèses sur une clé faible. Une exception : la clé `Jefe` part aussi, car c’est la clé de test publiée dans la [RFC 4231](https://www.rfc-editor.org/rfc/rfc4231) (cas de test 2, consultée le 01/11/2026), celle qu’utilise le bouton Exemple de la page. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis une mise en garde qui lui est propre (le message part tel que saisi : relisez-le avant d’envoyer le lien), puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Une clé HMAC est une clé : la [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104) (section 3, consultée le 01/11/2026) demande des clés choisies aléatoirement (« chosen at random ») et renouvelées périodiquement (« periodically refreshed »), une pratique qui limite les dégâts d’une clé exposée (« limits the damage of an exposed key ») ; quiconque la détient peut calculer un MAC valide pour n’importe quel message.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les valeurs ne sont donc pas envoyées au serveur à l’ouverture du lien ; elles restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le message et l’algorithme se placent dans la page. La zone de la clé reçoit la clé de test publiée quand le lien la contient, et garde sinon ce que la personne a saisi ; sur une page neuve, elle est vide, et une note précise que la clé ne voyage jamais. Le MAC est calculé avec Web Crypto dans le navigateur dès que les deux champs sont remplis. Un algorithme que la page ne propose pas, ou une clé autre que la clé publiée, fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
