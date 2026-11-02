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

## Compartilhar resultado

Abaixo dos origin servers, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva uma cópia do pool depois do `#`, nunca o pool como foi colado. Um pool com mTLS até as origens guarda a chave privada de cada certificado de cliente: "TLS Private Key data in unencrypted PEM format ... may be optionally secured using BlindFold" (a chave em PEM sem cifra, opcionalmente protegida pelo Blindfold; [referência de API do XC para o origin pool](https://docs.cloud.f5.com/docs-v2/api/views-origin-pool), lida em 2026-11-01). O schema do F5 Distributed Cloud os marca: SecretType, "used in an object to indicate a sensitive/confidential field" (usado num objeto para indicar um campo confidencial), guarda o segredo em claro (`clear_secret_info.url`: "For string:/// scheme, Secret needs to be encoded Base64 format", o segredo vai codificado em Base64) ou cifrado pelo Blindfold (`blindfold_secret_info.location`). A página lê se o mTLS está ligado, nunca a chave. Por isso a cópia troca cada segredo SecretType por `[redacted]`, e mantém todo o resto como foi colado. Antes de oferecer o link, a página lê a cópia de novo e precisa chegar à mesma leitura, senão não há link; depois a cópia passa por uma busca de credenciais que ainda estejam lá (uma chave privada fora de SecretType, o valor de um matcher do header `Authorization`, um JWT, uma senha numa URL, como nas outras ferramentas do site): qualquer uma impede o link, e o popover diz a linha; um valor cujo nome só parece de segredo é citado no popover.

O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Ele também diz quantos valores foram trocados, e que um pool cita os origin servers, os endereços e os sites deles. Não há opção para incluir os valores trocados: um pool não tem valores de header ou cookie, e os segredos que o schema define nunca são enviados.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada, e a página a lê. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
