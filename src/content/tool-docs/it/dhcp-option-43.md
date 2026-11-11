# Generatore dell’opzione DHCP 43

Indica l’indirizzo di un wireless controller e il vendor degli access point, e lo strumento restituisce il valore che quel vendor si aspetta davvero. Tutto viene eseguito nel browser; l’indirizzo non lascia mai la pagina.

## Perché non basta «convertire un IP in esadecimale»

La RFC 2132 definisce l’opzione 43 come *Vendor Specific Information* e ne lascia il contenuto a ogni vendor («The definition of this information is vendor specific»). Si limita a raccomandare una struttura: un vendor che inserisce più di un elemento nell’opzione dovrebbe codificarla come una sequenza di campi sotto-opzione, lunghezza e valore («SHOULD encode the option using 'Encapsulated vendor-specific options'»). Il significato delle sotto-opzioni, e il modo in cui vi si scrive un indirizzo, restano comunque una scelta del vendor. Il risultato è che un solo numero di opzione contiene almeno quattro codifiche incompatibili tra loro, e quando scegli quella sbagliata il guasto è del tipo peggiore: l’access point si avvia, ottiene un indirizzo, legge un valore che non riesce ad analizzare e semplicemente non si associa mai al controller. Nessun errore compare da nessuna parte.

Le quattro famiglie:

**TLV binario**: Cisco e UniFi. L’indirizzo viene inserito come quattro byte grezzi. `192.168.10.5` diventa `c0a80a05`.

**TLV ASCII**: RUCKUS. L’indirizzo viene inserito come *testo*, un byte per carattere, punti compresi. L’articolo 000008703 della knowledge base di RUCKUS formula la regola così: «For each number, the ASCII translation is “3” plus the number in decimal» e «For the “.” character, the ASCII code is “2e”»; il suo stesso esempio scrive `192.168.1.120` come `060d3139322e3136382e312e313230`: sotto-opzione `06`, lunghezza `0d` (13 caratteri), poi i 13 caratteri come testo. Quindi 10 scritto come byte binario è `0a`, ma scritto come testo è `31 30`. Sono valori diversi, e per un dato vendor ne funziona solo uno.

**Testo nella sotto-opzione 1**: ExtremeWireless. La guida al deployment di Extreme dichiara la sotto-opzione come `option HAP.HWC code 1 = text;` e il suo esempio riporta due controller in un solo valore, `"10.100.2.36, 10.100.2.22"`; lo strumento scrive quindi la sotto-opzione `01`, la lunghezza, poi gli indirizzi come testo separati da una virgola e uno spazio: quell’esempio diventa `011831302e3130302e322e33362c2031302e3130302e322e3232`.

**Stringa semplice**: Aruba. Nessun valore esadecimale. Il server DHCP invia l’indirizzo come testo, e un valore esadecimale qui è sbagliato, per quanto accuratamente sia stato costruito.

**Un’opzione del tutto diversa**: FortiAP. Legge l’indirizzo del controller dall’opzione 138, l’opzione CAPWAP per l’access controller («The FortiAP acquires the IP address of an AC in DHCP option 138 (the factory default)»). Fortinet documenta anche che si può usare un altro numero di opzione, se gli AP vengono configurati di conseguenza («If Option 138 is used for some other purpose on your network, you can use a different option number if you configure the AP units to match.»).

## Come si usa

Scegli prima il vendor. L’ordine è voluto: lo stesso indirizzo produce quattro risposte diverse, quindi non c’è alcun valore sensato da leggere finché il vendor non è stato scelto.

Inserisci l’IP di gestione del controller. Cisco ne accetta più di uno, separati da spazi o virgole, e li codifica nell’ordine; gli altri vendor ne accettano uno.

Il risultato mostra il valore e, per i vendor esadecimali, la sua composizione byte per byte (sotto-opzione, lunghezza, poi l’indirizzo), così puoi verificare il calcolo invece di fidarti. Più sotto ci sono le righe pronte da incollare per ISC dhcpd, Cisco IOS, Windows Server e MikroTik.

## Cosa ti dice che una casella esadecimale non può dirti

**Quando serve anche l’opzione 60.** Gli access point Aruba chiedono le informazioni specifiche del vendor solo quando il vendor class identifier corrisponde, quindi l’opzione 43 senza l’opzione 60 impostata su `ArubaAP` non ha alcun effetto. Anche ExtremeWireless richiede un VCI, che varia con la generazione dell’AP: i modelli più vecchi usano `HiPath` seguito dal nome del modello, quelli più recenti solo il modello.

**Quando la risposta non è esadecimale.** Per Aruba lo strumento restituisce una stringa e lo dice, perché restituire un valore esadecimale dall’aspetto plausibile sarebbe peggio che non restituire nulla.

**Quando stai chiedendo l’opzione sbagliata.** Per FortiAP restituisce l’opzione 138 e spiega perché.

## Condivisione dei risultati

Sotto il valore, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene l’indirizzo o gli indirizzi del controller così come li hai inseriti (`#input=192.168.1.10`). Il vendor non è nel link: il link si apre sul primo profilo, Cisco Wireless LAN Controller, e quando è scelto un altro vendor il riquadro a comparsa indica quale selezionare dopo averlo aperto. Prima che tu copi qualsiasi cosa, il riquadro a comparsa aggiunge un’avvertenza: l’indirizzo di gestione di un controller fa parte della topologia interna, quindi controllalo prima di inviare il link. Tutto ciò che il link contiene sta dopo il `#`, la parte che la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) separa dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): il browser non la invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un elenco di indirizzi è molto più corto.
- **Apertura di un link.** Il link è lo stesso indirizzo usato dagli altri link a questo strumento: gli indirizzi riempiono il campo e vengono codificati come se li avessi digitati. Come per ogni link a questo strumento, il valore resta dopo il `#` finché non modifichi o cancelli il campo, e poi sparisce dall’indirizzo senza che parta alcuna richiesta.

## API

Lo stesso motore risponde all’operazione `/api/v1/dhcp-option-43` dell’API HTTP del sito, descritta campo per campo nel contratto OpenAPI della [pagina API](/api), con esempi tratti dai vettori di test di riferimento (golden vectors). Il contratto indica anche se questo sito espone l’API.

- **Richiesta.** `{"vendor": "<id>", "addresses": "<addresses>"}`. Gli ID dei vendor sono `cisco-wlc`, `ruckus-zonedirector`, `ruckus-smartzone`, `unifi-ip`, `extreme-wireless`, `extreme-cloudiq-switch`, `aruba` e `fortiap`; gli indirizzi sono separati da spazi, virgole o punti e virgola.
- **Risposta.** `vendor` (il profilo usato: `encoding`, `subOption`, `addressForm`, `multiple`, `vendorClass`, `useOption` e `source`), `addresses`, `option` (43, o 138 per FortiAP), `encoding`, `hex` o `text`, `breakdown`, `serverSnippets` e `notes` (codici stabili).
- **Errori.** HTTP 400, `invalid_input`, con il messaggio del motore: nessun indirizzo, un vendor sconosciuto, un indirizzo che non è in rigorosa notazione decimale puntata a quattro ottetti, più di un indirizzo per un vendor che ne accetta uno, o un valore oltre i 255 byte.

Dal 19 ottobre 2026 `extreme-wireless` risponde con un valore esadecimale, con `addressForm` `ascii-list` e `multiple` true: `{"vendor": "extreme-wireless", "addresses": "10.100.2.36, 10.100.2.22"}` restituisce `011831302e3130302e322e33362c2031302e3130302e322e3232`. `source.access_date` e `source.unreachable` indicano quando è stata letta l’ultima volta la pagina di ciascun vendor, o perché non è stato possibile leggerla.

## Fonti

Ogni profilo di vendor è costruito dalla documentazione di quel vendor, e ogni vettore di test di riferimento cita un documento che ne riporta i byte, così come vi sono stampati. Un vettore prodotto dal codice sotto test e poi attribuito a un vendor dimostrerebbe solo che il codice è d’accordo con sé stesso, quindi nessun vettore è fatto così. Due valori vengono da fonti secondarie e sono indicati come tali: un esempio Cisco svolto, da un repository della community su Cisco Code Exchange, e un esempio RUCKUS da un post della community RUCKUS. La knowledge base di RUCKUS indica la sotto-opzione solo come «03 or 06»; l’assegnazione del 3 a ZoneDirector viene da un post della community RUCKUS, quindi il vettore ZoneDirector fissa solo i due byte che i documenti riportano.

- RFC 2132, sezione 8.4, Vendor Specific Information (consultata il 19/10/2026)
- Cisco, documento 97066, *Configure DHCP OPTION 43 for Lightweight Access Points*, aggiornato il 22 luglio 2026 (consultato il 19/10/2026)
- Cisco Code Exchange, README di cisco43calc di Brett Verney, un repository della community (fonte secondaria; consultato il 19/10/2026)
- Knowledge base di RUCKUS, articolo 000008703, *Understanding DHCP Option 43 Hexadecimal code in Ruckus*, aggiornato il 6 maggio 2020 (consultato il 19/10/2026)
- RUCKUS Networks Community, *How the APs discover the IP address of the controller* e *AP Discovery: How to configure DHCP option 43 to discover the controller*, post di membri del RUCKUS Team (fonte secondaria; consultati il 19/10/2026)
- Fortinet, *FortiWiFi and FortiAP Configuration Guide*: *Discovering, authorizing, and deauthorizing FortiAP units* (7.2.5) e *Advanced WiFi controller discovery* (8.0.1) (consultata il 19/10/2026)
- Ubiquiti, articolo di assistenza 204909754, *Layer 3 Adoption for Remote UniFi Controllers* (non è stato possibile consultarlo di nuovo il 19/10/2026: il sito ha risposto con una verifica anti-bot)
- Extreme Networks, *ExtremeCloud IQ Controller Deployment Guide*, e la guida utente di Fabric Engine per la sotto-opzione 226 (le pagine di ExtremeCloud IQ Controller sono state lette con HTTP 200 il 18/10/2026; il 19/10/2026 il sito della documentazione ha risposto 401 e non è stato possibile consultarle di nuovo)
- HPE Aruba Networking, opzioni DHCP per gli access point (non è stato possibile consultarle di nuovo il 19/10/2026: accesso negato)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link Condividi i risultati

## Un’omissione voluta

Aerohive non è tra le opzioni. È stata acquisita da Extreme nel 2019 e integrata in ExtremeCloud IQ, e non è stata trovata alcuna documentazione del vendor per una sotto-opzione Aerohive autonoma, solo affermazioni della community. L’unica sotto-opzione 226 documentata appartiene agli switch Fabric Engine che dialogano con ExtremeCloud IQ, una classe di dispositivi diversa che risponde a una domanda diversa. Un valore incollato nel DHCP di produzione è il posto peggiore in cui essere approssimativamente nel giusto, quindi finché non esiste una fonte del vendor, Aerohive resta fuori. Se hai quella documentazione, può essere aggiunta in un pomeriggio.
