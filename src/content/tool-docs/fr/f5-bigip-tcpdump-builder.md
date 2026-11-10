## Ce que fait l’outil

Assemblez une commande `tcpdump` correcte pour F5 BIG-IP à partir de choix structurés : l’interface (dans la syntaxe propre à BIG-IP), le niveau de détail des flux TMM à inclure, la longueur de capture (snap length), l’écriture éventuelle dans un fichier de capture et un filtre BPF. L’outil met en forme la commande, que vous copiez ensuite et exécutez sur l’équipement ; il ne capture rien lui-même et ne contacte aucun équipement.

## Ce qui distingue tcpdump sur BIG-IP

Sur un BIG-IP, `tcpdump` travaille au niveau du TMM (Traffic Management Microkernel), et c’est l’argument d’interface qui le distingue du tcpdump standard. Deux éléments propres à BIG-IP comptent plus que les autres :

- **L’interface `0.0`** désigne toutes les interfaces de données du TMM à la fois. Elle est très utile pour trouver où le trafic circule (ou ne circule pas), mais elle n’est pas limitée en débit : un filtre est donc indispensable pour ne pas submerger la capture.
- **Le suffixe de détail `:n`** détermine la quantité d’informations internes du TMM que porte chaque ligne de paquet, et c’est l’élément le plus souvent mal compris.

## Le suffixe de détail, et l’erreur à éviter

Ajouter un suffixe à l’interface augmente le niveau de « bruit » (noise) :

- **`:n`** (faible) ajoute le nom du serveur virtuel, l’interface et le sens.
- **`:nn`** (moyen) ajoute le détail des flux.
- **`:nnn`** (élevé) ajoute l’adresse IP et le port des deux côtés du BIG-IP : vous pouvez ainsi suivre une connexion unique de part et d’autre du proxy.

Un **`p`** final (comme dans `:nnnp`, ou simplement `:p`) capture les deux côtés du proxy à la fois : le flux du client vers le BIG-IP et le flux du BIG-IP vers le membre du pool. L’erreur classique consiste à confondre ce suffixe d’interface `:n` avec l’option de ligne de commande `-n`, qui fait tout autre chose (elle désactive la résolution de noms). Ce sont deux choses distinctes, et l’outil les modélise séparément pour que vous ne les confondiez pas.

## Utilisation

Choisissez l’interface et le niveau de détail, définissez une longueur de capture et un fichier de sortie si vous en avez besoin, ajoutez un filtre BPF, puis copiez la commande assemblée. Elle est construite à partir des options que décrivent les recommandations de F5 sur la capture de paquets (K411 et K13637) : c’est donc la commande qu’un BIG-IP acceptera réellement.

## Partage des résultats

Sous la commande, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le formulaire sous forme de valeurs nommées : `iface`, `filter` et `file` tels que saisis (le fichier seulement quand l’écriture est activée), et chaque choix qui diffère de la valeur par défaut du formulaire (`detail`, `both`, `names`, `snaplen` avec `snapbytes`, `count`, `verbose`, `ether`, `hex`, `write`). Le bouton reste désactivé tant que le formulaire n’a pas quitté son état par défaut. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Le formulaire ne contient aucun secret (le générateur met en forme une commande et n’exécute rien), mais l’interface et le filtre peuvent nommer des adresses et des VLAN internes : la fenêtre contextuelle ajoute donc une mise en garde propre à cet outil, avant toute copie. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le formulaire n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les valeurs du lien remplacent tout le formulaire : un champ de texte que le lien ne contient pas est vidé, un choix qu’il ne contient pas reprend sa valeur par défaut, et la page assemble la commande. Rien n’est capturé, exécuté ni envoyé. Un choix que le formulaire ne propose pas, un interrupteur qui vaut autre chose que 1 ou 0, ou un nombre hors limites fait ignorer le lien en entier. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
