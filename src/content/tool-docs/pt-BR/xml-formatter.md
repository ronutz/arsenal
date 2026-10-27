## O que faz

Cole um documento XML e a ferramenta diz primeiro se ele é bem formado. Quando não é, você recebe a linha, a coluna (contada em caracteres), um código de erro estável, uma mensagem em linguagem simples com a regra e a seção da recomendação XML 1.0 de onde ela vem, e a linha que falhou com um `^` sob a coluna. Quando é bem formado, você o recebe de volta formatado com dois espaços, quatro espaços ou um tab por nível, ou minificado, com os comentários mantidos ou removidos. Tudo roda no seu navegador.

As regras vêm da recomendação do W3C [Extensible Markup Language (XML) 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/), de 26 de novembro de 2008. Ela fica ao lado do [formatador de JSON](/tools/json-formatter) e do [conversor de JSON e YAML](/tools/json-yaml-convert). O [decodificador de XML](/tools/xml-decoder) é outra ferramenta: ele lê a estrutura de um documento e a sua superfície de ataque (DOCTYPE, entidades externas, expansão de entidades) e não o reescreve.

## O que o veredito verifica

Estas regras, todas da recomendação, decidem aqui se o documento é bem formado:

- **Um único elemento raiz** (seção 2.1): exatamente um elemento no nível superior; antes e depois dele, só comentários, instruções de processamento e espaço em branco.
- **Caracteres permitidos** (seção 2.2): tab, line feed, carriage return e as faixas Unicode da produção `Char`. Um caractere de controle como U+0001, um surrogate isolado, U+FFFE ou U+FFFF é recusado onde quer que apareça.
- **Nomes** (seção 2.3): nomes de elemento e de atributo, targets de instruções de processamento e nomes de entidade seguem a produção `Name`, inclusive com letras fora do ASCII.
- **Dados de caractere** (seção 2.4): `&` e `<` nunca aparecem sozinhos no texto, e a sequência `]]>` nunca aparece no texto.
- **Comentários** (seção 2.5): nada de `--` dentro e nada de `--->` no fim.
- **Instruções de processamento** (seção 2.6): um nome de target, depois espaço em branco ou `?>`; o target nunca é `xml`, em nenhuma combinação de maiúsculas e minúsculas.
- **Seções CDATA** (seção 2.7): terminam no primeiro `]]>` e só aparecem dentro de um elemento.
- **A declaração XML** (seção 2.8): só no começo absoluto, sem nada antes, e na forma `<?xml version="1.x" encoding="..." standalone="..."?>`, com encoding e standalone opcionais e nessa ordem.
- **A declaração de tipo de documento** (seção 2.8): uma vez, antes do elemento raiz, com um nome, um identificador `SYSTEM` ou `PUBLIC` opcional (um identificador público usa só os caracteres que a produção [13] permite) e um subconjunto interno opcional que contém só declarações de marcação, comentários, instruções de processamento, referências a entidades de parâmetro e espaço em branco, sem referência a entidade de parâmetro dentro de uma declaração (a regra PEs in Internal Subset). As declarações de entidade do subconjunto interno são conferidas contra a sua gramática (seção 4.2).
- **Tags e atributos** (seção 3.1): tags de abertura, de fechamento e de elemento vazio; toda tag de fechamento corresponde ao elemento aberto (Element Type Match); nenhum atributo aparece duas vezes na mesma tag (Unique Att Spec); todo valor de atributo fica entre aspas e não contém `<`.
- **Referências** (seção 4.1): todo `&` inicia uma referência bem formada; uma referência de caractere aponta para um caractere permitido; uma referência de entidade aponta para uma entidade declarada quando a regra Entity Declared se aplica, o que acontece sem DTD, com só um subconjunto interno e nenhuma referência a entidade de parâmetro, ou com `standalone="yes"`. Sem declaração, só existem `&amp;`, `&lt;`, `&gt;`, `&apos;` e `&quot;`, então nomes do HTML como `&nbsp;` são recusados. Uma referência a uma entidade declarada com `NDATA` é recusada (Parsed Entity), e uma referência direta a uma entidade externa dentro do valor de um atributo também (No External Entity References).

O que ela **não** verifica, dito com todas as letras:

- **Validade.** Se o documento segue uma DTD, um XML Schema ou qualquer outro schema é outra pergunta; esta ferramenta verifica só a boa formação.
- **A gramática interna das declarações `<!ELEMENT`, `<!ATTLIST` e `<!NOTATION`**, e nada de uma DTD externa, que nunca é lida.
- **Regras que dependem do texto de substituição de uma entidade**, porque nenhuma entidade é expandida: uma referência indireta a uma entidade externa num valor de atributo, um `<` que chega a um valor de atributo por meio de uma entidade, recursão entre entidades e a boa formação do próprio texto de substituição.
- **Nomes de entidade quando o DOCTYPE aponta para fora.** Quando o DOCTYPE cita uma DTD externa ou o subconjunto interno usa entidades de parâmetro (e a declaração não diz `standalone="yes"`), um nome de entidade pode estar declarado onde esta ferramenta nunca lê, então nomes desconhecidos são aceitos e uma nota avisa.
- **Namespaces.** Os prefixos ficam como parte dos nomes; se cada prefixo está declarado é uma regra de outra recomendação, Namespaces in XML, e não da XML 1.0, e não é verificado.
- **A declaração de encoding.** O que você cola já é texto, então o nome do encoding fica como está e não é comparado com nada.

## O que "não significativo" quer dizer aqui

A seção 2.10 da recomendação diz que um processador XML "MUST always pass all characters in a document that are not markup through to the application". O espaço em branco de um documento é dado, a menos que algo diga o contrário. Um formatador precisa então decidir qual espaço em branco pode tratar como layout, e este decide de forma estreita:

- **O único texto que ele muda é o espaço em branco entre elementos**: um nó de texto feito só de espaços, tabs e quebras de linha, dentro de um elemento que tem pelo menos um elemento filho e nenhum outro dado de caractere. O modo formatado troca cada nó desses por uma quebra de linha e a indentação da linha seguinte; o modo minificado o remove. O espaço em branco fora do elemento raiz é marcação pela seção 2.4, então recebe o mesmo tratamento.
- **Conteúdo misto nunca é tocado.** A seção 3.2.2 diz que um elemento tem conteúdo misto quando "may contain character data, optionally interspersed with child elements". Quando um elemento tem texto que não é só espaço em branco, qualquer referência de caractere ou de entidade, ou uma seção CDATA, todo o seu conteúdo, elementos filhos incluídos, é copiado exatamente como foi escrito: inserir uma quebra de linha ali mudaria o texto.
- **`xml:space="preserve"` é respeitado.** A seção 2.10 define o atributo especial `xml:space` com os valores `default` e `preserve`; `preserve` indica que as aplicações devem manter todo o espaço em branco, e a intenção vale para todos os elementos de dentro, "unless overridden with another instance of the xml:space attribute". O conteúdo sob `preserve` é copiado como está, e um elemento dentro dele com `xml:space="default"` volta a ser formatado. Qualquer outro valor é um erro do qual a recomendação deixa o processador se recuperar ignorando o atributo; esta ferramenta o ignora na formatação, o mantém como está e acrescenta uma nota.
- **Um elemento sem elemento filho mantém o conteúdo como foi escrito**, mesmo quando esse conteúdo é só espaço em branco, ou espaço em branco e comentários. `<a>   </a>` continua `<a>   </a>`, e com os comentários removidos, um `<a>` que tinha um comentário entre duas quebras de linha mantém as duas quebras de linha.

**Um schema ainda pode dar significado a esse espaço em branco.** Sem ler uma DTD ou um schema, um parser não tem como saber se um elemento tem conteúdo de elementos ou conteúdo misto; a seção 2.10 só pede a um processador que valida que diga à aplicação qual espaço em branco aparece em conteúdo de elementos. Um schema que declara um elemento como texto pode fazer até o espaço em branco entre os seus filhos virar parte do valor. Se quem consome o seu documento se importa com isso, mantenha o original.

## O que fica exatamente como foi escrito

- Texto, seções CDATA, comentários (a menos que você os remova) e instruções de processamento, caractere por caractere.
- A declaração XML, como foi digitada, aspas incluídas.
- Todo valor de atributo entre as suas aspas, com o caractere de aspas com que foi escrito: aspas simples continuam simples e aspas duplas continuam duplas. Só o espaço em branco dentro de uma tag é arrumado: um espaço antes de cada atributo, nenhum em volta do `=` e nenhum antes de `>` ou `/>`.
- Tags de elemento vazio continuam tags de elemento vazio (`<b/>`), e uma tag de abertura seguida de uma tag de fechamento continua assim (`<c></c>`).
- Referências de caractere (`&#169;`, `&#x2122;`) e de entidade (`&amp;`, `&org;`) são copiadas como estão, nunca trocadas pelos caracteres que representam.
- O DOCTYPE, com o subconjunto interno, é copiado como texto, com as quebras de linha e tudo.

Duas mudanças sempre acontecem, e o resultado avisa quando acontecem: uma marca de ordem de bytes (U+FEFF) no início é removida, e um carriage return seguido de line feed, ou um carriage return sozinho, é lido como line feed, como a seção 2.11 exige de todo processador XML. A saída termina sem uma quebra de linha final.

## Segurança: nada é expandido, nada é baixado

A ferramenta nunca expande uma entidade, nunca lê uma DTD externa e nunca baixa um identificador `SYSTEM` ou `PUBLIC`: o DOCTYPE é mantido como texto, e a única coisa que ela aprende de um subconjunto interno é quais entidades gerais estão declaradas e de que tipo. Um documento montado para um ataque de entidade externa (XXE) ou de expansão de entidades é, então, só texto aqui. A entrada tem limite de 2.000.000 de caracteres e 1.000 níveis de aninhamento, e o parser lê o texto uma única vez, então um documento hostil não consegue travar a página. Para ver o que um documento desses faria com um parser que expande entidades, use o decodificador de XML.

## Documentos assinados

Não reformate um documento assinado, como uma asserção SAML assinada. Para validar uma referência, o verificador obtém os dados assinados, aplica as transformações da assinatura, calcula o digest do resultado e o compara com o digest gravado na assinatura; qualquer diferença reprova a validação ([XML Signature 1.1, seção 3.2.1](https://www.w3.org/TR/xmldsig-core1/)). A especificação central do SAML diz que as implementações SHOULD usar a Exclusive XML Canonicalization, tanto para a informação assinada quanto como transformação ([SAML 2.0 core, seção 5.4.3](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf)). A canonicalização exclusiva trata o espaço em branco como a Canonical XML ([Exclusive XML Canonicalization, seções 1.1 e 3](https://www.w3.org/TR/xml-exc-c14n/)), e a Canonical XML mantém "all whitespace in character content", inclusive o espaço em branco entre tags ([Canonical XML 1.1, seção 1.1 e exemplo 3.2](https://www.w3.org/TR/xml-c14n/)). Reindentar um documento assinado muda, portanto, o digest, e a assinatura deixa de ser válida. Ler uma cópia formatada não tem problema; repassá-la, sim. Para ler o que uma mensagem SAML afirma, e se e como ela é assinada, use o [decodificador SAML](/tools/saml-decoder).

## Opções

- **Modo.** O formatado coloca cada filho de um elemento com conteúdo de elementos na sua própria linha, um nível mais indentado que o pai, com a tag de fechamento de volta no nível do pai. O minificado remove o mesmo espaço em branco e não acrescenta nenhum.
- **Indentação.** Dois espaços, quatro espaços ou um tab por nível (só no modo formatado).
- **Manter comentários.** Ligado por padrão. Desligado, todos os comentários ficam de fora, dentro e fora da raiz, e as contagens dizem quantos.

## Códigos de erro

| Código | Significado | Seção |
|---|---|---|
| `empty` | Só espaço em branco (aparece na API; a página simplesmente espera) | |
| `too-large` | Mais de 2.000.000 de caracteres | |
| `too-deep` | Mais de 1.000 elementos aninhados | |
| `illegal-character` | Um caractere fora de `Char` | 2.2 |
| `bad-xml-declaration` | Uma declaração XML malformada, ou `<?XML` no início | 2.8 |
| `misplaced-xml-declaration` | Uma declaração XML em qualquer lugar que não o começo absoluto | 2.6, 2.8 |
| `bad-pi` | Uma instrução de processamento sem target válido | 2.6 |
| `unterminated-pi` | Falta o `?>` | 2.6 |
| `unterminated-comment` | Falta o `-->` | 2.5 |
| `comment-double-hyphen` | `--` dentro de um comentário, ou `--->` | 2.5 |
| `unterminated-cdata` | Falta o `]]>` | 2.7 |
| `cdata-outside-root` | Uma seção CDATA fora de todos os elementos | 2.7 |
| `bad-doctype` | Um DOCTYPE malformado | 2.8 |
| `unterminated-doctype` | Um DOCTYPE que nunca fecha | 2.8 |
| `bad-internal-subset` | Algo além de declarações, comentários, instruções de processamento, referências a entidades de parâmetro e espaço em branco no subconjunto interno, uma referência a entidade de parâmetro dentro de uma declaração ali, ou uma declaração de entidade malformada | 2.8, 4.2 |
| `misplaced-doctype` | Um DOCTYPE depois que a raiz começa, ou um segundo DOCTYPE | 2.8 |
| `unknown-markup` | Um `<!` que não inicia um comentário, uma seção CDATA nem o DOCTYPE | |
| `bad-start-tag` | Uma tag de abertura sem nome válido, ou com um caractere solto | 3.1 |
| `bad-attribute` | Sem `=`, sem aspas ou sem espaço em branco antes de um atributo | 3.1 |
| `duplicate-attribute` | O mesmo atributo duas vezes numa tag | 3.1 |
| `lt-in-attribute` | Um `<` dentro do valor de um atributo | 3.1 |
| `unterminated-tag` | A entrada termina dentro de uma tag | 3.1 |
| `bad-end-tag` | Algo além de espaço em branco entre o nome de uma tag de fechamento e o seu `>` | 3.1 |
| `mismatched-end-tag` | Uma tag de fechamento que não corresponde ao elemento aberto | 3.1 |
| `unexpected-end-tag` | Uma tag de fechamento sem elemento aberto | 3.1 |
| `unclosed-element` | Um elemento que nunca fecha (indicado onde ele abre) | 3.1 |
| `bad-reference` | Um `&` sem uma referência bem formada depois | 2.4, 4.1 |
| `illegal-char-reference` | Uma referência a um caractere fora de `Char` | 4.1 |
| `undeclared-entity` | Uma referência a uma entidade não declarada, quando Entity Declared se aplica | 4.1 |
| `unparsed-entity-reference` | Uma referência a uma entidade declarada com `NDATA` | 4.1 |
| `external-entity-in-attribute` | Uma referência direta a uma entidade externa no valor de um atributo | 3.1 |
| `cdata-end-in-text` | `]]>` no texto | 2.4 |
| `text-outside-root` | Texto antes ou depois do elemento raiz | 2.1, 2.8 |
| `multiple-roots` | Um segundo elemento de nível superior | 2.1 |
| `no-root` | Nenhum elemento | 2.1 |

## Exemplos

- **O botão Exemplo**: uma Response parecida com a do SAML 2.0, numa linha só, como chega de um binding, com os namespaces `samlp` e `saml`, um status `Success` e um NameID `emailAddress` (os nomes do padrão [OASIS SAML 2.0 core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf); a mensagem não é assinada). Formatada com dois espaços, vira 18 linhas; minificar essas linhas devolve a linha única, byte por byte. O `&amp;` dentro de `<saml:AttributeValue>admin &amp; auditor</saml:AttributeValue>` continua `&amp;`.
- **Conteúdo misto**: em `<para>Use <code>--force</code> only when <emphasis>all</emphasis> nodes agree.</para>` nada é reindentado, e um `<para>` cujo texto ocupa três linhas mantém as quebras de linha, os espaços e a posição da tag de fechamento.
- **`xml:space`**: sob `<poem xml:space="preserve">`, a quebra de linha e os três espaços antes do segundo `<line>` ficam; dentro de `<listing xml:space="preserve">`, um filho `<meta xml:space="default">` com dois elementos filhos é organizado de novo.
- **CDATA, comentários, instruções de processamento**: `<step id="1"><![CDATA[if (a < b && c) { go(); }]]></step>` fica numa linha, como foi escrito; `<?xml-stylesheet type="text/xsl" href="view.xsl"?>` é uma instrução de processamento (o target começa com `xml-`, que não é o `xml` reservado) e é mantida; `<step id='2'>` mantém as aspas simples.
- **Um DOCTYPE com referências**: `<from>&org;</from>` mantém `&org;` (declarada no subconjunto interno, nunca expandida), `<sign>&#169; 2026 &#x2122;</sign>` mantém as duas referências de caractere, e `<to   lang = "pt-BR" >` vira `<to lang="pt-BR">`.
- **Recusas**: `<a>AT&T</a>` para na linha 1, coluna 6, com `bad-reference`; `<a>&nbsp;</a>` com `undeclared-entity`; uma quebra de linha antes de `<?xml version="1.0"?>` com `misplaced-xml-declaration` na linha 2, coluna 1.

## Proveniência

O engine é uma única passada pelo texto, com uma pilha explícita de elementos, sem relógio, sem rede e sem aleatoriedade. Ele traz golden vectors (conjunto `xml-formatter-golden-2026-10-26`): 20 documentos aceitos cuja saída é fixada byte por byte, escrita à mão a partir das regras acima antes de o engine rodar, e 42 recusas fixadas por código, linha e coluna, com pelo menos uma para cada código de erro. Cada documento aceito também é conferido quanto a duas propriedades: formatar a saída de novo não muda nada, e minificar a saída dá o mesmo texto que minificar a entrada. Durante o desenvolvimento, os vereditos foram comparados com os do parser Expat 2.6.1 que vem com o Python 3.13, em cerca de 500.000 documentos gerados, e coincidiram em todos menos uma classe: o Expat aceita um número de versão que não é "1." seguido de dígitos, como `"10"` ou `"2.0"`, o que a produção [26] da recomendação (`'1.' [0-9]+`) não permite. A página de errata da recomendação foi lida no mesmo dia: a correção proposta S01 reescreve os nomes reservados e diz que o target `xml` é proibido, o que a produção [17] já exclui, e a E01 acrescenta uma nota sobre normalização Unicode; nenhuma muda uma regra que o engine aplica.

## API

O mesmo engine responde à operação `/api/v1/xml-formatter` da API HTTP do site, descrita no contrato OpenAPI na [página da API](/api); o contrato também diz se este site serve a API.

- **Requisição.** O documento XML como texto, no corpo de um POST ou no parâmetro `input` de um GET. A API aplica as opções padrão: formatado, dois espaços, comentários mantidos.
- **Resposta.** `ok`; quando bem formado, `output` e `stats` (`elements`, `attributes`, `comments`, `commentsDropped`, `cdataSections`, `processingInstructions`, `maxDepth`, `mixedContentElements`, `preserveElements`, `insignificantWhitespaceNodes`); quando não, `error`, com `code`, uma `message` em inglês, `line`, `column`, `offset`, `excerpt`, `excerptColumn` e `params`. As duas formas trazem `notes` (`bom-removed`, `line-endings-normalised`, `doctype-kept`, `entities-unchecked`, `xml-space-invalid`) e as `options` aplicadas. Um documento malformado é uma resposta normal com `ok` falso, não um erro HTTP.

## Fontes

- [W3C, Extensible Markup Language (XML) 1.0 (Fifth Edition), W3C Recommendation 26 November 2008](https://www.w3.org/TR/xml/) (lida em 2026-10-26): seções 2.1 a 2.11, 3.1, 3.2.2, 4.1 e 4.2; [errata](https://www.w3.org/XML/xml-V10-5e-errata) (lida em 2026-10-26)
- [W3C, Canonical XML Version 1.1, W3C Recommendation 2 May 2008](https://www.w3.org/TR/xml-c14n/) (lida em 2026-10-26; este endereço hoje serve a versão 1.1): seção 1.1 e exemplo 3.2
- [W3C, Exclusive XML Canonicalization Version 1.0, W3C Recommendation 18 July 2002](https://www.w3.org/TR/xml-exc-c14n/) (lida em 2026-10-26): seções 1.1 e 3
- [W3C, XML Signature Syntax and Processing Version 1.1, W3C Recommendation 11 April 2013](https://www.w3.org/TR/xmldsig-core1/) (lida em 2026-10-26): seção 3.2.1
- [OASIS, Assertions and Protocols for the OASIS Security Assertion Markup Language (SAML) V2.0, OASIS Standard, 15 March 2005](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) (lida em 2026-10-26): seção 5.4.3, e os nomes de namespace, o status Success e o formato de NameID emailAddress usados no Exemplo
