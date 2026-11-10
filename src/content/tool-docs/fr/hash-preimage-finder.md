## Ce que fait l’outil

C’est un outil pédagogique. Il lance dans votre navigateur une recherche par force brute bornée, qui tente de trouver une entrée dont l’empreinte correspond à une empreinte cible. Face à une entrée faible, un code PIN court ou quelques lettres minuscules, il aboutit en quelques secondes ; face à tout ce qui a une réelle entropie, il épuise son espace des clés plafonné et s’arrête sans réponse. Ce contraste est tout l’intérêt : il montre, de première main, pourquoi une empreinte rapide et non salée protège mal un mot de passe, et pourquoi un secret à forte entropie reste sûr, même face à une recherche directe.

## Préimage et fonctionnement de la recherche

Une fonction de hachage est à sens unique : aucune formule ne ramène une empreinte à son entrée. La seule façon générique d’en inverser une est de deviner : choisir un candidat, le hacher et vérifier si l’empreinte correspond. C’est exactement ce que fait cet outil. Il énumère les candidats sur un alphabet et une longueur que vous choisissez (chiffres, lettres minuscules, etc.) et hache chacun localement jusqu’à trouver une correspondance ou épuiser les candidats. Il n’utilise aucun dictionnaire, aucune liste de mots (wordlist) ni aucune table précalculée : c’est uniquement une démonstration de recherche exhaustive, pas une trousse de cassage de mots de passe.

## Pourquoi les entrées faibles cèdent, et pas les fortes

Le nombre de candidats est la taille de l’alphabet élevée à la puissance de la longueur. Un code PIN à 4 chiffres ne représente que 10^4, soit 10 000 possibilités, une recherche triviale ; six lettres minuscules donnent 26^6, environ 300 millions, ce qui reste peu pour un ordinateur ; mais chaque caractère supplémentaire multiplie l’espace, si bien qu’un secret réellement aléatoire porte le nombre de candidats bien au-delà de ce que peut couvrir une recherche locale bornée. C’est précisément pourquoi les fonctions de hachage rapides comme MD5 ou SHA-256, calculables des milliards de fois par seconde, ne conviennent pas aux mots de passe, et pourquoi les systèmes réels ajoutent un sel et utilisent une fonction de dérivation de clé volontairement lente, comme le recommandent le guide Password Storage de l’OWASP et la NIST SP 800-63B.

## Ce que l’outil ne peut pas faire

Comme l’espace des clés est plafonné et qu’il n’y a pas de liste de mots, l’outil ne retrouve jamais que des entrées dont on savait déjà qu’elles étaient faibles. Il ne peut pas attaquer une empreinte salée, ni une empreinte produite par une fonction de dérivation de clé lente comme bcrypt, scrypt, Argon2 ou PBKDF2, conçues pour rendre chaque essai coûteux.

Il ne dispose pas non plus de liste de mots de passe divulgués. Pour savoir si un mot de passe donné figure déjà dans une fuite de données, sans l’envoyer, utilisez la [vérification Pwned Passwords](/dev/out/pwned-passwords) de la salle rouge : elle n’envoie que les cinq premiers caractères de l’empreinte SHA-1 du mot de passe, et seulement quand vous appuyez sur Interroger ou sur Entrée.

## Utilisation

Collez une empreinte cible, ou créez-en une en hachant une entrée d’exemple dans le [générateur d’empreintes](/tools/hash) (SHA-1 ou SHA-256), choisissez l’alphabet et la longueur maximale à explorer, puis suivez la recherche. Essayez une entrée numérique courte pour la voir aboutir rapidement, puis allongez-la ou élargissez l’alphabet pour voir l’espace des clés distancer la recherche.

## Partage des résultats

Sous la recherche et le résultat qu’elle a pu donner, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la recherche telle que vous l’avez configurée : l’empreinte, l’alphabet et la longueur maximale. Il ne contient jamais ce qu’une recherche a trouvé, et son ouverture n’en lance jamais. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis une mise en garde qui lui est propre, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Cette mise en garde compte ici plus que partout ailleurs : cette page existe pour montrer qu’une empreinte rapide et non salée d’une entrée faible équivaut à l’entrée elle-même. Quiconque ouvre le lien peut appuyer sur Lancer la recherche et obtenir la même réponse que vous : envoyez donc des empreintes de valeurs de test, jamais celle d’un vrai mot de passe.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les valeurs ne sont donc pas envoyées au serveur à l’ouverture du lien ; elles restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Ouverture d’un lien.** Les trois champs se remplissent, toute recherche en cours s’arrête, et une note vous invite à appuyer sur Lancer la recherche : la recherche ne s’exécute que lorsque vous le décidez, dans votre navigateur. Une empreinte dont la page ne peut pas déduire l’algorithme d’après sa longueur, un alphabet que la page ne propose pas, ou une longueur hors de l’intervalle allant de 1 au plafond de cet alphabet, fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
