## Cosa fa

Indica allo strumento le date di inizio e di fine di un certificato, il suo `notBefore` e il suo `notAfter`, e lo strumento ne ricava le conseguenze pratiche: per quanto tempo il certificato è valido, in quale fase del calendario di riduzione della validità del CA/Browser Forum è stato emesso e se la sua durata rientra nel limite di quella fase, quanti rinnovi all’anno comporta quella cadenza, le finestre di riutilizzo della convalida del dominio e dell’identità in quella fase, e un anticipo consigliato con la data entro cui rinnovare. È puro calcolo sulle date e viene eseguito interamente offline.

## Perché la durata dei certificati si sta riducendo

Da anni i certificati TLS considerati attendibili pubblicamente hanno una durata sempre più breve, e la votazione SC-081v3 del CA/Browser Forum stabilisce un calendario che riduce la validità massima da 398 giorni, passando per 200 e 100 giorni, fino a 47 giorni entro il 2029. Certificati più brevi limitano il tempo per cui un certificato compromesso o emesso per errore resta utilizzabile, ma rendono anche impraticabile il rinnovo manuale, ed è proprio questo lo scopo: il calendario impone di fatto l’automazione. Insieme alla validità si riducono due finestre collegate: il periodo per cui si può riutilizzare una convalida del controllo del dominio (DCV, domain control validation) e il periodo per cui si possono riutilizzare le Subject Identity Information (SII), l’identità convalidata del soggetto del certificato, quindi una parte maggiore del processo va ripetuta più spesso.

## Cosa ti dice il piano

A partire dalle sole due date, lo strumento ricava il quadro completo:

- la **durata della validità** e la fase SC-081v3 a cui corrisponde, con un sì o un no netto sul fatto che la durata rientri nel limite di quella fase;
- la **cadenza di rinnovo**, espressa in rinnovi all’anno, sia per il limite attuale sia per ogni limite futuro, così puoi vedere come cresce il carico di lavoro;
- le **finestre di riutilizzo DCV e SII** che valgono per la fase di emissione; e
- un **anticipo di rinnovo consigliato** e la data entro cui rinnovare che ne risulta, perché un rinnovo si concluda prima della scadenza e non all’ultimo momento.

## La vera risposta è l’automazione

Poiché il punto d’arrivo di questo calendario è un certificato da 47 giorni, rinnovare a mano molte volte all’anno ogni certificato non è sostenibile. La risposta standard è il protocollo ACME (RFC 8555), il rilascio e il rinnovo automatici usati da strumenti come certbot; i valori di cadenza del pianificatore sono in realtà un argomento a favore della sua adozione.

## Come si usa

Inserisci le date `notBefore` e `notAfter` del certificato e leggi la validità, la conformità al calendario, la cadenza di rinnovo, le finestre di riutilizzo e la data di rinnovo consigliata. Il calcolo è una funzione pura di quelle due date; se un certificato sia scaduto in questo momento viene mostrato a parte, in base all’orologio del tuo dispositivo.

## Condivisione dei risultati

Alla fine del riepilogo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le due date, emissione e scadenza: `/tools/cert-renewal-planner#input=2026-01-01&notafter=2027-02-02`. I giorni rimanenti non vengono inclusi: la pagina li conta in base all’orologio di chi apre il link. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi le date non vengono inviate al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerle.

- **Apertura di un link.** Entrambe le date vengono impostate e la pagina elabora il piano. Ognuna deve essere un giorno reale nel formato AAAA-MM-GG, l’unico che un campo data accetta; qualsiasi altro valore fa ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
