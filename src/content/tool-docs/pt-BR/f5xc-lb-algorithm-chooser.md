## O que faz

Esta ferramenta é um seletor guiado para o algoritmo de load balancing do origin pool do F5 Distributed Cloud (XC). Responda três perguntas - se as sessões precisam grudar no mesmo origin, o que identifica uma sessão (IP de origem, um cookie, um header custom, ou "varia por rota"), e se o origin pool é dinâmico - e ela recomenda um dos algoritmos do XC, nomeia o equivalente no BIG-IP, lista os cuidados que se aplicam às suas respostas, e diz onde configurar. Tudo roda no seu navegador.

## O modelo de persistência do XC, para quem vem do BIG-IP

Este é o ponto que a ferramenta existe para fazer. No BIG-IP, o método de load balancing (Round Robin, Least Connections, e assim por diante) e o profile de persistência (Source Address Affinity, Cookie) são duas configurações independentes no virtual server. O XC os junta. Os algoritmos de consistent-hashing - Source IP Stickiness, Cookie Based Stickiness e Ring Hash - não são só métodos de distribuição; cada um também é, por definição, o método de persistência. Escolher um te dá os dois de uma vez. Os algoritmos non-hash - Round Robin, Least Active Request, Random - não persistem de forma alguma. Não há objeto de profile de persistência separado para anexar.

## Os sete algoritmos

Round Robin envia requisições para os origins em turnos. Least Active Request envia cada requisição para o origin com menos requisições em andamento, o que serve para custos de requisição desiguais ou conexões longas. Random escolhe um origin aleatoriamente e é estatisticamente uniforme em pools grandes. Source IP Stickiness, Cookie Based Stickiness e Ring Hash são a família de consistent-hashing - eles fazem hash do IP de origem, de um cookie, ou de uma hash policy que você define (tipicamente um header de session ID), e mantêm um cliente no mesmo origin. Load Balancer Override é a saída de emergência - ele adia a escolha para o HTTP load balancer para que você defina a stickiness por rota ou por domínio.

## Por que os cuidados importam

A recomendação é tão boa quanto o encaixe, então a ferramenta destaca as armadilhas. Fazer hash no IP de origem concentra clientes que compartilham um IP (atrás de NAT ou proxy) em um origin, deixando a carga desigual. A stickiness por cookie precisa de um nome, TTL e path, e só vale se o cliente devolver o cookie. Um hash de header custom precisa de um valor estável por sessão, não por requisição. E para um pool dinâmico - pods Kubernetes subindo e descendo - o consistent hashing é a família certa, porque remapeia o menor número de clientes quando a membership muda.

## Compartilhar resultado

Abaixo do nome do algoritmo recomendado, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as suas respostas depois do `#`, pelos ids: se você precisa de persistência; a distribuição ou a chave de sessão, a que a recomendação ler; e se o pool é dinâmico, depois que você responde. O questionário não tem nada para digitar, então nada digitado viaja. O botão fica disponível quando a recomendação está completa. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** As respostas são marcadas como se tivessem sido clicadas, e a recomendação aparece. Um link com uma resposta desconhecida, ou com respostas dos dois ramos, é ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
