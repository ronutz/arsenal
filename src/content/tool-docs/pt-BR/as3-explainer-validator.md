## O que faz

Cole uma declaração AS3 do F5 BIG-IP, o JSON que você faz POST em `/mgmt/shared/appsvcs/declare`, e ela a lê de volta para você: se é uma requisição AS3 completa ou uma declaração apenas ADC, as opções de nível superior, os metadados do ADC, e a árvore Tenant para Application para recurso com cada classe nomeada e explicada. Ela também verifica as regras estruturais que o F5 documenta. É uma ferramenta decode-only que roda inteiramente no seu navegador, baseada no guia do usuário e na referência de schema do AS3 do F5.

## Requisição ou declaração

A primeira coisa que ela informa é qual das duas formas você colou. Uma requisição AS3 completa tem `class: "AS3"` e carrega `action` (deploy, dry-run, retrieve, remove, patch) e `persist`, envolvendo a declaração. Uma declaração apenas ADC tem `class: "ADC"` no topo e omite o wrapper, o que significa que as opções action e persist não estão disponíveis. A ferramenta mostra o action e o persist de uma requisição, e o schemaVersion, id, label e remark da declaração ADC em ambos os casos.

## A árvore que ela percorre

Abaixo dos metadados, a ferramenta percorre a hierarquia fixa do AS3: cada Tenant (que vira uma partição no BIG-IP), cada Application (com seu template, notando quando generic é assumido por padrão no AS3 3.20 e posterior), e cada objeto de recurso dentro. Para cada objeto ela mostra a classe e uma explicação em linguagem simples, de Service_HTTP e Service_HTTPS a Pool, Monitor, TLS_Server, TLS_Client, Certificate, Persist, WAF_Policy, Endpoint_Policy e iRule. Uma classe que ela não reconhece ainda é listada e marcada, nunca escondida.

## As verificações estruturais

Junto com a explicação, a ferramenta aplica as regras documentadas que tornam uma declaração válida: uma classe AS3 ou ADC de nível superior, um schemaVersion obrigatório, ao menos um Tenant contendo ao menos uma Application contendo ao menos um recurso, e a regra de correspondência entre template e classe de service (um template de http, https, tcp, udp ou l4 exige um objeto Service correspondente chamado service, antes serviceMain). Ela também sinaliza nomes reservados (Common, Shared, service) como informativos e verifica se os nomes de objeto seguem a regra de 1 a 64 caracteres, começando com letra, alfanuméricos.

## Escopo e grounding

Este é um explicador de estrutura e verificador de sanidade, não um validador completo de JSON-Schema. Ele não reproduz o schema inteiro do AS3 nem verifica cada propriedade, então uma declaração que passa aqui ainda pode ser rejeitada pelo próprio AS3; trate um resultado limpo como um bom sinal, não uma garantia. Nada que você cola é enviado ou sai da página. Baseado na documentação do AS3 do F5; para uma implantação, valide contra a sua versão do AS3 e a referência de schema.
