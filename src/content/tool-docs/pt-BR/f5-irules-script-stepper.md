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
