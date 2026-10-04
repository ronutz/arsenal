## O que faz

Um texto pode conter muito mais do que mostra. Um espaço de largura zero fica entre duas letras sem deixar rastro, um override da direita para a esquerda faz uma linha de código aparecer numa ordem diferente da que o compilador lê, um "а" cirílico passa por um "a" latino, e um separador de linha começa uma nova linha no seu editor, mas não no seu analisador. O inspetor mostra o que de fato está ali, um ponto de código por vez.

Ele tem três modos:

- **Inspecionar um texto** conta o texto, diz se algo merece atenção, lista o que encontrou por tipo, aponta controles bidirecionais deixados abertos no fim de uma linha e palavras que misturam escritas, desenha o texto na ordem em que está armazenado com cada caractere escondido como uma etiqueta, lista todos os pontos de código, oferece uma cópia limpa e escreve o texto como escapes em oito linguagens.
- **Um ponto de código** recebe um ponto de código em qualquer notação (`U+00E9`, `é`, `0xE9`, `&eacute;`, `é`, `zero width space`, `BOM`) e mostra o nome e os apelidos, as propriedades, as codificações, os escapes e o que é preciso saber sobre ele.
- **Encontrar pelo nome** lista os pontos de código cujo nome ou apelido tem palavras que começam com as palavras digitadas.

## O que ele aponta num texto

| Achado | O que é | Por que importa |
|---|---|---|
| Controle bidirecional | Um dos doze caracteres Bidi_Control (LRM, RLM, ALM, LRE, RLE, LRO, RLO, PDF, LRI, RLI, FSI, PDI) | Muda a ordem exibida do texto ao redor; a classe de ataque Trojan Source (CVE-2021-42574) |
| Aberto no fim da linha | Um embedding, override ou isolate sem PDF ou PDI antes de a linha acabar | Tudo o que vem depois nessa linha pode ser exibido numa ordem diferente da ordem em que é lido |
| Invisível | Default_Ignorable_Code_Point: caracteres de largura zero, o BOM, seletores de variação, tags | Não desenha nada, mas comparações de strings, comprimentos e hashes o enxergam |
| Controle | Um código de controle que não é TAB, LF nem CR | Não é texto; as ferramentas o descartam, mostram uma caixa ou param |
| Quebra de linha que não é LF nem CR | VT, FF, NEL (U+0085), LINE SEPARATOR (U+2028), PARAGRAPH SEPARATOR (U+2029) | Um editor e uma linguagem podem discordar sobre onde a linha termina (UTS #55, falsificação por quebra de linha) |
| Surrogate isolado, não caractere | Pontos de código que não são caracteres | Inválidos em UTF-8 (surrogates) ou nunca destinados a intercâmbio (não caracteres) |
| Uso privado, não atribuído | Sem significado público, ou ainda sem caractere | Fontes e sistemas divergem, ou o texto veio de um Unicode mais novo que o seu |
| Caractere de substituição | U+FFFD | Muitas vezes marca uma falha de decodificação anterior |
| Espaço, aspa ou traço não ASCII | Espaços não separáveis e outros, aspas tipográficas, travessões e meias-riscas, o sinal de menos | Parecem ASCII; analisadores e comparações discordam |
| Confundível com ASCII | Um caractere que a UTS #39 associa a um protótipo ASCII | Sósias: а cirílico por a, ο grego por o |
| ASCII estilizado | Um caractere cuja decomposição de compatibilidade é ASCII | Letras de largura total, ligaduras e parecidos |
| Palavra de escritas misturadas | Uma palavra cujas letras não compartilham um sistema de escrita | `pаypal` com um а cirílico; japonês misturando Han, Hiragana e Katakana não é apontado |

A detecção de escritas misturadas segue a UTS #39: o conjunto de escritas aumentado de cada caractere é o seu Script_Extensions mais os sistemas de escrita que combinam escritas (Han acrescenta Hanb, Hntl, Jpan e Kore; Hiragana e Katakana acrescentam Jpan; Hangul acrescenta Kore; Bopomofo acrescenta Hanb; Latin acrescenta Hntl), um caractere Common ou Inherited combina com qualquer escrita, e uma palavra é misturada quando a interseção desses conjuntos sobre os seus caracteres é vazia.

## O texto, na ordem armazenada

O painel de revelação desenha o texto da esquerda para a direita na ordem da memória, com a reordenação bidirecional desligada para o próprio painel, então nenhum controle do texto consegue reordenar o que você vê. Cada caractere que merece atenção vira uma etiqueta com o seu ponto de código; etiquetas vermelhas mudam significado ou ordem, etiquetas âmbar imitam outra coisa. Passe o mouse ou o foco sobre uma etiqueta para ver o nome.

## Limpeza

A cópia limpa pode remover caracteres invisíveis e bidirecionais, trocar espaços não ASCII por SPACE (e LINE SEPARATOR, PARAGRAPH SEPARATOR e NEL por LF), transformar aspas tipográficas e traços em `'`, `"` e `-`, e, se você pedir, trocar sósias pelo ASCII que imitam. Essa última opção vem desligada, porque também altera palavras legítimas em cirílico, grego e outras escritas.

## Escapes

O texto inteiro pode ser escrito em JSON, JavaScript, Python, HTML, CSS, numa URL, numa string `u8` de C ou numa palavra entre aspas de Tcl (iRules). Cada forma faz o escape dos caracteres que a sua linguagem reserva e de tudo o que está fora do ASCII imprimível. Quando esta ferramenta foi construída, cada forma de 4.000 pontos de código, espalhados pelos dezessete planos, e de dois textos de estresse foi decodificada de volta pela própria linguagem (CPython, Node, GCC, Tcl 8.4.6, e o Chromium para HTML e CSS), e todos voltaram iguais.

Algumas formas não comportam todos os caracteres, e a ferramenta diz isso em vez de escrever algo errado:

- **Tcl 8.4 e iRules** não têm escape para caracteres além de U+FFFF: `\u` aceita no máximo quatro dígitos hexadecimais, e o interpretador Tcl 8.4.6 lê os quatro bytes UTF-8 de um caractere assim como quatro caracteres separados.
- **HTML** não comporta um surrogate isolado, e uma referência de U+0080 a U+009F dá outro caractere: 27 dessas 32 referências são lidas como Windows-1252 (`&#x85;` vira reticências), então a ferramenta escreve esses caracteres como eles mesmos.
- **CSS** transforma um 0 ou um surrogate escapado em U+FFFD.
- **C**: nomes de caractere universais não podem nomear caracteres abaixo de U+00A0 além de `$`, `@` e `` ` ``, nem um surrogate; a ferramenta escreve os bytes UTF-8 de U+0080 a U+009F em octal.
- **URLs** codificam por porcentagem bytes UTF-8, que um surrogate isolado não tem.

## Um ponto de código

- **Nome.** A propriedade Name; para um controle, o seu primeiro apelido formal (controles não têm nome); para qualquer outro sem nome, o seu rótulo de ponto de código, como `<surrogate-D800>` ou `<reserved-0378>`.
- **Apelidos.** Todos os apelidos formais com o seu tipo: correção, controle, alternativo, fictício ou abreviação (`BOM` e `ZWNBSP` para U+FEFF).
- **Propriedades.** General_Category, Block, Script e Script_Extensions, e a versão do Unicode que o incluiu.
- **Codificações.** Bytes UTF-8, unidades de código UTF-16 (um par surrogate além de U+FFFF) e UTF-32.
- **Escapes e referências.** As oito formas acima para este ponto de código, mais as referências HTML decimal, hexadecimal e nomeadas, com uma nota quando uma referência não devolve este ponto de código.

## Limites

- Colunas e posições são contadas em pontos de código. Editores podem contar unidades UTF-16 ou caracteres percebidos pelo usuário.
- A detecção de escritas misturadas trabalha palavra por palavra; não verifica identificadores inteiros através de pontuação e não decide se uma mistura é legítima.
- Os dados de confundíveis cobrem caracteres que parecem texto ASCII. Confundíveis entre duas escritas não ASCII ficam de fora.
- A ferramenta mostra a visão do Unicode 18.0.0. Um sistema com dados mais antigos pode não conhecer caracteres incluídos depois (13.007 chegaram na 18.0).

## Fontes

- [Unicode Character Database 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/): UnicodeData.txt, DerivedName.txt, NameAliases.txt, PropList.txt, DerivedCoreProperties.txt, Blocks.txt, DerivedAge.txt, Scripts.txt, ScriptExtensions.txt, LineBreak.txt, PropertyValueAliases.txt (lido em 2026-10-03)
- [UTS #39: Unicode Security Mechanisms (18.0.0) e confusables.txt](https://www.unicode.org/reports/tr39/) (lido em 2026-10-03)
- [UTS #55: Unicode Source Code Handling](https://www.unicode.org/reports/tr55/) (lido em 2026-10-03)
- [UAX #9: Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/) (lido em 2026-10-03)
- [UAX #44: Unicode Character Database](https://www.unicode.org/reports/tr44/) (lido em 2026-10-03)
- [The Unicode Standard 18.0.0, capítulos 3, 4, 5 e 23](https://www.unicode.org/versions/Unicode18.0.0/) (lido em 2026-10-03)
- [NVD: CVE-2021-42574](https://nvd.nist.gov/vuln/detail/CVE-2021-42574) (lido em 2026-10-03)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (lido em 2026-10-03)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (lido em 2026-10-03)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (lido em 2026-10-03)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (lido em 2026-10-03)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (lido em 2026-10-03)
- [ISO/IEC 9899:2011, rascunho do comitê N1570 (C11), 6.4.3](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (lido em 2026-10-03)
- [Manual do Tcl 8.4: Tcl](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (lido em 2026-10-03)
- [WHATWG HTML: análise (referências numéricas de caractere)](https://html.spec.whatwg.org/multipage/parsing.html) (lido em 2026-10-03)
- [WHATWG HTML: referências de caractere nomeadas](https://html.spec.whatwg.org/entities.json) (lido em 2026-10-03)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lido em 2026-10-03)
