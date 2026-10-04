## O que faz

Um byte não significa nada até alguém dizer em que charset ele está. `E9` é é no windows-1252, Ú no IBM 850 e Z no EBCDIC, e em UTF-8 não é caractere nenhum, só o primeiro byte de um. Esta ferramenta mostra o mesmo texto e os mesmos bytes em catorze charsets de uma vez, decodifica bytes exatamente como um navegador decodifica e desfaz o estrago quando um texto foi lido no charset errado.

Ela tem três modos:

- **Texto para bytes** escreve um texto num charset, em seis notações, caractere por caractere, e diz o que aconteceu com cada caractere que o charset não comporta. Depois mostra o mesmo texto em todos os charsets, e como esses bytes se leem em cada charset: o mojibake que cada palpite errado produz.
- **Bytes para texto** lê bytes digitados em hexadecimal ou colados de um dump, como escapes, como %XX ou como Base64, decodifica-os com o charset que você escolher ou com o que ela detectar, e lista cada sequência que precisou substituir, com o motivo. Também mostra o que cada charset faz dos mesmos bytes.
- **Consertar mojibake** recebe um texto embaralhado, como `cafÃ©`, descobre o charset que o leu errado e aquele em que os bytes realmente estavam, e devolve o original, com os passos e a força da evidência.

## Os catorze charsets

| Charset | Bytes por caractere | O que um navegador faz com ele |
|---|---|---|
| UTF-8 | 1 a 4 | Decodifica; o WHATWG Encoding Standard o exige para conteúdo novo |
| UTF-16LE, UTF-16BE | 2 ou 4 | Decodifica os dois ("utf-16" é um rótulo do UTF-16LE); nunca os codifica |
| UTF-32LE, UTF-32BE | 4 | Não suporta |
| US-ASCII | 1 (sete bits) | Os rótulos "ascii" e "us-ascii" significam windows-1252 |
| ISO-8859-1 (Latin-1) | 1 | Os rótulos "iso-8859-1" e "latin1" significam windows-1252 |
| windows-1252 | 1 | Decodifica |
| ISO-8859-15 (Latin-9) | 1 | Decodifica |
| Mac OS Roman | 1 | Decodifica (rótulo "macintosh") |
| IBM 437 (DOS, EUA) | 1 | Não suporta |
| IBM 850 (DOS, Europa Ocidental) | 1 | Não suporta |
| IBM 037 e IBM 500 (EBCDIC) | 1 | Não suporta |

As tabelas do windows-1252, do ISO-8859-15 e do Mac OS Roman são os índices do WHATWG Encoding Standard, então batem com o que um navegador decodifica. As tabelas IBM são as tabelas de mapeamento de fabricantes que o Consórcio Unicode mantém arquivadas, "only for historical and archival purposes" (só para fins históricos e de arquivo), e sem garantia de que correspondam a uma plataforma. Cada tabela foi comparada byte a byte com os codecs do CPython 3.11 e com o iconv da glibc 2.39 em 2026-10-03. As diferenças:

- **windows-1252, bytes 0x81, 0x8D, 0x8F, 0x90 e 0x9D.** O padrão do WHATWG os mapeia para os controles C1 U+0081, U+008D, U+008F, U+0090 e U+009D; a tabela da Microsoft, o CPython e o iconv os deixam indefinidos. A ferramenta segue o padrão do WHATWG, então todo byte decodifica e a decodificação nunca perde informação.
- **Mac OS Roman no iconv.** A glibc mapeia 0xC6 para U+0394 e 0xF0 para U+E01E, onde a tabela da Apple e o padrão do WHATWG têm U+2206 e U+F8FF.

## Decodificar como um navegador decodifica

Os decodificadores de UTF-8 e UTF-16 seguem o WHATWG Encoding Standard passo a passo. Quando uma sequência é malformada, um U+FFFD substitui a sua subparte máxima: a maior sequência de bytes que ainda poderia ter começado um caractere bem formado, ou um único byte. O padrão Unicode descreve a mesma prática na seção 3.9.6, e as suas Tabelas 3-8 a 3-11 estão entre os exemplos. Cada sequência substituída recebe um nome:

| Motivo | Bytes UTF-8 | O que significa |
|---|---|---|
| Byte de continuação solto | 80 a BF onde um caractere começa | falta o primeiro byte, ou os dados não são UTF-8 |
| C0 ou C1 | C0, C1 | só poderiam começar uma forma de dois bytes de um caractere ASCII |
| F5 a FF | F5 a FF | nunca aparecem em UTF-8 |
| Forma longa demais | E0 80-9F, F0 80-8F | uma forma mais longa de um ponto de código que tem uma mais curta |
| Surrogate | ED A0-BF | U+D800 a U+DFFF, que o UTF-8 não pode carregar |
| Além de U+10FFFF | F4 90-BF | depois do último ponto de código |
| Cortada | um byte inicial, depois outra coisa | os bytes lidos até ali viram um U+FFFD |

O UTF-16 substitui surrogates sem par e um byte ímpar que sobre; o UTF-32, que os navegadores não decodificam, segue as definições D99 e D100 do padrão Unicode e substitui cada unidade de quatro bytes que seja um surrogate ou passe de U+10FFFF.

**Marcas de ordem de bytes.** Com "Deixar uma marca de ordem de bytes decidir o charset" ligado (o padrão), dados que começam com EF BB BF, FE FF ou FF FE são decodificados como UTF-8, UTF-16BE ou UTF-16LE seja qual for o charset escolhido, e a marca não faz parte do texto: o padrão do WHATWG trata a marca como mais confiável que um rótulo. A ferramenta também reconhece as marcas do UTF-32, 00 00 FE FF e FF FE 00 00, que um navegador não reconhece: ele toma o FF FE de FF FE 00 00 pela marca do UTF-16LE e decodifica o resto como UTF-16LE (Chromium 141, medido em 2026-10-03).

**Detectar.** Com o charset em Detectar, a ferramenta diz por que escolheu um: uma marca de ordem de bytes; todos os bytes ASCII (aí todo charset compatível com ASCII lê o mesmo texto); UTF-8 bem formado com caracteres além do ASCII; bytes zero onde texto ASCII em UTF-16 ou UTF-32 os coloca; ou o padrão do EBCDIC (0x40 comum, nenhum espaço ASCII, a maioria dos bytes acima de 0x80). Fora isso, ela diz que não há uma resposta única, e a tabela de leituras é a resposta.

## Ler bytes da caixa

| Formato | Exemplo |
|---|---|
| Hexadecimal, com qualquer separador, com ou sem 0x ou \x | `C3 A9`, `c3a9`, `0xC3, 0xA9`, `{ 0xC3, 0xA9 }` |
| Um dump hexadecimal | a saída de `hexdump -C`, `xxd` ou `od -Ax -tx1`: deslocamentos e a coluna ASCII são ignorados |
| Escapes | `\xC3\xA9`, `b'caf\xc3\xa9'` (Python), `caf\303\251` (o git escreve nomes de arquivo assim) |
| Codificação por porcentagem | `caf%C3%A9`, lida como o WHATWG URL Standard a lê: um % que não é seguido de dois dígitos hexadecimais continua sendo um % |
| Base64 | alfabeto padrão ou seguro para URLs, com ou sem preenchimento |

Um dump hexadecimal é reconhecido quando toda linha começa com um deslocamento e os deslocamentos avançam pela largura da linha, para que a coluna ASCII nunca seja lida como bytes, mesmo quando por acaso parece hexadecimal.

## Escrever bytes

As seis notações: pares hexadecimais; o leiaute do `hexdump -C`; um array em C; um literal de bytes do Python (exatamente como o `repr()` do Python o escreve); Base64 (RFC 4648, seção 4); e codificação por porcentagem com os caracteres não reservados da RFC 3986 mantidos como estão. Cada uma foi comparada com a sua referência: o `hexdump -C` do util-linux e o `repr()`, o `base64` e o `urllib.parse.quote` do CPython.

**Caracteres que um charset não comporta** são escritos como `?` (o que a maioria dos conversores faz), como uma referência HTML decimal como `&#8364;` (o que um navegador faz quando um formulário é enviado num charset assim: o modo de erro "html" do padrão do WHATWG, que o servidor não consegue distinguir de alguém digitando esses caracteres), ou não são escritos (estrito).

## Consertar mojibake

Um mojibake é reversível quando o charset errado não perdeu nada: codifique o texto embaralhado de volta com o charset que o leu errado e decodifique os bytes com o certo. A ferramenta tenta isso em dois níveis:

1. **UTF-8 lido como um charset de um byte** (windows-1252, ISO-8859-1, ISO-8859-15, Mac OS Roman, IBM 437, IBM 850). Desfazer a leitura precisa dar UTF-8 bem formado, que bytes além do ASCII raramente formam por acaso: evidência forte. Até três rodadas desfazem um texto lido errado mais de uma vez (`Ã¢â‚¬â„¢` é ’ lido errado duas vezes).
2. **Um charset de um byte lido como outro**, como um arquivo em IBM 850 mostrado como windows-1252 (`a‡Æo` no lugar de ação), ou EBCDIC mostrado como Latin-1. Todo byte decodifica nesses charsets, então a ferramenta só fica com uma leitura que pontue melhor numa medida de mojibake (os pares que o UTF-8 deixa para trás, símbolos dentro de palavras, maiúsculas dentro de palavras minúsculas, controles, caracteres de desenho de caixas, palavras que misturam escritas), e marca a evidência como mais fraca.

Quando um byte se perdeu no caminho (muitas vezes o último byte de ” ou de ™, que o windows-1252 transforma num controle invisível), uma passada tolerante recupera o resto e marca cada caractere perdido com U+FFFD. **Ver embaralhado** passa para Texto para bytes com o texto consertado, e a tabela de leituras mostra exatamente como ele foi embaralhado.

Verificado em 2026-10-03: 104 de 106 amostras de mojibake feitas a partir de quinze textos (UTF-8 lido errado em cinco charsets, lido errado duas vezes, IBM 850 e windows-1252 lidos um como o outro, EBCDIC lido como Latin-1) voltaram exatamente, e os quinze textos originais ficaram como estavam. As duas falhas são curtas: AÇÃO em EBCDIC lido como Latin-1 (`ÁhfÖ`), em que outra leitura fica em primeiro lugar, e Ça va em windows-1252 lido como IBM 850 (`Ãa va`), que fica como está. De 12.087 textos corretos (parágrafos dos artigos do Learn deste site em inglês e português, mais dezesseis frases em outras línguas, escritas e conjuntos de símbolos), nenhum recebeu proposta de conserto.

## Limites

- O conserto trabalha sobre o texto inteiro. Um texto que mistura caracteres certos e embaralhados fica como está: cole a parte embaralhada sozinha.
- Bytes que viraram `?` ou U+FFFD, ou que foram descartados, não voltam; o conserto diz quantos caracteres se perderam.
- A detecção e o segundo nível de conserto são heurísticas. Evidência forte vem de marcas de ordem de bytes e de UTF-8 bem formado; todo o resto aparece como mais fraco.
- Só os catorze charsets acima. Charsets multibyte do leste asiático (Shift_JIS, GBK, Big5, EUC-KR) não estão incluídos.
- Até 64 KiB de bytes são decodificados e 20.000 caracteres codificados de uma vez; as tabelas listam as primeiras 2.000 linhas; o conserto examina os primeiros 2.000 caracteres.

## Fontes

- [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/): os decodificadores de UTF-8 e UTF-16, a detecção da BOM, o decodificador e o codificador de um byte, os rótulos, os modos de erro; padrão vivo atualizado em 21 de maio de 2026 (lido em 2026-10-03)
- [Índices do WHATWG: windows-1252](https://encoding.spec.whatwg.org/index-windows-1252.txt), [ISO-8859-15](https://encoding.spec.whatwg.org/index-iso-8859-15.txt), [macintosh](https://encoding.spec.whatwg.org/index-macintosh.txt) (lido em 2026-10-03)
- [The Unicode Standard 18.0.0, capítulo 3: Conformance](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-3/): Tabela 3-7, seção 3.9.6 e Tabelas 3-8 a 3-11, definições D95 a D100 (lido em 2026-10-03)
- [FAQ do Unicode: UTF-8, UTF-16, UTF-32 & BOM](https://www.unicode.org/faq/utf_bom.html) (lido em 2026-10-03)
- [Tabelas de mapeamento do Unicode](https://www.unicode.org/Public/MAPPINGS/): [ReadMe](https://www.unicode.org/Public/MAPPINGS/ReadMe.txt), [CP437](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP437.TXT), [CP850](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP850.TXT), [CP037](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP037.TXT), [CP500](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP500.TXT), [CP1252](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP1252.TXT), [8859-1](https://www.unicode.org/Public/MAPPINGS/ISO8859/8859-1.TXT), [Apple ROMAN](https://www.unicode.org/Public/MAPPINGS/VENDORS/APPLE/ROMAN.TXT) (lido em 2026-10-03)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (lido em 2026-10-03)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (lido em 2026-10-03)
- [RFC 4648: Base16, Base32 e Base64](https://www.rfc-editor.org/rfc/rfc4648) (lido em 2026-10-03)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lido em 2026-10-03)
- [WHATWG URL Standard: percent-decode](https://url.spec.whatwg.org/) (lido em 2026-10-03)
