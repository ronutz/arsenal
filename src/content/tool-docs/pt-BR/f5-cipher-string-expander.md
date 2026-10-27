## O que faz

Cole uma cipher string do F5 BIG-IP e a ferramenta explica cada palavra-chave e operador nela e sinaliza as escolhas fracas ou obsoletas. Ela lê a string, o valor do campo `cipher` em uma cipher rule ou perfil SSL, e transforma sua sintaxe compacta em uma explicação em linguagem clara do que ela seleciona e em que ordem. Ela roda inteiramente no seu navegador.

## Como uma cipher string do F5 é construída

Uma cipher string do BIG-IP é uma lista ordenada de conjuntos de cifras, separados por dois-pontos, vírgula ou espaço em branco, e a ordem é significativa porque expressa a preferência do servidor. Dentro de um conjunto, as palavras-chave são combinadas com `+`, então `ECDHE+AES-GCM` significa as cifras que são ao mesmo tempo ECDHE e AES-GCM. As palavras-chave nomeiam as partes de uma suíte: a versão do protocolo, a troca de chaves, a autenticação, a cifra e o MAC. `DEFAULT` representa o conjunto padrão embutido da F5, um ponto de partida comum.

## Os operadores, que são a parte sutil

Um conjunto pode carregar um operador à frente, e a diferença entre eles importa:

- **`!`** exclui permanentemente as cifras correspondentes; uma vez excluídas dessa forma, elas não podem ser readicionadas por um termo posterior.
- **`-`** remove as cifras correspondentes, mas, ao contrário do `!`, um termo posterior pode readicioná-las.
- **`+`** não adiciona; ele move as cifras correspondentes para o fim, baixando sua prioridade.

E `@STRENGTH` reordena a lista inteira por comprimento de chave. Confundir `!` com `-`, ou esquecer que `+` reordena em vez de adicionar, é uma fonte comum de uma cipher string que não faz o que seu autor pretendia, que é exatamente o que a ferramenta torna visível.

## A análise de segurança, e um limite honesto

A ferramenta sinaliza elementos fracos e obsoletos, como cifras de grau de exportação, RC4 ou 3DES e versões de protocolo obsoletas, para que uma string arriscada se destaque. Uma coisa que ela deliberadamente não faz: ela não reproduz a lista final ordenada exata de suítes de cifra que um BIG-IP específico produziria, porque isso depende da tabela de cifras da versão de software específica no equipamento. Ela explica a string; não substitui o equipamento.

## Como usar

Cole uma cipher string de uma cipher rule ou de um perfil SSL e leia cada palavra-chave e operador explicado, com as escolhas fracas sinalizadas. A análise é determinística e local.

## Compartilhar resultado

Abaixo da análise de segurança, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` a cipher string ou o nome de rule como você digitou: `/tools/f5-cipher-string-expander#input=ECDHE%3ARSA%3A!SSLv3...`. O popover dele diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a string não é enviada ao servidor quando o link é aberto; ela fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-la.

- **Ao abrir um link.** A string preenche a caixa como se tivesse sido colada e a página a explica. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
