## Ce que fait l’outil

Trois champs : une taille, un débit et une durée. Chacun s’explique seul ; deux d’entre eux donnent le troisième.

- **Une taille** (« 1,5 GB », « 700 MiB », « 10K », « 8 bits », « 2 kilooctets ») est restituée en nombre exact de bits et d’octets, en valeur dans chaque unité des deux conventions (bits avec préfixes SI et binaires, octets avec préfixes SI, octets avec préfixes CEI) et, quand l’étiquette était un préfixe SI appliqué à des octets, sous la forme de cette même étiquette lue dans les deux sens, avec l’écart entre les deux lectures.
- **Un débit** (« 100 Mbit/s », « 12,5 MB/s », « 1 Gbps », « 56k ») est restitué en bits et en octets par seconde, dans chaque unité de débit, et sous la forme de la quantité transférée en une minute, une heure et un jour.
- **Une durée** (« 90 s », « 2h 30min », « 1 day ») est lue exactement, à la milliseconde près. Les unités sont ms, s, min, h et d, ou leur nom en toutes lettres en anglais, en portugais, en espagnol, en allemand, en français ou en italien (seconds, minutes, hours, days ; segundos, minutos, horas, dias ou días ; Sekunden, Minuten, Stunden, Tage ; secondes, minutes, heures, jours, ou j pour un jour ; secondi, minuti, ore, giorni).
- **Deux des trois** donnent le troisième : la taille divisée par le débit donne la durée du transfert (avec sa décomposition), la taille divisée par la durée le débit obtenu, le débit multiplié par la durée la quantité transférée. Avec les trois, la durée est recalculée à partir de la taille et du débit.
- **L’efficacité** pondère le débit : un préréglage pour TCP sur IPv4 sur Ethernet, TCP sur IPv6, UDP sur IPv4, ou n’importe quel pourcentage.
- **Le tableau des liaisons** répond d’un coup à la question de la durée de transfert pour un ensemble de liaisons standard, avec l’efficacité choisie.

## Deux sortes de kilo

Les préfixes ont deux sens en informatique, et le calculateur les distingue par leur graphie, comme le font les normes :

- **Les préfixes SI sont décimaux.** k vaut 1000, M 1 000 000, et ainsi de suite ; un kilooctet (ko) vaut 1000 octets, un mégabit (Mbit) 1 000 000 bits. C’est le sens de ces préfixes partout ailleurs dans les sciences, et celui qu’emploient les fabricants de disques et d’équipements réseau.
- **Les préfixes binaires de la CEI (IEC) sont des puissances de 1024.** La CEI les a approuvés en décembre 1998 (IEC 60027-2 Amendment 2, publié en janvier 1999 ; aujourd’hui IEC 80000-13) : kibi Ki 2^10, mébi Mi 2^20, gibi Gi 2^30, tébi Ti 2^40, pébi Pi 2^50, exbi Ei 2^60. Un kibioctet (Kio) vaut 1024 octets ; un mébioctet (Mio), 1 048 576 octets. Le NIST précise que ces préfixes ne font pas partie du SI.
- **L’ancienne habitude.** Avant 1998, et encore dans certains logiciels, « Ko » et « Mo » désignaient 1024 et 1 048 576 octets. L’écart grandit avec le préfixe : 2,4 % pour kilo, 4,86 % pour méga, 7,37 % pour giga, 10 % pour téra, 12,6 % pour péta. Un disque de « 1 To » contient 1 000 000 000 000 octets, qu’un système comptant en puissances de 1024 affiche comme 931 Gio et peut étiqueter « 931 Go » ; il ne manque rien. Le calculateur affiche les deux lectures pour toute étiquette SI appliquée à des octets, pour que la question n’ait jamais à être débattue.

Lecture de l’entrée :

- `b` désigne un bit et `B` un octet ; `bit`, `bits`, `byte`, `bytes` et `octet` sont acceptés, ainsi que les préfixes écrits en toutes lettres (kilobyte, mebibit).
- `k`, `K`, `M`, `G`, `T`, `P`, `E`, `Z` sont décimaux ; `Ki`, `Mi`, `Gi`, `Ti`, `Pi`, `Ei`, `Zi` sont binaires.
- Un préfixe seul, sans unité (`10K`, `1.5M`), est lu comme une puissance de 1024 appliquée à des octets, à la manière dont `ls -h` et `du -h` affichent les tailles (la page de manuel GNU de ls : K, M, G, T, P, E, Z, Y, R, Q sont des puissances de 1024, KB, MB et ainsi de suite des puissances de 1000, et KiB équivaut à K) ; le résultat le signale.
- `Kb`, `Mb`, `Gb` (un préfixe en majuscule suivi d’un b minuscule) sont lus comme des bits, ce que dit le symbole, et signalés, car certaines fiches produit écrivent ainsi des octets.
- Un débit est une taille suivie de `/s` ou de `ps` : `Mbit/s`, `MB/s`, `Mbps`, `kbps`. Un `56k` seul, en guise de débit, vaut 56 000 bit/s.
- La virgule ou le point sert de séparateur décimal à la saisie (`1,5 GB` et `1.5 GB` désignent la même taille) ; les résultats s’affichent avec le séparateur de la langue de la page.

## Préréglages d’efficacité

Le débit nominal d’une liaison compte chaque bit transmis sur le fil. La charge utile avance moins vite, car chaque trame porte des en-têtes, un préambule et un intervalle. Pour des trames pleines de 1500 octets :

| Préréglage | Charge utile par trame | Sur le fil par trame | Efficacité |
|---|---|---|---|
| TCP sur IPv4 sur Ethernet | 1500 − 20 (IPv4) − 20 (TCP) = 1460 | 1500 + 14 + 4 + 8 + 12 = 1538 | 94,93 % |
| TCP sur IPv6 sur Ethernet | 1500 − 40 (IPv6) − 20 (TCP) = 1440 | 1538 | 93,63 % |
| UDP sur IPv4 sur Ethernet | 1500 − 20 (IPv4) − 8 (UDP) = 1472 | 1538 | 95,71 % |

Les tailles minimales d’en-tête viennent de la RFC 791 (IPv4, 20 octets), de la RFC 8200 (IPv6, 40 octets, que sa section 8.3 présente comme 20 octets de plus que l’en-tête IPv4 minimal), de la RFC 9293 (TCP, 20 octets) et de la RFC 768 (UDP, 8 octets). Le surcoût de trame vient de l’annexe B de la RFC 2544, « Maximum frame rates reference » : « Preamble 64 bits, Frame 8 x N bits, Gap 96 bits », N étant la trame avec son en-tête de 14 octets et son FCS de 4 octets ; les 812 trames de 1518 octets par seconde à 10 Mb/s que donne la même annexe correspondent à 10 000 000 / (1538 × 8), et le vecteur de référence `rfc2544-frame-time` le reproduit. Ces préréglages sont des plafonds : un vrai transfert TCP consomme aussi de la capacité en acquittements, en démarrage lent (slow start) et en retransmissions.

## Le tableau des liaisons

| Liaison | Débit nominal | Source |
|---|---|---|
| Modem 56k | 56 000 bit/s en voie descendante | ITU-T V.90 (09/98) |
| RNIS (ISDN), un canal B | 64 kbit/s | le tableau du calculateur de 2004 |
| T1 | 1544 kbit/s | ITU-T G.704 (10/98) |
| E1 | 2048 kbit/s | ITU-T G.704 (10/98) |
| Ethernet de 10 Mb/s à 400 Gb/s | 10, 100, 1000 Mb/s ; 2,5 Gb/s, 5, 10, 25, 40, 100, 400 Gb/s | IEEE 802.3-2022 |

Les lignes marquées 2004 figuraient dans le tableau des liaisons du calculateur de bits et d’octets de nutzmann.net en 2004 et de ntz.com.br en 2013, le plus ancien ancêtre des outils de ce site. Son exemple commenté est repris par le bouton Exemple : un fichier « 56k » sur un modem « 56k » met environ 8,2 secondes, et non une, car le fichier fait 56 Kio (57 344 octets, 458 752 bits) et le modem transfère 56 000 bits par seconde : 8,192 s exactement.

## Exactitude

Chaque quantité est conservée sous la forme d’une mantisse entière et d’une puissance de dix, et chaque débit et chaque durée sous la forme d’un rapport de deux tels nombres : rien n’est arrondi avant l’affichage. Les valeurs affichées gardent jusqu’à six décimales ; une valeur dont la forme exacte ne se termine pas (un tiers de seconde) est signalée comme arrondie. Les durées sont décomposées en jours, heures, minutes, secondes et millisecondes, arrondies à la milliseconde (demi vers le haut), et le total est aussi donné en secondes avec six décimales. Un zettaoctet exprimé en bits s’écrit en entier.

## Partage des résultats

Sous la première réponse, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les champs que vous avez remplis, tels que vous les avez saisis : `size`, `rate`, `time` et `eff` (l’efficacité, un préréglage ou un pourcentage), par exemple `/tools/bits-bytes#size=56+KiB&rate=56+kbit%2Fs`. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les valeurs ne sont donc pas envoyées au serveur à l’ouverture du lien ; elles restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Ouverture d’un lien.** Les quatre champs sont réglés ensemble, un champ absent étant vidé, pour que le résultat soit celui de l’expéditeur ; la page calcule. Une valeur plus longue que ce que son champ peut contenir fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
- **Liens venant d’autres pages.** Une taille transmise sous la forme `#input=` remplit toujours le champ de taille exactement comme avant ; Partager les résultats utilise ses propres noms, et les deux ne se mélangent jamais.

## Limites

- Ne sont pas modélisés : les fenêtres TCP et le temps aller-retour, les pertes, la compression, ni l’écart entre le débit nominal d’une liaison et ce que livre réellement un fournisseur d’accès. Les préréglages d’efficacité sont des plafonds par trame.
- Le calculateur indique ce que signifie une étiquette dans chaque convention. La convention qu’utilise un système d’exploitation donné pour afficher les tailles relève de la documentation de ce système ; le calculateur ne prétend pas la connaître.
- Chaque champ est tronqué à 64 caractères et lu par une seule expression ancrée ; l’arithmétique repose sur BigInt, si bien qu’aucune valeur ne déborde.

## Sources

- [NIST: Prefixes for binary multiples](https://physics.nist.gov/cuu/Units/binary.html) (consulté le 04/10/2026)
- [ls(1), GNU coreutils (man7.org)](https://man7.org/linux/man-pages/man1/ls.1.html) (consulté le 04/10/2026) : -h, --si et l’argument SIZE
- [RFC 2544, Appendix B, Maximum frame rates reference](https://www.rfc-editor.org/rfc/rfc2544.html#page-22) (consultée le 26/10/2026)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791) (consultée le 04/10/2026)
- [RFC 8200: IPv6, section 8.3](https://www.rfc-editor.org/rfc/rfc8200.html#section-8.3) (consultée le 04/10/2026)
- [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293) (consultée le 04/10/2026)
- [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768) (consultée le 04/10/2026)
- [ITU-T V.90 (09/98)](https://www.itu.int/rec/T-REC-V.90/en) (consulté le 04/10/2026)
- [ITU-T G.704 (10/98)](https://www.itu.int/rec/T-REC-G.704/en) (consulté le 04/10/2026)
- [IEEE 802.3-2022](https://standards.ieee.org/ieee/802.3/10422/) (consulté le 04/10/2026)
- [nutzmann.net, Calculadora de bits e bytes (2004), Internet Archive](https://web.archive.org/web/20041009131549/http://nutzmann.net:80/bitsandbytes.htm) (consulté le 04/10/2026) : l’exemple commenté du calculateur de 2004, sa note sur la CEI et son tableau des liaisons
- [ntz.com.br, Calculadora e conversão de bits e bytes (2013), Internet Archive](https://web.archive.org/web/2013/http://ntz.com.br/bitsandbytes.html) (consulté le 04/10/2026) : le même calculateur sur le site de 2013, avec son tableau des préfixes CEI
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
