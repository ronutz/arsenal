# Explicador do fluxo de decisão GSLB

Cole estrofes `gtm wideip` e `gtm pool` (como `tmsh list gtm wideip a <nome>` e `tmsh list gtm pool a <nome>` as imprimem) e a decisão em duas camadas do BIG-IP DNS (antigo GTM - Global Traffic Manager) é renderizada como realmente executa.

A camada wide-IP mostra o método de seleção de pool (`pool-lb-mode`, padrão round-robin) com os pools anexados, seus valores de order e ratio, e as configurações do wide IP que moldam as respostas: persistence, last-resort-pool, comportamento de failure-rcode e a verbosidade do log de decisão que permite assistir esse mesmo fluxo nos logs.

A camada de pool renderiza a cadeia de três passos: preferred (`load-balancing-mode`), alternate (`alternate-mode`), fallback (`fallback-mode`), cada passo carregando a semântica do fabricante para a camada e o método. Os padrões são aplicados e rotulados quando um atributo está ausente: round-robin, round-robin, return-to-dns.

Abaixo, observações determinísticas verificam a configuração contra a gramática documentada e as regras do manual de Load Balancing: métodos fora da lista de tokens admitidos por camada, a propriedade ignora-disponibilidade da camada de fallback declarada em toda cadeia resolvida, a fiação do Fallback IP (o método sem endereço, ou um endereço que nenhuma camada usa), o escopo do dynamic-ratio, coeficientes de QoS zerados, ratios de membros que nenhuma camada consome, a regra de pareamento do Global Availability e o aviso de topologia-nas-duas-camadas que pede o fallback de cada pool em None.

Um nome de método explica aquele método, incluindo quais camadas o admitem e de onde vem seu sinal de decisão (sondagem do caminho LDNS, estatísticas do servidor, ou nenhum). A palavra `methods` lista os dois catálogos.

Tudo roda localmente; nada do que você cola sai da página.

## Compartilhar resultado

No topo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi digitada depois do `#`, e mais nada. O popover dele diz primeiro o que o link leva e depois um aviso próprio: nomes de wide IP e de pool identificam sua infraestrutura, então leia o que foi colado antes de mandar o link. Então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Esta página pula toda stanza que não explica, então um arquivo de configuração inteiro ainda ganha uma leitura, e um link dele levaria tudo o que houver nele. Por isso, enquanto o que foi colado tiver uma configuração secreta, não há link, e o popover diz qual é: um atributo do tmsh chamado `password`, `passphrase` ou `secret`, ou cujo nome termine num deles (`encrypted-password`, `proxy-ca-passphrase`, `shared-secret`), `bind-pw` ou `community-name`, seguido de um valor diferente de `none`; ou um header `Authorization` em qualquer lugar, como na string `send` de um monitor. A [referência do tmsh para gtm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/gtm/gtm_monitor_http.html) da F5 (lida em 2026-10-27) lista `password` ao lado de `send`, e a [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (seção 11.6.2, lida em 2026-10-27) define o valor de Authorization como credenciais. Tire essa linha e clique de novo: esta página nunca mostra esses valores, então o resto é lido do mesmo jeito.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado e a página o lê; nada é enviado a lugar nenhum. O valor então sai do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
