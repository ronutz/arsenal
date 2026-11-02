## O que faz

O Virtual Router Redundancy Protocol (VRRP) deixa vários roteadores de uma LAN dividirem um único endereço de default gateway. Um deles, o Active Router, encaminha pelo endereço virtual e manda um ADVERTISEMENT a cada intervalo; os outros, os Backups, esperam, e o primeiro que deixa de ouvir ADVERTISEMENTs assume. Quanto dura essa espera, quem ganha e qual MAC os hosts enxergam, tudo isso a norma fixa, e esta calculadora faz as contas com valores exatos, em três modos:

- **Timers.** Para a prioridade de um roteador e o intervalo de advertisement: o Skew_Time e o tempo que um Backup espera antes de declarar o Active Router morto, com a conta à vista, e quando um Backup com essa prioridade assume depois de uma falha silenciosa e depois de um desligamento ordenado.
- **Eleição.** Para dois a oito roteadores, cada um com nome, prioridade, endereço primário e a indicação de quem é dono do endereço virtual, com a Preempt_Mode ligada ou desligada: quem vira o Active Router e por quê, quem assume quando ele cai sem aviso ou é desligado de forma ordenada e quanto isso leva, o que acontece quando ele volta, e os timers de cada roteador.
- **MAC virtual.** Para um Virtual Router Identifier (VRID) e uma família de endereços: o MAC do Virtual Router em três notações.

As regras são as da [RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), o VRRP versão 3 para IPv4 e IPv6 (abril de 2024), que substitui a RFC 5798, que por sua vez tinha substituído a RFC 3768 ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abstract). Um seletor no alto do formulário troca para o VRRPv2, com as regras da [RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt) (abril de 2004, substituída pela RFC 5798 e hoje pela RFC 9568), para os equipamentos antigos que ainda o usam. Tudo é calculado no seu navegador, e nada é arredondado.

## Nomes: Active ou Master

A RFC 9568 renomeou o roteador que encaminha: "The term for the VRRP Router assuming forwarding responsibility has been changed to "Active Router" to be consistent with IETF inclusive terminology", troca feita por linguagem inclusiva ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), seção 1.1). A espera dele é o Active_Down_Interval, contado pelo Active_Down_Timer. A RFC 3768, e a RFC 5798 antes de a RFC 9568 substituí-la, dizem Master, Master_Down_Interval e Master_Down_Timer, e muita saída de roteador ainda diz. A página usa as palavras de cada versão: Active Router e Active_Down_Interval no VRRPv3, Master e Master_Down_Interval no VRRPv2.

## Timers: as entradas

- **Versão do VRRP**: VRRPv3 (RFC 9568) ou VRRPv2 (RFC 3768).
- **Prioridade**: um número inteiro de 1 a 255. "The priority value for the VRRP Router that owns the IPvX address associated with the Virtual Router MUST be 255 (decimal)", o dono do endereço usa 255, e "VRRP Routers backing up a Virtual Router MUST use priority values between 1-254 (decimal). The default priority value for VRRP Routers backing up a Virtual Router is 100 (decimal)", os Backups usam de 1 a 254, com default 100 ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), seção 5.2.4). Quatro atalhos preenchem o campo: 255 (o owner), 254, 100 (o default) e 1.
- **Intervalo de advertisement**: no VRRPv3, centissegundos, ou um tempo com unidade: `100`, `1 s`, `250 ms`, `0.5 s`. O campo tem 12 bits de centissegundos ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), seção 5.2.7), e a errata verificada 8301 deixa a faixa explícita: "Configurable value in the range 1-4095 (centiseconds). Default is 100 centiseconds (1 second)", de 1 a 4095 centissegundos, default 100 ([errata da RFC 9568](https://www.rfc-editor.org/errata/rfc9568)). No VRRPv2, segundos inteiros de 1 a 255: o campo Adver Int tem 8 bits e "indicates the time interval (in seconds) between ADVERTISEMENTS. The default is 1 second", em segundos, default de 1 segundo ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), seções 5.1 e 5.3.7). Em branco vale o default da versão. Use ponto como separador decimal no campo.

## Timers: o que calcula

No VRRPv3, as fórmulas da [RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), seção 6.1, em centissegundos:

```text
Skew_Time            = (((256 - Priority) * Active_Adver_Interval) / 256)
Active_Down_Interval = (3 * Active_Adver_Interval) + Skew_Time
```

O Active_Adver_Interval é o intervalo que o Backup lê nos ADVERTISEMENTs do Active Router; o "initial value is the same as Advertisement_Interval", o valor inicial é a configuração do próprio Backup (seção 6.1), e o Backup passa ao valor anunciado sempre que aceita um ADVERTISEMENT (seção 6.4.2). A página mostra as duas fórmulas com os seus números: na prioridade 100 e com 100 cs, (256 - 100) x 100 = 15.600, dividido por 256 dá 60,9375 cs, e 3 x 100 + 60,9375 dá 360,9375 cs, 3,609375 segundos.

No VRRPv2, as fórmulas da [RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), seção 6.1, em segundos:

```text
Skew_Time            = ( (256 - Priority) / 256 )
Master_Down_Interval = (3 * Advertisement_Interval) + Skew_time
```

As duas versões diferem em mais do que a unidade. No VRRPv3 o skew é uma fração do intervalo; no VRRPv2 é uma fração de um segundo, seja qual for o intervalo. No default de 1 segundo as duas dão os mesmos números, mas com 3 segundos um Backup VRRPv2 de prioridade 100 espera 9,609375 s, enquanto um Backup VRRPv3 com 300 cs espera 1082,8125 cs (10,828125 s). Por isso as duas nunca se misturam numa mesma conta: um intervalo em centissegundos ou milissegundos no VRRPv2 é recusado, assim como uma fração de segundo.

**Valores exatos.** Todo timer é um número inteiro de 256 avos da unidade da versão, então tem um decimal exato, e a página o mostra inteiro: 0,78125 cs na prioridade 254, 99,609375 cs na prioridade 1. A RFC não define arredondamento; cada implementação guarda os timers na própria resolução, então a tela de um roteador pode mostrar um número arredondado.

**Quando um Backup com essa prioridade assume.**

- **Depois de uma falha silenciosa.** O Active Router para, e o Active_Down_Timer do Backup, o "Timer that fires when a VRRP Advertisement has not been received for Active_Down_Interval", o timer que dispara quando nenhum advertisement chega durante o Active_Down_Interval ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), seção 6.2), dispara um Active_Down_Interval depois do último ADVERTISEMENT que ele ouviu. Contado a partir da própria falha, isso dá entre um intervalo a menos que o Active_Down_Interval (a falha caiu logo antes do próximo ADVERTISEMENT) e o Active_Down_Interval inteiro (caiu logo depois de um): de 2,609375 s a 3,609375 s na prioridade 100 com 1 s.
- **Depois de um desligamento ordenado.** O Active Router que é desligado manda "an ADVERTISEMENT with Priority = 0", um ADVERTISEMENT com prioridade 0 (seção 6.4.3), e o Backup que o recebe põe o timer "to Skew_Time", no Skew_Time (seção 6.4.2): 0,609375 s na prioridade 100 com 1 s.

Os atrasos de propagação e de processamento não entram na conta, nem o tempo que switches e hosts levam para seguir o MAC virtual até a nova porta.

**Prioridade 255.** Os timers do owner são calculados, mas ele nunca espera por eles numa rede que funciona: na partida, o roteador com prioridade 255 manda um ADVERTISEMENT e faz a transição "to the {Active} state", para o estado Active, na hora (seção 6.4.1), e faz preemption sobre qualquer prioridade menor, "independent of the setting of this flag", diga o que disser a flag (seção 6.1). Ele só esperaria como Backup se um segundo roteador também usasse 255, e "only a single VRRP Router on the link SHOULD be configured with priority 255", só um roteador do link deve usar 255 (seção 8.3.2).

**Intervalos abaixo de um segundo.** Abaixo de 100 cs a página acrescenta o aviso da própria RFC 9568: um atraso de fila maior que o intervalo pode fazer um Backup se promover e voltar atrás, e "this process can repeat many times per second, causing a significant disruption of traffic", o vaivém se repete várias vezes por segundo (seção 2.5).

## Eleição: as entradas

- **Versão do VRRP** e **intervalo de advertisement**, como acima; o intervalo é o mesmo em todos os roteadores.
- **Preempt_Mode**: ligada (o default) ou desligada, igual em todos os roteadores. "Controls whether a (starting or restarting) higher-priority Backup Router preempts a lower-priority Active Router. Values are True to allow preemption and False to prohibit preemption. Default is True.", isto é, decide se um Backup de prioridade maior que sobe ou volta toma o lugar de um Active Router de prioridade menor, e o default é True ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), seção 6.1).
- **De dois a oito roteadores**, cada um com:
  - um **nome**: até 32 letras, dígitos, pontos, hífens ou sublinhados, sem espaços; um nome em branco vira R1, R2 e assim por diante;
  - uma **prioridade**, de 1 a 254, ou 255 para o owner;
  - o **endereço primário**: no IPv4, "an IPv4 address selected from the set of real interface addresses", um dos endereços reais da interface, e "In IPv6, the link-local address of the interface over which the packet is transmitted is used", no IPv6 vale o link-local da interface ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), seção 1.7), então um endereço primário IPv6 tem de estar em fe80::/10 ([RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.txt), seção 2.5.6);
  - **Dono do endereço virtual**: marcado no roteador cujo endereço real de interface é o endereço virtual. Marcar põe a prioridade em 255.

## Eleição: as regras que aplica

A página roda a máquina de estados da RFC 9568 (seção 6.4) por quatro momentos, com todos os roteadores subindo juntos e todo ADVERTISEMENT chegando na hora:

1. **Na partida.** O owner manda um ADVERTISEMENT e faz a transição "to the {Active} state" na hora; todos os outros sobem como Backup, com o Active_Down_Timer no Active_Down_Interval (seção 6.4.1). Sem owner, a maior prioridade tem o menor Active_Down_Interval, então o timer dela dispara primeiro e ela vira Active; os outros aceitam o ADVERTISEMENT dela, de prioridade maior que a sua, e continuam Backup (seção 6.4.2).
2. **Uma falha silenciosa do Active Router.** O melhor Backup que sobrou assume quando o próprio timer dispara, com os tempos do modo Timers.
3. **Um desligamento ordenado do Active Router.** O ADVERTISEMENT de prioridade 0 põe o timer de cada Backup no próprio Skew_Time, e o melhor Backup que sobrou, com o menor skew, assume primeiro.
4. **A volta dele.** O owner volta a ser Active na hora, diga o que disser a Preempt_Mode. Qualquer outro roteador sobe como Backup: um Backup reinicia o timer ao receber um ADVERTISEMENT "If Preempt_Mode is False, or if the Priority in the ADVERTISEMENT is greater than or equal to the local Priority", com a preemption desligada ou quando a prioridade anunciada é maior ou igual à sua, e o descarta nos outros casos (seção 6.4.2). Assim, com a Preempt_Mode ligada e uma prioridade maior, ele ignora os ADVERTISEMENTs do Active Router atual, o próprio timer dispara um Active_Down_Interval depois que ele sobe, e ele assume; o Active Router atual, ao receber uma prioridade maior, volta a Backup (seção 6.4.3). Com a Preempt_Mode desligada, ou com a mesma prioridade do Active Router atual, ele continua Backup.

**Empates.** Dois Backups com a mesma prioridade mais alta estouram o timer juntos e os dois viram Active. Um Active Router volta a Backup quando "the Priority in the ADVERTISEMENT is equal to the local Priority and the primary IPvX address of the sender is greater than the local primary IPvX address (based on an unsigned integer comparison of the IPvX addresses in network byte order)", isto é, com prioridade igual e endereço primário maior do outro lado, comparado como inteiro sem sinal (seção 6.4.3), então quem tem o maior endereço primário continua Active. A comparação é numérica: 192.0.2.10 ganha de 192.0.2.9, e fe80::1:0 ganha de fe80::ff. O endereço só desempata entre Active Routers, e é por isso que um roteador que volta com a mesma prioridade do Active Router atual continua Backup, mesmo com endereço maior. Quando dois roteadores têm a mesma prioridade a página avisa, porque a RFC 9568 pede que "all Virtual Routers SHOULD be configured with different priorities and with sufficient differences in the priorities", prioridades diferentes e com diferenças suficientes (seção 8.3.2).

O resultado é o veredito (quem é Active e por quê), os quatro momentos em ordem com a regra e o tempo de cada um, e uma tabela dos roteadores na ordem da eleição com o Skew_Time e o Active_Down_Interval de cada um.

## MAC virtual

"IPv4 case: 00-00-5E-00-01-{VRID} (in hex, in network byte order)" e "IPv6 case: 00-00-5E-00-02-{VRID} (in hex, in network byte order)": "The first three octets are derived from the IANA's Organizationally Unique Identifier (OUI)", os três primeiros octetos vêm do OUI da IANA, os dois seguintes são o bloco atribuído ao VRRP para a família, e o último é o VRID ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), seção 7.3). O VRID é "Configurable value in the range 1-255 (decimal). There is no default", de 1 a 255, sem default (seção 6.1). A página escreve o endereço de três jeitos: com hífens, como a RFC escreve (00-00-5E-00-01-0A); com dois-pontos (00:00:5e:00:01:0a); e em três grupos de quatro separados por pontos (0000.5e00.010a). Também dá o último octeto em hexadecimal e o destino dos ADVERTISEMENTs: 224.0.0.18 no IPv4, ff02::12 no IPv6, protocolo IP 112 (seções 5.1.1 e 5.1.2). O VRRPv2 usa o mesmo bloco IPv4 ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), seção 7.3) e não tem bloco IPv6.

O Active Router responde ao ARP e às Neighbor Solicitations do endereço virtual com esse MAC, "The Active Router MUST NOT respond with its physical MAC address", nunca com o MAC físico, o que "allows the host to always use the same MAC address, regardless of the current Active Router", o host usa sempre o mesmo MAC, seja quem for o ativo (seções 8.1.2 e 8.2.2).

## O que recusa, e por quê

- **Prioridade 0.** Nunca é configurada: "The priority value zero (0) has special meaning, indicating that the current Active Router has stopped participating in VRRP. This is used to trigger Backup Routers to quickly transition to the Active Router without having to wait for the current Active_Down_Interval", o 0 indica que o Active Router atual saiu do VRRP e serve para os Backups assumirem rápido, sem esperar o Active_Down_Interval ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), seção 5.2.4). A página explica isso e pede de 1 a 254, ou 255 para o owner.
- **Prioridade acima de 255**, que o campo de 8 bits não comporta, e qualquer coisa que não seja um número inteiro.
- **Um owner com prioridade diferente de 255**, e **prioridade 255 num roteador não marcado como owner** (a seção 6.1 a reserva).
- **Dois owners.** Só um SHOULD existir (seção 8.3.2). No texto publicado, a seção 7.1 faz o roteador que é owner descartar qualquer ADVERTISEMENT, então dois owners ficam ativos juntos; a errata verificada 8298 muda essa verificação para o maior endereço primário vencer. O resultado depende de qual texto a implementação segue, então a página não chuta.
- **VRID 0 ou acima de 255**, e um VRID em hexadecimal: o VRID entra em decimal.
- **Um intervalo de 0**, que a errata verificada 8301 exclui porque um intervalo zero faz todo Backup estourar o timeout na hora; **acima de 4095 cs** (40,95 s) no VRRPv3 ou **acima de 255 s** no VRRPv2; e **uma fração da unidade da versão** (255 ms são 25,5 cs).
- **Contas misturadas de VRRPv2 e VRRPv3**: um intervalo em centissegundos ou milissegundos no VRRPv2, e IPv6 no VRRPv2, que "is intended for use with IPv4 routers only", é feito só para roteadores IPv4 ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), seção 1.2).
- **Roteadores que misturam IPv4 e IPv6** (um Virtual Router é de uma família só, RFC 9568, Abstract), **um endereço primário IPv6 que não é link-local**, **dois roteadores com o mesmo endereço primário** (comparado por valor, então fe80::1 e fe80:0:0:0:0:0:0:1 são o mesmo), dois roteadores com o mesmo nome, menos de dois ou mais de oito roteadores, e um endereço com tamanho de prefixo ou com zona.

## Exemplos resolvidos

Os Exemplos são o laboratório de VRRP do capítulo 4.2 do curso aberto [LAN Switch Operations and Maintenance](/materials/lan-switch-operations-and-maintenance): VRID 10 na VLAN 10, o gateway virtual 10.1.10.1, o SW-CORE-01 com prioridade 110 e 10.1.10.2 e o SW-CORE-02 com prioridade 100 e 10.1.10.3, preemption ligada, intervalo de um segundo.

- **Timers**, prioridade 100 com 100 cs: Skew_Time de 60,9375 cs (0,609375 s), Active_Down_Interval de 360,9375 cs (3,609375 s). Um link cortado leva o gateway de 2,609375 s a 3,609375 s depois da falha, os "cerca de 3,6 s" do laboratório; um desligamento ordenado leva 0,609375 s depois do ADVERTISEMENT de prioridade 0, os "cerca de 0,6 s" do laboratório.
- **Eleição**: o SW-CORE-01 tem a prioridade maior e vira o Active Router 357,03125 cs (3,5703125 s) depois que os dois sobem; se ele cai, o SW-CORE-02 assume como acima; quando o SW-CORE-01 volta com a preemption ligada, ele retoma o papel 3,5703125 s depois de subir. Com a preemption desligada ele continua Backup, que é a dica que fecha o laboratório.
- **MAC virtual**, VRID 10, IPv4: 00-00-5E-00-01-0A, o endereço que os hosts do laboratório aprendem para 10.1.10.1.
- **A tabela do artigo**, com 100 cs: a prioridade 254 espera 300,78125 cs, a 200 espera 321,875 cs, a 1 espera 399,609375 cs; com 1 cs, um Backup de prioridade 254 espera 3,0078125 cs, uns 30 milissegundos.
- **Os limites**: com 4095 cs, um Backup de prioridade 1 espera 16.364,00390625 cs (163,6400390625 s); um Backup VRRPv2 de prioridade 1 com 255 s espera 765,99609375 s.
- **Um empate**: dois roteadores com prioridade 100 e os endereços 192.0.2.2 e 192.0.2.3 viram Active depois de 3,609375 s, e o 192.0.2.3 continua Active; se ele cai, o 192.0.2.2 assume, e quando o 192.0.2.3 volta ele continua Backup, com ou sem preemption.

## O que não faz

Não conversa com roteador nenhum: as prioridades, os endereços e o intervalo são seus. A conta supõe que todos os roteadores têm o mesmo intervalo e a mesma Preempt_Mode, que sobem juntos e que os ADVERTISEMENTs chegam sem atraso. Tracking (baixar a prioridade quando um uplink cai), atrasos de preemption, Accept_Mode, o gratuitous ARP e a rapidez com que os switches reaprendem o MAC, a convivência entre VRRPv2 e VRRPv3 (RFC 9568, seção 8.4) e o HSRP ficam de fora. Os defaults e os comandos dos fabricantes não estão incluídos: para isso, leia a documentação do fabricante e os slides de fabricante do curso. Para encadear falhas e retornos passo a passo, use o laboratório de eleição do artigo [Redundância de first hop](/learn/first-hop-redundancy-vrrp-and-hsrp).

## Compartilhar resultado

Abaixo do veredito, o **Compartilhar resultado** monta um link para esta página, só quando você clica, que leva o modo, a versão e os campos do modo mostrado, como foram digitados, depois do `#`: `mode` (`timers`, `election` ou `mac`) e `version` (`3` ou `2`) sempre; no modo Timers, `priority`, e `interval` quando digitado; no modo Eleição, `routers`, um roteador por linha no formato `<nome> <prioridade> <endereço>`, com ` owner` depois do owner e `*` para um campo em branco, `preempt` (`1` ou `0`), e `interval` quando digitado; no modo MAC virtual, `vrid` e `family` (`ipv4` ou `ipv6`). Os campos dos outros modos não vão. No modo Eleição o popover acrescenta um aviso: nomes de roteadores e endereços primários descrevem uma rede privada, então confira antes de mandar o link.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-02) diz que o fragmento é "separated from the rest of the URI prior to a dereference", separado do resto da URI antes da requisição, então esses valores não vão para o servidor quando o link é aberto; eles ficam na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link pode lê-los.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para tudo o que vem depois do `#`; esses campos são bem mais curtos.
- **Ao abrir um link.** O modo, a versão e os campos do modo são preenchidos como a digitação os preencheria (um intervalo que o link não traz fica em branco, o que significa o default; sem `preempt`, vale ligada), os outros modos mantêm os seus valores, e a página calcula. Um link com modo, versão, valor de `preempt` ou família desconhecidos, um campo de outro modo, um campo obrigatório ausente, um valor em duas linhas (fora a lista de roteadores), ou uma lista de roteadores que não tenha de duas a oito linhas de três ou quatro palavras é ignorado. Aceitos ou não, os valores saem na hora do endereço da própria página, sem requisição nenhuma, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da página não leva nada que você não tenha escolhido compartilhar de novo.

## Procedência

O motor é aritmética fixa e uma leitura fixa da máquina de estados, sem relógio, sem rede e sem aleatoriedade. Ele traz 133 golden vectors (conjunto `vrrp-timer-calculator-golden-2026-11-02`): 26 linhas de timers (prioridades 1, 100, 200, 254 e 255 no intervalo default, com 1 cs e com 4095 cs, e o VRRPv2 com 1 s e 255 s), 14 eleições, 12 MACs virtuais, os três Exemplos, grafias e defaults do intervalo, as frases que carregam as regras e 51 recusas. Cada número esperado e cada resultado de eleição veio de uma implementação separada, não da execução deste motor: os timers pelas fórmulas das RFCs com as frações exatas do Python, e as eleições por uma simulação de eventos discretos da máquina de estados da RFC 9568 (timers, ADVERTISEMENTs, prioridade 0, preemption e o desempate por endereço) pelos quatro momentos, com a comparação de endereços do próprio Python. As erratas foram lidas no mesmo dia: a RFC 9568 tem seis erratas verificadas, das quais a 8301 (a faixa de 1 a 4095) e a 8298 (dois owners) moldam esta ferramenta, e as outras (7947 e 7949 sobre o gratuitous ARP, 8299 e 8300 sobre verificações de recepção) não mexem em timer nenhum; a RFC 3768 não tem nenhuma.

## API

O mesmo motor responde em `/api/v1/vrrp-timer-calculator` na API HTTP do site; o contrato está na [página da API](/api), que também diz se este site serve a API.

- **Requisição.** Um objeto JSON. Timers: `{"mode": "timers", "version": 3, "priority": 100, "interval": "100"}`; `version` (3 por default) e `interval` (o default quando ausente) são opcionais, e um intervalo sem unidade está na unidade da versão. Eleição: `{"mode": "election", "version": 3, "interval": "100", "preempt": true, "routers": [{"name": "SW-CORE-01", "priority": 110, "address": "10.1.10.2"}, {"name": "SW-CORE-02", "priority": 100, "address": "10.1.10.3"}]}`; `preempt` (true por default), `name` e `owner` (false por default) são opcionais, e a `priority` de um owner pode ficar de fora. MAC virtual: `{"mode": "mac", "vrid": 10, "family": "ipv4"}`.
- **Resposta, timers.** `mode`, `version`, `unit` (`cs` ou `s`), `names` (`rfc`, `interval`, `down`, `downTimer`, `activeRole`, `activeState`), `priority`, `owner`, `interval`, `intervalSeconds`, `intervalDefault`, `skewTime`, `skewTimeSeconds`, `downInterval`, `downIntervalSeconds`, `skewNumerator`, `arithmetic` (`skew`, `down`: as fórmulas com os valores, como `Skew_Time = ((256 - 100) * 100) / 256 = 15600 / 256 = 60.9375 cs`), `failover` (`silentFrom`, `silentTo`, `shutdown` e os respectivos `...Seconds`; null para a prioridade 255), `warnings` e `notes`. Todo tempo é texto decimal exato, com "." como separador.
- **Resposta, eleição.** `mode`, `version`, `unit`, `names`, `family`, `preempt`, `preemptDefault`, `interval`, `intervalSeconds`, `intervalDefault`, `routers` (cada um: `index`, `name`, `priority`, `address`, `owner`, `rank`, `startState`, `skewTime`, `skewTimeSeconds`, `downInterval`, `downIntervalSeconds`), `ranking`, `active`, `activeReason` (`owner`, `priority` ou `address-tie`), `steps` (quatro: `event` `start`, `failure`, `shutdown` ou `return`; `outcome`; `active`, `activeName`, `subject`, `tied`, `after`, `afterSeconds`, `from`, `fromSeconds`, `text`), `verdictText`, `warnings` e `notes`.
- **Resposta, MAC virtual.** `mode`, `version`, `family`, `vrid`, `vridHex`, `block`, `hyphen`, `colon`, `dotted`, `multicastGroup`, `ipProtocol` e `notes`.
- **Erros.** HTTP 400, `invalid_input`, com a mensagem do motor (em inglês), por exemplo `Priority 0 is never configured: RFC 9568 reserves it for the Active Router to indicate it is relinquishing responsibility for the Virtual Router. ...`.

## Fontes

- [RFC 9568, Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, abril de 2024](https://www.rfc-editor.org/rfc/rfc9568.txt) (lida em 2026-11-02): seções 1.1, 1.7, 2.5, 5.1, 5.2.4, 5.2.7, 6.1 a 6.4, 7.3, 8.1.2, 8.2.2 e 8.3.2. Proposed Standard que substitui a RFC 5798; nem substituída nem atualizada
- [Errata da RFC 9568](https://www.rfc-editor.org/errata/rfc9568) (lida em 2026-11-02): seis erratas verificadas; a 8301 (Advertisement_Interval de 1 a 4095 centissegundos) e a 8298 (um owner que recebe ADVERTISEMENTs) se aplicam aqui
- [RFC 3768, Virtual Router Redundancy Protocol (VRRP), abril de 2004](https://www.rfc-editor.org/rfc/rfc3768.txt) (lida em 2026-11-02): VRRP versão 2, seções 1.2, 5.1, 5.3.7, 6.1, 6.4 e 7.3. Draft Standard substituída pela RFC 5798, que a RFC 9568 substituiu; lida só para equipamentos antigos; [página de errata](https://www.rfc-editor.org/errata/rfc3768): nenhuma errata
- [RFC 4291, IP Version 6 Addressing Architecture, fevereiro de 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (lida em 2026-11-02): seções 2.2 e 2.5.6
- [RFC Editor, índice de RFCs (XML)](https://www.rfc-editor.org/rfc-index.xml) (lido em 2026-11-02): o status da RFC 9568, da RFC 5798 (substituída pela RFC 9568), da RFC 3768 (substituída pela RFC 5798) e da RFC 4291
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-11-02): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
