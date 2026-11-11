## Cosa fa

Incolla la stringa di un vettore CVSS v3.1 o v3.0 e lo strumento calcola il punteggio, lo colloca in una fascia di gravità e spiega cosa significa ogni metrica. Calcola il punteggio Base e, quando quelle metriche sono presenti nel vettore, anche i punteggi Temporale e Ambientale. È pura matematica e funziona offline; nulla viene inviato altrove.

## Cos’è il CVSS

Il CVSS (Common Vulnerability Scoring System) di FIRST.org è il modo standard per esprimere la gravità di una vulnerabilità con un unico numero da 0,0 a 10,0. Quel numero non viene assegnato a mano; viene calcolato da una stringa vettore, un elenco compatto di metriche come `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`, dove ogni campo è una caratteristica della vulnerabilità. Lo strumento riporta quella stringa in linguaggio semplice e vi applica la formula ufficiale.

## Le metriche di base

Il punteggio Base, la parte che ogni vettore ha, si costruisce con metriche di due gruppi. Le metriche di sfruttabilità descrivono quanto è difficile sfruttare la vulnerabilità: **Vettore di attacco (Attack Vector)** (rete, adiacente, locale o fisico), **Complessità dell’attacco (Attack Complexity)**, **Privilegi richiesti (Privileges Required)** e **Interazione dell’utente (User Interaction)**. Le metriche di impatto descrivono cosa succede se viene sfruttata: l’effetto su **riservatezza (Confidentiality)**, **integrità (Integrity)** e **disponibilità (Availability)**. **Ambito (Scope)** sta tra i due gruppi e indica se lo sfruttamento del componente può interessare risorse al di là di esso. Lo strumento mostra il valore scelto per ogni metrica e il suo significato, così un vettore smette di essere un codice oscuro.

## Punteggio, gravità e gli altri gruppi

Il punteggio Base calcolato corrisponde a una fascia qualitativa: Nessuna, Bassa, Media, Alta o Critica. Due gruppi di metriche facoltativi lo affinano quando sono presenti: le metriche **Temporali** tengono conto dello stato attuale del codice di exploit e delle correzioni, e le metriche **Ambientali** ripesano il punteggio per il tuo deployment specifico, compresi i tuoi requisiti di riservatezza, integrità e disponibilità. L’aritmetica segue esattamente la specifica di FIRST.org, compresa la sua regola di arrotondamento, quindi il numero mostrato dallo strumento corrisponde a quello del calcolatore ufficiale.

## Come si usa

Incolla un vettore v3.0 o v3.1 e leggi il punteggio, la fascia di gravità e le metriche decodificate. Il calcolo è deterministico: lo stesso vettore dà sempre lo stesso punteggio, perché è la formula pubblicata e nient’altro.

[PHP2Shell: the October 2026 PHP vulnerabilities](/learn/php-october-2026-vulnerabilities) esamina un caso reale: le stesse falle hanno ottenuto 9,8 o 8,1 in v3.1, a seconda della Complessità dell’attacco (Attack Complexity) scelta da chi assegnava il punteggio.

## Condivisione dei risultati

Sotto i punteggi, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il vettore così come l’hai inserito, una volta che la pagina l’ha decodificato. Un vettore CVSS è un descrittore pubblico della gravità e non rivela nulla di tuo. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Il vettore compila la casella come farebbe un incolla e la pagina lo decodifica. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
