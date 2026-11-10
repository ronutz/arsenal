## Ce que fait l’outil

Fabric Connect (SPBM) d’Extreme nomme les éléments avec trois nombres, et cet outil décode celui que vous collez, en le reconnaissant automatiquement à sa forme :

- un **I-SID**, un identifiant de service sur 24 bits (de 1 à 16 777 215) qui nomme une instance de service dans la fabric ;
- un **nickname**, un identifiant de nœud sur 20 bits écrit `X.XX.XX` en hexadécimal ;
- un **system-id / B-MAC**, une adresse de 48 bits au format MAC, écrite en trois groupes séparés par des points comme `00bb.0021.0001`.

Il s’exécute entièrement dans votre navigateur.

## L’I-SID

L’I-SID est au cœur d’un service de fabric. Un VLAN client associé à un I-SID forme un VSN de couche 2 ; une VRF (virtual routing and forwarding) associée à un I-SID forme un VSN de couche 3 ; la table de routage globale transportée par IS-IS sans I-SID, c’est IP Shortcuts. Le numéro lui-même n’indique pas de quel cas il s’agit, car cela dépend de la façon dont vous le provisionnez : l’outil vérifie donc la plage de 24 bits et explique l’usage au lieu de deviner un type. L’I-SID par défaut du réseau Fabric Attach (FAN) est 16777001, ce que l’outil signale.

## Le nickname

Chaque nœud SPBM porte un nickname de 20 bits, écrit sous la forme d’un chiffre hexadécimal, d’un point, de deux chiffres hexadécimaux, d’un point et de deux chiffres hexadécimaux (par exemple `C.30.00`). Il doit être unique dans toute la fabric, y compris entre zones IS-IS adjacentes. L’outil convertit la forme `X.XX.XX` en valeur entière et inversement, et vérifie la plage. L’attribution dynamique des nicknames les distribue à partir d’une plage de préfixes de serveur comme `C.30.00-C.3F.FF`.

## Le system-id / B-MAC

La B-MAC nodale, configurée comme system-id IS-IS, est une adresse de 48 bits. L’outil lit les deux bits significatifs de son premier octet : le bit U/L (Extreme recommande une adresse administrée localement, premier octet `02`) et le bit I/G (une adresse de nœud doit être individuelle, et non de groupe).

## Utilisation

Collez un I-SID décimal, un nickname `X.XX.XX` ou une B-MAC en trois groupes séparés par des points. La détection se fait d’après la forme : il n’y a rien à sélectionner.

## Partage des résultats

Sous la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient l’identifiant tel que saisi (`#input=C.30.00`), et rien d’autre. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; un identifiant est bien plus court.
- **Ouverture d’un lien.** Le lien est la même adresse que celle qu’utilisent les autres liens vers cet outil : l’identifiant remplit le champ et est décodé comme lors d’une saisie. Comme pour tout lien vers cet outil, la valeur reste après le `#` jusqu’à ce que vous modifiiez ou effaciez le champ, puis quitte l’adresse sans aucune requête.
