## O que esta ferramenta faz

Ela funciona nos dois sentidos. Dê a ela um nickname de nó e um I-SID e ela monta o endereço de grupo que aquele nó usará para aquele serviço. Cole um endereço saído de `show isis spbm multicast-fib` e ela diz de quem é a árvore e qual serviço ela carrega.

## A regra

Um endereço de grupo SPBM não é configurado nem aprendido. Ele é montado a partir de dois números que todo nó já tem:

- **primeiros três bytes** — o prefixo fixo `0x30000` combinado com o nickname de 20 bits
- **últimos três bytes** — o I-SID de 24 bits

Assim, o nickname `0.00.10` carregando o I-SID 100 dá `03:00:10:00:00:64`. Todo nó na árvore de caminho mais curto calcula esse mesmo endereço a partir da base link-state sem que ninguém lhe diga, e é exatamente por isso que o SPBM não precisa aprender MACs de backbone.

O mesmo I-SID enraizado em outro nó produz um endereço diferente — uma árvore por raiz.

## O sentido que justifica a ferramenta

Ler a FIB multicast. É uma coluna de hexadecimal, e a pergunta é sempre a mesma: de quem é esta árvore, e qual serviço. As duas respostas estão no endereço. `03:00:41:00:04:4d` é o nickname `0.00.41` carregando o I-SID 1101. Cruze o nickname com a coluna SYSID ou HOST-NAME da mesma saída para dar nome ao nó.

## Uma ambiguidade, declarada em vez de escondida

Os bits 16 e 17 pertencem ao prefixo fixo. Um nickname cujo primeiro campo os define produz um endereço que não pode ser decodificado de volta a um único nickname. Todo exemplo documentado usa primeiro campo 0. Se você informar outro, a ferramenta monta o endereço e avisa que o caminho inverso não está verificado — em vez de devolver um nickname pelo qual não pode responder.

## Limites honestos

Isto calcula apenas o endereço de grupo. Seleção de B-VID, a própria árvore de caminho mais curto, adjacência IS-IS e o B-MAC unicast estão todos fora de escopo — o B-MAC unicast é o endereço do chassi e não é derivado de nada. O I-SID é tratado como número; se um dado valor é uma L2 VSN ou uma L3 VSN é questão de configuração que isto não modela.
