## Ce que fait l’outil

Lancez `tty` dans un shell, collez ce qu’il a affiché, et l’outil vous dit quelle couche de la pile du terminal vous avez réellement sous les yeux : l’extrémité slave d’un pseudoterminal, une console virtuelle, une vraie ligne série, le synonyme du terminal de contrôle ou la console système. Il traite aussi **« not a tty »**, qui est un constat et non une erreur.

Les quatre définitions d’une ligne s’affichent **avant** que vous ne colliez quoi que ce soit : une personne qui arrive en confondant ces mots ne devrait pas avoir à fournir une saisie avant que la page lui apprenne quelque chose.

## Ce que donne chaque réponse

- **`/dev/pts/N`** : l’extrémité slave d’un pseudoterminal. Un programme de l’espace utilisateur tient l’extrémité master : votre émulateur, `sshd` ou `tmux`. **Le numéro est attribué, il ne signifie rien** : deux shells aux numéros consécutifs n’ont aucun rapport entre eux. C’est aussi pourquoi fermer une fenêtre tue ce qui s’y exécutait : le master disparaît, le noyau raccroche (hang-up), et le leader de session reçoit SIGHUP.
- **`/dev/ttyN`** : une console virtuelle, le noyau qui pilote le clavier et l’écran de la machine elle-même. Elle survit à ce qui emporte un pseudoterminal, et c’est pourquoi c’est là que vous vous retrouvez quand le serveur d’affichage est mort.
- **`/dev/ttyS0`, `/dev/ttyUSB0`** : une vraie ligne série, le cas d’origine, inchangé. L’outil prévient que **les paramètres série ne sont pas négociés** : une discordance produit un charabia convaincant plutôt que le silence, si bien qu’une console qui affiche n’importe quoi relève généralement d’un réglage de vitesse plutôt que d’un câble défectueux.
- **`/dev/tty`** : pas un périphérique, mais un **synonyme** du terminal qui contrôle le processus appelant, quel qu’il soit. C’est ce qui explique qu’une invite de mot de passe vous parvienne encore quand la sortie est redirigée.
- **`/dev/console`** : là où parle le noyau ; sur un serveur, c’est souvent le port série plutôt que l’écran.

## Ce que l’outil ne fait pas

Il lit un chemin, pas un système. Il ne peut pas vous dire qui tient le master de votre `/dev/pts/3` en particulier, et il ne fait pas de suppositions sur les noms de périphériques qu’il ne connaît pas : un chemin non reconnu est signalé comme tel, car un périphérique propre à une plateforme ne doit pas être déduit de l’orthographe de son nom.

## Partage des résultats

Sous l’identification du périphérique, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le chemin du périphérique ou la sortie de tty tels que saisis (`input`), et rien d’autre. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les quatre définitions du haut font partie de la page elle-même : elles ne figurent donc pas dans le lien.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le chemin n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le chemin remplit la zone comme le ferait une saisie, et la page l’explique ; rien n’est envoyé. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
