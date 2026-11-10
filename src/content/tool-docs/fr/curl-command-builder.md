## Ce que fait l’outil

Choisissez un protocole, remplissez des champs qui s’adaptent à ce protocole, et regardez la commande `curl` exacte s’assembler en direct. Chaque option qu’émet le générateur est expliquée sous la commande, et tout ce qui a une incidence sur la sécurité fait l’objet d’un avertissement : `-k`, les protocoles en clair, un mot de passe placé sur la ligne de commande, ou l’encodage de formulaire par défaut de `-d` dans `curl` quand le corps ressemble à du JSON. Rien n’est exécuté et rien ne quitte le navigateur.

## Les 27 protocoles

Le générateur couvre toute la liste des protocoles de l’outil `curl` actuel telle que publiée sur curl.se : DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP (Lightweight Directory Access Protocol), LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS et WSS. Sélectionner un protocole ouvre une courte explication : ce qu’il est, son port par défaut, et s’il fonctionne en clair, à l’intérieur de TLS, ou s’il démarre en clair avec un mécanisme de passage au chiffrement. Le formulaire n’affiche ensuite que ce que ce protocole comprend : HTTP a droit aux méthodes, aux en-têtes, aux corps et aux formulaires ; SMTP à une enveloppe ; MQTT à un topic ; FTP au listage et à l’envoi de fichiers ; `file://` à un simple chemin.

## Une seule table, une seule vérité

Les panneaux d’explication et l’assembleur de commandes lisent la même table des capacités des protocoles. C’est délibéré : le texte qui vous apprend ce que peut faire un protocole et le code qui construit la commande ne peuvent pas diverger, car ce sont les mêmes données.

## Déterministe par construction

Des saisies identiques produisent toujours une commande identique à l’octet près : les options sont émises dans un ordre canonique unique, et les valeurs ne sont mises entre guillemets simples, avec l’échappement POSIX, que lorsque c’est nécessaire. Onze vecteurs de référence (golden vectors) figent ce comportement, y compris la règle selon laquelle `-d` implique POST (si bien qu’aucun `-X POST` redondant n’est jamais émis) et la séquence d’échappement `'\''`. La mise entre guillemets vise les shells POSIX ; une remarque dans l’outil le précise, car cmd.exe et PowerShell suivent d’autres règles.

## L’inverse de l’analyseur

Cet outil écrit des commandes `curl` ; l’[analyseur de commandes curl](/tools/curl-command-explainer) les lit. Construisez une commande ici, ou collez-en une là-bas pour la faire expliquer option par option et traduire en fetch, en HTTP brut, en HTTPie et en Python requests.

## Partage des résultats

Sous la zone de la commande, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient le formulaire après le `#`, chaque champ sous son propre nom (un formulaire n’a pas de texte unique à coller), le mot de passe et tous les identifiants étant remplacés par `REDACTED`, jamais tels que saisis. Le bouton reste visible, désactivé, tant que le formulaire ne produit pas de commande. Sa fenêtre contextuelle indique d’abord ce que contient le lien et combien de valeurs ont été remplacées, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Ce qui est remplacé :

- **Le champ du mot de passe** : la commande indique toujours `-u user:REDACTED`, et l’avertissement sur un mot de passe placé sur la ligne de commande reste affiché.
- **Les en-têtes**, selon leur nom : `Authorization` et `Proxy-Authorization` conservent leur schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials ») ; Basic conserve son user-id et perd le mot de passe ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2) ; un JWT conserve son en-tête protégé et perd les claims et la signature ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1) ; `Cookie` conserve ses noms ; un en-tête dont le nom évoque un secret (`X-API-Key`) est remplacé en entier ; un jeton à l’intérieur de toute autre valeur est remplacé.
- **Le champ des cookies** : chaque valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1). **Un champ de formulaire dont le nom évoque un secret** (`client_secret`) : sa valeur ; un champ de fichier conserve son chemin. **Le corps** : les membres JSON et les paramètres `name=value` dont le nom évoque un secret (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sections 2.2 et 2.3), `refresh_token`, `client_secret`, `password` et `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 2.3.1, 4.1.2, 4.3.2 et 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), section 4.5), et tout nom se terminant par token, secret, password ou api key).
- **L’hôte, le proxy et le chemin** : le mot de passe d’un `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 ; curl en lit aussi un sans schéma) et tout paramètre de requête secret.

Tous les autres champs sont transmis tels que saisis ; les valeurs par défaut (https, GET, sortie standard, interrupteurs désactivés) sont omises du lien, et une tabulation saisie dans un champ d’une ligne voyage sous forme d’espace. Les vecteurs de partage de l’outil vérifient que la copie produit les mêmes options et les mêmes avertissements. Si la commande construite à partir de la copie contient encore une clé ou un jeton qu’aucun nom ne signale (un JWT dans le chemin), il n’y a pas de lien, et la fenêtre contextuelle le signale.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le formulaire n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Tout le formulaire est remplacé (un champ que le lien ne transporte pas est vidé) et la commande est construite ; rien n’est exécuté ni envoyé. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
