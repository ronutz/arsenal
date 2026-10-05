## O que faz

Recebe uma página, ou só o conteúdo do seu head, e lê o que ela declara do modo como cada padrão lê. O HTML é analisado de modo inerte com o parse5 (o parser por trás do explicador de estrutura HTML e do testador de seletores CSS), então um head colado sem as tags `html` ou `head` é colocado onde o parser o põe, exatamente como um navegador faria. Nada é buscado, resolvido, executado ou renderizado: URLs ficam como strings, scripts ficam como texto, o JSON é analisado com `JSON.parse` e nunca avaliado. A API hospedada roda o mesmo código.

## O que lê, e contra o quê

- **title e codificação** (HTML Living Standard 4.2.2, 4.2.5.4): um title com texto; uma declaração de codificação de caracteres, `utf-8`, uma vez, com o elemento terminando dentro dos primeiros 1024 bytes (o deslocamento em bytes é mostrado).
- **Cada elemento meta** (4.2.5): classificado pelo modo como se identifica, name, http-equiv, charset, itemprop, ou o property do RDFa (a forma do Open Graph, conforme através do HTML+RDFa 1.1), e pelo que a chave é: um dos oito nomes de metadados padrão (4.2.5.1), um nome registrado na wiki MetaExtensions do WHATWG (viewport, robots, os nomes de verificação, twitter:* e outros), uma diretiva pragma (4.2.5.3: content-type, default-style, refresh, x-ua-compatible, content-security-policy) ou uma que o padrão chama de não conforme (content-language, set-cookie), ou desconhecido. Cada nome conhecido carrega a frase do próprio padrão ou do registro. As regras de uso único (description, color-scheme, application-name por língua) são verificadas, e um elemento meta sem nenhum dos atributos identificadores ou sem `content` é um erro.
- **Cada elemento link** (4.6.7): os tokens rel com os que o padrão define marcados; `rel=canonical` pela RFC 6596 (relativo, vários); `rel=alternate` com `hreflang` listados, com se há um `x-default` entre eles; ícones, apple-touch-icon, mask-icon e manifest.
- **Open Graph** (ogp.me): as quatro propriedades obrigatórias (og:title, og:type, og:image, og:url), as opcionais, arrays (o primeiro valor é o preferido, como diz o ogp.me), as propriedades estruturadas de og:image, og:video e og:audio ligadas à raiz antes delas, e uma propriedade estruturada sem raiz antes dela reportada como tal; a forma language_TERRITORY de og:locale; og:type contra os tipos globais; os namespaces verticais (article, book, profile, music, video, payment) e qualquer propriedade que o ogp.me não liste. Open Graph escrito com `name=` em vez de `property=` também é lido, com uma nota.
- **twitter:\*** propriedades de card como registradas no MetaExtensions: twitter:card com os quatro tipos que o registro nomeia (summary, photo, app, player; `summary_large_image` é reportado como de uso comum, já que a documentação de cards do X não está mais publicada), e cada nome verificado contra o registro.
- **robots, googlebot e os outros nomes de rastreador** contra a lista de regras publicada do Google: regras atuais com os seus valores (max-snippet, max-image-preview, max-video-preview, unavailable_after), regras aposentadas (noarchive, nocache, nositelinkssearchbox), desconhecidas, e conflitos dentro do que um rastreador recebe ("the more restrictive rule applies").
- **viewport**, separado em partes, com um aviso quando `user-scalable=no` ou um `maximum-scale` abaixo de 2 impede os 200 por cento do WCAG 2.2 SC 1.4.4; **refresh**, separado em segundos e URL; uma **Content Security Policy** num elemento meta, encaminhada ao avaliador de CSP, e sinalizada quando o elemento meta não é filho de head (o padrão então a ignora).
- **JSON-LD** (JSON-LD 1.1 seção 7): cada `script type="application/ld+json"` analisado; o @context, se o nível superior é um @graph, um esboço dos nós com @type, @id e uma propriedade de nome, nós sem @type contados; JSON inválido reportado com a mensagem do parser; as sequências que a seção 7.2 manda escapar (`</script`, `<!--`) sinalizadas; um script de outro type que contenha `@context` reportado como parecido.

## Os achados

Quarenta e seis regras, M1 a M46, cada uma citando a frase em que se apoia: erros são requisitos de conformidade violados (sem title, dois titles, duas descriptions, charset ausente, não UTF-8 ou tardio, um meta sem atributo identificador ou sem content, JSON-LD inválido); avisos são regras de "should" e expectativas documentadas de consumidores (um viewport que restringe o zoom, vários canonicals, uma propriedade obrigatória do Open Graph ausente, og:image sem og:image:alt, uma propriedade estruturada antes da raiz, um og:locale malformado, twitter:* sem twitter:card, JSON-LD sem @context, regras de robots em conflito, um pragma não conforme, um meta de CSP fora do head, sem lang na raiz); notas são fatos que vale saber (sem description, sem viewport, sem canonical, sem Open Graph, um canonical ou og:image relativo, um noindex, uma regra aposentada, um meta refresh, um nome desconhecido); e "em ordem" marca o que a página acerta.

## O que não faz

Não busca nada, então não pode dizer se uma imagem existe, qual o seu tamanho, se um alvo canonical responde, ou como uma dada plataforma vai renderizar um card de compartilhamento. Não valida JSON-LD contra o vocabulário do schema.org; reporta os tipos e a estrutura. O que um rastreador ou uma plataforma social faz com uma tag é citado da documentação publicada dessa parte, com a sua data; onde uma parte retirou a documentação (a marcação de cards do X), o inspetor diz isso em vez de adivinhar.

## Fontes

- [HTML Living Standard, o elemento meta e os nomes de metadados](https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element) (lido em 2026-10-05)
- [HTML Living Standard, tipos de link](https://html.spec.whatwg.org/multipage/links.html#linkTypes) (lido em 2026-10-05)
- [Wiki do WHATWG, MetaExtensions](https://wiki.whatwg.org/wiki/MetaExtensions) (lido em 2026-10-05; última edição em 12 de outubro de 2023)
- [The Open Graph protocol](https://ogp.me/) (lido em 2026-10-05)
- [HTML+RDFa 1.1, Second Edition, W3C Recommendation 17 March 2015](https://www.w3.org/TR/html-rdfa/) (lido em 2026-10-05)
- [JSON-LD 1.1, W3C Recommendation 16 July 2020, seção 7](https://www.w3.org/TR/json-ld11/#embedding-json-ld-in-html-documents) (lido em 2026-10-05)
- [RFC 6596, The Canonical Link Relation](https://www.rfc-editor.org/rfc/rfc6596) (lido em 2026-10-05)
- [Google Search Central, Meta tags and attributes that Google supports](https://developers.google.com/search/docs/crawling-indexing/special-tags) (lido em 2026-10-05; última atualização 2025-12-10)
- [Google Search Central, Robots meta tag, data-nosnippet, and X-Robots-Tag specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) (lido em 2026-10-05; última atualização 2026-03-24)
- [WCAG 2.2, SC 1.4.4 Resize Text](https://www.w3.org/TR/WCAG22/#resize-text) (lido em 2026-10-05)
- [parse5](https://github.com/inikulin/parse5) (lido em 2026-10-05)
