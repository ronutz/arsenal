# Ordine di valutazione delle policy PAN-OS

Incolla una base di regole (rulebase) che comprende i livelli di Panorama e le regole locali del firewall. Lo strumento la mette nell’ordine in cui PAN-OS la valuta davvero, se vuoi segue un flusso fino alla regola che lo decide e indica le regole che non scattano mai perché una regola più in alto trova già corrispondenza. Tutto viene eseguito nel browser.

## Il problema che risolve

Un firewall autonomo valuta un solo elenco ordinato, e leggerlo è semplice. Un firewall gestito da Panorama o un tenant di Prisma Access no. Questi valutano per livello e per tipo, in questo ordine:

1. Pre-rule condivise
2. Pre-rule del device group
3. **Regole locali del firewall**
4. Post-rule del device group
5. Post-rule condivise
6. Regole predefinite

Le regole locali che un amministratore può vedere e modificare sul firewall stanno in mezzo a un sandwich che, dal firewall, non può modificare affatto. È la sorpresa più comune in un parco gestito da Panorama: una regola locale che sembra perfettamente corretta non viene mai eseguita, perché una pre-rule condivisa due livelli più in alto ha già trovato corrispondenza e la valutazione si è fermata lì.

## Regole oscurate, e perché gli strumenti del vendor non le segnalano

Il documento di Palo Alto sulle best practice delle policy di sicurezza dice esplicitamente che Commit and Push non segnala le regole oscurate (shadowing):

> Commit and Push doesn't provide shadowing information.

Una regola generica posta sopra una specifica cattura il traffico per cui la regola specifica era stata scritta. La regola specifica non scatta mai. Nel push nulla te lo segnala, e il sintomo emerge più tardi, come traffico trattato in un modo che nessuno voleva.

Lo strumento segnala le regole oscurate e mette in evidenza due casi. **L’attraversamento di un livello** conta perché una regola locale oscurata da una pre-rule condivisa non si può né vedere né correggere dal firewall; la correzione va fatta in Panorama. **Un’azione diversa** conta perché significa che l’esito non è solo ridondante: è l’opposto di ciò per cui la regola oscurata era stata scritta.

Il test di oscuramento è volutamente prudente. Segnala una regola come oscurata solo quando la regola sopra di essa è un sovrainsieme su ogni singolo campo, il che significa che ogni pacchetto a cui la regola più in basso potrebbe corrispondere è già preso. Le sovrapposizioni parziali non vengono segnalate, perché spesso sono volute, e una segnalazione che grida sempre «al lupo» è una segnalazione che nessuno legge, il che sarebbe peggio della posizione attuale del vendor, che non segnala nulla.

## Le regole predefinite non sono simmetriche

In fondo a ogni base di regole ci sono due regole predefinite, e fanno cose opposte:

- **intrazone-default** consente tutto il traffico all’interno di una zona
- **interzone-default** nega tutto il traffico tra zone diverse

Un modello che trattasse «nessuna corrispondenza» come un’unica negazione implicita (implicit deny) sbaglierebbe per ogni flusso all’interno della stessa zona. Lo strumento applica la regola predefinita richiesta dalle zone e indica quale ha usato.

Entrambe si possono modificare perché registrino nei log o applichino profili di sicurezza, e conviene farlo: il traffico che arriva alle regole predefinite è traffico che nessuna regola aveva previsto.

## Come scrivere una base di regole per lo strumento

Una regola per riga. Il livello viene indicato per primo, di proposito: è proprio ciò che lo strumento esiste per mostrare, e una grammatica che permettesse di ometterlo ti permetterebbe di dimenticare proprio ciò che vuoi controllare.

```
shared-pre | block-tor      | deny  | from=any to=any app=tor
dg-pre     | allow-dns      | allow | from=trust to=untrust app=dns svc=application-default
local      | web-out        | allow | from=trust to=untrust app=web-browsing
dg-post    | catch-all-deny | deny  | from=any to=any
```

I campi sono nella forma `key=value`, con le virgole all’interno di un valore per gli elenchi. Tutto ciò che viene omesso vale `any`, come fa PAN-OS. Chiavi accettate: `from`, `to`, `src`, `dst`, `app`, `svc`, `user`. Le azioni sono `allow`, `deny`, `drop`, `reset-client`, `reset-server`, `reset-both`.

## Cosa non fa

Non legge la tua configurazione, non si connette a Panorama e non raccoglie nulla. Non modella il cambio di App-ID a sessione in corso, i profili di sicurezza, il NAT (Network Address Translation) né le policy di decifratura. Ragiona sull’**ordine** delle regole che gli fornisci, cioè la parte decisa al momento del commit e la parte difficile da vedere.

## Una nota sull’autorizzazione

Questo sito non dichiara alcuna autorizzazione o partnership di Palo Alto Networks. Lo strumento ragiona sull’ordine di valutazione pubblicato nella documentazione di Palo Alto stessa. È un’analisi di una specifica pubblica, non materiale del vendor, e non gode di alcun avallo.

## Condivisione dei risultati

Sotto l’ordine di valutazione, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene la base di regole così come l’hai inserita (`#input=...`). Il flusso che segui non viene incluso, e quando è attivo un tracciamento il riquadro a comparsa lo indica. Prima che tu copi qualsiasi cosa, il riquadro a comparsa aggiunge un’avvertenza: una base di regole riporta le tue zone, i tuoi indirizzi e i tuoi utenti, quindi rileggila prima di inviare il link. Tutto ciò che il link contiene si trova dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un contenuto più lungo non ottiene il link e il riquadro a comparsa indica quanto sarebbe lungo.
- **Apertura di un link.** Il link è lo stesso indirizzo usato dagli altri link a questo strumento: le regole compilano la casella e vengono valutate come farebbe un incolla. Come per ogni link a questo strumento, il valore resta dopo il `#` finché non modifichi o cancelli il campo, e poi lascia l’indirizzo senza alcuna richiesta.

## Fonti

- [Palo Alto Networks, Device Groups](https://docs.paloaltonetworks.com/panorama/getting-started/panorama-overview/centrally-manage-firewall-configuration-and-updates-with-panorama/device-groups) (consultata l’11/11/2026): un firewall valuta le regole delle policy per livello e per tipo, dall’alto in basso; le regole locali del firewall compaiono tra le pre-rule e le post-rule
- [Palo Alto Networks, Security Policy Rulebase Best Practices](https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices/security-policy-best-practices/deploy-security-policy-best-practices/security-policy-rulebase-best-practices) (consultata l’11/11/2026): vale la prima corrispondenza e il confronto si ferma; Commit and Push non fornisce informazioni sulle regole oscurate
- [Palo Alto Networks, Security Policy Rule Best Practices](https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices/security-policy-best-practices/deploy-security-policy-best-practices/security-policy-rule-best-practices) (consultata l’11/11/2026): definizione dello shadowing; intrazone-default consente e interzone-default nega
- [Palo Alto Networks, Defining Policies on Panorama](https://docs.paloaltonetworks.com/ngfw/help/11-1/panorama-web-interface/defining-policies-on-panorama) (consultata l’11/11/2026): le pre-rule vengono aggiunte in cima all’ordine delle regole e valutate per prime; le post-rule vengono aggiunte in fondo e valutate dopo le pre-rule e le regole locali del firewall
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
