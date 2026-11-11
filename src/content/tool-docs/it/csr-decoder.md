## Cosa fa

Decodifica una richiesta di firma del certificato (CSR) PKCS#10 e leggi cosa contiene: il nome del soggetto, la chiave pubblica, i Subject Alternative Names e le altre estensioni che il richiedente chiede, ed eventuali attributi. Analizza la struttura della richiesta interamente nel tuo browser e non contatta mai un’autorità di certificazione.

## Cos’è una CSR, e cosa non è

Una CSR è l’oggetto che consegni a un’autorità di certificazione quando le chiedi di emettere un certificato. La cosa importante è che non è un certificato. Non ha numero di serie, emittente né date di validità, perché nessuno di questi elementi è ancora stato deciso. Contiene solo ciò che il richiedente chiede: un nome del soggetto, una chiave pubblica e, facoltativamente, un insieme di estensioni richieste come i Subject Alternative Names. L’intera richiesta è firmata con la chiave privata che corrisponde alla chiave pubblica al suo interno, il che dimostra che il richiedente possiede davvero quella chiave privata: un passaggio chiamato prova di possesso (proof of possession).

## Richiesto, non concesso

Leggere una CSR ti dice cosa è stato chiesto, non cosa concederà una CA. Un’autorità di certificazione è libera di aggiungere, modificare o eliminare ciò che una CSR richiede in base alla propria policy e alla validazione che esegue, quindi i SAN e le estensioni che vedi qui sono una richiesta, non una garanzia. La distinzione conta quando un certificato emesso non corrisponde alla CSR: spesso è la CA che applica la sua policy, non un errore.

## Cosa decodifica

La richiesta è ASN.1 codificato in DER (la stessa codifica tag-lunghezza-valore usata dai certificati), e il decodificatore la percorre trasformandola in campi leggibili:

- il nome distinto (distinguished name) del **soggetto**;
- la **chiave pubblica**, con il suo algoritmo e la sua dimensione;
- le **estensioni richieste**, contenute in un attributo PKCS#9 `extensionRequest`, soprattutto i Subject Alternative Names; e
- altri **attributi**, come una challenge password o un unstructured name, se presenti.

Decodifica solo la struttura. Non verifica l’autofirma della richiesta e, poiché una CSR non ha un periodo di validità, non c’è nulla da verificare rispetto al tempo.

## Come si usa

Incolla una CSR PKCS#10 (il blocco tra i delimitatori CERTIFICATE REQUEST) e leggi il soggetto, la chiave, i SAN e le estensioni richiesti e gli attributi. L’analisi è deterministica e avviene in locale.

## Condivisione dei risultati

Sotto la nota iniziale, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai incollato: `/tools/csr-decoder#input=-----BEGIN%20CERTIFICATE%20REQUEST-----...`. Una richiesta è ciò che invii a una CA: un soggetto, una chiave pubblica e le estensioni richieste. Qualsiasi altra cosa presente nella casella viaggia insieme a essa. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la richiesta non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Nessun link in due casi.** Quando la casella contiene anche una chiave privata (un blocco `-----BEGIN ... PRIVATE KEY-----`, perché alcuni generatori stampano insieme la richiesta e la sua chiave) e quando la richiesta contiene una challenge password, che questa pagina mostra in chiaro: la richiesta è firmata, quindi non si può condividere senza la password. Il riquadro a comparsa indica quale dei due casi si è verificato.
- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il link ha la forma `#input=` che questa pagina già legge, quindi aprirlo funziona esattamente come hanno sempre funzionato quei link: il valore compila la casella e viene decodificato, e resta nell’indirizzo finché non modifichi o cancelli la casella.
