## O que faz

Cole uma `service_policy` do F5XC - F5 Distributed Cloud em JSON e a ferramenta detalha exatamente como ela casa: o escopo de servidor ao qual se aplica, a ordem em que suas regras são avaliadas e, para cada regra, sua ação e as condições que precisam valer. Ela lê a definição da política inteiramente no seu navegador e não avalia nada contra tráfego real.

## O que é uma service policy

Na plataforma F5 Distributed Cloud, uma service policy decide quais requisições chegam a um load balancer e quais são recusadas, o equivalente na plataforma à lógica de correspondência de requisições que você escreveria como uma iRule em um BIG-IP clássico. Uma política tem um **escopo de servidor** que diz quais servidores ela governa, uma **disposição** que define o comportamento padrão, e uma **lista de regras** ordenada. A ordem importa: as regras são avaliadas em sequência, e a primeira que casa decide o resultado, então lê-las de cima para baixo é como você entende o que a política de fato faz.

## Como uma regra casa

Cada regra combina uma **ação**, como permitir ou negar, com um conjunto de condições que precisam todas valer para a regra se aplicar. A ferramenta renderiza cada condição do jeito que o schema define:

- o **matcher** e o que ele inspeciona (uma origem, um header, um caminho e assim por diante);
- seus **critérios**, se ele casa por valor exato, por expressão regular ou por prefixo;
- a **lógica e/ou** que combina múltiplos valores;
- qualquer **inversão**, em que a correspondência é negada; e
- a **sensibilidade a maiúsculas/minúsculas** da comparação.

Renderizar isso de forma clara é o valor: uma service policy em JSON bruto é difícil de ler, e um único matcher mal interpretado ou uma condição invertida é exatamente o tipo de coisa que permite ou bloqueia o tráfego errado.

## Fundamentada no schema

Os nomes e formatos de campo que a ferramenta entende seguem o schema OpenAPI oficial do F5 Distributed Cloud para a service policy e suas regras, então a decodificação reflete o objeto real, e não um palpite. A ferramenta é local e sem egresso de dados: ela analisa e explica o JSON que você cola, e nunca contata a plataforma nem testa a política contra requisições reais. Entradas malformadas são reportadas, em vez de gerar um erro.

## Como usar

Cole um spec de `service_policy` em JSON e leia o escopo de servidor, as regras ordenadas e a ação e as condições de cada regra. A decodificação é determinística e local.

## Compartilhar resultado

Abaixo da visão geral, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a política como foi colada depois do `#`, assim que a página a reconhece. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Uma política pode citar hosts internos, faixas de endereço, ASNs e nomes de header e de cookie: o popover pede para você conferir. A página mostra cada matcher com os valores, então nada pode ser cortado sem mudar a leitura; uma credencial impede o link. Antes de oferecer o link, a política passa por uma busca de credenciais que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials", consiste em credenciais), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 8.4: os servidores "commonly store a nonce (or "session identifier") in a cookie", costumam guardar num cookie um identificador de sessão), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS, e duas coisas que o próprio schema do F5 Distributed Cloud define: um segredo SecretType, uma URL de `clear_secret_info` ou uma location de `blindfold_secret_info` (a [referência de API do XC](https://docs.cloud.f5.com/docs-v2/api/views-http-loadbalancer): "SecretType is used in an object to indicate a sensitive/confidential field"), e um matcher do header `Authorization` com um valor literal; todas lidas em 2026-11-01. Qualquer um deles impede o link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (um membro JSON `token`, um `token=` numa query, um matcher de `X-Api-Key` ou de cookie) não impede o link; o popover cita o primeiro para você conferir.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A política preenche a caixa como se tivesse sido colada, e a página a lê (decodificada, nunca avaliada). Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
