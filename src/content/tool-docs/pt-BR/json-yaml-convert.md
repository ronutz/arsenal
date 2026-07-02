## O que faz

Converta um documento entre JSON e YAML em qualquer direção, no seu navegador. Partindo do JSON, ela produz YAML em estilo de bloco; partindo do YAML, produz JSON. Quando uma análise falha, o erro indica a linha e a coluna exatas, e quando uma conversão perde algo pelo caminho, uma nota explica o quê e por quê.

## As duas direções

- **JSON para YAML.** O JSON é primeiro validado pelo mesmo analisador preciso, que rastreia a posição, usado pelo formatador JSON, de modo que um documento inválido é rejeitado com linha, coluna e caminho JSON Pointer, em vez de uma falha vaga. Os dados válidos são então escritos como YAML em estilo de bloco.
- **YAML para JSON.** O YAML é analisado sob um esquema compatível com JSON e serializado para JSON. Âncoras e aliases (o mecanismo de reúso `&nome` e `*nome` do YAML) são expandidos inline, e escalares de bloco (os estilos de string de múltiplas linhas do YAML) viram strings JSON comuns.

## As armadilhas de aspas que ela trata

O YAML é famoso por ler uma palavra solta como algo diferente de uma string, e é aí que as idas e voltas dão errado. O caso mais conhecido é o "problema da Noruega": a palavra solta `NO` é lida como o booleano falso, e o mesmo acontece com `yes`, `on` e `off`, e com valores como `1.0` (um número, não a string "1.0") e `08` (que não é um octal válido). Ao emitir YAML, o conversor coloca esses valores entre aspas para que aquilo que você quis dizer como string sobreviva como string.

## O que a conversão pode perder

Algumas coisas existem em um formato mas não no outro, então as notas as sinalizam:

- **Comentários.** O YAML tem comentários e o JSON não, então os comentários são descartados ao converter de YAML para JSON.
- **Âncoras e aliases.** São expandidos para o seu valor completo, então uma referência compartilhada e compacta no YAML de origem vira dado repetido na saída.

## Exemplos

- O JSON `{"port":8080,"tls":true}` vira as linhas YAML `port: 8080` e `tls: true`.
- O YAML `country: NO` vira o JSON `{"country":"NO"}` na entrada, e quando isso é emitido de volta para YAML o valor é colocado entre aspas como `country: "NO"` para que não seja confundido com falso.

## Como usar

Cole JSON para obter YAML, ou YAML para obter JSON. Leia as notas de conversão quando aparecerem: elas dizem se algo, como um comentário ou uma âncora, mudou de um jeito que você deva saber. A conversão é determinística para uma dada entrada.
