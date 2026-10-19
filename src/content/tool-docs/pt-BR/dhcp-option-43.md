# Gerador de DHCP option 43

Informe o endereço da controladora sem fio e o fabricante dos pontos de acesso, e a ferramenta devolve o valor que aquele fabricante realmente espera. Tudo roda no navegador; o endereço não sai da página.

## Por que isto não é só "converter um IP para hexadecimal"

A RFC 2132 define a option 43 como *Vendor Specific Information* e deixa o conteúdo a cargo de cada fabricante: "The definition of this information is vendor specific", ou seja, a definição é do fabricante. Ela só recomenda um formato: o fabricante que coloca mais de um item na opção "SHOULD encode the option using 'Encapsulated vendor-specific options'", uma sequência de campos de subopção, comprimento e valor. O que cada subopção significa, e como o endereço é escrito dentro dela, continua sendo escolha do fabricante. O resultado é que um único número de opção carrega pelo menos quatro codificações incompatíveis entre si, e o modo de falha quando se escolhe a errada é o pior possível: o ponto de acesso inicia, recebe endereço, lê um valor que não consegue interpretar e simplesmente nunca se registra. Nenhum erro aparece em lugar nenhum.

As quatro famílias:

**TLV binário** — Cisco e UniFi. O endereço entra como quatro bytes crus. `192.168.10.5` vira `c0a80a05`.

**TLV em ASCII** — RUCKUS. O endereço entra como *texto*, um byte por caractere, pontos incluídos. O artigo 000008703 da base de conhecimento da RUCKUS descreve a regra assim: "For each number, the ASCII translation is “3” plus the number in decimal" e "For the “.” character, the ASCII code is “2e”", ou seja, cada dígito vira 3 seguido do dígito e o ponto vira 2e; o exemplo do próprio artigo escreve `192.168.1.120` como `060d3139322e3136382e312e313230`: subopção `06`, comprimento `0d` (13 caracteres) e depois os 13 caracteres como texto. Assim, 10 escrito como byte binário é `0a`, mas escrito como texto é `31 30`. São valores diferentes e só um deles funciona para cada fabricante.

**Texto dentro da subopção 1**: ExtremeWireless. O guia de implantação da Extreme declara a subopção como `option HAP.HWC code 1 = text;` e o exemplo dele leva dois controllers num único valor, `"10.100.2.36, 10.100.2.22"`; por isso a ferramenta escreve a subopção `01`, o comprimento e depois os endereços como texto, separados por vírgula e espaço: esse exemplo vira `011831302e3130302e322e33362c2031302e3130302e322e3232`.

**Texto puro** — Aruba. Nada de hexadecimal. O servidor DHCP envia o endereço como texto, e um valor hex aqui está errado por mais cuidadosamente que tenha sido montado.

**Outra opção inteiramente** — FortiAP. Ele lê o endereço da controladora na option 138, a opção de access controller do CAPWAP: "The FortiAP acquires the IP address of an AC in DHCP option 138 (the factory default)", isto é, a 138 é o padrão de fábrica. A Fortinet também documenta que "If Option 138 is used for some other purpose on your network, you can use a different option number if you configure the AP units to match", ou seja, dá para usar outro número de opção se os APs forem configurados para ele.

## Como usar

Escolha o fabricante primeiro. A ordem é proposital: o mesmo endereço produz quatro respostas diferentes, então não existe valor com significado antes de escolher o fabricante.

Informe o IP de gerenciamento da controladora. A Cisco aceita vários, separados por espaço ou vírgula, e os codifica em ordem; os demais aceitam um.

O resultado mostra o valor e, para os fabricantes que usam hexadecimal, a montagem byte a byte — subopção, comprimento e endereço — para você conferir a aritmética em vez de confiar nela. Abaixo ficam as linhas prontas para ISC dhcpd, Cisco IOS, Windows Server e MikroTik.

## O que ele informa e uma caixa de hexadecimal não informa

**Quando a option 60 também é obrigatória.** Pontos de acesso Aruba só pedem informação específica de fabricante quando o vendor class identifier confere, então a option 43 sem a option 60 valendo `ArubaAP` não faz absolutamente nada. O ExtremeWireless também exige VCI, e ele varia conforme a geração do AP: modelos mais antigos usam `HiPath` seguido do nome do modelo, os mais novos apenas o modelo.

**Quando a resposta não é hexadecimal.** Para Aruba a ferramenta devolve texto e diz isso, porque entregar um hexadecimal de aparência plausível seria pior do que não devolver nada.

**Quando a pergunta é sobre a opção errada.** Para FortiAP ela devolve a option 138 e explica o motivo.

## Fontes

Cada perfil de fabricante foi montado a partir da documentação do próprio fabricante, e cada vetor dourado cita um documento que imprime exatamente aqueles bytes, transcritos como estão. Um vetor produzido pelo código sob teste e atribuído a um fabricante provaria apenas que o código concorda consigo mesmo, então nenhum é assim. Dois valores vêm de fontes secundárias e estão marcados como tal: um exemplo Cisco de um repositório da comunidade no Cisco Code Exchange e um exemplo RUCKUS de um post da comunidade RUCKUS. A base de conhecimento da RUCKUS dá a subopção apenas como "03 or 06"; a atribuição do 3 à ZoneDirector vem de um post da comunidade RUCKUS, por isso o vetor da ZoneDirector fixa só os dois bytes que os documentos imprimem.

- RFC 2132, seção 8.4, Vendor Specific Information (lida em 2026-10-19)
- Documento Cisco 97066, *Configure DHCP OPTION 43 for Lightweight Access Points*, atualizado em 22 de julho de 2026 (lido em 2026-10-19)
- Cisco Code Exchange, README do cisco43calc de Brett Verney, repositório da comunidade (fonte secundária; lido em 2026-10-19)
- Artigo 000008703 da base de conhecimento da RUCKUS, *Understanding DHCP Option 43 Hexadecimal code in Ruckus*, atualizado em 6 de maio de 2020 (lido em 2026-10-19)
- RUCKUS Networks Community, *How the APs discover the IP address of the controller* e *AP Discovery: How to configure DHCP option 43 to discover the controller*, posts de RUCKUS Team Members (fonte secundária; lidos em 2026-10-19)
- Fortinet, *FortiWiFi and FortiAP Configuration Guide*: *Discovering, authorizing, and deauthorizing FortiAP units* (7.2.5) e *Advanced WiFi controller discovery* (8.0.1) (lidas em 2026-10-19)
- Artigo Ubiquiti 204909754, *Layer 3 Adoption for Remote UniFi Controllers* (não foi possível reler em 2026-10-19: o site respondeu com um desafio anti-bot)
- Extreme Networks, *ExtremeCloud IQ Controller Deployment Guide*, e o guia do Fabric Engine para a subopção 226 (as páginas do ExtremeCloud IQ Controller foram lidas com HTTP 200 em 2026-10-18; em 2026-10-19 o site de documentação respondeu 401 e não pôde ser relido)
- HPE Aruba Networking, opções DHCP para pontos de acesso (não foi possível reler em 2026-10-19: acesso negado)

## Uma omissão deliberada

A Aerohive não é oferecida. Ela foi adquirida pela Extreme em 2019 e incorporada ao ExtremeCloud IQ, e não foi possível encontrar documentação do fabricante para uma subopção Aerohive independente — apenas afirmações de comunidade. A única subopção 226 documentada pertence a switches Fabric Engine falando com o ExtremeCloud IQ, que é outra classe de equipamento respondendo a outra pergunta. Um valor colado num DHCP de produção é o pior lugar possível para se estar aproximadamente certo, então até existir fonte do fabricante a Aerohive fica de fora. Se você tiver essa documentação, dá para acrescentar numa tarde.
