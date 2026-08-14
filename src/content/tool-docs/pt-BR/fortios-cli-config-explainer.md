## O que faz

Cole um bloco de configuração do FortiOS e a ferramenta devolve a estrutura em árvore com cada verbo explicado: o que `config`, `edit`, `set`, `unset`, `append`, `next`, `end` e `abort` fazem, e em que nível o bloco está a cada linha. Local e offline; lê estrutura, não semântica.

## A armadilha que ela existe para pegar

**`set` num campo de múltiplos valores substitui a lista inteira.** `set srcaddr "internal-net"` numa policy que tinha quatro endereços de origem a deixa com um — com sucesso, em silêncio, sem que nada na saída mencione isso. O comando que acrescenta é o **`append`**.

A ferramenta avisa em todo `set` contra um campo de lista conhecido, nomeando o campo e a linha. Esse é o hábito mais caro no trabalho de CLI do FortiOS e é invisível num bloco lido casualmente — que é exatamente quando blocos são lidos.

## Mais duas coisas que ela sempre diz

- **`edit` cria o que não encontra.** Um ID de policy digitado errado não produz um erro, produz uma policy.
- **`end` é a única linha que aplica.** `next` fecha uma entrada e permanece na tabela; `abort` fecha e descarta. Um bloco usando `end` onde se queria `next` sai da tabela cedo demais e cada edit restante cai em outro lugar.

Ela também reporta **blocos não fechados**, porque um bloco não fechado não aplicou nada e colar um numa sessão ativa deixa você em algum lugar inesperado.

## O que ela não faz

Não conhece os seus objetos de endereço, as suas policies nem o seu arranjo de VDOMs, e não sabe dizer se um valor faz sentido. Ela responde se o formato do comando faz o que quem digitou provavelmente esperava — que é uma pergunta diferente e muitas vezes mais útil.

Também não tem como saber o que havia num campo antes. Quando ela avisa que um `set` substitui uma lista, **a pergunta que ela está pedindo que você responda é o que aquela lista continha.**
