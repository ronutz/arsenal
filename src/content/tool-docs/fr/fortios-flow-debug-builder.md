## Ce que fait l’outil

Indiquez ce que vous voulez tracer (une adresse, éventuellement des ports, un protocole, un nombre de paquets) : l’outil assemble la séquence `diagnose debug flow` complète pour un FortiGate, c’est-à-dire la remise à un état propre, le filtre, les options d’affichage, la trace et l’activation, suivies du nettoyage. Chaque ligne est expliquée individuellement. L’outil génère du texte et ne contacte rien.

La saisie est facultative pour l’essentiel du formulaire : les champs de port et le nombre de paquets sont flanqués de flèches haut et bas, et sous le champ du protocole se trouve un bouton par nom de protocole que l’outil convertit en numéro (`tcp`, `udp`, `icmp`, `icmpv6`, `gre`, `esp`, `ah`, `sctp`) ; appuyer sur le bouton allumé vide de nouveau le champ. Un numéro de protocole, les adresses et le VDOM restent à saisir.

## Pourquoi un générateur plutôt qu’une référence

`diagnose debug flow` n’est pas une commande, c’est une recette de quatre ou cinq commandes qui ne fonctionnent qu’ensemble. L’ordre compte, le nettoyage encore plus, et l’ensemble sert assez rarement pour que presque personne ne s’en souvienne exactement. C’est précisément le type de problème que résout un générateur déterministe.

## L’ordre produit, et pourquoi

L’outil produit **le filtre d’abord, l’activation en dernier**. Le guide d’administration de Fortinet lui-même place `diagnose debug enable` en premier, avant le filtre, et **les deux fonctionnent** : l’outil le dit dans ses remarques au lieu de choisir discrètement. La raison de préférer le filtre d’abord est pratique : sur un pare-feu chargé, activer la sortie avant que le filtre soit défini trace tout jusqu’à ce que le filtre s’applique.

## Trois rappels systématiques

- **Le nombre compte des paquets, pas des secondes.** `trace start 100` correspond à cent paquets, et une interface chargée peut les épuiser en moins d’une seconde.
- **Le trafic accéléré par le matériel (offload) n’atteint jamais ce code.** Sur les plateformes NP ou SP, un filtre correct peut ne rien produire du tout alors que le trafic circule manifestement. C’est la raison la plus courante pour laquelle une bonne trace semble cassée.
- **Les numéros de ligne de la sortie ne sont pas stables d’une version à l’autre.** Fiez-vous au nom de la fonction.

## Ce que l’outil ne fait pas

Il ne peut connaître ni votre plateforme, ni l’organisation de vos VDOM, ni l’éventuelle accélération matérielle de votre session, et il ne valide rien sur un équipement. Il refuse de construire une trace sans filtre, car un debug flow sans filtre sur un pare-feu de production est le moyen le plus rapide de rendre une console inutilisable.

## Partage des résultats

Sous les commandes, après le bouton Copier, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le formulaire sous forme de valeurs nommées, tous les champs, toujours : `addr`, `saddr`, `daddr`, `port`, `sport`, `dport`, `proto`, `vdom` et `count` tels que saisis (un champ vide est omis), et `iprope` et `timestamp` à 1 ou 0. Le bouton reste désactivé tant qu’aucun filtre n’est défini, car la page ne construit rien sans filtre. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Le formulaire ne contient aucun secret (le générateur met du texte en forme et n’exécute rien), mais ses filtres nomment des hôtes, des ports et un domaine virtuel de votre réseau : la fenêtre contextuelle ajoute donc une mise en garde avant toute copie. Tous les champs partent, pas seulement ceux qui diffèrent des valeurs par défaut : un ancien lien garde ainsi son sens si une valeur par défaut change.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les valeurs du lien remplacent tout le formulaire (un champ texte qu’il ne contient pas est vidé), et la page construit les commandes ; rien n’est exécuté. Une option qui ne vaut ni 1 ni 0, ou un lien sans filtre, fait ignorer le lien en entier. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
