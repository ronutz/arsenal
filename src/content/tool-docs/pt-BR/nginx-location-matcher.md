## O que esta ferramenta faz

Cole as linhas `location` de um bloco server mais uma linha `request <uri>`, e o comparador roda o algoritmo de seleção documentado do NGINX à sua frente. Ele nomeia o bloco vencedor e mostra o percurso inteiro: o que aconteceu em cada um dos cinco passos e por quê, inclusive nos passos que não decidiram nada.

## A regra que ela existe para ensinar

**O NGINX não escolhe o primeiro location que casa, nem o último.** Ele tenta uma correspondência exata primeiro e para se uma acertar. Depois verifica cada location de prefixo e memoriza o **mais longo**, não o primeiro. Se esse prefixo tiver `^~`, ele vence de imediato. Caso contrário, as expressões regulares são tentadas **na ordem do arquivo** e a primeira que casar vence, batendo o prefixo memorizado. Só se nenhuma regex casar é que o prefixo vence afinal.

A ordem do arquivo decide exatamente um desses cinco passos, e é por isso que ler a configuração de cima para baixo engana sobre o resultado.

## Os dois resultados que as pessoas descobrem na prática

Um bloco de prefixo `/images/` perde para um bloco `~ \.(gif|jpg|png)$` escrito abaixo dele, porque as regexes são tentadas depois da rodada de prefixos e a vencem. O bloco de aparência mais específica, escrito primeiro, é superado por projeto.

E `^~` não significa "prioridade maior" — significa **pare antes das expressões regulares**. É exatamente por isso que ele corrige o caso acima.

## O que mais ela reporta

Além do percurso, a ferramenta inspeciona a própria configuração: blocos de prefixo que uma expressão regular poderia tomar (com a correção `^~` nomeada), locations duplicados, e a ausência de um `location /` de captura geral.

## Limites honestos

Um bloco server: sem seleção por `server_name` e sem correspondência de porta. Os padrões `~` e `~*` compilam para expressões regulares JavaScript — PCRE e JS concordam na sintaxe usada em blocos location comuns, mas são motores diferentes, então confie no próprio NGINX para qualquer coisa exótica. Sem `rewrite`, `try_files` ou redirecionamentos internos: isto responde qual bloco é selecionado, não o que a requisição inteira faz. A URI é comparada como escrita, porque o NGINX decodifica antes de comparar e fazer metade disso aqui seria pior que não fazer nada.
