## Ce que fait l’outil

Collez du XML : l’outil l’analyse et en donne une structure lisible, avec la déclaration XML, le DOCTYPE et les entités qu’il déclare, et l’arbre complet des éléments avec leurs espaces de noms et leurs attributs, ainsi que les sections CDATA, les commentaires et les instructions de traitement. Il vérifie que le document est bien formé et mène une analyse de sécurité de la surface d’attaque XML. Il ne récupère rien et ne résout rien.

## Ce que l’outil affiche

Le XML réunit plusieurs types de nœuds dans un même document, et l’outil les sépare : la **déclaration** avec sa version et son encodage ; le **DOCTYPE** et les **entités** qu’il définit ; l’**arbre des éléments**, avec les **espaces de noms** (les liaisons `xmlns`) et les **attributs** affichés élément par élément ; et les sections **CDATA**, les **commentaires** et les **instructions de traitement**. Il vérifie aussi la bonne formation au sens XML : chaque balise a sa correspondante, et le document a exactement un élément racine.

## La surface d’attaque XML

La puissance du XML le rend dangereux quand il vient d’une source non fiable, et l’analyse de sécurité de l’outil signale précisément où se loge ce danger :

- **La présence même d’un DOCTYPE**, car c’est la définition de type de document qui rend possible tout le reste ;
- **Les entités externes**, qui peuvent faire entrer un fichier local ou une URL et sont le mécanisme des attaques XXE (XML External Entity) ;
- **Les entités paramètres**, une forme qui sert à faire passer une XXE au travers de défenses naïves ; et
- **L’expansion d’entités**, l’imbrication à l’origine de l’attaque par déni de service billion laughs.

C’est tout l’intérêt de les voir signalés : vous savez ainsi si un document donné cherche à faire quelque chose qu’un simple document de données ne ferait jamais.

## Sûr par construction

L’outil est un analyseur lexical de texte, pas un processeur XML. Il lit le document comme du texte et en décrit la structure ; il ne résout jamais une entité, n’ouvre jamais une référence externe et ne développe jamais rien. C’est ce qui lui permet d’analyser sans danger du XML hostile : les fonctionnalités mêmes contre lesquelles il vous met en garde sont décrites, pas exécutées. C’est le pendant généraliste du décodeur SAML, qui refuse toute DTD, car un message SAML n’en contient jamais légitimement.

## Utilisation

Collez un document XML et lisez sa déclaration, son DOCTYPE et ses entités, son arbre des éléments et les signalements de sécurité. L’analyse est déterministe et locale : vous pouvez inspecter sans risque du XML de n’importe quelle source.

Pour chacune des règles de bonne formation de XML 1.0, avec la ligne et la colonne du premier échec, et pour indenter ou minifier un document, utilisez le [formateur et validateur XML](/tools/xml-formatter).

## Partage des résultats

Sous le verdict de bonne formation, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le document tel que collé, une fois que la page l’a lu comme du XML. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Le XML peut nommer des hôtes internes et des personnes : la fenêtre contextuelle vous demande donc de le relire avant d’envoyer le lien. Avant qu’un lien soit proposé, le texte est examiné à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1, 4.2.1 et 8.4, selon lesquelles un cookie contient couramment un identifiant de session), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un identifiant de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret (un membre JSON `token`, un `password=` dans la chaîne de requête d’une URL) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier. Deux autres emplacements comptent ici comme des identifiants : le `Password` d’un `UsernameToken` WS-Security ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html), consulté le 01/11/2026 : il fournit le mot de passe ou un équivalent, comme une empreinte, « provides password information (or equivalent such as a hash) »), et une assertion SAML signée ou chiffrée, comme sur le décodeur SAML. Un élément ou un attribut dont le nom ressemble à un secret (`password`, `apiKey`, `client_secret`) est, lui, nommé dans la fenêtre contextuelle.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le document remplit la zone comme un collage et la page le lit, localement : aucune entité n’est résolue et rien n’est récupéré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
