# Analizzatore di filtri LDAP

Incolla un qualsiasi filtro di ricerca LDAP (Lightweight Directory Access Protocol) e lo strumento lo analizza esattamente come fa un server di directory, secondo la RFC 4515: la rappresentazione in forma di stringa in cui finiscono per tradursi ogni client LDAP, ogni ricerca di PingDirectory, ogni ricerca nel datastore di PingFederate e ogni query di Active Directory.

## Cosa ottieni

L’albero annotato. Ogni nodo AND (`&`), OR (`|`) e NOT (`!`) enuncia la propria regola in linguaggio semplice; ogni elemento foglia viene classificato per tipo di corrispondenza: uguaglianza, presenza (`=*`), sottostringa (caratteri jolly, con le parti «inizia con», «contiene» e «termina con» nel loro ordine), `>=`, `<=`, approssimata (`~=`) o extensible match. Gli escape esadecimali della RFC 4515 (`\2a`, `\28`, `\29`, `\5c`) vengono decodificati ed elencati. I celebri OID delle regole di corrispondenza di Active Directory vengono riconosciuti per nome: `1.2.840.113556.1.4.803` (AND bit a bit, il classico test sugli account disabilitati `(userAccountControl:1.2.840.113556.1.4.803:=2)`), `804` (OR bit a bit) e `1941` (appartenenza transitiva ai gruppi).

## Errori indicati nel punto esatto

Un filtro malformato fallisce con la posizione esatta del carattere e un accento circonflesso (^) sotto di esso: la parentesi non bilanciata, l’elemento senza `=`, la barra rovesciata a cui mancano le due cifre esadecimali.

## Privacy

I filtri contengono spesso nomi di attributi interni e la struttura delle OU. Tutto viene analizzato in locale nel tuo browser; nulla viene trasmesso.

## Condivisione dei risultati

Sotto i conteggi del filtro, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il filtro così come l’hai inserito, anche quando non è analizzabile: il suo errore, indicato nel punto esatto, è proprio la lettura che potresti voler mostrare. Il suo riquadro a comparsa indica prima cosa contiene il link, poi un’avvertenza specifica: un filtro può nominare utenti, gruppi e la struttura della tua directory, quindi rileggilo prima di inviare il link. Poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Un filtro che asserisce un valore di un attributo password non ottiene alcun link, e il riquadro a comparsa indica l’attributo: `userPassword` ([RFC 4519](https://www.rfc-editor.org/rfc/rfc4519), sezione 2.41, OID 2.5.4.35, «octet strings that are known only to the user and the system»), `authPassword` ([RFC 3112](https://www.rfc-editor.org/rfc/rfc3112), OID 1.3.6.1.4.1.4203.1.3.4) e `unicodePwd` di Active Directory ([schema AD di Microsoft](https://learn.microsoft.com/en-us/windows/win32/adschema/a-unicodepwd), ID attributo 1.2.840.113556.1.4.90), tutti consultati il 01/11/2026. Vengono riconosciuti per nome o per OID, con qualsiasi combinazione di maiuscole e minuscole e con qualsiasi opzione, perché la [RFC 4512](https://www.rfc-editor.org/rfc/rfc4512) (sezione 2.5, consultata il 01/11/2026) rende le descrizioni di attributo indipendenti da maiuscole e minuscole, con le opzioni dopo un `;`. Un test di presenza come `(userPassword=*)` non contiene alcun valore e passa.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il filtro non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un filtro più lungo non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il filtro compila la casella e la pagina lo spiega come dopo un incolla; nulla viene inviato a una directory. Un filtro che asserisce una password viene ignorato. In ogni caso il valore lascia subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
