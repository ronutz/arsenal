## O que faz

Preencha o que você quer rastrear — um endereço, opcionalmente portas, um protocolo, uma contagem de pacotes — e a ferramenta monta a sequência completa de `diagnose debug flow` para um FortiGate: o reset para estado limpo, o filtro, as opções de exibição, o trace e o enable, seguidos da limpeza. Cada linha é explicada individualmente. Gera texto e não contata nada.

## Por que um construtor, e não uma referência

`diagnose debug flow` não é um comando, é uma receita de quatro ou cinco comandos que só funcionam em conjunto. A ordem importa, a limpeza importa mais, e o conjunto é usado com frequência baixa o bastante para que quase ninguém o lembre com exatidão. É exatamente o formato de problema que um construtor determinístico resolve.

## A ordem que ela emite, e por quê

A ferramenta emite **filtro primeiro, enable por último**. O guia de administração da própria Fortinet mostra `diagnose debug enable` primeiro, antes do filtro, e **os dois funcionam** — a ferramenta diz isso nas notas em vez de escolher em silêncio. O motivo para preferir o filtro primeiro é prático: num firewall movimentado, ligar a saída antes do filtro rastreia tudo até o filtro entrar.

## Três coisas que ela sempre informa

- **A contagem é de pacotes, não de segundos.** `trace start 100` são cem pacotes, e uma interface movimentada pode esgotá-los em menos de um segundo.
- **Tráfego com offload nunca chega a esse código.** Em plataformas NP ou SP, um filtro correto pode não produzir nada enquanto o tráfego claramente flui. É o motivo mais comum de um bom trace parecer quebrado.
- **Os números de linha na saída não são estáveis entre versões.** Case pelo nome da função.

## O que ela não faz

Não pode saber a sua plataforma, o seu arranjo de VDOMs ou se a sua sessão está com offload, e não valida nada contra um equipamento. Ela se recusa a montar um trace sem filtro, porque um debug flow sem filtro num firewall de produção é a forma mais rápida de tornar um console inutilizável.

## Compartilhar resultado

Abaixo dos comandos, depois de Copiar, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o formulário depois do `#` como valores com nome, sempre todos os campos: `addr`, `saddr`, `daddr`, `port`, `sport`, `dport`, `proto`, `vdom` e `count` como foram digitados (um vazio fica de fora), e `iprope` e `timestamp` como 1 ou 0. O botão fica desabilitado até um filtro ser digitado, porque a página não monta nada sem filtro. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

O formulário não tem segredo (o builder formata texto e não roda nada), mas os filtros citam hosts, portas e um virtual domain da sua rede, então o popover traz uma linha de cuidado antes de você copiar qualquer coisa. Todos os campos vão, não só os que diferem do padrão, então um link antigo mantém o sentido se um padrão mudar.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** Os valores do link substituem o formulário inteiro (um campo de texto que ele não leva fica vazio) e a página monta os comandos; nada é rodado. Uma opção diferente de 1 ou 0, ou um link sem filtro, fazem o link inteiro ser ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
