## O que faz

Descreva uma requisição — para onde vai, como é direcionada, se o dispositivo é gerenciado, se o TLS é descriptografado, se carrega payload — e a ferramenta mostra o passe único: quais serviços atuam, em que ordem, quais são **pilares** e quais são **transversais**, e o que uma cadeia de appliances separados teria feito no lugar. Determinístico e offline; descreve uma arquitetura em vez de consultar uma.

## O ponto que ela existe para fazer

**DLP e proteção contra ameaças não são pilares.** São transversais: rodam dentro do mesmo passe e recebem o que os pilares descriptografaram. É por isso que um único perfil de dados cobre web, software-as-a-service e aplicações privadas igualmente, e por que a mesma regra numa arquitetura encadeada precisa ser escrita quatro vezes em quatro dialetos.

Os pilares tratam de **para onde o tráfego vai** — secure web gateway para a web em geral, cloud access security broker para atividade em SaaS, zero trust network access para uma aplicação privada, cloud firewall para as portas que os outros não cobrem. Mude o destino na ferramenta e observe quais pilares atuam enquanto os motores transversais permanecem constantes.

## A afirmação que você pode verificar

Single-pass significa que **o payload é descriptografado uma vez** e o mesmo fluxo é entregue a todos os motores. Appliances encadeados descriptografam e recriptografam a cada hop, e essa repetição é a maior parte da latência que as pessoas atribuem à inspeção.

A ferramenta apresenta isso como contraste em todo resultado, porque "convergente" costuma ser uma afirmação de empacotamento e não de arquitetura. A pergunta que vale fazer a um fornecedor é se o payload é descriptografado uma vez, ou uma vez por motor.

## O que ela não faz

Não modela nenhum tenant específico e não é um simulador de políticas. Desligue a descriptografia e ela avisará que tudo abaixo da identificação de aplicação trabalha com metadados — que é o modo de falha que ela mais quer que o aprendiz internalize, porque uma política escrita como se o conteúdo estivesse visível vai ficar no console com aparência correta.

## Escopo de fornecedor

Os nomes dos estágios seguem a descrição publicada pela Netskope do seu Zero Trust Engine, já que é a plataforma coberta pelo treinamento deste site. O argumento estrutural — passe único, inspeção transversal, compute completo no edge — é geral ao SSE e é apresentado como tal.

## Compartilhar resultado

Abaixo do resumo, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva todos os campos do formulário depois do `#`, sempre: o destino e o método de steering pelos ids, e as quatro caixas como 1 ou 0, então um link mantém o sentido se um padrão mudar. Os campos descrevem uma requisição e não citam nenhum sistema nem pessoa. A página já mostra uma passagem ao abrir, então o botão fica disponível na hora. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** Os campos são escolhidos como se tivessem sido marcados, e a passagem aparece. Um link com uma escolha desconhecida é ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
