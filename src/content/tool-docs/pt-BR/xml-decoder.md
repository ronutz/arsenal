## O que faz

Cole XML e a ferramenta o analisa em uma estrutura legível: a declaração XML, o DOCTYPE e quaisquer entidades que ele declare, e a árvore de elementos completa com seus namespaces e atributos, junto com CDATA, comentários e instruções de processamento. Ela verifica se o documento é bem-formado e roda uma análise de segurança da superfície de ataque do XML. Ela não busca nada e não resolve nada.

## O que ela mostra

O XML reúne vários tipos de nó em um documento, e a ferramenta os separa: a **declaração** com sua versão e codificação; o **DOCTYPE** e quaisquer **entidades** que ele define; a **árvore de elementos**, com os **namespaces** (as ligações `xmlns`) e os **atributos** mostrados por elemento; e as seções **CDATA**, os **comentários** e as **instruções de processamento**. Ela também verifica a boa formação no sentido do XML: que toda tag está fechada corretamente e que o documento tem exatamente um elemento raiz.

## A superfície de ataque do XML

O XML é poderoso de um jeito que o torna perigoso quando vem de uma fonte não confiável, e a análise de segurança da ferramenta sinaliza exatamente onde esse perigo mora:

- **Um DOCTYPE, para começar**, porque a definição de tipo de documento é o que habilita o resto;
- **Entidades externas**, que podem puxar um arquivo local ou uma URL e são o mecanismo dos ataques de XML External Entity (XXE);
- **Entidades de parâmetro**, uma forma usada para passar XXE por defesas ingênuas; e
- **Expansão de entidades**, o aninhamento por trás do ataque de negação de serviço billion laughs.

Ver essas coisas destacadas é o ponto: isso diz se um determinado documento está tentando fazer algo que um documento de dados simples nunca faria.

## Segura por construção

A ferramenta é um tokenizador de texto, não um processador de XML. Ela lê o documento como texto e descreve sua estrutura, e nunca resolve uma entidade, nunca abre uma referência externa e nunca expande nada. É isso que a permite analisar XML hostil com segurança: os próprios recursos sobre os quais ela avisa são descritos, não executados. Esta é a contraparte de propósito geral do decodificador SAML, que recusa uma DTD por completo porque uma mensagem SAML nunca legitimamente tem uma.

## Como usar

Cole um documento XML e leia sua declaração, DOCTYPE e entidades, árvore de elementos e as flags de segurança. A análise é determinística e local, então é seguro inspecionar XML de qualquer fonte.

Para todas as regras de boa formação do XML 1.0, com a linha e a coluna da primeira falha, e para formatar ou minificar um documento, use o [formatador e validador de XML](/tools/xml-formatter).

## Compartilhar resultado

Abaixo do veredito de boa formação, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o documento como foi colado depois do `#`, assim que a página o lê como XML. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Um XML pode citar hosts internos e pessoas, então o popover pede que você o leia antes de mandar o link. Antes de oferecer um link, o texto é verificado em busca de uma credencial que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials"), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seções 4.1.1, 4.2.1 e 8.4, em que um cookie costuma guardar um identificador de sessão), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (um membro JSON `token`, um `password=` na query de uma URL) não impede o link; o popover cita o primeiro para você conferir. Aqui mais dois lugares contam como credencial: o `Password` de um `UsernameToken` do WS-Security ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html), lido em 2026-11-01: ele "provides password information (or equivalent such as a hash)"), e uma assertion SAML assinada ou criptografada, como no decodificador de SAML. Um elemento ou atributo cujo nome parece de segredo (`password`, `apiKey`, `client_secret`) é citado no popover.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O documento preenche a caixa como se tivesse sido colado e a página o lê, localmente: nenhuma entidade é resolvida e nada é buscado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
