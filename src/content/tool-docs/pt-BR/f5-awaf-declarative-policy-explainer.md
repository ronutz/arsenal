## O que faz

Cole uma política de segurança declarativa do F5 AWAF - Advanced WAF (antigo BIG-IP ASM - Application Security Manager), o JSON `{ "policy": { ... } }` que você mantém em controle de versão, e a ferramenta a lê de volta para você, seção por seção, em linguagem clara: o que cada configuração é e, onde importa, o que o valor específico que você definiu realmente significa para a segurança da política. É um explicador somente de decodificação, fundamentado no schema declarativo publicado pela F5, e roda inteiramente no seu navegador.

## Ela lê uma política como um delta sobre o seu template

Uma política declarativa lista apenas os seus ajustes sobre um template base, então a regra mais importante ao lê-la é que uma seção ausente significa que o padrão do template se aplica, não que uma proteção está desligada. A ferramenta respeita isso o tempo todo: explica apenas o que a política define explicitamente, sempre carrega o lembrete de que tudo o que não é mostrado é herdado, e nunca relata uma proteção como desativada só porque ela está ausente. Todo alerta de segurança que ela faz é derivado de um valor que a política de fato define, nunca de uma ausência.

## O que ela cobre

A ferramenta reconhece cerca de cinquenta e cinco seções de nível superior da política, agrupadas em ordem de leitura: identidade (`name`, `description`, `template`), postura de enforcement (`enforcementMode`, `signature-settings`, modo passivo e as configurações de staging e X-Forwarded-For em `general`), aprendizado automático (Policy Builder), contexto da aplicação (idioma da aplicação, sensibilidade a maiúsculas, tecnologias de servidor), a superfície de tráfego (URLs, parâmetros, tipos de arquivo, métodos, cabeçalhos, cookies), as proteções (blocking settings, Data Guard, CSRF, força bruta, bloqueio por geolocalização, enforcement comportamental e outras) e os perfis de conteúdo (JSON, XML, GraphQL, OpenAPI). Cada seção é descrita a partir do próprio texto do schema da F5, e tudo o que a ferramenta não reconhece ainda é reconhecido como presente.

## Os alertas de segurança

Além de descrever seções, a ferramenta lê os valores que decidem se uma política realmente protege. Ela levanta um aviso quando `enforcementMode` é `transparent`, porque a política é então somente monitoramento e não bloqueia nada, nem mesmo violações marcadas para bloquear. Ela observa quando assinaturas de ataque estão em staging (correspondidas mas ainda não impostas), quando a política confia em `X-Forwarded-For` para o IP do cliente, quando o Data Guard está explicitamente desativado, e quando um cookie imposto é definido sem o atributo Secure ou HttpOnly. Cada um é um estado que as pessoas rotineiramente deixam passar ao ler uma política a olho.

## Fundamentação e precisão

As descrições dos campos são parafraseadas do schema declarativo publicado pela F5. A F5 publica a documentação de cinco versões, v16.0, v16.1, v17.0, v17.1 e v17.5; a ferramenta é fundamentada no schema v17.1, que é o mais recente com um schema completo publicado (a página do schema v17.5 ainda não foi publicada). As seções centrais cobertas aqui são estáveis na linha v16.x a v17.x. Nada do que você cola é enviado ou sai da página; para uma decisão em produção, confirme qualquer leitura no schema declarativo da versão do seu BIG-IP.
