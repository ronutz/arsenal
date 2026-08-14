## O que faz

Descreva a situação — dispositivo gerenciado ou não, num site ou em trânsito, se o pacote de certificados pode ser instalado, se a política precisa nomear o usuário — e a ferramenta diz qual método de direção se encaixa: o cliente no endpoint, um túnel IPsec ou GRE, um proxy explícito, ou encadeamento a partir de um proxy já em operação. **Cada método lista o que custa, escolhido ou não**, porque uma ferramenta que só listasse as desvantagens das opções que descartou seria um anúncio da que escolheu.

## A interação sobre a qual ela avisa

**O cliente detecta outros métodos de direção e, por padrão, se desabilita quando encontra IPsec, GRE ou um proxy explícito.** Então rodar os dois não é automaticamente redundância — é um dos dois, decidido por uma configuração que a maioria nunca abriu.

A ferramenta também apresenta o terceiro arranjo: implantar o cliente ao lado do túnel **não para direcionar**, mas para provisionar certificados e fornecer a identidade do usuário. O túnel carrega o tráfego; o cliente responde quem é o usuário.

## O limite rígido que ela declara

**Sem os certificados raiz e intermediário da Netskope no endpoint não há inspeção TLS nem autenticação SAML.** O tráfego chega e a política roda — sobre metadados. Uma regra escrita como se o conteúdo estivesse visível vai parecer correta no console e não vai fazer o que o autor acredita.

## Como isto difere do explicador de decisão de direção

Eles respondem perguntas diferentes e ambos estão neste site:

- **Esta ferramenta é uma pergunta de projeto**: qual rampa de acesso implantar para esta situação?
- **O explicador de decisão de direção é uma pergunta de runtime**: dada uma configuração de direção já em vigor, o que acontece com *este fluxo específico* — direcionado, contornado, bloqueado ou direto?

Escolha o método aqui; rastreie o fluxo lá.

## O que ela não faz

Não conhece as suas licenças, o seu tenant nem a sua configuração existente. A direção por DNS, por exemplo, exige licenças específicas e se aplica apenas a certos tipos de configuração, o que a ferramenta não tem como verificar por você.
