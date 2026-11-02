## O que faz

Lê HTML (um documento inteiro ou um fragmento) com o mesmo parser que os navegadores são especificados para usar e mostra o que saiu: a árvore (cada elemento, nó de texto e comentário, recuado pela profundidade, com a linha da sua tag), os elementos que o parser criou sem tag, as tags de fechamento que ele supriu, os elementos de formatação que dividiu, o conteúdo que moveu para fora de uma tabela, o modo do documento (no-quirks, limited-quirks ou quirks), o DOCTYPE, o título, o idioma e a codificação que o documento declara, cada erro de análise pelo código da própria especificação com linha e coluna, a estrutura de títulos, e uma lista de achados sobre estrutura e acessibilidade, cada um ligado a uma frase do HTML Standard ou da WCAG 2.2. Conta também o que teria rodado e não rodou: elementos script, manipuladores de evento inline, URLs javascript:, elementos style, iframes.

O parser é o parse5, o parser de HTML conforme à especificação usado pelo jsdom, pelo Cheerio e pelo compilador do Angular, executado com posições no código e com a chamada de erros de análise ligada, e com a flag de scripting desligada (como o DOMParser analisa). Nada é executado, buscado ou renderizado. A API hospedada roda o mesmo código e devolve a mesma árvore.

## Como ler a árvore

- Um **ponto** na coluna das linhas marca um nó sem posição no código: o parser o criou. A especificação: "Omitting an element's start tag in the situations described below does not mean the element is not present; it is implied, but it is still there." html, head, body e tbody são os habituais.
- **fim suprido** marca um elemento cuja tag de fechamento não está no código. Para 19 elementos a especificação permite isso (13.1.2.4 Optional tags: html, head, body, li, dt, dd, p, rt, rp, optgroup, option, colgroup, caption, thead, tbody, tfoot, tr, td, th); para qualquer outro significa que a tag de fechamento faltou ou que outra tag o fechou antes, e o achado D13 diz qual.
- **parte n** marca o resultado do adoption agency algorithm: quando uma tag de fechamento fecha um elemento de formatação (a, b, i, em, strong, font, small, s, u, code, nobr, big, tt, strike) que não é o elemento aberto mais interno, o parser o fecha e reabre uma cópia em volta do que segue, de modo que um elemento do código vira vários (achado D14).
- **movido** marca o foster parenting: texto ou elementos escritos dentro de uma tabela onde só partes de tabela podem aparecer são inseridos antes da tabela (achado D15).
- **vazio** marca os 13 elementos que nunca têm tag de fechamento (area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr). Uma barra final neles é "unnecessary and has no effect of any kind"; em qualquer outro elemento HTML é um erro de análise e o elemento continua aberto.

## Os erros de análise

A especificação define exatamente o tratamento de erros, então um documento com erros ainda tem uma árvore exata: "Parse errors are only errors with the syntax of HTML." A sua tabela de erros nomeados (13.2.2) tem 52 códigos, cada um com uma descrição não normativa; a página cita a descrição ao lado de cada erro. Os erros da construção da árvore (uma tag de fechamento perdida, elementos abertos no fim, um segundo body) são descritos na prosa da especificação sem código; o parse5 nomeia esses por conta própria (missing-doctype, end-tag-without-matching-open-element, open-elements-left-after-eof e mais nove), e a página marca qual autoridade nomeou cada código.

## Os achados

D1 sem DOCTYPE e D2 DOCTYPE legado (quirks mode); D3 sem lang na raiz (WCAG 3.1.1); D4 título ausente, repetido ou vazio (modelo de conteúdo do head, WCAG 2.4.2); D5 declaração de codificação ausente, além dos primeiros 1024 bytes, ou não UTF-8; D6 img sem alt e D7 img com alt vazio (WCAG 1.1.1 e as regras de texto alternativo da especificação); D8 link ou botão feito só de imagens sem texto alternativo; D9 títulos que saltam níveis e h1 ausente (4.3.11: "less than, equal to, or 1 greater"); D10 ids duplicados; D11 e D12 os elementos e atributos obsoletos da seção 16.2, cada um com o conselho de substituição da especificação; D13 a D16 o que o parser reparou; D17 um controle rotulável sem rótulo; D18 o que não rodou; D19 títulos vazios (WCAG 2.4.6); D20 os elementos que o parser criou.

## Compartilhar resultado

Abaixo do veredito, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o HTML como foi colado depois do `#`: a árvore, os erros de análise e os achados dependem de cada caractere dele, então nada pode ser trocado sem mudar a leitura. O popover diz primeiro o que o link leva, depois uma cautela própria (um HTML colado pode citar hosts e caminhos internos), e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. A chave de valores de atributo completos não vai junto.

Uma página salva de uma sessão autenticada ainda pode trazer uma credencial, então antes de oferecer um link o texto passa pela verificação de segredos do site. Um valor que é segredo pelo próprio formato impede o link, e o popover diz a linha: uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), seções 10 e 11), um JWS ou JWE ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), seção 7.1, a serialização que os JWTs usam, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), credenciais de Authorization escritas como linha de header ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1) ou um access key ID da AWS. Coloque um placeholder no lugar e clique de novo. Um valor cujo nome só parece de segredo (um membro JSON como `apiToken`) continua ganhando link, e a linha de cautela diz em que linha ele está para você conferir antes.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o HTML não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O HTML substitui a caixa como se tivesse sido colado e a página o analisa; nada é executado, buscado ou renderizado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Limites

- O parse5 8.0.1 implementa a especificação tal como estava no seu lançamento. A tokenização de instruções de processamento que a especificação ganhou em 2026 não está nele: `<?…>` é relatado sob o nome anterior unexpected-question-mark-instead-of-tag-name e vira comentário, que é também o que a especificação atual faz com um alvo xml.
- Os achados leem estrutura, não significado: se um texto alternativo é bom, se um título descreve a sua seção, se uma etiqueta lang está certa, não são perguntas que um parser responda. headingoffset e headingreset não são aplicados à estrutura.
- A lista da árvore para em 2.000 nós (as contagens cobrem tudo); entradas acima de 200.000 caracteres são recusadas.

## Fontes

- [HTML Living Standard, 13 The HTML syntax: 13.2.2 Parse errors](https://html.spec.whatwg.org/multipage/parsing.html#parse-errors) (lido em 2026-10-05)
- [HTML Living Standard, 4.3.11 Headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines) (lido em 2026-10-05)
- [HTML Living Standard, 16.2 Non-conforming features](https://html.spec.whatwg.org/multipage/obsolete.html#non-conforming-features) (lido em 2026-10-05)
- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (lido em 2026-10-05)
- [parse5](https://github.com/inikulin/parse5) (lido em 2026-10-05)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-11-01): seção 3.5, o fragmento, que o link de Compartilhar resultado usa
