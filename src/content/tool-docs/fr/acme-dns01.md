## Ce que fait l’outil

Calculez l’enregistrement TXT exact à publier pour réussir un challenge ACME dns-01. Collez le jeton du challenge et la clé de votre compte ACME, au format JWK ou sous forme de son empreinte, et l’outil renvoie le nom d’enregistrement `_acme-challenge`, la valeur à placer dans l’enregistrement TXT, ainsi que l’autorisation de clé (key authorization) et l’empreinte intermédiaires dont elle découle. Tout s’exécute dans votre navigateur avec le SHA-256 natif de Web Crypto ; votre clé ne quitte jamais la page, et seuls ses membres publics sont utilisés.

## Raison d’être de dns-01

Le protocole ACME (RFC 8555) automatise la délivrance des certificats en vous demandant de prouver que vous contrôlez un domaine. Le challenge dns-01 le fait par le DNS : vous publiez un enregistrement TXT précis sous le domaine, et l’AC le consulte. Contrairement à http-01, dns-01 ne demande aucune connexion entrante vers votre serveur : il fonctionne donc derrière un pare-feu ou un équilibreur de charge, et c’est le seul type de challenge capable de valider un nom wildcard.

## Le calcul

La valeur de l’enregistrement n’a rien d’arbitraire : l’AC la recalcule à partir de votre clé de compte, et c’est ce qui rattache le challenge à vous. La chaîne compte trois étapes. D’abord, l’empreinte SHA-256 de la clé publique du compte est calculée sous la forme canonique définie par la RFC 7638, puis encodée en base64url. Ensuite, l’autorisation de clé s’obtient en joignant le jeton et cette empreinte par un point : `token.thumbprint`. Enfin, la valeur de l’enregistrement TXT est le base64url du condensat SHA-256 de l’autorisation de clé. L’enregistrement est publié sous `_acme-challenge.<domain>` ; un nom wildcard comme `*.example.com` est validé sous `_acme-challenge.example.com`.

## Seule votre clé publique est utilisée

L’empreinte de la RFC 7638 porte uniquement sur les membres publics obligatoires de la clé : pour une clé EC, la courbe et les coordonnées x et y ; pour une clé RSA, le module et l’exposant. Votre clé privée n’est jamais nécessaire pour calculer l’enregistrement : collez donc uniquement la JWK publique. Si une clé complète est collée, ses champs privés sont ignorés et ne s’affichent jamais.

## Utilisation

Saisissez le jeton du challenge et votre clé de compte et, si vous le souhaitez, le domaine pour voir le nom complet de l’enregistrement. Publiez la valeur renvoyée dans un enregistrement TXT sous `_acme-challenge.<domain>`, attendez sa propagation, puis laissez votre client ACME poursuivre. Le même jeton et la même clé produisent toujours la même valeur : vous pouvez donc comparer ce que publie votre client avec ce que calcule l’outil.

## Partage des résultats

Sous l’enregistrement, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient trois valeurs après le `#` : le jeton du challenge, l’empreinte de la clé de compte (celle que la page a calculée, ou celle que vous avez saisie) et le domaine. Il n’emporte jamais la zone de la clé : un fichier de clé de compte contient le membre privé `d` à côté des membres publics, et le lien ne contient aucun d’eux. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Rien de ce qu’il contient n’est secret. Dans la [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555) (consultée le 27/10/2026), l’autorisation de clé (le jeton et l’empreinte joints par un point) est servie en clair à `/.well-known/acme-challenge/<token>` pour le challenge http-01 (section 8.3), et l’enregistrement dns-01 prouve le contrôle du DNS du domaine, que le lien ne donne pas (section 8.4). La [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638) (section 3.2.1, consultée le 27/10/2026) attribue à une clé privée l’empreinte de sa clé publique : le lien désigne donc la clé sans la contenir. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les valeurs ne sont donc pas envoyées au serveur à l’ouverture du lien ; elles restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Ouverture d’un lien.** Le jeton et le domaine remplissent leurs zones, et l’empreinte va dans la zone de la clé, qui en accepte une ; la page calcule l’enregistrement comme pour un collage, avec Web Crypto dans le navigateur. Un jeton ou une empreinte hors de l’alphabet base64url qu’exige la page fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
- **Preuve.** Les contrôles de partage du site créent le lien à partir d’une clé de compte privée (l’exemple P-256 de la RFC 7515, `d` compris) et vérifient que ni `d`, ni un membre public, ni la JWK elle-même n’y apparaît, ni tel quel, ni en encodage-pourcent, ni en encodage de formulaire, ni décodé.
