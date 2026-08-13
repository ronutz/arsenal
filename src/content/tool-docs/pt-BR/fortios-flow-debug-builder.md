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
