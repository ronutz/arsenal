## O que faz

Teste, explique e depure uma expressão regular. Digite um padrão e um texto e a ferramenta mostra cada correspondência com seus grupos de captura ao vivo, conforme você digita; digite um padrão sozinho e ela o divide em partes anotadas para você ler o que cada trecho faz; e, o tempo todo, ela avisa quando um padrão corre risco de backtracking catastrófico. Ela usa o motor de regex do JavaScript (ECMAScript) e roda inteiramente no seu navegador.

## Quatro tarefas em uma

A ferramenta faz as quatro coisas que você de fato quer de uma bancada de regex:

- **Testar.** Ela compila seu padrão e suas flags, relata qualquer erro de sintaxe em termos claros, e roda o padrão contra sua entrada, retornando cada correspondência junto com seus grupos de captura numerados e nomeados. O número de correspondências que ela coleta é limitado, para que um padrão que casa com uma entrada enorme não trave a página.
- **Explicar.** Ela analisa o padrão em tokens anotados, rotulando cada quantificador, classe de caracteres, grupo e asserção, para você entender uma regex sem rodá-la de cabeça.
- **Verificar ReDoS.** Ela procura as estruturas que causam backtracking catastrófico e avisa você sobre elas.
- **Comparar dialetos.** Ela lista cada construção do padrão cujo suporte ou significado muda entre ECMAScript, PCRE2 (NGINX) e as Advanced Regular Expressions do Tcl (iRules do BIG-IP), de forma estática, sem rodar o padrão em nenhum lugar além daqui. A seção Dialetos, abaixo, explica como.

## O que é ReDoS, e por que importa aqui

Regular expression Denial of Service (ReDoS) acontece quando um padrão pode fazer backtracking de um número exponencial de formas em certas entradas, de modo que uma string curta faz o motor rodar praticamente para sempre. A forma clássica é um quantificador aplicado a um grupo que ele mesmo contém um quantificador, como `(a+)+`, casado contra uma entrada que no fim falha. Isso importa diretamente no navegador: uma correspondência de regex síncrona não pode ser interrompida, então um padrão catastrófico travaria a página. É por isso que a ferramenta tanto limita seu trabalho quanto sinaliza padrões arriscados, e é um aviso real a levar em conta antes de publicar um padrão que rodará sobre entrada não confiável. O [lab do artigo sobre backtracking](/learn/regex-catastrophic-backtracking#lab-regex-partitions) conta os jeitos de `(a+)+` dividir uma sequência de letras a.

## O motor e seu dialeto

A sintaxe de regex varia entre linguagens, e esta ferramenta usa o dialeto do JavaScript definido pela especificação ECMAScript, com suas flags (global, ignore-case, multiline, dotall, unicode e sticky) e seu suporte a grupos nomeados e lookarounds. Se você está escrevendo regex para JavaScript, ou para qualquer coisa que compartilhe sua semântica, o que você vê aqui é o que você vai obter. Para qualquer outro motor, veja Dialetos, abaixo.

## Dialetos

O testador roda um único motor, o ECMAScript, mas os padrões que engenheiros de rede e de segurança escrevem raramente ficam no JavaScript. Um bloco `location ~` do NGINX, uma iRule do BIG-IP e uma assinatura de web application firewall (WAF) entregam o padrão cada um a um motor diferente, e os mesmos caracteres podem significar outra coisa ali. A seção **Portabilidade** lê os tokens do seu padrão e lista cada construção cujo suporte ou significado muda entre três dialetos:

- **ECMAScript**, como a edição de 2026 do ECMA-262 o define (a 17ª edição; a gramática de RegExp não muda no rascunho de 2027), junto com o anexo para navegadores que, por exemplo, faz de `\A` a simples letra A quando nem a flag `u` nem a `v` está ativa.
- **PCRE2**, como o próprio manual o descreve. O NGINX precisa da biblioteca PCRE para expressões regulares em `location` e no módulo rewrite, as diretivas `map` e `server_name` também aceitam expressões regulares, e desde a 1.21.5 ele usa o PCRE2, a menos que seja compilado com `--without-pcre2`, que escolhe a biblioteca PCRE original.
- **Advanced Regular Expressions (AREs) do Tcl**, como o manual `re_syntax` do Tcl 8.4 as descreve. A F5 informa que o conjunto de comandos das iRules do BIG-IP foi desenvolvido a partir do Tcl 8.4.6 (K6091), e `regexp` e `regsub` não estão na lista de comandos Tcl desabilitados (K36322151). Os manuais do Tcl 8.6 e 9.0 não acrescentam lookbehind nem grupos nomeados, e o `\w` deles também aceita os caracteres de pontuação conectora.

Cada construção recebe uma resposta por dialeto: **igual** (suportada com o significado que o título da linha dá), **difere** (suportada com outro significado ou outra sintaxe, e a linha diz como) ou **sem suporte** (um erro, ou lida como outra coisa, e a linha diz qual). A seção aparece mesmo quando o seu navegador não consegue compilar o padrão, porque colar um padrão do NGINX ou de uma iRule é justamente o objetivo.

Onde esses padrões moram, outras ferramentas os leem: o [comparador de location do NGINX](/tools/nginx-location-matcher) mostra qual bloco `location` uma URI seleciona, o [linter de desempenho de iRules](/tools/f5-irules-performance-linter) sinaliza `regexp` e `regsub` onde um comando de string resolveria, e o [explicador de scripts Expect](/tools/expect-script-explainer) lê os padrões de um script Expect, cujos padrões `-re` "follow the syntax defined by Tcl's regexp" (seguem a sintaxe definida pelo comando regexp do Tcl; expect(1), Expect 5.45.4), e por isso a coluna do Tcl vale para eles também.

| Construção | ECMAScript | PCRE2 | Tcl ARE |
|---|---|---|---|
| Lookbehind de tamanho fixo: `(?<=ab)`, `(?<=colour\|color)` | igual | igual: cada ramo de nível superior com tamanho fixo, até 65.535 caracteres | sem suporte: só lookahead |
| Lookbehind de tamanho variável, com máximo: `(?<=colou?r)` | igual | difere: a partir da 10.43, cada ramo até um limite que quem chama define, 255 por padrão; sem suporte acima dele ou antes da 10.43 | sem suporte |
| Lookbehind sem máximo: `(?<=\d+)` | igual | sem suporte | sem suporte |
| Lookahead com grupo ou backreference | igual | igual | difere: parênteses dentro dele nunca capturam; backreference fica sem suporte |
| Grupo nomeado `(?<name>...)` | igual, a única grafia | igual; fora do modo UTF o nome precisa ser ASCII | sem suporte |
| Grupo nomeado `(?P<name>...)` ou `(?'name'...)` | sem suporte | igual | sem suporte |
| Backreference nomeada `\k<name>` | igual | igual | sem suporte |
| `\k'name'`, `\k{name}`, `\g{name}`, `\g1`, `\g{-1}`, `(?P=name)` | sem suporte | igual | sem suporte |
| Modificadores restritos `(?i:...)`, `(?i-s:...)` | igual a partir do ECMAScript 2025, só com as letras i, m e s | igual | sem suporte |
| Opções simples `(?i)`, `(?im)` | sem suporte | igual | só logo no início; i e x significam o mesmo, m é casamento sensível a quebra de linha e s é o modo padrão |
| Quantificadores possessivos `a++`, `a*+` | sem suporte | igual | sem suporte |
| Grupo atômico `(?>...)` | sem suporte | igual | sem suporte |
| `\A` | sem suporte | igual | igual |
| `\Z` | sem suporte | igual: fim, ou antes de uma quebra de linha final | difere: só o fim absoluto |
| `\z` | sem suporte | igual | sem suporte |
| `$` | igual: fim; com `m`, antes de terminadores de linha | difere: também antes de uma quebra de linha final, a menos que PCRE2_DOLLAR_ENDONLY esteja definido | igual: fim; com `-line`, antes de cada quebra de linha |
| `.` | igual: não casa LF, CR, U+2028 nem U+2029 sem `s` | difere: não casa os caracteres da convenção de quebra de linha, só LF por padrão | difere: casa quebra de linha, a menos que o casamento seja sensível a quebra de linha |
| Classe POSIX `[[:alpha:]]` | sem suporte | igual: ASCII, a menos que PCRE2_UCP esteja definido; também `ascii`, `word` e `[:^nome:]` | difere: localidade Unicode; doze nomes, sem negação |
| `[[:<:]]`, `[[:>:]]` | sem suporte | igual, convertido em limite de palavra | igual, obsoleto |
| `\Q...\E` | sem suporte | igual | sem suporte; `***=` torna uma expressão inteira literal |
| `\p{L}`, `\P{L}` | difere com `u` ou `v` (nomes mais rígidos); sem suporte sem elas | igual: nomes flexíveis, nomes de script sozinhos | sem suporte |
| `\pL` | sem suporte | igual | sem suporte |
| Quantificadores preguiçosos `*?`, `+?`, `??`, `{n,m}?` | igual | igual | difere: regras de preferência pelo mais longo ou mais curto |
| `\b` | igual: caracteres de palavra ASCII | igual: ASCII, a menos que PCRE2_UCP esteja definido | difere: backspace; o limite é `\y` |
| `\B` | igual | igual | difere: uma barra invertida; a posição fora de limite é `\Y` |
| `\w`, `\W` | igual: ASCII | igual: ASCII, a menos que PCRE2_UCP esteja definido | difere: localidade Unicode |
| `\D`, `\S` ou `\W` dentro de colchetes | igual | igual | sem suporte |
| `\m`, `\M`, `\y`, `\Y` | sem suporte: letras comuns num navegador sem `u` nem `v` | sem suporte: erro | igual: restrições de palavra |
| `{,n}` | sem suporte: texto literal sem `u` nem `v` | igual a partir da 10.43 | sem suporte: texto literal |

### Assinaturas de web application firewall

A sintaxe de assinaturas da F5 para as assinaturas de ataque e de bot do BIG-IP ASM (um manual que vale para o BIG-IP ASM da 14.1.0 à 21.0.0) cita três opções de regra com expressão regular. A opção `pcre` se baseia na sintaxe PCRE, mas qual biblioteca e versão PCRE ela usa não é informado pela F5. A opção `re2` usa a sintaxe aberta RE2, que a F5 recomenda por desempenho, e esta visão não compara o RE2. A opção `ipp`, só para assinaturas de bot, usa um motor baseado em Intel cuja sintaxe não é informada pela F5. Assim, a coluna PCRE2 é o guia mais próximo para a opção `pcre`, e nada além disso.

### O que a visão não verifica

É uma comparação estática de sintaxe, não um segundo motor: ela nunca roda o seu padrão em PCRE2 ou Tcl. Ela não verifica limites dos motores (limites de quantificador, tamanho do padrão, o limite do lookbehind além do valor padrão de 255), desempenho ou comportamento de backtracking, opções que um produto define por você (o `~*` sem distinção de maiúsculas do NGINX, os modificadores de uma assinatura, os modos UTF ou UCP do PCRE2, a opção `-line` do Tcl), nem construções fora da sua lista, como chamadas de sub-rotina, condicionais, comentários, `\K`, `\G`, `\R`, `\X` e escapes hexadecimais ou octais. Um padrão sem linhas não está provado portável; ele apenas não usa nada da lista.

## Como usar

Digite um padrão e flags, e opcionalmente um texto para casar, e leia as correspondências ao vivo, a explicação token a token, as linhas de portabilidade e qualquer aviso de backtracking. **Exemplo de portabilidade** carrega um padrão que cada dialeto lê de um jeito. Tudo é calculado localmente.

## Fontes

- [ECMA-262, ECMAScript 2026 Language Specification (17ª edição), 22.2.1 Patterns](https://tc39.es/ecma262/2026/#sec-patterns), [22.2.2 Pattern Semantics](https://tc39.es/ecma262/2026/#sec-pattern-semantics), [Anexo B.1.2 Regular Expressions Patterns](https://tc39.es/ecma262/2026/#sec-regular-expressions-patterns) e a [Introdução](https://tc39.es/ecma262/2026/#sec-intro) (o ECMAScript 2025 acrescentou os modificadores inline) (lidos em 2026-10-26)
- [Rascunho do ECMA-262, 22.2 RegExp Objects](https://tc39.es/ecma262/multipage/text-processing.html): a gramática de padrões do rascunho de 2027 é igual à da edição de 2026 (lido em 2026-10-26)
- [Manual do PCRE2: pcre2pattern](https://www.pcre2.org/doc/pcre2pattern/), [pcre2syntax](https://www.pcre2.org/doc/pcre2syntax/), [pcre2api](https://www.pcre2.org/doc/pcre2api/) e [pcre2build](https://www.pcre2.org/doc/pcre2build/) (manual 10.50-DEV; lidos em 2026-10-26)
- [Manual do Tcl 8.4: re_syntax](https://www.tcl-lang.org/man/tcl8.4/TclCmd/re_syntax.htm) e [regexp](https://www.tcl-lang.org/man/tcl8.4/TclCmd/regexp.htm); [Tcl 8.6.18: re_syntax](https://www.tcl-lang.org/man/tcl8.6/TclCmd/re_syntax.htm); [Tcl 9.0.4: re_syntax](https://www.tcl-lang.org/man/tcl9.0/TclCmd/re_syntax.html) (lidos em 2026-10-26)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) e [K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (lidos em 2026-10-26)
- [F5 BIG-IP ASM: Attack and Bot Signatures, Signature Syntax](https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-asm-attack-and-bot-signatures-14-1-0/signature-syntax.html) (vale para o BIG-IP ASM da 14.1.0 à 21.0.0; lido em 2026-10-26)
- nginx: [location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location), [map](https://nginx.org/en/docs/http/ngx_http_map_module.html#map), [Building nginx from Sources](https://nginx.org/en/docs/configure.html) e [Regular expression captures](https://nginx.org/en/docs/regex_captures.html) (lidos em 2026-10-26)
- [expect(1), código-fonte do manual do Expect 5.45.4](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (lido em 2026-10-27): os padrões no estilo regexp seguem a sintaxe definida pelo comando regexp do Tcl
