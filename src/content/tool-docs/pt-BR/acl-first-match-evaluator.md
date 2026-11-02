## O que ela faz

Cole uma access list IPv4 do Cisco IOS ou IOS XE do jeito que você copiaria de uma configuração, descreva um pacote, e a ferramenta diz qual entrada decide. Cada entrada testada antes dessa aparece com o primeiro campo que a descartou (protocolo, endereço de origem, porta de origem, endereço de destino, porta de destino, `established` ou `fragments`); quando nada dá match, o pacote chega ao deny implícito. Um lint lê a lista inteira, com ou sem pacote. Tudo é calculado no seu navegador a partir do texto colado; nada é aplicado a equipamento nenhum.

O escopo é proposital: **a v1 lê só a sintaxe IPv4 do Cisco IOS e do IOS XE.** O fim da lista é comportamento de plataforma, não padrão: o Juniper EX termina todo filtro com um descarte implícito, enquanto o Extreme Switch Engine e o Fabric Engine permitem o que não deu match em nenhuma regra. O [artigo sobre ACLs](/learn/access-control-lists-on-switches-and-routers) coloca as plataformas lado a lado, com as fontes.

## O que ela lê

- **Listas numeradas**: linhas `access-list`, padrão de 1 a 99 e de 1300 a 1999, estendidas de 100 a 199 e de 2000 a 2699, e as linhas `remark` delas.
- **Listas nomeadas**: um bloco `ip access-list standard NOME` ou `ip access-list extended NOME`, entradas com ou sem número de sequência, linhas `remark`. O nome começa com uma letra; um número da faixa certa nomeia a mesma lista que as linhas `access-list` desse número. Várias listas num só texto são lidas; botões escolhem a que vai ser avaliada.
- **Endereços**: `any` (0.0.0.0 255.255.255.255), `host A` (A 0.0.0.0), um endereço e o wildcard dele e, numa entrada padrão, um endereço sozinho, que leva 0.0.0.0 como máscara. Os bits 1 do wildcard são ignorados e não precisam ser contíguos.
- **Protocolos**: `ip` (todos os protocolos), um número de 0 a 255, e as palavras-chave cujo número uma fonte dá: `icmp` 1, `igmp` 2, `tcp` 6, `udp` 17, `gre` 47, `esp` 50, `eigrp` 88, `pim` 103 (IANA, a mesma palavra-chave) e `ospf` 89 (RFC 2328). A Cisco também aceita `ahp`, `ipinip`, `nos` e `pcp`; nenhuma fonte lida dá o número deles, então uma linha que use um deles aparece com esse motivo, e dá para escrever o número no lugar.
- **Portas**, só depois de `tcp` ou `udp`: `eq` e `neq` com até 10 portas, `lt`, `gt` e `range` (inclusivo). Um operador depois da origem testa a porta de origem; depois do destino, a porta de destino. Uma porta é um número de 0 a 65535 ou um nome da lista TCP ou UDP do modelo de dados do IOS XE 17.18.1 da Cisco (`www` é TCP 80, `domain` é 53 nos dois, `snmp` é UDP 161 ...); um nome TCP só funciona com `tcp`, um nome UDP só com `udp`.
- **Opções**: `established` (só TCP: o match exige ACK ou RST ligado), `fragments` (a entrada vale só para fragmentos não iniciais), `log` e `log-input`.

As linhas que ela não lê aparecem abaixo do resultado, com o motivo, nunca descartadas: object groups, tipos de mensagem ICMP e IGMP, `dscp`, `precedence`, `tos`, `time-range`, `option`, `ttl`, flags TCP além de `established`, entradas `dynamic` e reflexivas, nomes de host, comandos `no`, `ip access-list resequence`, `ip access-group` (onde a lista é aplicada) e saída do `show access-lists`. Quando uma dessas linhas tem cara de entrada, o resultado avisa que o veredito cobre só as entradas que foram lidas.

## O passo a passo

A Cisco avalia uma lista **pelo número de sequência**, e a primeira entrada que dá match decide; nada depois dela é lido. A ferramenta testa as entradas nessa ordem:

- Uma entrada digitada sem número recebe 10 a mais que o maior número da lista dela (10 para a primeira) e vai para o fim. Um número que já está na lista é recusado (a Cisco responde `Duplicate sequence number`), e uma entrada igual a outra que já está lá, tirando o número, não muda nada; as duas aparecem como linhas não lidas.
- Numa lista **padrão**, a Cisco põe numa tabela hash as entradas que citam um único host e procura a origem nessa tabela antes de percorrer as outras entradas. O passo a passo segue essa ordem e avisa quando uma entrada de host é testada à frente de um número de sequência menor.
- Uma entrada **padrão** testa só o endereço de origem: o protocolo, o destino e as portas do pacote não contam.
- Quando nada dá match, o pacote é negado pelo deny implícito, que a Cisco documenta como o deny não escrito que termina toda access list.
- Uma lista sem entradas não ganha veredito de deny implícito: a Cisco documenta que uma interface com uma access list vazia aplicada permite todo o tráfego.

O pacote de teste é um pacote não fragmentado: uma entrada com `fragments` nunca dá match nele.

## O lint

- **Sombreada (shadowed)**: uma entrada anterior dá match em todo pacote que esta pegaria, com a ação oposta, então esta nunca decide nada.
- **Redundante**: uma entrada anterior dá match em todo pacote que esta pegaria, com a mesma ação; ou uma entrada posterior faz isso, e nenhuma entrada entre as duas decide algum desses pacotes de outro jeito. Tirá-la não muda nada.
- **Só repete o deny implícito**: uma entrada deny que nenhum permit posterior cobre em parte. Ela não muda nenhum veredito, embora o contador dela (ou o `log`) mostre o tráfego.
- **Nunca dá match**: um teste de porta que porta nenhuma passa, como `lt 0`.
- **Wildcard não contíguo**: válido na Cisco, apontado porque nenhum comprimento de prefixo consegue expressá-lo e os endereços dele não formam um bloco só.
- **Bits ignorados**: um endereço com bits ligados onde o wildcard os ignora (`10.1.1.5 0.0.0.255` dá match em 10.1.1.0/24).
- **O alcance de uma lista padrão**: as entradas dela testam só a origem, então cada uma decide por tudo o que essas origens mandam.

O lint raciocina sobre fragmentos não iniciais além de pacotes inteiros, porque a Cisco testa os dois de um jeito diferente: uma entrada deny com portas ou `established` não vale para um fragmento não inicial, e a entrada seguinte é processada. Uma entrada abaixo de um deny assim aparece, então, como sombreada "para todo pacote não fragmentado", com o motivo, em vez de simplesmente sombreada.

Todo endereço de toda entrada aparece como foi escrito, como endereço e wildcard com os bits ignorados zerados, como prefixo na notação da RFC 4632 quando o wildcard é contíguo, e com a quantidade de endereços em que dá match.

## O que ela não tem como saber

- O que o equipamento guarda. A ferramenta lê o texto colado; uma linha que ela não lê pode continuar sendo uma entrada no equipamento.
- Onde a lista está aplicada, e em que sentido. Uma porta, uma VLAN ou uma interface roteada, na entrada ou na saída, muda quais pacotes chegam à lista; o artigo explica os pontos de aplicação.
- Limites de hardware. Uma lista que lê certinho ainda pode não caber na TCAM do switch.
- Outras plataformas. A sintaxe e o fim da lista delas são outros; a v1 não lê essas plataformas.

## Exemplos

O botão Exemplo carrega a lista do laboratório do capítulo 4.3 de Operação e Manutenção de Switches LAN: permitir SSH de 10.1.10.0/24 para a rede de gerência 10.1.99.0/24, negar todo o resto para 10.1.99.0/24, permitir o restante, como `ip access-list extended MGMT-PROTECT` com os números de sequência 10, 20 e 30. O pacote dele é SSH vindo da VLAN 20 (TCP 10.1.20.25 porta 51514 para 10.1.99.10 porta 22): a entrada 10 falha no endereço de origem e a entrada 20 nega. Troque a origem para 10.1.10.25 e a entrada 10 permite; inverta as duas primeiras entradas e o SSH da VLAN 10 passa a ser negado, com o permit apontado como sombreado. Os golden vectors cobrem o primeiro match em cada campo, todos os operadores de porta nas bordas, listas padrão e estendidas, a ordem do hash, números de sequência fora de ordem, os dois tipos de redundância e as linhas não lidas; um deles é o próprio exemplo não contíguo do Extreme Fabric Engine (3.4.5.6 com 255.255.255.0 dá match em 192.168.1.6 e não em 3.4.5.7), escrito do jeito da Cisco.

## API

O mesmo motor responde à operação `/api/v1/acl-first-match-evaluator` da API HTTP do site, descrita no contrato OpenAPI da [página da API](/api), que também diz se este site serve a API.

- **Requisição.** A access list como texto (lida e com lint), ou um objeto JSON `{"acl": "...", "packet": {"protocol": "tcp", "source": "10.1.20.25", "destination": "10.1.99.10", "sourcePort": 51514, "destinationPort": 22, "ackOrRst": false}, "list": "MGMT-PROTECT"}` (e o passo a passo para esse pacote). `packet` e `list` são opcionais; as portas podem ser números ou strings.
- **Resposta.** `lists` (cada uma com `name`, `kind`, `line`, `entries`, `evaluationOrder` e `remarks`; cada entrada com `seq`, `seqGiven`, `line`, `text`, `action`, `protocol`, `source`, `sourcePort`, `destination`, `destinationPort`, `established`, `fragments`, `log` e `hashed`; cada endereço com `written`, `form`, `address`, `wildcard`, `base`, `contiguous`, `prefix`, `addresses` e `ignoredBitsSet`), `selected`, `issues` (`line`, `text`, `entryLike`, `reason`), `packet`, `packetErrors`, `steps` (`seq`, `line`, `text`, `action`, `matched`, `field`, `reason`), `verdict` (`action`, `by`: `entry`, `implicit-deny` ou `empty-list`, `seq`, `line`, `text`, `sentence`), `lint` (`kind`, `seq`, `line`, `other`, `sentence`), `notes` e `counts`. As frases vêm em inglês.
- **Erros.** HTTP 400 para uma requisição que começa com `{` mas não é JSON válido ou não tem a string `acl`, e para um texto com mais de 65.536 caracteres ou 4.000 linhas. Uma linha que não pode ser lida, ou um pacote que não pode ser lido, não é erro HTTP: `issues` e `packetErrors` dizem por quê.

## Compartilhar resultado

Abaixo do veredito, **Compartilhar resultado** monta um link para esta página, só quando você aperta, que leva a access list como foi colada (`input`) e o pacote de teste como foi digitado (`protocol`, `source`, `srcport`, `destination`, `dstport`, e `ackrst` quando a caixa está marcada), mais `list` quando você escolheu uma lista que não é a primeira, depois do `#`. O popover diz primeiro o que o link leva, depois um aviso próprio (uma access list cita redes e hosts internos e o que pode chegar até eles), e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A lista também passa pela verificação de segredos do site: um valor que é credencial pelo formato (uma senha numa URL, uma chave privada PEM, um JWT), num remark ou em qualquer outro lugar, significa nenhum link, e o popover diz a linha. Coloque um placeholder no lugar e aperte de novo.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-02) diz que o fragmento é "separated from the rest of the URI prior to a dereference", então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Abrir um link.** A lista e cada campo do pacote são preenchidos como foram digitados, e a página lê tudo; nada é contactado. Um valor do pacote que a ferramenta não consegue ler mostra a mesma mensagem que mostraria ao ser digitado. Os valores então saem do endereço da página na hora, sem requisição, então recarregar a página ou usar o botão Compartilhar dela não leva nada.

## Fontes

- [Cisco, Security and VPN Configuration Guide, Cisco IOS XE 17.x: IP Access List Entry Sequence Numbering](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-acl-seq-num.html) (lido em 2026-11-02): o primeiro match, "If no conditions match, the packet is dropped", a lista vazia, os números de sequência de 10 em 10, as duplicatas recusadas, as entradas de host da lista padrão em hash e procuradas primeiro
- [Cisco, ACLs Configuration Guide, Cisco IOS XE 17 (Catalyst 9000): Access Control Lists](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/security/acls/acls-configuration-guide/access-control-lists.html) (lido em 2026-11-02): o número de sequência "dictates the order in which ACEs are evaluated", remarks, sintaxe e faixas das listas numeradas, operadores de porta, `established`
- [Cisco IOS Security Command Reference, Commands A to C](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/a1/sec-a1-cr-book/sec-cr-a2.html) (lido em 2026-11-02): `access-list (IP extended)` e `access-list (IP standard)`: protocolos, bits de wildcard, operadores e nomes de porta, `established`, `fragments`, `log`, o deny implícito
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-acl](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-acl.yang) (lido em 2026-11-02): `eq` e `neq` com até 10 portas, números de sequência de 1 a 2147483647, remarks de 1 a 100 caracteres
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-types](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-types.yang) (lido em 2026-11-02): faixas de números de lista, nomes de porta TCP e UDP com os números
- [Cisco, End-of-Sale and End-of-Life Announcement for the Cisco IOS XE 17.18.x](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-17/ios-xe-17-18-x-eol.html) (lido em 2026-11-02): releases de manutenção até 29 de abril de 2028, correções de segurança até 30 de setembro de 2029
- [RFC 4632, Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632.txt) (lido em 2026-11-02): notação de prefixo e máscaras contíguas
- [IANA, Assigned Internet Protocol Numbers](https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv) (lido em 2026-11-02): os números de protocolo por trás das palavras-chave
- [RFC 2328, OSPF Version 2](https://www.rfc-editor.org/rfc/rfc2328.txt) (lido em 2026-11-02): "OSPF is IP protocol number 89"
- [Juniper Networks, Understanding how firewall filters are evaluated (EX Series)](https://www.juniper.net/documentation/us/en/software/junos/routing-policy/topics/concept/firewall-filter-ex-series-evaluation-understanding.html) (lido em 2026-11-02): o descarte implícito no fim de todo filtro
- [Extreme Networks, Switch Engine v33.7.1 User Guide (PDF)](https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20User%20Guide/downloads/Switch_Engine_33_7_1_User_Guide.pdf) (lido em 2026-11-02): "If a packet matches no rule entries in the ACL, it is permitted"
- [Extreme Networks, Fabric Engine v9.4 User Guide, access control lists](https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/access_control_lists.shtml) (lido em 2026-11-02): "The default action mode for ACLs is permit"
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (lido em 2026-11-02): o fragmento, em que Compartilhar resultado se apoia
