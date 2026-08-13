## O que faz

Descreva uma requisição — para onde vai, como é direcionada, se o dispositivo é gerenciado, se o TLS é descriptografado, se carrega payload — e a ferramenta mostra o passe único: quais serviços atuam, em que ordem, quais são **pilares** e quais são **transversais**, e o que uma cadeia de appliances separados teria feito no lugar. Determinístico e offline; descreve uma arquitetura em vez de consultar uma.

## O ponto que ela existe para fazer

**DLP e proteção contra ameaças não são pilares.** São transversais: rodam dentro do mesmo passe e recebem o que os pilares descriptografaram. É por isso que um único perfil de dados cobre web, software-as-a-service e aplicações privadas igualmente, e por que a mesma regra numa arquitetura encadeada precisa ser escrita quatro vezes em quatro dialetos.

Os pilares tratam de **para onde o tráfego vai** — secure web gateway para a web em geral, cloud access security broker para atividade em SaaS, zero trust network access para uma aplicação privada, cloud firewall para as portas que os outros não cobrem. Mude o destino na ferramenta e observe quais pilares atuam enquanto os motores transversais permanecem constantes.

## A afirmação que você pode verificar

Single-pass significa que **o payload é descriptografado uma vez** e o mesmo fluxo é entregue a todos os motores. Appliances encadeados descriptografam e recriptografam a cada salto, e essa repetição é a maior parte da latência que as pessoas atribuem à inspeção.

A ferramenta apresenta isso como contraste em todo resultado, porque "convergente" costuma ser uma afirmação de empacotamento e não de arquitetura. A pergunta que vale fazer a um fornecedor é se o payload é descriptografado uma vez, ou uma vez por motor.

## O que ela não faz

Não modela nenhum tenant específico e não é um simulador de políticas. Desligue a descriptografia e ela avisará que tudo abaixo da identificação de aplicação trabalha com metadados — que é o modo de falha que ela mais quer que o aprendiz internalize, porque uma política escrita como se o conteúdo estivesse visível vai ficar no console com aparência correta.

## Escopo de fornecedor

Os nomes dos estágios seguem a descrição publicada pela Netskope do seu Zero Trust Engine, já que é a plataforma coberta pelo treinamento deste site. O argumento estrutural — passe único, inspeção transversal, compute completo no edge — é geral ao SSE e é apresentado como tal.
