## O que faz

Roda um trecho curto um comando por vez e mostra cada comando de três jeitos: como foi escrito, como as palavras que ele de fato recebeu depois que o Tcl substituiu variáveis, comandos e barras invertidas, e o que ele devolveu. Sob cada comando aparecem as variáveis que ele mudou, o ramo que `if` ou `switch` tomou e cada expressão avaliada, em forma de árvore. As linhas de log são reunidas, e ações como `pool`, `HTTP::redirect`, `drop` ou `reject` são anotadas em vez de executadas.

No modo **iRules**, os comandos de requisição (`HTTP::uri`, `HTTP::host`, `HTTP::method`, `HTTP::header`, `IP::client_addr` e outros) respondem a partir de uma requisição de exemplo editável, e um bloco `when` roda seu corpo uma vez, como se o evento tivesse disparado.

## Como ler os passos

Os comandos aparecem na ordem em que começaram. Um comando recuado rodou dentro do comando acima dele: no corpo, ou entre colchetes enquanto as palavras do comando de fora eram montadas, o que significa que terminou antes que o de fora rodasse. "recebeu" mostra as palavras como o comando as recebeu; o contorno tracejado marca onde cada palavra começa e termina, que é o que as aspas decidem.

## Vale saber

- `"$a$b"` junta dois valores sem nada entre eles; `"$a $b"` mantém o espaço.
- `append` acrescenta o texto exatamente como veio; `concat` tira o espaço em branco das duas pontas de cada argumento, descarta os vazios e junta o resto com espaços simples; `lappend` acrescenta elementos de lista.
- Uma string com espaços é uma lista para `foreach`: `foreach item "red green blue"` roda três vezes.
- `incr` lê `010` como octal 8, então o resultado é 9.
- `switch` lê qualquer palavra que comece com hífen como opção. Coloque `--` antes do valor (F5 K15650046), ou um valor como `-foo` quebra o comando.
- Um `expr` sem chaves substitui duas vezes: se uma variável contém `[log local0. "x"]`, esse comando roda (F5 K57410758). O exemplo "Dupla substituição" mostra isso.

## Compartilhar resultado

Abaixo de como a execução terminou, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o que a execução lê, pelo nome: o script como `#input=`, `&mode=irules` no modo iRules e, nesse modo, cada campo da requisição de exemplo que você mudou (`&uri=`, `&host=`, `&method=`, `&agent=` para o User-Agent). O Tcl puro é o padrão e não vai no link, e também não vai uma requisição de exemplo que o Tcl puro não lê. Um script costuma ser um pedaço de uma iRule real, então, antes de você copiar qualquer coisa, o popover acrescenta um alerta (um script pode citar hosts internos, pools e data groups), e a página lê cada campo que o link levaria com a mesma verificação de segredos dos leitores de iRule deste site.

Antes de oferecer qualquer link, ela procura chaves e credenciais escritas por extenso onde as próprias referências da F5 as colocam (todas lidas em 2026-10-27):

- a passphrase de `HTTP::cookie encrypt` e `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- uma chave na forma de string `AES 128 <hex>`, ou a chave de `AES::encrypt` e `AES::decrypt` escrita por extenso ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- o valor de `-key` ou `-keyhex` em `CRYPTO::encrypt`, `decrypt`, `sign` e `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- um header `Authorization` ou `Proxy-Authorization` escrito com `HTTP::header insert` ou `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), cujo valor a [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (seções 11.6.2 e 11.7.2) define como as credenciais;
- um literal atribuído com `set` a uma variável usada num desses lugares, como no próprio exemplo de `CRYPTO::encrypt`;
- e, pela verificação de segredos do site, chave privada PEM, JWT, ID de chave de acesso da AWS ou senha dentro de uma URL.

Quando a página encontra um desses, não há link: o popover aponta o campo e a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (`set static::api_token "..."`) não impede o link; o alerta aponta esse valor em vez disso. Nenhuma verificação acha todo segredo, então leia o que vai mandar.

Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; um script maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** Os campos são preenchidos como se você tivesse digitado (uma requisição de exemplo que o link mudou aparece aberta), e a página segura o script: um aviso diz que ele veio de um link compartilhado, e nada roda até você clicar em **Executar** ou mudar um campo. O interpretador didático nunca roda sozinho o texto de um link. Um modo diferente de `tcl` ou `irules`, ou um valor de requisição de exemplo no modo Tcl puro, faz o link inteiro ser ignorado. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.

## Limites

Este é um interpretador didático, não o TMM. Ele modela os comandos listados no código desta página e para depois de 2.000 comandos, em valores com mais de 1.000.000 de caracteres e em 200 níveis de aninhamento. Arrays, `proc`, `regexp`, `table`, `after` e o sistema de arquivos não são modelados; os comandos que a F5 desativa em iRules (K36322151) também não estão disponíveis. Tempo de eventos, estado de conexão e outros eventos ficam fora do escopo. A ferramenta não é oferecida pela API, porque executa o Tcl que você fornece.

## Fontes

- [Manual do Tcl 8.4: Tcl (as regras de substituição)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (lido em 2026-10-03)
- [Manual do Tcl 8.4: append](https://www.tcl-lang.org/man/tcl8.4/TclCmd/append.htm), [concat](https://www.tcl-lang.org/man/tcl8.4/TclCmd/concat.htm), [lappend](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lappend.htm), [incr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/incr.htm) e [switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (lidos em 2026-10-03)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (lido em 2026-10-03)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (lido em 2026-10-03)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (lido em 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (lido em 2026-10-03)
- [Referência de iRules da F5: log](https://clouddocs.f5.com/api/irules/log.html) (lido em 2026-10-02)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
- [Referência de iRules da F5: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) e [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (lidas em 2026-10-27): onde uma iRule guarda passphrase, chave ou credenciais, que impedem um link de Compartilhar resultado
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (lida em 2026-10-27): seções 11.6.2 e 11.7.2, os valores de Authorization e Proxy-Authorization são credenciais
