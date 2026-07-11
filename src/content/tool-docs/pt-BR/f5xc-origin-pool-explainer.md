## O que faz

Esta ferramenta decodifica um spec de origin_pool do F5 Distributed Cloud (XC). Cole o objeto origin_pool da visão JSON do Console, seu corpo spec, ou um envelope de create/get, e ela mostra o que o pool de fato faz: o tipo e endereço de cada origin server, a porta do pool, o algoritmo de load balancing e a seleção de endpoint, os health checks que ele referencia, e as configurações de TLS para o origin. Roda inteiramente no seu navegador.

## Origin servers: tipo e lugar

Um origin pool pode apontar para origins de várias formas, e a ferramenta nomeia cada uma. Um IP público ou nome DNS público alcança origins pela internet. Um IP ou nome DNS "em sites específicos" alcança origins através de um Customer Edge ou Regional Edge e carrega um locator de site ou virtual-site - a ferramenta mostra essa localização. Nomes de serviço K8s e Consul usam service discovery em um site. Há também variantes de virtual-network e custom-endpoint. Cada origin também pode carregar labels, que a ferramenta lista.

## Onde os pesos e prioridades de fato ficam

Um equívoco comum é achar que os origin servers em um pool têm pesos e prioridades. Eles não têm. Dentro de um pool, os origin servers são uma lista plana servida de acordo com o algoritmo do pool. Pesos e prioridades são definidos um nível acima, na referência do pool dentro de uma rota ou nos pools default do load balancer - cada referência é um pool mais um peso mais uma prioridade. A ferramenta declara isso para que você olhe no lugar certo.

## A porta do pool e a seleção de endpoint

A porta pode ser explícita, tirada do endpoint, ou automática - e automática significa 443 quando o TLS para o origin está habilitado e 80 quando não está. A seleção de endpoint controla qual Regional Edge faz egress para o origin: Local Preferred (o padrão) faz egress do RE local quando ele tem uma entrada de origin saudável, e caso contrário encaminha pela rede global da F5 para um RE que tenha. É por isso que o mesmo origin pode aparecer várias vezes no Console, uma vez por RE.

## TLS para o origin

Se o TLS para o origin está habilitado, a ferramenta decodifica o nível de segurança - reusando os mesmos dados de nível do mapeador de níveis de segurança TLS, então High é mínimo TLS 1.2 - junto com o modo SNI (usar o header Host, um valor explícito, ou sem SNI), a escolha de verificação do servidor, e se o mTLS está ligado. Ela sinaliza o caso que mais importa: pular a verificação do origin server. Isso ainda criptografa a conexão, mas não valida o certificado do origin, então a ferramenta destaca.
