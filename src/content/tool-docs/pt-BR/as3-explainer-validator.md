## O que faz

Cole uma declaração AS3 do F5 BIG-IP, o JSON que você faz POST em `/mgmt/shared/appsvcs/declare`, e ela a lê de volta para você: se é uma requisição AS3 completa ou uma declaração apenas ADC, as opções de nível superior, os metadados do ADC, e a árvore Tenant para Application para recurso com cada classe nomeada e explicada. Ela também verifica as regras estruturais que o F5 documenta. É uma ferramenta decode-only que roda inteiramente no seu navegador, baseada no guia do usuário e na referência de schema do AS3 do F5.

## Requisição ou declaração

A primeira coisa que ela informa é qual das duas formas você colou. Uma requisição AS3 completa tem `class: "AS3"` e carrega `action` (deploy, dry-run, retrieve, remove, patch) e `persist`, envolvendo a declaração. Uma declaração apenas ADC tem `class: "ADC"` no topo e omite o wrapper, o que significa que as opções action e persist não estão disponíveis. A ferramenta mostra o action e o persist de uma requisição, e o schemaVersion, id, label e remark da declaração ADC em ambos os casos.

## A árvore que ela percorre

Abaixo dos metadados, a ferramenta percorre a hierarquia fixa do AS3: cada Tenant (que vira uma partição no BIG-IP), cada Application (com seu template, notando quando generic é assumido por padrão no AS3 3.20 e posterior), e cada objeto de recurso dentro. Para cada objeto ela mostra a classe e uma explicação em linguagem simples, de Service_HTTP e Service_HTTPS a Pool, Monitor, TLS_Server, TLS_Client, Certificate, Persist, WAF_Policy, Endpoint_Policy e iRule. Uma classe que ela não reconhece ainda é listada e marcada, nunca escondida.

## As verificações estruturais

Junto com a explicação, a ferramenta aplica as regras documentadas que tornam uma declaração válida: uma classe AS3 ou ADC de nível superior, um schemaVersion obrigatório, ao menos um Tenant contendo ao menos uma Application contendo ao menos um recurso, e a regra de correspondência entre template e classe de service (um template de http, https, tcp, udp ou l4 exige um objeto Service correspondente chamado service, antes serviceMain). Ela também sinaliza nomes reservados (Common, Shared, service) como informativos e verifica se os nomes de objeto seguem a regra de 1 a 64 caracteres, começando com letra, alfanuméricos.

## Compartilhar resultado

Abaixo do veredito, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva uma cópia da declaração depois do `#`, nunca o que foi colado: todo valor que a [referência de schema](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/schema-reference.html) do AS3 (lida em 2026-10-27) define como segredo é trocado por `[redacted]`. Isso é o `ciphertext` de um objeto Secret (com o header `protected` padrão ele é o próprio segredo, só codificado em base64url), um `passphrase`, `password`, `secret`, `sharedSecret` ou `token` escrito como string, as passphrases nomeadas (`cookiePassphrase`, `md5SignaturePassphrase`, `javaSignKeyPassphrase`), o `privateKey` e o `pkcs12` de um Certificate colocados direto ou dados como `base64` ou `text`, o `targetPassphrase` e cada valor de `targetTokens` da requisição AS3, e as credenciais de Service Discovery (`secretAccessKey`, `apiAccessKey`, `encodedCredentials`, `encodedToken`). O popover dele diz primeiro o que o link leva e quantos valores foram trocados, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Esta página nunca mostra esses valores, então a página que recebe lê a mesma declaração; a cópia mantém todo o resto, espaços e ordem inclusive. Uma chave dada como caminho `bigip` ou `url` fica, e também ficam `accessKeyId`, nomes, endereços, iRules e strings `send` de monitores, que o schema não marca como segredos: confira isso você mesmo antes de compartilhar.

Um texto colado que não é JSON válido não pode ser cortado com segurança: se ele cita uma dessas configurações em qualquer lugar, não há link e o popover pede para corrigir o JSON primeiro; se não cita nenhuma, vai como foi digitado e a página que recebe mostra o mesmo erro de parse.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviada ao servidor quando o link é aberto; ela fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-la.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a explica; nada é enviado a lugar nenhum. O valor então sai do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Escopo e grounding

Este é um explicador de estrutura e verificador de sanidade, não um validador completo de JSON-Schema. Ele não reproduz o schema inteiro do AS3 nem verifica cada propriedade, então uma declaração que passa aqui ainda pode ser rejeitada pelo próprio AS3; trate um resultado limpo como um bom sinal, não uma garantia. Nada que você cola é enviado ou sai da página. Baseado na documentação do AS3 do F5; para uma implantação, valide contra a sua versão do AS3 e a referência de schema.
