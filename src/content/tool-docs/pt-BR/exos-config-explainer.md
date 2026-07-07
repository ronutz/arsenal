## O que faz

Cole uma configuração ExtremeXOS (EXOS, hoje com a marca Switch Engine) e isto a lê de volta sem tocar em um switch: uma explicação em português claro de cada comando, um resumo agregado das VLANs e os comandos agrupados por categoria. O EXOS difere do Cisco IOS ou do FortiOS em um aspecto estrutural que torna um explicador genuinamente útil: ele não tem sub-modos de interface. Cada linha é um comando imperativo autossuficiente, então uma configuração se lê como uma lista plana em vez de blocos aninhados. Esta ferramenta roda inteiramente no seu navegador e é fundamentada na Referência de Comandos do ExtremeXOS.

## O modelo de comandos

Todo comando EXOS começa com um de seis verbos agindo sobre um objeto nomeado: `create` (criar uma nova VLAN, conta ou domínio STP), `configure` (definir uma propriedade em algo que já existe, o verbo de trabalho), `enable` e `disable` (ligar e desligar um recurso ou objeto), `delete` (remover um objeto) e `unconfigure` (redefinir parte da configuração para o padrão). Como não há aninhamento de modos, você lê cada linha por si só. A ferramenta rotula cada comando com seu verbo e categoria para que a estrutura fique visível de relance.

## VLANs e portas

Os comandos EXOS mais comuns montam VLANs e atribuem portas, e a ferramenta os agrega em um resumo por VLAN. Ela acompanha `create vlan <nome> tag <id>`, `configure vlan <nome> add ports <lista> tagged|untagged` e `configure vlan <nome> ipaddress <ip>` por toda a configuração, e então mostra cada VLAN com sua tag, suas portas tagged e untagged, e qualquer endereço IP. Duas regras da documentação são destacadas quando relevantes: portas tagged carregam a tag 802.1Q e podem pertencer a muitas VLANs (um trunk), enquanto uma porta untagged pode pertencer a apenas uma VLAN e deve primeiro ser removida da VLAN Default. As portas são escritas como slot:porta em switches empilhados e modulares (por exemplo 1:1, 2:24) e como números simples em um switch stand-alone.

## Camada 3, agregação de links e o resto

Atribuir um endereço IP a uma VLAN a torna uma interface roteada, mas o switch ainda precisa de `enable ipforwarding` para rotear entre interfaces, então a ferramenta avisa quando uma VLAN tem um IP mas nenhum comando ipforwarding foi visto. A agregação de links tem um nome e uma forma específicos do EXOS: um LAG é um grupo "sharing" criado com `enable sharing <porta-mestre> grouping <lista>` e referenciado pela sua porta mestre, o que a ferramenta destaca. Rotas estáticas (`configure iproute add default`), spanning tree (`create stpd`, `configure stpd add vlan`), contas locais (`create account <papel> <nome>`) e serviços de gerenciamento (SNMP, SNTP, DNS, logging, LLDP) são cada um reconhecidos, explicados e agrupados sob sua categoria.

## Escopo e fundamentação

Isto analisa e explica; nunca se conecta a um switch, executa um comando ou busca nada, e a mesma entrada sempre produz a mesma saída. Modela a gramática dos comandos e reconhece os comandos comuns; não é um analisador completo do ExtremeXOS, e um comando incomum ou mais novo que ele não reconheça é mostrado com uma explicação genérica em vez de uma errada. Cada fato vem da Referência de Comandos do ExtremeXOS e do guia do usuário do Switch Engine. Nada do que você cola sai da página.
