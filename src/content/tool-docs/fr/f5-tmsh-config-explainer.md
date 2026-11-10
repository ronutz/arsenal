## Ce que fait l’outil

Collez un extrait du `bigip.conf` d’un BIG-IP : l’outil l’analyse et explique chaque objet en langage clair, ainsi que la structure qui les relie. Il ne fait que lire la configuration, entièrement dans votre navigateur ; il ne modifie rien et ne contacte aucun équipement.

## La forme d’une configuration BIG-IP

BIG-IP stocke sa configuration sous forme d’objets tmsh, qui suivent tous une même forme :

    <module> <component> [<type>] <name> {
        <key> <value>
        <key> { <nested body> }
        <bare-list-item>
    }

Les premiers mots placent l’objet dans la hiérarchie des modules et des composants de BIG-IP (`ltm virtual`, `ltm pool`, `net vlan`, etc.), le nom l’identifie, et les accolades contiennent ses champs. À l’intérieur d’un corps, les sauts de ligne séparent les entrées, les blocs entre accolades peuvent s’imbriquer à n’importe quelle profondeur, les chaînes entre guillemets peuvent contenir des espaces, et un `#` commence un commentaire. Une séquence avec barre oblique inverse entre guillemets s’affiche telle qu’elle est écrite : la chaîne send d’un moniteur contient `\r\n`, et le BIG-IP ne transforme chaque `\r` en retour chariot et chaque `\n` en saut de ligne qu’au moment où il met en forme la requête ([F5 K2167](https://my.f5.com/manage/s/article/K2167), consulté le 27/10/2026). L’outil suit exactement cette grammaire pour découper un extrait en objets, et chaque objet en champs.

## Ce que l’outil explique

Plutôt que de vous laisser reconnaître chaque champ, l’outil décrit ce que signifient les objets et les paramètres courants : `destination`, `pool`, `profiles` et `source-address-translation` d’un serveur virtuel ; `members`, `monitor` et `load-balancing-mode` d’un pool ; et les nombreux autres objets qu’une configuration relie entre eux. Le résultat est une carte lisible de ce que fait réellement une configuration, utile quand vous héritez d’un équipement, relisez un changement ou apprenez le modèle objet.

## La seule chose qui n’est pas du tmsh

Il existe une exception délibérée. Un objet `ltm rule` porte une iRule Tcl dans son corps, et ce corps est un script, pas de la configuration tmsh. L’analyseur le reconnaît et capture l’iRule telle quelle au lieu d’essayer de la découper en objets et en champs : votre règle est ainsi conservée exactement telle qu’elle est écrite au lieu d’être déformée.

## Utilisation

Collez un extrait de `bigip.conf`, d’un seul objet à un grand bloc, et lisez la décomposition structurée et expliquée. L’analyse est déterministe et locale : c’est donc aussi un moyen sûr de lire une configuration exportée d’un équipement que vous ne pouvez pas, ou ne devez pas, interroger directement.

## Partage des résultats

Sous le résumé de ce qui a été trouvé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la configuration avec la valeur de chaque paramètre secret remplacée par `[redacted]`, jamais telle que collée, car cette page affiche la valeur de chaque champ. Sa fenêtre contextuelle indique d’abord ce que contient le lien et combien de valeurs ont été remplacées, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les paramètres concernés sont `password` (les moniteurs ; [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html) le décrit comme le mot de passe exigé par la cible surveillée, « the password if the monitored target requires authentication »), `passphrase` ([client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), server-ssl, sys file ssl-key), `secret` ([auth radius-server](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_radius-server.html), auth tacacs, ltm monitor radius), `bind-pw` ([auth ldap](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_ldap.html)), `preshared-key` ([net ipsec ike-peer](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/net/net_ipsec_ike-peer.html)), les `community-name`, `community` et `trap-community` SNMP ([sys snmp](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_snmp.html)), et tout paramètre dont le nom se termine par `-password`, `-passphrase` ou `-secret` (`encrypted-password`, `auth-password`, `privacy-password`, [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html), [`encrypt-cookie-secret`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_http.html), `proxy-ca-passphrase`) ; pages de la référence tmsh de F5, consultées le 27/10/2026. La chaîne `send` d’un moniteur conserve son texte, à l’exception des identifiants d’un en-tête `Authorization` ou `Proxy-Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2, consultée le 27/10/2026), qui deviennent eux aussi `[redacted]`. `none` est conservé. `[redacted]` est un seul mot tmsh : la copie se lit donc comme les mêmes objets, champs et imbrications, et les vecteurs de partage de l’outil vérifient que la page qui reçoit le lien analyse le même arbre. Les noms, les adresses et les partitions partent tels que collés.

Le corps d’une iRule (`ltm rule`) est du Tcl, affiché ici tel quel, et il part tel que collé : quand la configuration en contient une, la fenêtre contextuelle le signale, pour que vous puissiez d’abord vérifier qu’elle ne contient pas de jeton ni de mot de passe codé en dur. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme le ferait un collage, et la page l’explique. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Outils associés

- Un moniteur Scripted (`ltm monitor scripted`) rejoue un fichier de lignes send et expect conservé dans `/config/eav/` ; l’[analyseur de moniteurs Scripted BIG-IP](/tools/bigip-scripted-monitor-explainer) lit ce fichier et simule le contrôle face à la transcription d’un serveur.
- Pour collecter la configuration d’un BIG-IP par script, le [générateur de scripts Expect](/tools/expect-script-builder) écrit un script de connexion et d’exécution avec un profil tmsh, qui désactive la pagination de tmsh avec `modify /cli preference pager disabled display-threshold 0`.
