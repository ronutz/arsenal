# Pontuador longest-match de topologia GTM

O folclore diz que a correspondência mais longa vence. A documentação diz algo mais afiado: Longest Match é uma ordenação da lista de registros, e as pontuações decidem. Esta ferramenta computa tudo do jeito que o BIG-IP DNS (antigo GTM - Global Traffic Manager) computa.

Cole registros `gtm topology` (como o tmsh os imprime: `gtm topology ldns: <origem> server: <destino> { score N }`, com negação `not` suportada em ambos os lados), estrofes `gtm region` opcionais (membros positivos; regiões aninhadas resolvem), uma linha `source` declarando os atributos do LDNS a avaliar (`ip=`, `country=`, `continent=`, `isp=`, `region=`), e opcionalmente uma linha `candidates` nomeando os destinos a pontuar (caso contrário os destinos pool e datacenter dos registros viram os candidatos).

A saída mostra os registros na ordem do Longest Match, cada um com sua justificativa de posição: o balde de negação (entradas simples acima de negações do lado servidor, acima de negações do lado LDNS, acima de curingas, conforme o K10721), a escada de tipos (subnets pela máscara mais longa, depois datacenter e pool, region, ISP, país, continente) e o peso. Tipos que as fontes não classificam são colocados depois da escada verificada e sinalizados, nunca adivinhados.

Depois, a caminhada de pontuação: cada candidato recebe sua pontuação do primeiro registro da lista ordenada que o corresponde, e registros posteriores para aquele candidato são marcados como sombreados. O candidato com a maior pontuação vence; pontuações máximas iguais fazem round robin. E é por isso que um curinga carregando peso 100 realmente vence um /32 carregando peso 5, e a ferramenta mostra exatamente onde isso acontece.

Sem uma linha `source`, a lista ordenada é exibida sozinha. Tudo roda localmente; nada do que você cola sai da página.

## Compartilhar resultado

Abaixo do vencedor (no topo da leitura quando não há um), o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi digitada depois do `#`, e mais nada. O popover dele diz primeiro o que o link leva e depois um aviso próprio: registros de topologia trazem suas sub-redes, regiões, pools e data centers, então leia antes de mandar o link. Então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Esta página pula toda stanza que não explica, então um arquivo de configuração inteiro ainda ganha uma leitura, e um link dele levaria tudo o que houver nele. Por isso, enquanto o que foi colado tiver uma configuração secreta, não há link, e o popover diz qual é: um atributo do tmsh chamado `password`, `passphrase` ou `secret`, ou cujo nome termine num deles (`encrypted-password`, `proxy-ca-passphrase`, `shared-secret`), `bind-pw` ou `community-name`, seguido de um valor diferente de `none`; ou um header `Authorization` em qualquer lugar, como na string `send` de um monitor. A [referência do tmsh para gtm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/gtm/gtm_monitor_http.html) da F5 (lida em 2026-10-27) lista `password` ao lado de `send`, e a [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (seção 11.6.2, lida em 2026-10-27) define o valor de Authorization como credenciais. Tire essa linha e clique de novo: esta página nunca mostra esses valores, então o resto é lido do mesmo jeito.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado e a página o lê; nada é enviado a lugar nenhum. O valor então sai do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
