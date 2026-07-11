## O que faz

Este é um tradutor de referência entre o **VOSS** (o Fabric Connect / SPBM da Extreme) e o **EXOS**. Ele coloca tarefas comuns lado a lado para você ver como cada linha de comando as expressa, e é explícito onde o EXOS não tem equivalente - porque o EXOS não roda SPBM de forma alguma. É uma referência, não um gerador de configuração: todo comando é fundamentado na documentação da Extreme, mas você deve adaptar nomes, portas e números à sua própria rede e verificar antes de aplicar qualquer coisa.

## A diferença essencial

EXOS e VOSS são sistemas operacionais diferentes que rodam no hardware universal da Extreme. O VOSS é nativo de fabric: ele constrói uma fabric SPBM com IS-IS, nicknames, B-VLANs e I-SIDs. O EXOS não suporta SPBM. Ele entra em uma rede Fabric Connect como uma borda **Fabric Attach** (um FA Proxy ou Client), e o FA Server do VOSS provisiona o I-SID para ele. Portanto, para as tarefas de core da fabric - a instância SPBM, o nickname, as B-VLANs, um L3 VSN - simplesmente não há comando EXOS, e a ferramenta diz isso claramente.

## Como usar

Digite uma tarefa ou um fragmento de comando (por exemplo `i-sid`, `nickname`, `vlan` ou `fabric attach`) e a tabela filtra as linhas correspondentes. Cada linha mostra o conceito, o(s) comando(s) VOSS, o(s) comando(s) EXOS ou uma nota de que não há equivalente, e uma breve explicação. Limpe o campo para ver a tabela inteira.

## O que não é

Ela não gera uma configuração pronta para implantar, e não traduz um arquivo de configuração arbitrário linha por linha. A configuração de fabric é de alto impacto e específica de plataforma; esta ferramenta serve para ajudar você a aprender e cruzar as duas CLIs, não para produzir configuração que você colaria em um switch em produção sem verificar.
