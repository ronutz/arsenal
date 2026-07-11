## O que faz

Esta ferramenta transforma a referência de firewall do Customer Edge (CE) publicada pela F5 em um allowlist funcional. Você cola o conteúdo do arquivo de endereços IP e domínios baixável da F5 (a F5 o publica exatamente para esse tipo de automação), escolhe seu tipo de site, e a ferramenta o analisa em um allowlist organizado por propósito e deduplicado - registro e atualizações, conectividade com Regional Edges, domínios da F5, feeds de reputação e classificação, registries de container, DNS e NTP - filtrado para o tipo de site que você escolheu. Ela também entrega a matriz de portas e protocolos, regras site-a-site opcionais, um texto plano de solicitação de firewall que você pode passar para uma equipe de rede, e um script de verificação no lado do CE. Tudo roda no seu navegador.

## Por que ela analisa em vez de listar

O único risco real de qualquer allowlist de firewall é a defasagem - faixas de IP e domínios mudam, e uma lista fixa apodrece no momento em que a F5 a atualiza. A própria F5 avisa que os endereços IP podem mudar sem aviso e que permissões baseadas em domínio são o método preferido. Então esta ferramenta nunca embarca sua própria cópia da lista. Ela analisa o arquivo que você cola, e sempre mostra uma linha de proveniência dizendo exatamente o que ela leu. Quando a F5 atualiza o arquivo, você cola o novo e a saída se atualiza junto.

## Secure Mesh v2 vs Legacy

A F5 divide os requisitos em duas gerações de site. O workflow do Secure Mesh Site v2 usa um único domínio wildcard de propriedade da F5 (ou uma lista de FQDNs se seu firewall não suportar wildcards) e um pequeno conjunto de IPs de registro. Sites CE Legacy usam uma lista grande de faixas de IP e um conjunto de domínios mais amplo que inclui registries de terceiros. O seletor de tipo de site filtra as entradas analisadas para a geração que você está implantando, para que você não coloque no allowlist faixas de que não precisa. Entradas que se aplicam a ambos (DNS, NTP e as faixas SaaS compartilhadas) são sempre incluídas.

## A matriz de portas e as regras site-a-site

A matriz de portas e protocolos é transcrita da referência: registro e atualizações em TCP 443, conectividade com Regional Edges em TCP 80 e 443 com IPsec opcional em UDP 4500 (o tunelamento SSL é suportado como fallback) e o NTP do RE em UDP 123, DNS fornecido pela F5 em TCP/UDP 53, e NTP fornecido pela F5 em UDP 123. A porta 65500 é reservada para acesso à UI e API local e não é uma regra de egress. Os blocos de regras opcionais cobrem clusters multi-node, Site Mesh Group (IPsec: UDP 500, UDP 4500 e ESP), DC Cluster Group (IP-in-IP em UDP 6080) e AWS Cloud Connect (GRE, protocolo IP 47).

## Verificando

O script gerado usa o comando de serviceability curl-host do CE contra cada domínio no seu allowlist, seguindo o método documentado de troubleshooting de registro da F5, para que você possa confirmar a partir do próprio nó que cada endpoint está acessível antes de abrir um chamado.
