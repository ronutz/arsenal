## O que ela faz

Cole o que um host imprimiu da sua tabela de roteamento e a ferramenta lê para você. Ela reconhece quatro impressões: o iproute2 do Linux (`ip route`, `ip route show table all`, `ip -6 route`, `ip -d route`), o net-tools do Linux (`netstat -rn` e `route -n`, a "Kernel IP routing table"), o `netstat -rn` do BSD e do macOS ("Routing tables", "Internet:", "Internet6:") e o `route print` do Windows, com as tabelas IPv4 e IPv6, Active e Persistent. Cada rota vira uma linha da mesma tabela (prefixo de destino, next hop, interface, métrica, tipo, tabela), e cada linha abre uma leitura campo a campo em linguagem simples. Depois a ferramenta lista as rotas default de cada tabela e diz qual vence, e uma segunda caixa responde "qual rota este destino usa?" pelas regras do roteador. Nada sai do navegador, e nenhuma rota é alterada ou consultada.

## O que cada campo quer dizer

As leituras vêm dos manuais dos comandos, lidos em 2026-10-19.

- **iproute2.** O destino vem primeiro; `default` é "equivalent to IP 0/0 or to IPv6 ::/0", e um endereço sem comprimento é rota de host porque "If the length of the prefix is missing, ip assumes a full-length host route" ([ip-route(8)](https://man7.org/linux/man-pages/man8/ip-route.8.html)). Depois vêm `via` (o roteador de next hop), `dev` (o dispositivo de saída), `proto` (kernel, boot, static, ra e redirect têm significado fixo; qualquer outra marca o kernel não interpreta, [rtnetlink(7)](https://man7.org/linux/man-pages/man7/rtnetlink.7.html)), `scope` (host, link, global), `src` (o endereço de origem preferido), `metric` ("routes with lower values are preferred", vence o menor), `table`, a flag de next hop `onlink` e opções como `pref`, `mtu` e `nhid`. Uma palavra de tipo no começo diz o que a rota faz: unicast encaminha, local e broadcast pertencem à tabela do próprio host, e blackhole, unreachable, prohibit e throw não encaminham. As linhas `nexthop` recuadas ficam presas à rota de cima como os hops do multipath, com o seu `weight`.
- **net-tools.** Destination mais Genmask é o prefixo ("'0.0.0.0' for the default route"), Gateway é "The gateway address or '*' if none set", e as letras de Flags são as que o [route(8)](https://man7.org/linux/man-pages/man8/route.8.html) lista em OUTPUT: U ativa, H host, G usa gateway, R, D, M, A, C e ! para rejeição. O `route -n` imprime Metric, Ref e Use; o `netstat -rn` imprime MSS, Window e irtt no lugar.
- **BSD e macOS.** As letras de Flags são lidas do [netstat(1) do FreeBSD](https://man.freebsd.org/cgi/man.cgi?query=netstat&sektion=1) (U, G, H, S, B, b, D, L, M, R, X, 1, 2, 3) e do netstat.1 da Apple, que acrescenta C, c, I, i, m, r, W, Y e g; uma letra que só o macOS lista vem marcada assim. Um gateway `link#N` é rota direta, e um gateway como `0:e0:b5:36:cf:4f` é um endereço de enlace. Essas impressões não trazem métrica.
- **Windows.** As Active Routes são as rotas em uso; as Persistent Routes são configuração guardada ([Microsoft Learn, KB 2966111](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/incorrect-default-gateways-in-persistent-routes)). Na tabela IPv4, Netmask dá o comprimento do prefixo, Gateway é um endereço de next hop ou `On-link`, Interface é o endereço do adaptador local, e entre rotas para o mesmo destino "the route with the lowest metric is selected", vence a menor métrica ([Microsoft Learn, The IP routing table](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc779122(v=ws.10))). Na tabela IPv6, If é um número de interface da Interface List; um gateway que quebra para a linha seguinte é juntado à sua linha.

O que a ferramenta não entende aparece na tela, nunca some: um token que ela não lê fica na sua rota, em "Não entendido", e uma linha que não é rota nem estrutura conhecida (headers de coluna, réguas, títulos de seção, um prompt `$ ip route` ecoado) aparece com o seu número de linha.

## Rotas default e a consulta

Uma rota default é uma rota de prefixo de comprimento zero. Quando uma tabela tem várias, todas têm o mesmo comprimento, então a métrica decide e vence a menor; a ferramenta aponta a vencedora, ou diz por que não consegue (métricas iguais, ou uma impressão sem métrica comparável, como o netstat do BSD ou as Persistent Routes do Windows com `Default`).

A consulta aplica as regras de poda da [RFC 1812, seção 5.2.4.3](https://www.rfc-editor.org/rfc/rfc1812.txt): o basic match guarda as rotas cujo prefixo contém o destino, o longest match guarda a mais longa delas, e entre comprimentos iguais vence a menor métrica. Ela mostra as candidatas, as sobreviventes e a regra que decidiu. No iproute2, as tabelas são lidas na ordem das três regras de política padrão, primeiro a local, depois a main e por fim a default ([ip-rule(8)](https://man7.org/linux/man-pages/man8/ip-rule.8.html)); qualquer outra tabela, como uma `table 100`, aparece como não consultada, porque só uma regra de política própria chegaria até ela. Uma rota `throw` vencedora manda a consulta para a tabela seguinte, como o ip-route(8) descreve. No Windows, só as Active Routes são consultadas. Rotas cujo destino não é um endereço com comprimento (um nome impresso sem `-n`, uma abreviação, um valor ocultado) aparecem como deixadas de fora.

## O que ela não tem como saber

- O `ip route show table 100` não imprime a palavra `table` nas linhas, então uma listagem colada de uma tabela só é lida como a tabela main, o padrão da listagem.
- O iproute2 não imprime a métrica quando ela é zero: na captura por trás dos exemplos, o `route -n` mostrou Metric 0 para uma rota que o `ip route` imprimiu sem métrica, e a ferramenta compara essa rota como métrica 0.
- A "Kernel IPv6 routing table" do net-tools fica como não entendida, porque o route(8) documenta só as colunas IPv4; cole a saída de `ip -6 route` no lugar.
- Regras de política além das três padrão não aparecem na impressão de uma tabela de roteamento, então a ferramenta não tem como segui-las.

## Exemplos

O botão Exemplo carrega um `ip route show` real, capturado em 2026-10-19 num host com o endereço 192.0.2.2, e pergunta por 192.0.2.77: a default 0.0.0.0/0 e a rede conectada 192.0.2.0/24 contêm o endereço, e a /24 vence pelo longest match, então o pacote é entregue on-link na eth0. Os golden vectors acrescentam, do mesmo host, o `ip route show table all` (em que 192.0.2.200 está numa /25 da tabela 100, mas nenhuma regra chega à tabela 100 e a /24 da main o entrega), o `ip -d route show table 100` (duas rotas default com métricas 100 e 200, e rotas blackhole, unreachable, prohibit e throw), o `netstat -rn` e o `route -n`; e ainda o exemplo de multipath com dezesseis hops do FRRouting, um `route print` do Windows 10 (ff02::1 casa com duas rotas ff00::/8 e a métrica 331 vence a 5256), o exemplo de rotas persistentes da Microsoft e as tabelas `netstat -nr` e `netstat -r` do FreeBSD Handbook.

## API

O mesmo engine responde à operação `/api/v1/routing-table-explainer` da API HTTP do site, descrita campo a campo no contrato OpenAPI da [página da API](/api), com exemplos tirados dos golden vectors. O contrato também diz se este site serve a API.

- **Requisição.** Ou a impressão como texto, que só é lida, ou um objeto JSON `{"text": "<a impressão>", "lookup": "<um endereço IPv4 ou IPv6>"}`, que é lido e depois consultado.
- **Resposta.** `parse` traz `format` (`iproute2`, `netstat-linux`, `netstat-bsd`, `windows` ou `unknown`), `routes` (cada uma com `index`, `line`, `raw`, `section`, `family`, `destination`, `prefix`, `prefixLength`, `isDefault`, `type`, `gateway`, `onLink`, `interface`, `metric`, `metricText`, `protocol`, `scope`, `src`, `flags`, `nhFlags`, `nexthops`, `attributes`, `unparsed` e `notes`), `interfaces` (a Interface List do Windows), `defaults` (por tabela: `section`, `consulted`, `candidates`, `winner` e `reason`), `unparsedLines`, `structureLines`, `lineCount` e `warnings`. `lookup` é null, ou traz `destination`, `family`, `stages` (cada um com `section`, `candidates`, `longest`, `survivors`, `winner`, `outcome` e `decidedBy`), `skipped`, `unusable`, `winner`, `action` e `decidedBy`. Para a captura do exemplo com o lookup 192.0.2.77, a resposta é a rota de `index` 1 (192.0.2.0/24, a #2 na página), action `on-link`, decidida por `longest-prefix`.
- **Erros.** HTTP 400, `invalid_input`, com a mensagem do engine: um lookup que não é um único endereço IPv4 ou IPv6, ou uma requisição que começa com `{` mas não é o objeto JSON acima. Texto que não é tabela de roteamento não é recusado: `format` vem `unknown` e as linhas aparecem como não entendidas.

## Fontes

- [ip-route(8), Linux manual page, iproute2, cópia do man7.org de 4 de agosto de 2026](https://man7.org/linux/man-pages/man8/ip-route.8.html) (lida em 2026-10-19): SYNOPSIS e DESCRIPTION
- [ip-rule(8), Linux manual page, iproute2](https://man7.org/linux/man-pages/man8/ip-rule.8.html) (lida em 2026-10-19): as três regras padrão
- [rtnetlink(7), Linux manual page, man-pages 6.19](https://man7.org/linux/man-pages/man7/rtnetlink.7.html) (lida em 2026-10-19): rtm_type, rtm_protocol e rtm_scope
- [route(8), Linux manual page, net-tools](https://man7.org/linux/man-pages/man8/route.8.html) (lida em 2026-10-19): OUTPUT
- [netstat(8), Linux manual page, net-tools](https://man7.org/linux/man-pages/man8/netstat.8.html) (lida em 2026-10-19): --route
- [netstat(1), FreeBSD 15.1, 7 de abril de 2026](https://man.freebsd.org/cgi/man.cgi?query=netstat&sektion=1) (lida em 2026-10-19): a tabela de letras de -r
- [Apple, network_cmds, netstat.tproj/netstat.1](https://github.com/apple-oss-distributions/network_cmds/blob/main/netstat.tproj/netstat.1) (lida em 2026-10-19): a tabela de letras
- [FreeBSD Handbook, Advanced Networking, 35.2 Gateways and Routes](https://docs.freebsd.org/en/books/handbook/advanced-networking/) (lido em 2026-10-19)
- [Microsoft Learn, Windows commands, route](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/route_ws2008) (lida em 2026-10-19)
- [Microsoft Learn, The IP routing table (Windows Server 2003)](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc779122(v=ws.10)) (lida em 2026-10-19)
- [Microsoft Learn, KB 2966111, rotas persistentes](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/incorrect-default-gateways-in-persistent-routes) (lida em 2026-10-19)
- [RFC 1812, Requirements for IP Version 4 Routers, junho de 1995](https://www.rfc-editor.org/rfc/rfc1812.txt) (lida em 2026-10-19): seção 5.2.4.3
