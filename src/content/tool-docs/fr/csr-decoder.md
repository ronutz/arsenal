## Ce que fait l’outil

Il décode une demande de signature de certificat (CSR, certificate signing request) PKCS#10 et en lit le contenu : le nom du sujet, la clé publique, les Subject Alternative Names et les autres extensions que demande le demandeur, ainsi que les éventuels attributs. Il analyse la structure de la demande entièrement dans votre navigateur et ne contacte jamais d’autorité de certification.

## Ce qu’est une CSR, et ce qu’elle n’est pas

Une CSR est l’objet que vous remettez à une autorité de certification quand vous lui demandez de délivrer un certificat. L’essentiel est que ce n’est pas un certificat. Elle n’a ni numéro de série, ni émetteur, ni dates de validité, car rien de tout cela n’a encore été décidé. Elle ne contient que ce que demande le demandeur : un nom de sujet, une clé publique et, éventuellement, un ensemble d’extensions demandées comme les Subject Alternative Names. L’ensemble de la demande est signé avec la clé privée qui correspond à la clé publique qu’elle contient, ce qui prouve que le demandeur détient bien cette clé privée : c’est l’étape appelée preuve de possession.

## Demandé, pas accordé

Lire une CSR vous dit ce qui a été demandé, pas ce qu’une AC accordera. Une autorité de certification est libre d’ajouter, de modifier ou de supprimer ce que demande une CSR selon sa propre politique et la validation qu’elle effectue : les SAN et les extensions affichés ici sont donc une demande, pas une garantie. Cette distinction compte quand un certificat délivré ne correspond pas à la CSR : c’est souvent l’AC qui applique sa politique, et non une erreur.

## Ce qu’il décode

La demande est de l’ASN.1 encodé en DER (le même encodage type-longueur-valeur que celui des certificats), et le décodeur la parcourt pour en tirer des champs lisibles :

- le nom distinctif du **sujet** ;
- la **clé publique**, avec son algorithme et sa taille ;
- les **extensions demandées**, transportées dans un attribut PKCS#9 `extensionRequest`, au premier rang desquelles les Subject Alternative Names ; et
- les autres **attributs**, comme un mot de passe de challenge (challenge password) ou un nom non structuré (unstructured name), s’ils sont présents.

Il ne décode que la structure. Il ne vérifie pas l’autosignature de la demande et, comme une CSR n’a pas de période de validité, il n’y a rien de temporel à vérifier.

## Utilisation

Collez une CSR PKCS#10 (le bloc situé entre les marqueurs CERTIFICATE REQUEST) et lisez son sujet, sa clé, les SAN et les extensions demandés, et ses attributs. L’analyse est déterministe et locale.

## Partage des résultats

Sous la remarque d’introduction, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la zone telle que vous l’avez collée, après le `#` : `/tools/csr-decoder#input=-----BEGIN%20CERTIFICATE%20REQUEST-----...`. Une demande est ce que vous envoyez à une AC : un sujet, une clé publique et les extensions demandées. Tout le reste du contenu de la zone l’accompagne. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la demande n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Pas de lien dans deux cas.** Quand la zone contient aussi une clé privée (un bloc `-----BEGIN ... PRIVATE KEY-----`, car certains générateurs affichent la demande et sa clé ensemble), et quand la demande contient un mot de passe de challenge, que cette page affiche en clair : la demande est signée, elle ne peut donc pas être partagée sans le mot de passe. La fenêtre contextuelle précise le cas.
- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le lien a la forme `#input=` que cette page lit déjà : son ouverture fonctionne donc exactement comme pour ces liens depuis toujours. La valeur remplit la zone et se décode, et elle reste dans l’adresse jusqu’à ce que vous modifiiez ou effaciez la zone.
