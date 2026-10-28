## O que faz

Avalia uma expressão do jeito que `expr`, `if` e `while` fazem num iRule e mostra a avaliação inteira: o valor e como ele é guardado, a expressão com os operandos de cada operador entre parênteses para deixar a precedência visível, uma árvore com cada passo e, numa comparação, o que `==`, `eq`, `<` e `>` fazem com os mesmos dois operandos. As variáveis recebem valores por comandos `set` comuns, então as aspas se comportam exatamente como num iRule.

Dois modos: **Tcl 8.4** (Tcl 8.4.6 puro, a base que a F5 indica no K6091) e **iRules**, que acrescenta os operadores documentados pela F5 (`contains`, `starts_with`, `ends_with`, `equals`, `matches_glob`, `matches_regex`, `and`, `or`, `not`) e comandos de requisição como `[HTTP::uri]`, respondidos a partir de uma requisição de exemplo editável.

## Como ler a árvore

Cada caixa é uma parte da expressão: o trecho, uma seta e o que ele produziu. Os operandos ficam abaixo do seu operador. As notas sob uma caixa dizem o que aconteceu ali, por exemplo "Comparado como inteiros: 10 e 10" para `$x == $y` com `x` valendo `012`, ou "Comparado como texto porque o lado esquerdo não é um número". Uma parte marcada como "nunca avaliado" foi pulada por `&&`, `||` ou `?:`.

## Vale saber

- `==` e os outros operadores de comparação comparam números quando os dois lados são lidos como números, e texto caso contrário. `eq` e `ne` sempre comparam texto.
- Numa comparação de texto, os códigos dos caracteres decidem, então toda letra maiúscula vem antes de toda minúscula: `"bench" < "Chair"` é falso.
- `true == 1` é falso: `true` é uma palavra booleana, não um número, então a comparação é entre textos.
- O Tcl 8.4 não tem o operador `**`; `2 ** 3` é erro de sintaxe.
- A divisão inteira arredonda em direção ao infinito negativo (`7 / -2` dá `-4`) e o resto fica com o sinal do divisor.
- Um literal como `08` escrito na expressão é recusado quando a expressão é compilada, antes que qualquer parte dela rode.
- Coloque as expressões entre chaves. Sem chaves, o Tcl substitui o texto duas vezes, o que é mais lento e deixa dados rodarem como código (F5 K57410758 e K15650046). O executor passo a passo mostra isso acontecendo.

## Compartilhar resultado

Abaixo do resultado, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o que a avaliação lê, pelo nome: a expressão como `#input=`, os comandos set como `&setup=`, `&mode=irules` no modo iRules e, nesse modo, o `HTTP::uri` e o `HTTP::host` de exemplo quando você os mudou (`&uri=`, `&host=`). O Tcl puro é o padrão e não vai no link, e também não vai uma requisição de exemplo que o Tcl puro não lê. Os comandos set são onde caem valores copiados de uma iRule, então a página lê cada campo que o link levaria com a mesma verificação de segredos dos leitores de iRule deste site.

Antes de oferecer qualquer link, ela procura chaves e credenciais escritas por extenso onde as próprias referências da F5 as colocam (todas lidas em 2026-10-27):

- a passphrase de `HTTP::cookie encrypt` e `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- uma chave na forma de string `AES 128 <hex>`, ou a chave de `AES::encrypt` e `AES::decrypt` escrita por extenso ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- o valor de `-key` ou `-keyhex` em `CRYPTO::encrypt`, `decrypt`, `sign` e `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- um header `Authorization` ou `Proxy-Authorization` escrito com `HTTP::header insert` ou `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), cujo valor a [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (seções 11.6.2 e 11.7.2) define como as credenciais;
- um literal atribuído com `set` a uma variável usada num desses lugares, como no próprio exemplo de `CRYPTO::encrypt`;
- e, pela verificação de segredos do site, chave privada PEM, JWT, ID de chave de acesso da AWS ou senha dentro de uma URL.

Quando a página encontra um desses, não há link: o popover aponta o campo e a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (`set static::api_token "..."`) não impede o link; o alerta aponta esse valor em vez disso. Nenhuma verificação acha todo segredo, então leia o que vai mandar.

Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; campos maiores que isso não ganham link, e o popover diz o tamanho.
- **Ao abrir um link.** Os campos são preenchidos como se você tivesse digitado (uma requisição de exemplo que o link mudou aparece aberta), e a página os segura: um aviso diz que vieram de um link compartilhado, e nada é avaliado até você clicar em **Avaliar** ou mudar um campo. O interpretador didático nunca roda sozinho o texto de um link. Um modo diferente de `tcl` ou `irules`, ou um valor de requisição de exemplo no modo Tcl puro, faz o link inteiro ser ignorado. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.

## Limites

A F5 documenta seus operadores em palavra, mas não a precedência deles em relação aos operadores do Tcl; a ferramenta coloca `contains`, `starts_with` e os demais junto com `==`, e `and` e `or` junto com `&&` e `||`. `rand()` e `srand()` são recusados porque seus resultados não podem ser reproduzidos. Comandos que rodam dentro de uma expressão (entre colchetes) usam o mesmo pequeno interpretador do executor passo a passo, limitado a 2.000 comandos. Esta ferramenta não é oferecida pela API, porque executa o Tcl que você fornece.

## Fontes

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (lido em 2026-10-03)
- [Manual do Tcl 8.4: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (lido em 2026-10-03)
- [Referência de iRules da F5: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (lido em 2026-10-02)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (lido em 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (lido em 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
- [Referência de iRules da F5: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) e [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (lidas em 2026-10-27): onde uma iRule guarda passphrase, chave ou credenciais, que impedem um link de Compartilhar resultado
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (lida em 2026-10-27): seções 11.6.2 e 11.7.2, os valores de Authorization e Proxy-Authorization são credenciais
