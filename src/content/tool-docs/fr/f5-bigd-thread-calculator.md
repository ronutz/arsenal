## Ce que fait l’outil

BIG-IP 21.1 a reconstruit bigd, le démon des moniteurs de santé, sous la forme d’une instance unique multithread capable de prendre en charge jusqu’à 15 000 moniteurs du plan de contrôle, et a documenté précisément la façon dont le nombre de threads automatique est déduit du nombre de vCPU. Cet outil reprend mot pour mot ces deux formules : saisissez un nombre de vCPU et le type de système, et il renvoie le nombre de threads que le système en déduirait, le plafond du réglage manuel bigd.numprocs et le plafond de moniteurs. Un nombre seul calcule les deux formules côte à côte.

## Les deux formules

Pour les systèmes avec hyperthreading, les notes de version de F5 indiquent `Number of BigD Threads = (Number of vCPUs × 6) ÷ 10`, au motif que les cœurs HT tournent à environ 60 % des performances d’un vrai cœur. Pour les systèmes normaux (sans HT), la formule est `Number of BigD Threads = (Number of vCPUs ÷ 2) − 1`. Quand une formule donne un résultat fractionnaire (8 vCPU avec hyperthreading donnent 4,8), les notes de version n’indiquent aucune règle d’arrondi : l’outil affiche donc à la fois la valeur exacte et sa partie entière en threads, et le dit clairement. À 2 vCPU, le résultat exact de la formule normale est 0 ; bigd s’exécute pourtant, lisez donc ce cas limite comme un multithreading minimal, et non comme une absence.

## Le réglage manuel et le plafond

La variable db `bigd.numprocs` fixe manuellement le nombre de threads, mais elle est plafonnée au nombre de vCPU disponibles ; sa valeur par défaut, 0, signifie un calcul automatique selon les formules ci-dessus. Le démon multithread prend en charge jusqu’à 15 000 moniteurs du plan de contrôle. Pour le dimensionnement, les notes de la 21.0 de F5 recommandent de maintenir bigd à 5000 instances de moniteurs au plus et, au-delà, de passer aux moniteurs In-TMM, qui montent jusqu’à 25 000 avec une allocation extramb de 8 Go.

## Plateformes avec hyperthreading

Le choix de la formule est une caractéristique de la plateforme, et la documentation des plateformes de F5 elle-même le tranche. Sur rSeries, la famille se divise en deux : les appliances de milieu et de haut de gamme (r5000, r10000 et la famille r12000 dans les tableaux de dimensionnement de F5) utilisent l’hyperthreading, chaque cœur Intel apparaissant comme deux vCPU, tandis que les r2000 et r4000 utilisent une classe de processeur sans hyperthreading et ne sont comptés qu’en cœurs physiques. VELOS utilise l’hyperthreading sur ses deux types de lames : les vCPU d’un tenant sont des hyperthreads, deux par cœur physique, et les tenants BIG-IP utilisent la répartition HT-Split (K15003), dans laquelle TMM prend un hyperthread de chaque cœur. iSeries et VIPRION comptent eux aussi les vCPU en hyperthreads dans le vocabulaire de dimensionnement de F5, mais aucun des deux n’exécute BIG-IP 21.x : pour eux, l’outil n’affiche la correspondance qu’à titre d’information. Virtual Edition hérite de ce qu’expose l’hyperviseur : vérifiez dans l’invité (`lscpu`, Thread(s) per core) et choisissez la formule correspondante.

Saisissez directement la plateforme : `8 r10900` sélectionne la formule avec hyperthreading, `16 r4800` la formule normale, `22 velos` celle avec hyperthreading, `8 ve` affiche les deux avec la remarque invitant à vérifier l’hôte. Un mot explicite `ht` ou `normal` l’emporte toujours sur la valeur par défaut de la plateforme, pour le cas où l’hyperthreading a été désactivé dans le firmware.

## Exemples commentés

`8 ht` donne 4,8 en valeur exacte, soit 4 threads entiers. `10 ht` tombe juste, à 6. `16 normal` donne 7. `40 ht` donne 24. `6` seul affiche les deux : 3,6 (partie entière 3) avec hyperthreading, 2 en normal.

## Partage des résultats

Sous les deux formules, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la ligne telle que saisie : `/tools/f5-bigd-thread-calculator#input=8%20r10900`. Un nombre de vCPU et une plateforme ne nomment rien de votre réseau. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la ligne n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Une ligne de quelques mots, bien en deçà des 16 384 caractères que le site autorise après le `#`.
- **Ouverture d’un lien.** La ligne remplit le champ comme lors d’une saisie, et la page calcule. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Provenance

Les formules, le comportement du plafond et la limite de 15 000 sont repris mot pour mot des notes de version « New Features in BIG-IP Version 21.1.0 » de F5 (BigD enhancements for large-scale configurations), récupérées le 08/07/2026 ; la recommandation des 5000 instances et les chiffres In-TMM proviennent de leur équivalent pour la 21.0.0. Le nombre de threads réel du système en fonctionnement fait toujours foi.
