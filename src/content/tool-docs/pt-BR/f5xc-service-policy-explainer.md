## O que faz

Cole uma `service_policy` do F5XC - F5 Distributed Cloud em JSON e a ferramenta detalha exatamente como ela casa: o escopo de servidor ao qual se aplica, a ordem em que suas regras são avaliadas e, para cada regra, sua ação e as condições que precisam valer. Ela lê a definição da política inteiramente no seu navegador e não avalia nada contra tráfego real.

## O que é uma service policy

Na plataforma F5 Distributed Cloud, uma service policy decide quais requisições chegam a um load balancer e quais são recusadas, o equivalente na plataforma à lógica de correspondência de requisições que você escreveria como uma iRule em um BIG-IP clássico. Uma política tem um **escopo de servidor** que diz quais servidores ela governa, uma **disposição** que define o comportamento padrão, e uma **lista de regras** ordenada. A ordem importa: as regras são avaliadas em sequência, e a primeira que casa decide o resultado, então lê-las de cima para baixo é como você entende o que a política de fato faz.

## Como uma regra casa

Cada regra combina uma **ação**, como permitir ou negar, com um conjunto de condições que precisam todas valer para a regra se aplicar. A ferramenta renderiza cada condição do jeito que o schema define:

- o **matcher** e o que ele inspeciona (uma origem, um cabeçalho, um caminho e assim por diante);
- seus **critérios**, se ele casa por valor exato, por expressão regular ou por prefixo;
- a **lógica e/ou** que combina múltiplos valores;
- qualquer **inversão**, em que a correspondência é negada; e
- a **sensibilidade a maiúsculas/minúsculas** da comparação.

Renderizar isso de forma clara é o valor: uma service policy em JSON bruto é difícil de ler, e um único matcher mal interpretado ou uma condição invertida é exatamente o tipo de coisa que permite ou bloqueia o tráfego errado.

## Fundamentada no schema

Os nomes e formatos de campo que a ferramenta entende seguem o schema OpenAPI oficial do F5 Distributed Cloud para a service policy e suas regras, então a decodificação reflete o objeto real, e não um palpite. A ferramenta é local e sem egresso de dados: ela analisa e explica o JSON que você cola, e nunca contata a plataforma nem testa a política contra requisições reais. Entradas malformadas são reportadas, em vez de gerar um erro.

## Como usar

Cole um spec de `service_policy` em JSON e leia o escopo de servidor, as regras ordenadas e a ação e as condições de cada regra. A decodificação é determinística e local.
