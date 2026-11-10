## Ce que fait l’outil

Décodez la valeur d’un cookie de persistance `BIGipServer` de F5 BIG-IP pour retrouver l’adresse IP et le port du membre du pool en backend, ou faites l’inverse : encodez une valeur de cookie à partir d’une adresse et d’un port. L’outil prend en charge les quatre encodages non chiffrés qu’utilise BIG-IP, et il s’exécute entièrement dans votre navigateur.

## Le cookie, et l’intérêt de le décoder

Quand la persistance par cookie de BIG-IP fonctionne dans son mode par défaut, le mode insert, elle ajoute un cookie nommé `BIGipServer<pool>` dont la valeur encode le membre du pool vers lequel le client a été envoyé, pour que le client revienne vers ce même membre. Le piège, c’est que cet encodage n’est pas un chiffrement : sous sa forme par défaut, le cookie encode en clair l’adresse IP interne et le port du membre du pool. Quiconque voit le cookie, c’est-à-dire le client et tout ce qui se trouve sur le chemin, peut le décoder et découvrir une partie de votre topologie interne. Le démontrer est la raison d’être de cet outil, et il signale quand une adresse décodée tombe dans une plage privée de la RFC 1918, car c’est précisément le détail interne que vous n’aviez pas l’intention de publier.

## Les encodages et leur ordre des octets

La subtilité, et la raison pour laquelle un décodeur dédié est utile, c’est l’ordre des octets. Dans l’encodage IPv4 par défaut, l’adresse est un nombre décimal unique dont les octets sont pris en little-endian, c’est-à-dire inversés, et le port est un champ décimal dont les deux octets sont permutés. Par exemple, l’adresse `10.1.1.100` s’encode en `1677787402` (en décimal), et le port `80` donne `20480`, octets permutés. BIG-IP définit en tout quatre encodages de ce type, pour IPv4, IPv6 et leurs variantes avec route domain, chacun avec sa propre règle ; l’outil les implémente d’après la documentation de F5 elle-même (K6917), recoupée avec un décodeur de référence bien connu.

## La correction, que l’outil ne peut pas défaire

La parade est simple et mérite d’être rappelée : configurez le chiffrement des cookies dans le profil de persistance (F5 K7784). Un cookie de persistance chiffré ne contient aucune adresse lisible, et cet outil ne peut pas le décoder, par conception. Si vous pouvez décoder ici votre cookie de production, n’importe qui d’autre le peut aussi : c’est le signal qu’il faut activer le chiffrement.

## Utilisation

Collez une valeur de cookie `BIGipServer` pour décoder l’adresse et le port du membre, ou saisissez une adresse et un port pour produire une valeur de cookie. Le calcul est déterministe et local ; rien n’est envoyé nulle part.

## Partage des résultats

Chaque mode a son propre bouton **Partager les résultats** sous sa réponse. Il crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient les valeurs après le `#`. En mode Décoder, le lien contient une copie du cookie que la page a décodé, son nom et sa valeur, jamais la ligne telle que collée : la page ne lit que ce qui précède le premier `;`, et une ligne collée peut contenir davantage, les attributs d’une ligne `Set-Cookie` ou la valeur `Cookie` d’un navigateur, où un cookie de session suit le cookie de persistance ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), exemple de la section 4.2.1, `Cookie: SID=31d4d96e407aad42; lang=en-US` ; section 8.4 : un cookie contient souvent un identifiant de session ; consultée le 01/11/2026). La page qui reçoit le lien décode donc le même membre du pool, et le reste ne vous quitte pas. En mode Encoder, le lien contient l’adresse, le port et le route domain tels que la page les a lus. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Comme l’adresse décodée ou saisie est généralement celle d’un membre du pool interne, la fenêtre contextuelle ajoute une ligne qui vous demande de la vérifier avant d’envoyer le lien.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le mode s’ouvre et ses champs se remplissent comme si vous les aviez saisis, puis la page décode ou encode comme d’habitude. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
