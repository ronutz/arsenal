# Gerador de DHCP option 43

Informe o endereço da controladora sem fio e o fabricante dos pontos de acesso, e a ferramenta devolve o valor que aquele fabricante realmente espera. Tudo roda no navegador; o endereço não sai da página.

## Por que isto não é só "converter um IP para hexadecimal"

A RFC 2132 define a option 43 como *Vendor Specific Information* e, deliberadamente, não diz nada sobre o que vai dentro dela. O conteúdo fica inteiramente a cargo de cada fabricante. O resultado é que um único número de opção carrega pelo menos quatro codificações incompatíveis entre si, e o modo de falha quando se escolhe a errada é o pior possível: o ponto de acesso inicia, recebe endereço, lê um valor que não consegue interpretar e simplesmente nunca se registra. Nenhum erro aparece em lugar nenhum.

As quatro famílias:

**TLV binário** — Cisco e UniFi. O endereço entra como quatro bytes crus. `192.168.10.5` vira `c0a80a05`.

**TLV em ASCII** — Ruckus. O endereço entra como *texto*, um byte por caractere, pontos incluídos. `192.168.0.200` vira `3139322e3136382e302e323030`. A própria base de conhecimento da Ruckus alerta para isto: converter 10 para hexadecimal dá `0a`, mas o ASCII de "10" é `31 30`. São valores diferentes e só um funciona.

**Texto puro** — Aruba e ExtremeWireless. Nada de hexadecimal. O servidor DHCP envia o endereço como texto, e um valor hex aqui está errado por mais cuidadosamente que tenha sido montado.

**Outra opção inteiramente** — FortiAP. Ele lê o endereço da controladora na option 138, a opção de access controller do CAPWAP, que é o padrão de fábrica. A option 43 num FortiGate existe para atender pontos de acesso de *outros* fabricantes, não os da própria Fortinet.

## Como usar

Escolha o fabricante primeiro. A ordem é proposital: o mesmo endereço produz quatro respostas diferentes, então não existe valor com significado antes de escolher o fabricante.

Informe o IP de gerenciamento da controladora. A Cisco aceita vários, separados por espaço ou vírgula, e os codifica em ordem; os demais aceitam um.

O resultado mostra o valor e, para os fabricantes que usam hexadecimal, a montagem byte a byte — subopção, comprimento e endereço — para você conferir a aritmética em vez de confiar nela. Abaixo ficam as linhas prontas para ISC dhcpd, Cisco IOS, Windows Server e MikroTik.

## O que ele informa e uma caixa de hexadecimal não informa

**Quando a option 60 também é obrigatória.** Pontos de acesso Aruba só pedem informação específica de fabricante quando o vendor class identifier confere, então a option 43 sem a option 60 valendo `ArubaAP` não faz absolutamente nada. O ExtremeWireless também exige VCI, e ele varia conforme a geração do AP: modelos mais antigos usam `HiPath` seguido do nome do modelo, os mais novos apenas o modelo.

**Quando a resposta não é hexadecimal.** Para Aruba e ExtremeWireless a ferramenta devolve texto e diz isso, porque entregar um hexadecimal de aparência plausível seria pior do que não devolver nada.

**Quando a pergunta é sobre a opção errada.** Para FortiAP ela devolve a option 138 e explica o motivo.

## Fontes

Cada perfil de fabricante foi montado a partir da documentação do próprio fabricante, e cada vetor dourado é um exemplo trabalhado publicado pelo fabricante, não um valor que esta ferramenta gerou e depois consagrou. A distinção importa: um vetor produzido pelo código sob teste prova apenas que o código concorda consigo mesmo.

- RFC 2132, seção 8.4, Vendor Specific Information
- Documento Cisco 97066, *Configure DHCP Option 43 for Lightweight Access Points*
- Artigo Ruckus 000008703, *Understanding DHCP Option 43 Hexadecimal code*
- Artigo Ubiquiti 204909754, *Layer 3 Adoption for Remote UniFi Controllers*
- Extreme Networks, *ExtremeCloud IQ Controller Deployment Guide*, e o guia do Fabric Engine para a subopção 226
- HPE Aruba Networking, opções DHCP para pontos de acesso
- Fortinet, *FortiWiFi and FortiAP Configuration Guide*, tipos de descoberta

## Uma omissão deliberada

A Aerohive não é oferecida. Ela foi adquirida pela Extreme em 2019 e incorporada ao ExtremeCloud IQ, e não foi possível encontrar documentação do fabricante para uma subopção Aerohive independente — apenas afirmações de comunidade. A única subopção 226 documentada pertence a switches Fabric Engine falando com o ExtremeCloud IQ, que é outra classe de equipamento respondendo a outra pergunta. Um valor colado num DHCP de produção é o pior lugar possível para se estar aproximadamente certo, então até existir fonte do fabricante a Aerohive fica de fora. Se você tiver essa documentação, dá para acrescentar numa tarde.
