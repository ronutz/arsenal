## O que faz

Monta um comando `diagnose sniffer packet` do FortiGate a partir das suas partes, ou decodifica um comando existente explicando cada argumento, tudo sem tocar em um equipamento. O sniffer embutido do FortiOS é a primeira ferramenta que a maioria das pessoas usa quando um pacote não chega onde deveria, e sua linha de comando reúne cinco argumentos posicionais em uma única linha. Esta ferramenta monta essa linha para você e a lê de volta, argumento por argumento. Roda inteiramente no seu navegador e é fundamentada na documentação do próprio sniffer da Fortinet e na referência de CLI.

## Como montar um comando

Escolha uma interface (ou `any` para todas), opcionalmente um host, uma porta e um protocolo, e então um nível de verbosidade, uma contagem de pacotes e um formato de horário. A ferramenta monta o comando exato:

```
diagnose sniffer packet <interface> <'filtro'> <verbose> <count> <tsformat>
```

O filtro que você monta é mostrado entre aspas simples, do jeito que o FortiOS espera uma expressão estilo BPF com várias palavras, e um `host` mais um `proto` são unidos com `and`. Quando nenhuma parte do filtro está definida, é usada a palavra `none`, que captura tudo na interface. Cada argumento é explicado ao lado do comando, e as armadilhas comuns são sinalizadas enquanto você monta.

## Como decodificar um comando

Cole um comando como `diagnose sniffer packet any 'host 10.1.1.1 and tcp port 443' 4 0 l` e cada um dos cinco argumentos é lido de volta: a interface (e se `any` significa uma captura cooked do Linux que oculta o header Ethernet real), o filtro e o que ele casa, o nível de verbosidade e exatamente o que ele imprime, a contagem de pacotes e o formato de horário. A forma abreviada `diag sniff packet` também é aceita, e um comando com a contagem ou o horário finais omitidos ainda é decodificado, porque esses argumentos são opcionais no equipamento.

## Verbosidade, horários e as armadilhas

A verbosidade do FortiOS vai de 1 a 6. Os níveis 1 a 3 adicionam progressivamente mais do pacote (headers, depois o payload IP, depois o frame Ethernet completo); os níveis 4 a 6 fazem o mesmo, mas adicionalmente imprimem o nome da interface que cada pacote usou, que é o que você quer com `any`. A saída no nível Ethernet (verbose 3 ou 6) pode ser convertida em um `.pcap` para o Wireshark com o script `fgt2eth.pl` da Fortinet. O argumento de horário é `a` para UTC absoluto, `l` para horário local absoluto, ou omitido para um tempo relativo desde o início da captura; a ferramenta avisa que um horário relativo não pode ser correlacionado entre capturas paralelas. Ela também sinaliza os dois motivos clássicos de uma captura não mostrar nada: as tags de VLAN são removidas em `any` e em interfaces VLAN com verbosidade alta, e sessões com offload em hardware (NP/SoC) contornam totalmente o sniffer do kernel, então você pode precisar de `set auto-asic-offload disable` na política de firewall correspondente durante o diagnóstico.

## Escopo e fundamentação

Isto monta e explica texto de comando; nunca roda um sniffer, abre um socket ou busca nada, e a mesma entrada sempre produz a mesma saída. Modela a gramática do comando e a semântica documentada de verbosidade e horário; não captura nem analisa pacotes ao vivo. Cada fato vem da seção do Guia de Administração do FortiGate sobre executar uma captura, da referência de CLI do FortiOS para `diagnose sniffer packet` e da orientação de diagnóstico da comunidade Fortinet. Nada do que você digita ou cola sai da página.

## Compartilhar resultado

Abaixo da caixa do comando, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o modo aberto depois do `#`: no modo de montar, o formulário como valores com nome, sempre todos os campos (`iface`, `host`, `port`, `proto`, `verbose`, `count`, e `timestamp` como `a` ou `l`, de fora quando é relativo); no modo de decodificar, o comando colado como `input`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A interface e o filtro citam interfaces e hosts da sua rede, então o popover traz uma linha de cuidado nos dois modos. O formulário de montar não tem segredo; a caixa de decodificar aceita qualquer texto, então, antes de oferecer um link, a caixa é verificada em busca de uma credencial que o FortiOS ou um padrão define: uma linha `set` de um setting que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e os demais; lida em 2026-11-01) ou o `name` de uma community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5), qualquer valor `ENC` (aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), lido em 2026-11-01: esses dados postados onde outros leem "should currently be considered "easy to decrypt""), um par `psksecret=` ou `password=` com os mesmos nomes numa linha de diretiva, uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma senha numa URL ou um access key ID da AWS. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo, então o que você compartilha é exatamente o que escolheu (um valor nunca é trocado dentro de uma caixa colada, o que mudaria o que foi enviado). Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O modo de quem mandou abre e os campos dele são preenchidos (os do outro modo ficam como estavam), e a página monta ou decodifica como ao digitar; nada é capturado ou rodado. Um link que mistura os dois modos, um nível, protocolo ou timestamp que o formulário não oferece, ou uma contagem que não é número inteiro fazem o link inteiro ser ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
