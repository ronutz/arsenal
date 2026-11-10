## Ce que fait l’outil

Indiquez une série de modèles ou le nom d’un système d’exploitation : l’outil vous dit quelle dénomination s’applique, à partir de quelles versions le changement de nom a eu lieu et ce qui accompagne cette série en particulier. Les deux paires de noms sont affichées **avant toute saisie**, car la personne qui arrive après avoir lu un nom dans un document et un autre sur son commutateur a besoin de la réponse tout de suite.

## Le changement de nom, en une ligne chacun

- **ExtremeXOS (EXOS) → Switch Engine**, à partir de la 31.6
- **VOSS → Fabric Engine**, à partir de la 8.6

Les deux ne s’appliquent **qu’au matériel Universal** : 4120, 4220, 5320, 5420, 5520, 5720, 7520, 7720. Tout le reste garde les noms d’origine, et **les noms des fichiers d’image et les menus de démarrage les utilisent encore aussi** : un menu de démarrage qui propose de passer l’OS « to VOSS » sur un commutateur Fabric Engine n’est donc ni un bug ni un build périmé.

## L’avertissement toujours donné

**Changer de persona supprime la configuration.** Selon les termes d’Extreme, changer de système d’exploitation réseau supprime l’ensemble des fichiers de configuration, des informations de débogage, des journaux, des évènements et des statistiques du précédent. **C’est une reconstruction, pas une migration**, et l’outil le dit à chaque recherche, et pas seulement quand un modèle est reconnu.

Il signale aussi que la question posée au démarrage choisit Switch Engine par un non : à la question « Would you like to change the switch OS to VOSS? [y/N/q] » ([notes de version de Switch Engine 33.1.100](https://documentation.extremenetworks.com/release_notes/SwitchEngine/33.1.100/GUID-EEE4A4A1-99DC-4691-B6B5-F88A6FA8042F.shtml), consultées le 09/11/2026), **N conserve Switch Engine, y passe à Fabric Engine**.

## Particularités de série signalées

- **7520** : l’empilement (stacking) fonctionne sous Switch Engine et **pas** sous Fabric Engine. Si l’architecture a besoin de l’empilement, le choix de persona est déjà fait.
- **5420 et 5520** : la mise à niveau vers Switch Engine 31.6 **change le SysObjectID SNMP** ; une supervision qui identifie l’équipement par cette valeur cesse donc de le reconnaître, sans que rien ne paraisse anormal depuis la console.
- **Les versions minimales de Fabric Engine diffèrent** : 8.6 sur les 5320, 5420 et 5520 ; 8.7 sur le 5720.

## Ce que l’outil ne fait pas

Il travaille au niveau de la série plutôt qu’à celui de la référence individuelle, délibérément : la question de dénomination se tranche par série, et une table de références (SKU) se périmerait plus vite qu’elle ne rendrait service. Il ne connaît ni votre inventaire ni vos versions installées.

## Partage des résultats

Sous la réponse, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la série de modèles ou le nom du système d’exploitation tel que saisi (`input`), et rien d’autre. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les deux paires de noms et la liste des familles font partie de la page elle-même : elles ne sont donc pas dans le lien.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le nom n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le nom remplit la zone comme lors d’une saisie, et la page lui applique la correspondance ; rien n’est envoyé. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
