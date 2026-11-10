## Ce que fait l’outil

Un véritable CPython 3.14 s’exécute dans votre navigateur. Le moteur est Pyodide 314.0.7, le build de CPython pour WebAssembly du projet Pyodide, servi depuis cette origine et épinglé par version et par empreinte SHA-256. Vous écrivez un programme, lui donnez éventuellement une entrée standard, appuyez sur Exécuter, puis lisez stdout, stderr et la valeur de la dernière expression, comme l’afficherait un REPL. Rien de ce que vous saisissez ne quitte la page : l’interpréteur vit dans un Web Worker sur votre appareil, n’a ni réseau ni processus, et la politique de la page les refuserait de toute façon.

C’est le premier outil du site qui exécute du code qui n’est pas celui du site. Il en découle trois choses, que la page énonce clairement au lieu de les cacher :

- **Un téléchargement a lieu, une fois, quand vous le décidez.** Le moteur pèse environ 13,5 Mo, répartis en cinq fichiers. La page s’ouvre avec l’éditeur et un exemple, mais sans le moteur ; un bouton, qui indique la taille, lance le téléchargement avec une barre de progression. Votre navigateur met les fichiers en cache (ils sont versionnés et marqués comme immuables) : une deuxième visite ne coûte donc rien.
- **Un moteur tiers s’exécute.** Les contrôles du site couvrent le harnais qui l’entoure : la vérification préalable, les limites, les exemples (réexécutés dans le véritable moteur à chaque build) et les empreintes des fichiers épinglés. Le comportement de l’interpréteur relève du projet Pyodide.
- **Seule la bibliothèque standard est disponible.** La distribution Pyodide propose 357 paquets (numpy, pandas, requests et les autres) ; aucun n’est chargé dans cette version. Quarante modules de la bibliothèque standard sont absents du build WebAssembly (tkinter, curses, pwd, grp, readline, entre autres), et la vérification préalable les nomme si vous en importez un.

## La vérification préalable

Avant tout envoi au moteur, le texte du programme est lu (jamais exécuté) et l’outil vous indique ce qui ne fonctionnera pas ici, et pourquoi, dans les termes du moteur lui-même :

- un import d’un module de la bibliothèque standard absent de ce build, avec l’erreur que lève le moteur ;
- un import d’un paquet que propose la distribution Pyodide mais que cette version ne charge pas, désigné par le nom de son paquet (PIL est Pillow, yaml est pyyaml) ;
- un import de quelque chose que personne ne peut installer ici, ou un import relatif, qui n’a aucun paquet auquel se rapporter ;
- les modules réseau (socket, urllib, http, requests…) et les modules de processus (subprocess, multiprocessing, os.system), qu’Emscripten refuse ;
- zoneinfo, qui ne trouve ici aucune base de fuseaux horaires et lève ZoneInfoNotFoundError ;
- input() avec une zone stdin vide, qui lève EOFError à la première lecture ;
- un time.sleep plus long que la limite de durée d’exécution, une boucle while True non bornée, les modules dont la sortie change d’une exécution à l’autre (random, time, uuid, datetime.now) ;
- les fichiers, qui vivent dans la mémoire du moteur et disparaissent avec l’exécution ; un programme qui n’affiche rien (la valeur de la dernière expression s’affiche à la place) ; des tabulations et des espaces mélangés dans l’indentation.

Les éléments marqués comme erreurs bloquent l’exécution ; les autres sont des remarques.

## Limites

- Programme : 20 000 caractères. Entrée standard : 20 000 caractères.
- Durée d’exécution : 30 secondes par exécution. À la limite, le Worker est arrêté et un nouveau est démarré à partir des fichiers en cache.
- Sortie : 200 000 caractères par flux, puis coupure signalée.
- Arrêter met immédiatement fin au Worker (seul moyen d’interrompre du Python synchrone sans tampon d’interruption sous isolation cross-origin, dont ce site statique ne dispose pas) et en démarre un nouveau.
- Chaque exécution démarre dans un espace de noms global neuf, avec `__name__` valant `"__main__"` : les exécutions ne se transmettent donc pas de variables, et l’idiome de garde du main fonctionne.

## Entrée standard

La zone stdin alimente `input()` et `sys.stdin`, une ligne par lecture, puis la fin de fichier. Un saut de ligne final n’ajoute pas de ligne vide. `for line in sys.stdin:` lit l’ensemble.

## Les exemples

Treize programmes écrits pour les personnes à qui s’adresse ce site : le découpage d’un /24 en /26, l’agrégation de préfixes, les masques de réseau et les masques génériques en binaire, un EUI-64 modifié à partir d’une adresse MAC, un en-tête DNS construit avec struct, HMAC-SHA256 en hexadécimal et en base64url, des statistiques de latence avec le p95, la gigue et deux écarts types, des temps de transfert à trois débits de ligne, un décompte syslog par gravité à partir d’un journal collé, des lignes lues depuis la zone stdin, des champs extraits d’une réponse d’API, le plus court chemin d’abord (shortest path first) de Dijkstra sur six routeurs, et la dernière expression seule. Leur sortie exacte est enregistrée sous forme de vecteurs de référence (golden vectors) et remesurée dans le véritable moteur, sous Node, à chaque build ; une mise à niveau du moteur qui modifie l’une d’elles fait échouer le build et fait l’objet d’un examen délibéré.

L’exemple de latence affiche les deux écarts types et étiquette chacun. `statistics.pstdev` renvoie l’écart type de la population (« the population standard deviation »), c’est-à-dire ce que ping affiche sous le nom mdev : la page de manuel ping(8) indique « Population standard deviation (mdev) », et iputils le calcule en divisant la somme des carrés des écarts par le nombre de réponses. `statistics.stdev` renvoie l’écart type de l’échantillon (« the sample standard deviation »), plus grand pour les mêmes mesures (8,34 contre 7,99 ms dans l’exemple). Pour comparer avec le résumé `rtt min/avg/max/mdev` de ping, prenez la ligne pstdev, pas la ligne stdev.

L’exemple SPF exécute l’algorithme du plus court chemin d’abord (SPF, shortest path first) de Dijkstra depuis le routeur R1 sur les six routeurs et les huit liens de l’[article sur Dijkstra](/learn/dijkstra-and-the-twenty-minute-algorithm), avec une liste de candidats `heapq`, et affiche chaque étape dans l’ordre que décrit la RFC 2328, section 16.1 : les chemins vers le sommet candidat le plus proche de la racine sont forcément les plus courts (« the paths to the candidate vertex that is closest to the root are guaranteed to be shortest »), si bien que ce routeur rejoint l’arbre et que ses liens sont examinés ; un chemin plus court remplace le coût et les prochains sauts d’un candidat, un chemin de coût égal ajoute ses prochains sauts à ceux déjà listés, et l’exécution se termine quand la liste des candidats est vide. Le programme se termine par le coût, les prochains sauts et les parents de chaque routeur, puis par l’ordre dans lequel les coûts sont devenus définitifs (R1 R3 R2 R4 R5 R6), qui est l’idée de Dijkstra en 1959, dans ses propres mots : les chemins minimaux de P vers les autres nœuds sont construits par ordre de longueur croissante (« the minimal paths from P to the other nodes are constructed in order of increasing length »). Les candidats de même coût sortent du tas dans l’ordre des noms de routeurs, une règle que le programme énonce en commentaire : la sortie est donc identique à chaque exécution. Modifiez un coût (celui de R2 vers R4, de 1 à 20 par exemple) et relancez le programme pour voir les prochains sauts se déplacer ; l’[introduction à OSPF](/learn/ospf-primer) présente Open Shortest Path First, le protocole qui effectue ce calcul.

## Ce que l’API ne fait pas

Cet outil n’est pas exposé sur l’API HTTP. Exécuter du Python arbitraire sur une infrastructure partagée reviendrait à une exécution de code à distance ; le moteur s’exécute uniquement dans votre navigateur. La vérification préalable est une aide pédagogique autour de l’éditeur, pas un contrat stable.

## Partage des résultats

Sous la barre d’exécution, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le programme et l’entrée standard tels que saisis, jamais la sortie : la personne qui ouvre le lien exécute elle-même le programme, si elle le souhaite. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Un programme peut contenir des clés, des jetons et des noms internes : la fenêtre contextuelle vous demande donc de le relire avant d’envoyer le lien. Avant qu’un lien soit proposé, le texte est examiné à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 et 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 : la forme « user:password » est déconseillée, « is deprecated »), un ID de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme la zone et la ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret (`api_key = "..."`, une affectation que le contrôle lit sous la forme propre à Python) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les deux zones se remplissent, toute sortie antérieure est effacée, et la page indique que le programme provient d’un lien. Rien d’autre ne se produit : le moteur (environ 13,5 Mo) n’est pas téléchargé et, s’il est déjà chargé, le programme ne s’exécute pas tant que vous n’appuyez pas sur **Exécuter**. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

La documentation de Pyodide (pages sur les web workers et sur les flux standard, version 314.0.7), le package.json propre au paquet, son pyodide-lock.json et ses typages sur le registre npm, la documentation de CPython 3.14 pour les modules qu’utilisent les exemples, la RFC 1035 (section 4.1.1), la RFC 4291 (annexe A) et la RFC 5424 (section 6.2.1) pour l’arithmétique des exemples, et MDN pour le module Worker et la liste de sources de Content Security Policy, consultés le 04/10/2026. La page statistics de Python 3.14 (pstdev et stdev), la page de manuel ping(8) sur man7.org et le source iputils de la ligne de résumé de ping (ping/ping_output.c) ont été consultés le 19/10/2026, de même que les sections 16.1 et 16.1.1 de la RFC 2328 (rfc-editor.org) et la note de Dijkstra de 1959, A Note on Two Problems in Connexion with Graphs, Numerische Mathematik 1, pages 269 à 271 (le scan du dépôt du CWI que cite l’article sur Dijkstra), pour l’exemple SPF. Tous figurent sur la page de l’outil.
