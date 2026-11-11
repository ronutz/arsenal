## Cosa fa

Incolla codice, configurazione o output del terminale e ottieni un’immagine da mettere in una slide, in un ticket o in un documento: un SVG che mantiene il codice come testo vero e selezionabile e un PNG a 1x o 2x, con il testo alternativo pronto da incollare accanto. Scegli il linguaggio per l’evidenziazione, una tavolozza scura o chiara, la dimensione del carattere, le tabulazioni, i numeri di riga, una cornice in stile finestra con un titolo facoltativo, il margine interno e le righe da evidenziare.

Prima che venga creata qualsiasi immagine, un controllo dei segreti cerca i valori che potresti non voler pubblicare, come chiavi private, intestazioni Authorization, ID delle chiavi di accesso AWS, JWT, password negli URL, valori FortiOS `ENC` e attributi password o secret. Ogni rilievo viene elencato e mascherato nell’immagine, a meno che tu non lo deselezioni. Tutto viene eseguito nel tuo browser.

Dove il mezzo su cui scrivi può mostrare testo, preferisci il testo. Il criterio di successo 1.4.5 delle [WCAG 2.2](https://www.w3.org/TR/WCAG22/), Images of Text, chiede testo anziché immagini di testo ogni volta che la tecnologia può presentarlo; un blocco di codice delimitato in un wiki, in una knowledge base o in un sistema di ticket che lo visualizza è testo, e chi legge può copiarlo. Questo strumento è per i luoghi che non possono mostrarlo, e il testo alternativo che scrive è il codice stesso. [Code on slides and in tickets](/learn/code-on-slides-and-in-tickets) affronta questa scelta, il testo alternativo, il contrasto e i segreti che uno screenshot conserva.

## Linguaggi

Solo evidenziazione: nulla viene analizzato, convalidato o eseguito, e il codice non valido nel linguaggio scelto viene comunque disegnato, colorato fin dove arrivano le regole qui sotto. Le regole di ogni linguaggio vengono dal suo riferimento ufficiale, consultato il 27 ottobre 2026.

| Linguaggio | Cosa viene colorato | Riferimento |
|---|---|---|
| Testo semplice | Nulla | |
| Shell (POSIX sh) | commenti `#` solo dove potrebbe iniziare una parola (quindi `a#b` non lo è); virgolette singole, doppie e dollaro-singole; `$name`, `${...}`, `$1`, `$@` e gli altri parametri speciali, attivi dentro le virgolette doppie; le parole riservate `if then else elif fi do done case esac while until for in` dove sono riservate; il nome di un’assegnazione come `LOG=...`; le parole che sono numeri interi | [POSIX.1-2024 Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html), sezioni da 2.2 a 2.6 |
| Python | commenti `#`; stringhe con ogni prefisso (`b`, `r`, `u`, `f`, `t` e le combinazioni con `r`, maiuscole o minuscole), stringhe tra triple virgolette su più righe; le 35 parole chiave; le parole chiave soft `match`, `case`, `type` e `lazy` quando aprono un’istruzione; letterali interi, in virgola mobile e immaginari con trattini bassi e `0x`, `0o`, `0b` | [Python 3.15 Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), l’attuale release di bugfix (fine del ciclo di vita a ottobre 2031, [Status of Python versions](https://devguide.python.org/versions/)) |
| JSON | nomi dei membri (una stringa seguita da `:`) come chiavi; stringhe; numeri; `true`, `false`, `null`. JSON non ha commenti, quindi `//` non viene colorato | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) |
| YAML | commenti `#` dopo spazi bianchi; direttive `%`; `---` e `...`; chiavi delle mappature; scalari tra virgolette doppie e singole, anche su più righe; anchor, alias e tag; null, booleani, interi e numeri in virgola mobile dello schema core; il contenuto degli scalari a blocco `\|` e `>` | [YAML 1.2.2](https://yaml.org/spec/1.2.2/), sezioni 5.3, 6.6, 6.8, 6.9, 7.3, 8.1, 9.1.2 e 10.3.2 |
| Tcl, iRules, Expect | commenti `#` solo dove inizia un comando (quindi `;#` dopo un comando lo è); parole tra virgolette doppie con `$` e `[...]` attivi; `$name`, `${name}`, `$name(index)`; la prima parola di un comando quando è un comando integrato di Tcl, `when` o un comando di Expect; `then`, `elseif`, `else`; i numeri come li legge `expr`; il nome dell’evento dopo `when`. Le parole tra parentesi graffe vengono colorate come script, perché i corpi di `proc`, `if`, `when` ed `expect` sono script | [Tcl 9.0 Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html); le iRule sono [basate su Tcl](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) e iniziano con [`when`](https://clouddocs.f5.com/api/irules/when.html); i comandi di Expect da [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) |
| F5 tmsh | prompt; commenti `#` all’inizio di una parola; stringhe tra virgolette; i comandi e i moduli radice (`auth cli gtm ltm net sys wom`) fuori dalle parentesi graffe; i nomi degli attributi all’inizio di una riga dentro un oggetto; indirizzi e numeri | [TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/general/tmsh.html) e i suoi [comandi](https://clouddocs.f5.com/cli/tmsh-reference/latest/commands/index.html) |
| FortiOS CLI | prompt; una riga che inizia con `#` e non è un prompt (come la prima riga di un backup); stringhe tra virgolette singole e doppie con `\'`, `\"` e `\\`; `config`, `edit`, `set`, `unset`, `next`, `end` e gli altri comandi; il nome del campo dopo `set`; `ENC`; `$USERFROM`, `$USERNAME`, `$SerialNum`; indirizzi e numeri | [FortiOS 7.6.8 CLI basics](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics), [Command syntax](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/508024/command-syntax), [Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands) |
| CLI in stile Cisco | prompt (`Router>`, `Router#`, `Router(config)#`, `Router(config-if)#`, con o senza uno spazio dopo); commenti `!`; `no` e `default` e alcuni comandi documentati all’inizio di una riga; indirizzi, maschere e numeri. La CLI di Cisco non ha una regola generale per le virgolette, quindi nulla viene colorato come stringa | [IOS XE 17.x Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) («Precede a comment with an exclamation point»), [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html), [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html) |

Cosa non fanno gli evidenziatori: gli here-document della shell, le sostituzioni di comando annidate dentro le virgolette doppie, i campi di sostituzione delle f-string di Python (l’intera f-string viene colorata come stringa), gli scalari flow di YAML su più righe e tutto ciò che richiede un parser anziché uno scanner.

### Sessioni di terminale

Per la shell, Python e Tcl, un testo in cui una qualsiasi riga inizia con il prompt di quel linguaggio viene letto come una sessione. I prompt sono `$ ` (il valore predefinito di `PS1` in POSIX) e il prompt bash di BIG-IP `[root@bigip-1:Active:Standalone] config # ` per la shell, `>>> ` e `... ` (`sys.ps1` e `sys.ps2` di Python) per Python, e `% ` (tclsh) per Tcl. Le righe con un prompt vengono evidenziate come comandi, unite alla riga con prompt successiva così una stringa può continuare, e le righe senza prompt sono output dei comandi, lasciato senza colori, quindi un apostrofo nell’output non apre alcuna stringa. La pagina segnala quando ha letto il testo in questo modo.

Per tmsh, FortiOS e la CLI in stile Cisco i prompt vengono colorati e ogni riga viene evidenziata, perché il loro output è di solito configurazione.

## Il controllo dei segreti

Viene eseguito sul testo qualunque sia il linguaggio scelto, prima che venga disegnato qualcosa. Ogni regola è presa dalla documentazione del formato che cerca:

| Regola | Cosa cerca | Cosa viene mascherato | Fonte |
|---|---|---|---|
| Chiave privata PEM | un blocco `-----BEGIN ... PRIVATE KEY-----`: `PRIVATE KEY`, `ENCRYPTED PRIVATE KEY`, il tradizionale `RSA PRIVATE KEY` di OpenSSL (con le intestazioni `Proc-Type` e `DEK-Info`) e `OPENSSH PRIVATE KEY`; anche un blocco scritto su una riga con escape `\n` | ogni riga tra i delimitatori (le righe dei delimitatori restano); senza una riga END, le righe che sembrano base64 | [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468) sezioni 2, 3, 10, 11; [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/); [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c) |
| Intestazione Authorization | `Authorization:` o `Proxy-Authorization:` con `Bearer` o `Basic`, in maiuscolo o minuscolo | le credenziali | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) 5.1, 11.1, 11.4, 11.6.2; [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) 2.1; [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) 2 |
| ID della chiave di accesso AWS | `AKIA` (chiave di accesso) o `ASIA` (chiave STS temporanea) seguito da 16 lettere maiuscole o cifre, non all’interno di una parola più lunga | l’ID | [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html); [chiavi di accesso](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) |
| JWT | tre (JWS) o cinque (JWE) segmenti base64url uniti da punti, il cui primo segmento si decodifica in un oggetto JSON con `alg` | il token | [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) 2, 4.1.1, 7.1; [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516) 4.1.1, 7.1; [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) 1 |
| Password in un URL | `scheme://user:password@` | la password | [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) 3.2.1 |
| Valore cifrato FortiOS | `set <field> ENC <value>` | il valore | [Suggerimento tecnico Fortinet](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) (`set psksecret ENC ...`) |
| Comando set | `set <name> <value>` con un nome che sembra un segreto: campi FortiOS e variabili Tcl (script Expect, iRule) | il valore, dentro le sue virgolette o parentesi graffe | [FortiOS Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands); [Tcl set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html) |
| Attributo password, passphrase o secret | in tmsh `password`, `passphrase`, `encrypted-password`, `proxy-ca-passphrase`; in Cisco `password` e `secret` con una cifra di tipo facoltativa | il valore | tmsh [auth user](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_user.html), [sys file ssl-key](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_file_ssl-key.html), [ltm profile client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html); [password in Cisco IOS XE 17.18](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html) |
| Membro JSON | `"name": "value"` con un nome che sembra un segreto | il valore | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) 4, 7; [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) 5.1 (`access_token`, `refresh_token`) |
| Chiave YAML | `name: value`, a blocco o flow, con un nome che sembra un segreto | il valore | [YAML 1.2.2](https://yaml.org/spec/1.2.2/) 7.3, 7.4, 8.2.2 |
| Assegnazione shell | `NAME=value` con un nome che sembra un segreto, anche nella query string di un URL | il valore | [POSIX](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html) 2.10.2; il [file delle credenziali dell’AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) usa la stessa forma |
| Assegnazione | `name = "string"` (Python e file in stile TOML o INI) con un nome che sembra un segreto | il contenuto della stringa | [istruzioni di assegnazione di Python 3.15](https://docs.python.org/3/reference/simple_stmts.html) |

**Un nome che sembra un segreto** è una regola propria dello strumento, non uno standard: l’ultima parola del nome (divisa in corrispondenza di trattini bassi, trattini, punti e camelCase) è password, passwd, pass, passphrase, secret, token, psk, psksecret, apikey, accesskey, secretkey, privatekey, credential o credentials, oppure il nome termina con key dopo api, access, private, secret, signing, client, auth, encryption, master o session. Quindi `DB_PASSWORD`, `client_secret`, `refresh_token`, `apiKey` e `aws_secret_access_key` sembrano segreti, mentre `password_file`, `token_type`, `sort_key` e `PWD` (la directory di lavoro della shell) no.

**Non vengono segnalati:** un valore vuoto; un segnaposto o un’impostazione (`none`, `null`, `true`, `false`, `enable`, `disable` e simili); un riferimento che sta al posto del valore, come `$VAR`, `${VAR}`, `$(cmd)`, `$env(PW)`, un `[command]` di Tcl, `{{ template }}` o `<placeholder>`; un valore già mascherato con `*`, `x` o pallini; un valore senza alcuna lettera o cifra. Un hash in stile crypt come `$6$salt$hash` o il `$9$...` di Cisco non è un riferimento e viene segnalato. Un attributo password, passphrase o secret dentro un commento non viene segnalato, perché nei commenti quelle parole compaiono come testo normale; tutte le altre regole cercano anche nei commenti. Quando due regole trovano gli stessi caratteri, viene mantenuta quella più specifica (un JWT in un’intestazione Bearer è un solo rilievo).

**Mascheramento.** Un valore mascherato viene sostituito da otto pallini, qualunque sia la sua lunghezza, così l’immagine non mostra quanto era lungo. I caratteri stessi vengono sostituiti, non coperti: non sono né nel testo dell’SVG, né nel PNG, né nel testo alternativo, dove il valore si legge «[mascherato]». Deseleziona un rilievo per mostrarlo così com’è scritto; la scelta viene ricordata per regola, riga e colonna mentre modifichi altrove.

**Non è uno scanner completo.** Conosce i formati elencati sopra e nient’altro, non distingue un segreto vero da un esempio, e un segreto che non cerca resta nell’immagine. Leggi l’immagine prima di pubblicarla.

I segreti di sessione nell’output di `openssl s_client` sono un esempio: nessuna regola li cerca, quindi una riga TLS 1.3 `Resumption PSK:` viene disegnata così come è stampata, e una riga TLS 1.2 `Master-Key:` viene mascherata solo perché ha la forma di una chiave YAML con un nome che sembra un segreto. L’[Analizzatore di openssl s_client](/tools/openssl-s-client-explainer) li elenca entrambi tra i suoi rilievi.

## Come viene creata l’immagine

Il motore impagina l’immagine una sola volta (ogni rettangolo, punto e sequenza di testo con la sua posizione e il suo colore) ed entrambi i file derivano da quell’impaginazione, quindi non possono essere in disaccordo.

- **Carattere e griglia.** JetBrains Mono, il carattere monospazio del sito, con la [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/). Le sue metriche, lette dal file del carattere: 1000 unità per em, ogni carattere largo 600 unità, ascendente 1020, discendente 300. Una colonna è 0,6 volte la dimensione del carattere, una riga è 1,5 volte la dimensione del carattere arrotondata a un pixel intero, e il testo sta al centro della sua riga. Una colonna per code point: le tabulazioni si espandono alle posizioni che scegli, e i caratteri più larghi in alcuni font (molti caratteri dell’Asia orientale ed emoji) occupano comunque una colonna, quindi possono sovrapporsi al carattere vicino.
- **L’SVG** mantiene ogni riga come un unico elemento `<text>` di testo vero, colorato con elementi `<tspan>`, e assegna a ogni carattere la propria posizione x: [SVG 2](https://www.w3.org/TR/SVG2/text.html) applica l’n-esimo valore x all’n-esimo carattere, contato in code point, quindi le colonne reggono anche in un font di ripiego. Nomina il carattere (`'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace`) e non lo incorpora; dove JetBrains Mono non è installato, il font monospazio del visualizzatore disegna le stesse colonne. Gli spazi bianchi vengono conservati (`xml:space="preserve"` e `white-space: pre`), le legature di programmazione sono disattivate, il documento ha un `<title>` con la descrizione e `role="img"`, e i numeri di riga sono elementi separati, così una selezione del codice non li include. I caratteri che un documento XML non può contenere ([XML 1.0](https://www.w3.org/TR/xml/), produzione [2]: caratteri di controllo diversi da tabulazione e avanzamento riga, surrogati isolati, U+FFFE e U+FFFF) vengono prima sostituiti con U+FFFD.
- **Il PNG** viene disegnato su un canvas nel tuo browser a 1x o 2x i pixel CSS, carattere per carattere sulla stessa griglia, con la copia di JetBrains Mono della pagina stessa. Immagini molto grandi possono superare le dimensioni che un browser consente a un canvas; la pagina lo segnala e l’SVG funziona comunque.
- **La copia del PNG** usa `ClipboardItem`, dove il browser lo offre; `image/png` è uno dei tipi di dati che la [Clipboard API](https://www.w3.org/TR/clipboard-apis/) richiede per la scrittura.

Nulla viene caricato da o inviato a qualche destinazione. L’anteprima è un SVG inline costruito dall’impaginazione, e i download sono file creati nella pagina.

## Tavolozze e contrasto

Entrambe le tavolozze sono misurate con le formule delle WCAG 2.2 (luminanza relativa con la soglia 0,04045, rapporto di contrasto (L1 + 0,05) / (L2 + 0,05)). Ogni colore del testo, i numeri di riga e il titolo della finestra rispettano il rapporto 4,5:1 del criterio di successo 1.4.3 rispetto a ogni sfondo su cui possono trovarsi: lo sfondo del codice e la fascia della riga evidenziata (il titolo rispetto alla barra del titolo). L’indicatore a sinistra di una riga evidenziata è un oggetto grafico e rispetta il 3:1 del criterio 1.4.11. I tre punti della finestra sono decorativi. I rapporti sono arrotondati per difetto, quindi un esito positivo non è mai arrotondato per eccesso.

| Testo | Chiara: su sfondo `#ffffff` | Chiara: su evidenziazione `#fff3c4` | Scura: su sfondo `#11151c` | Scura: su evidenziazione `#26303d` |
|---|---|---|---|---|
| Normale | `#1f2328` 15,79 | 14,19 | `#e6e9ef` 15,04 | 10,97 |
| Commento | `#57606a` 6,38 | 5,74 | `#9ba6b2` 7,39 | 5,39 |
| Stringa | `#0a6629` 7,12 | 6,40 | `#9ddba0` 11,38 | 8,31 |
| Numero | `#0550ae` 7,59 | 6,82 | `#8fc6ff` 10,18 | 7,43 |
| Parola chiave | `#a40e26` 7,86 | 7,06 | `#ff9c94` 9,09 | 6,63 |
| Variabile | `#8a4600` 7,10 | 6,38 | `#f6bd84` 10,91 | 7,96 |
| Prompt | `#0b6874` 6,46 | 5,81 | `#7fd8d0` 11,00 | 8,03 |
| Chiave | `#6639ba` 7,34 | 6,59 | `#c9b0ff` 9,70 | 7,08 |
| Valore mascherato | `#9c1c6f` 7,47 | 6,71 | `#ff8fd0` 8,79 | 6,41 |
| Numero di riga | `#5f6872` 5,66 | 5,08 | `#97a1ad` 6,98 | 5,09 |

Titolo della finestra sulla barra del titolo: chiara `#3a424a` su `#eceff3`, 8,84; scura `#c3cbd4` su `#1d232c`, 9,64. Indicatore di evidenziazione (richiesto 3:1): chiara `#9a6700`, 4,86 sullo sfondo e 4,37 sull’evidenziazione; scura `#e3b341`, 9,40 e 6,86.

## Testo alternativo

Il testo alternativo è una descrizione di una riga (quante righe, quale linguaggio, quanti valori mascherati), una riga vuota, poi il codice come testo semplice con ogni valore mascherato scritto come «[mascherato]». Così segue il criterio di successo 1.1.1, Non-text Content: l’alternativa testuale di un’immagine di codice svolge la stessa funzione quando è il codice stesso. Dove il testo alternativo risulterebbe lungo, metti il codice come testo accanto all’immagine (in una slide, nelle note del relatore) e tieni come testo alternativo solo la descrizione.

## Opzioni

- **Linguaggio**: l’evidenziatore (vedi la tabella sopra).
- **Tavolozza**: scura (l’impostazione predefinita) o chiara.
- **Dimensione del carattere**: 12, 14, 16 (l’impostazione predefinita), 18, 20, 24 o 28 pixel CSS.
- **Tabulazioni**: ogni 2, 4 (l’impostazione predefinita) o 8 colonne.
- **Margine interno**: 16, 32 (l’impostazione predefinita), 48 o 64 pixel CSS intorno alla finestra, oppure intorno al codice senza cornice.
- **Numeri di riga**: attivi per impostazione predefinita.
- **Cornice della finestra**: attiva per impostazione predefinita, con tre punti decorativi e un titolo facoltativo fino a 80 caratteri.
- **Evidenzia righe**: numeri e intervalli separati da virgole o spazi, come `3, 5-7`. Un elemento che non è un numero o un intervallo, lo zero o un intervallo al contrario vengono ignorati, e un intervallo oltre l’ultima riga viene mantenuto fino all’ultima riga; la pagina elenca ciò che ha ignorato.

## Limiti e modifiche al testo

Lo strumento rifiuta, indicando il motivo, un testo più lungo di 50.000 caratteri, più di 400 righe, una riga più larga di 400 colonne dopo l’espansione delle tabulazioni, un titolo più lungo di 80 caratteri e un elenco di righe da evidenziare più lungo di 200 caratteri. Questi limiti mantengono l’immagine entro ciò che una slide o un ticket possono usare ed entro ciò che i browser riescono a disegnare.

Ti segnala quando ha rimosso un byte order mark, letto i ritorni a capo come interruzioni di riga, sostituito caratteri che XML non può contenere, espanso le tabulazioni, rimosso gli spazi alla fine delle righe (avrebbero solo allargato l’immagine) o letto il testo come una sessione di terminale. Un’interruzione di riga finale non produce una riga in più.

## Esempio svolto

Il pulsante Esempio carica una phase 1 IPsec di FortiOS la cui chiave precondivisa è nella forma cifrata `ENC`, scritta per questo esempio (il base64 di «for-demo-only-not-a-real-key»), con l’indirizzo di documentazione 203.0.113.10 della [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737):

```
config vpn ipsec phase1-interface
    edit "to-branch-01"
        set interface "port1"
        set peertype any
        set proposal aes256-sha256
        set remote-gw 203.0.113.10
        set psksecret ENC Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ==
    next
end
```

Il controllo dei segreti segnala un rilievo, «Valore cifrato FortiOS (ENC), riga 7, colonna 27», e l’immagine mostra `set psksecret ENC ••••••••` alla riga 7, che l’Esempio evidenzia anche, sotto il titolo «VPN to branch 01» (VPN: Virtual Private Network, rete privata virtuale). L’SVG misura 451,2 per 348 pixel CSS nella tavolozza scura, e il testo alternativo inizia con «Immagine di codice: 9 righe di FortiOS CLI, 1 valore mascherato».

## Condivisione dei risultati

Sotto i pulsanti di esportazione, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene tre cose dopo il `#`: il testo come lo mostra l’immagine, con ogni valore mascherato dal controllo dei segreti sostituito dagli stessi otto pallini, il linguaggio di evidenziazione e la tavolozza. Il titolo della finestra (testo libero che il controllo dei segreti non legge), le righe evidenziate, la dimensione del carattere, il margine interno, le tabulazioni e i due interruttori non vengono inclusi. Un valore che hai deselezionato è nel link così come l’hai scritto, e il riquadro a comparsa indica ciascuno di questi valori con la sua riga e la sua etichetta prima che tu copi qualcosa; quando non hai deselezionato nulla, indica che tutti i valori trovati sono mascherati. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre.

- **Lunghezza massima.** Al massimo 16.384 caratteri di testo, il limite che il sito applica a ogni valore dopo il `#`; un testo più lungo non ottiene il link, e il riquadro a comparsa lo segnala.
- **Apertura di un link.** Il testo compila la casella come farebbe un incolla, il linguaggio e la tavolozza vengono impostati e l’immagine viene disegnata; le altre scelte della pagina che riceve il link restano come sono. Un valore mascherato arriva come otto pallini: su alcune righe il controllo dei segreti li ritrova e li maschera di nuovo, su altre li disegna come caratteri normali, quindi la descrizione può contare meno valori mascherati, ma non c’è alcun valore da rivelare. Un linguaggio o una tavolozza che lo strumento non offre fanno ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta.

## Provenienza

Il comportamento è fissato dal set di vettori di test di riferimento (golden vectors) `code-to-image-golden-2026-10-27b`: la colorazione di ogni linguaggio (testo semplice, script e sessione shell, script e sessione Python, JSON, YAML, un’iRule, uno script Expect, una sessione tclsh, tmsh, FortiOS, stile Cisco), tre documenti SVG byte per byte con il loro testo alternativo (ciascuno verificato come XML ben formato e con una posizione x per carattere), ogni regola dei segreti in positivo e in negativo con i caratteri esatti mascherati (e verificati come assenti dall’SVG e dal testo alternativo quando mascherati), ogni limite al suo valore e oltre, la normalizzazione, le note, il parser delle righe da evidenziare e ogni rapporto di contrasto riportato sopra, la cui luminanza è confrontata anche con lo [strumento Contrasto e formati dei colori](/tools/color-contrast-format) del sito, e il testo che un link creato con Condividi i risultati contiene per sette input, byte per byte, con la verifica che la pagina che lo riceve disegni gli stessi caratteri e che nessun valore mascherato sia nel link.

## API

Non esposto tramite l’API, per scelta. Il PNG viene disegnato dal browser di chi legge, e l’input è il tipo di testo che contiene segreti: configurazioni, catture e script sono proprio ciò per cui esiste il controllo dei segreti, e il posto sicuro per controllarli è la macchina su cui si trovano già. Inviarli a un server per farli controllare vanificherebbe il controllo.

## Fonti

Tutte consultate il 27/10/2026.

- [The Open Group Base Specifications Issue 8 (POSIX.1-2024), Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html)
- [Python 3.15: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), [sys.ps1 e sys.ps2](https://docs.python.org/3/library/sys.html), [istruzioni di assegnazione](https://docs.python.org/3/reference/simple_stmts.html), [Status of Python versions](https://devguide.python.org/versions/)
- [RFC 8259, JSON](https://www.rfc-editor.org/rfc/rfc8259)
- [YAML 1.2.2](https://yaml.org/spec/1.2.2/)
- [Tcl 9.0: Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html), [set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html), [tclsh(1)](https://www.tcl-lang.org/man/tcl9.0/UserCmd/tclsh.html), [l’indice dei comandi](https://www.tcl-lang.org/man/tcl9.0/TclCmd/index.html), [le release](https://www.tcl-lang.org/software/tcltk/)
- [F5 iRules: What Is An iRule](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) e [when](https://clouddocs.f5.com/api/irules/when.html); [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html)
- [F5 TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/) (tmsh, l’indice dei comandi, il PDF 17.0.0, auth user, sys file ssl-key, ltm profile client-ssl, ltm monitor http). La politica di supporto software di F5, [K5903](https://my.f5.com/manage/s/article/K5903) (consultata il 27/10/2026), assegna alle Long-Term Stability Release 17.x lo Standard Support fino al 31 marzo 2027 (17.1.x) e al 1 gennaio 2029 (17.5.x).
- [FortiOS 7.6.8 Administration Guide](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics) (CLI basics, Command syntax, Subcommands, Trusted platform module support), [CLI Reference: config system admin](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/390485493/config-system-admin), i suggerimenti tecnici Fortinet sulla [copia di una chiave precondivisa](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) e sulla [fine del supporto di FortiOS 7.4 e 7.6](https://community.fortinet.com/fortigate-3/technical-tip-fortios-end-of-support-change-for-fortios-v7-4-and-v7-6-224876) (7.6: fine del supporto tecnico il 25 luglio 2028, fine del supporto il 25 gennaio 2030)
- Cisco IOS XE 17.x System Management Configuration Guide: [Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) e [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html); [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html); [password in IOS XE 17.18](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html); [la dichiarazione sul ciclo di vita del software IOS XE](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-26/bulletin-c25-2378701.html)
- [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/) (la 3.5 è la release con supporto a lungo termine di OpenSSL, supportata fino all’8 aprile 2030 secondo la sua [strategia di rilascio](https://openssl-library.org/policies/releasestrat/)), [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c)
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)
- AWS: [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html), [chiavi di accesso](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html), [file di configurazione e delle credenziali dell’AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516), [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Understanding 1.4.5 Images of Text](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html), [Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [SVG 2, Text](https://www.w3.org/TR/SVG2/text.html), [XML 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/), [Clipboard API and events](https://www.w3.org/TR/clipboard-apis/), [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/), e il file LICENSE del pacchetto @fontsource/jetbrains-mono 5.2.8 (Copyright 2020 The JetBrains Mono Project Authors)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
