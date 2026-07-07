## O que faz

Monta um comando `diagnose sniffer packet` do FortiGate a partir das suas partes, ou decodifica um comando existente explicando cada argumento, tudo sem tocar em um equipamento. O sniffer embutido do FortiOS é a primeira ferramenta que a maioria das pessoas usa quando um pacote não chega onde deveria, e sua linha de comando reúne cinco argumentos posicionais em uma única linha. Esta ferramenta monta essa linha para você e a lê de volta, argumento por argumento. Roda inteiramente no seu navegador e é fundamentada na documentação do próprio sniffer da Fortinet e na referência de CLI.

## Montando um comando

Escolha uma interface (ou `any` para todas), opcionalmente um host, uma porta e um protocolo, e então um nível de verbosidade, uma contagem de pacotes e um formato de horário. A ferramenta monta o comando exato:

```
diagnose sniffer packet <interface> <'filtro'> <verbose> <count> <tsformat>
```

O filtro que você monta é mostrado entre aspas simples, do jeito que o FortiOS espera uma expressão estilo BPF com várias palavras, e um `host` mais um `proto` são unidos com `and`. Quando nenhuma parte do filtro está definida, é usada a palavra `none`, que captura tudo na interface. Cada argumento é explicado ao lado do comando, e as armadilhas comuns são sinalizadas enquanto você monta.

## Decodificando um comando

Cole um comando como `diagnose sniffer packet any 'host 10.1.1.1 and tcp port 443' 4 0 l` e cada um dos cinco argumentos é lido de volta: a interface (e se `any` significa uma captura cooked do Linux que oculta o cabeçalho Ethernet real), o filtro e o que ele casa, o nível de verbosidade e exatamente o que ele imprime, a contagem de pacotes e o formato de horário. A forma abreviada `diag sniff packet` também é aceita, e um comando com a contagem ou o horário finais omitidos ainda é decodificado, porque esses argumentos são opcionais no equipamento.

## Verbosidade, horários e as armadilhas

A verbosidade do FortiOS vai de 1 a 6. Os níveis 1 a 3 adicionam progressivamente mais do pacote (cabeçalhos, depois carga IP, depois o quadro Ethernet completo); os níveis 4 a 6 fazem o mesmo, mas adicionalmente imprimem o nome da interface que cada pacote usou, que é o que você quer com `any`. A saída no nível Ethernet (verbose 3 ou 6) pode ser convertida em um `.pcap` para o Wireshark com o script `fgt2eth.pl` da Fortinet. O argumento de horário é `a` para UTC absoluto, `l` para horário local absoluto, ou omitido para um tempo relativo desde o início da captura; a ferramenta avisa que um horário relativo não pode ser correlacionado entre capturas paralelas. Ela também sinaliza os dois motivos clássicos de uma captura não mostrar nada: as tags de VLAN são removidas em `any` e em interfaces VLAN com verbosidade alta, e sessões com offload em hardware (NP/SoC) contornam totalmente o sniffer do kernel, então você pode precisar de `set auto-asic-offload disable` na política de firewall correspondente durante o diagnóstico.

## Escopo e fundamentação

Isto monta e explica texto de comando; nunca roda um sniffer, abre um socket ou busca nada, e a mesma entrada sempre produz a mesma saída. Modela a gramática do comando e a semântica documentada de verbosidade e horário; não captura nem analisa pacotes ao vivo. Cada fato vem da seção do Guia de Administração do FortiGate sobre executar uma captura, da referência de CLI do FortiOS para `diagnose sniffer packet` e da orientação de diagnóstico da comunidade Fortinet. Nada do que você digita ou cola sai da página.
