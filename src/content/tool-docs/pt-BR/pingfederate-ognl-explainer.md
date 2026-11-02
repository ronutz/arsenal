## O que faz

O PingFederate permite escrever expressões OGNL em mapeamentos de atributos e em critérios de emissão, para os casos em que um mapeamento simples não basta. Esta ferramenta lê uma dessas expressões e a explica construção por construção, e então levanta o que costuma dar errado em produção, e não em teste. Roda no navegador e nunca avalia a expressão.

## Por que o seletor de contexto importa

Um mapeamento de atributo e um critério de emissão são ambos expressões, e devem devolver coisas diferentes. O mapeamento produz o valor que segue adiante na asserção ou no token. O critério produz verdadeiro ou falso, e a emissão só prossegue quando é verdadeiro. Escolher o errado é erro comum de configuração, e não falha de forma barulhenta: um critério que devolve uma string em vez de um booleano se comporta de um jeito que parece problema de autorização em outro lugar qualquer. O seletor existe para que a ferramenta possa avisar quando o que você escreveu não combina com onde você está colocando.

## O que explica

As construções reconhecidas são as que aparecem em mapeamentos reais: ler um atributo pelo nome, verificar se é nulo, converter valor para string, normalizar maiúsculas e minúsculas, as operações de string que tiram o domínio de um nome de usuário ou arrumam o espaço em branco que um diretório carrega desde 2004, condicionais que fornecem um valor padrão, literais de mapa que traduzem nomes de grupo do diretório em papéis da aplicação, e as projeções e seleções que tratam atributos multivalorados como associação a grupos.

## Os diagnósticos, e por que cada um existe

**Atributos lidos sem verificação de nulo.** É a causa mais comum de expressão que funciona em teste e falha em produção, e o motivo é pouco glamouroso: as contas usadas para testar são mais arrumadas que o diretório. Um atributo sempre presente na sua conta não está sempre presente na de todo mundo, ausente não é o mesmo que vazio, e os dois acontecem. A ferramenta nomeia os atributos que viu sendo lidos para você decidir de quais realmente tem certeza.

**Chamadas estáticas a métodos Java.** Construções como `@java.lang.String@format` são suportadas e às vezes exatamente certas. São também a razão de a autoria de expressões ser um papel administrativo separado no produto: a mesma construção que formata uma data alcança bem mais que uma data. Sinalizar não é sugestão de remover, é a nota de que esta expressão faz algo que só o papel de expressões deveria poder fazer.

**Um critério sem nada que compare.** Se um critério de emissão não contém comparação, teste de pertencimento nem correspondência de padrão, dificilmente está devolvendo um booleano, seja lá o que estiver devolvendo.

**Um mapeamento que só repassa um atributo.** Legítimo, e normalmente alcançável sem expressão nenhuma. Vale preferir quando der, porque um mapeamento simples é visível a todo administrador enquanto uma expressão só é editável pelo papel de expressões - e quem for depurá-la um dia pode não ter esse papel.

**Expressões que cresceram demais.** Expressões longas são difíceis de revisar, mais difíceis de passar adiante e invisíveis a todos sem o papel de expressões, o que inclui a maioria das pessoas que um dia responderão por elas.

## Por que nunca avalia

Um explicador de expressões que avaliasse expressões seria um serviço de execução de código, que é exatamente a propriedade que torna a autoria de expressões um privilégio restrito dentro do próprio PingFederate. A ferramenta analisa e descreve. Se você quer saber o que uma expressão devolve para um usuário específico, o lugar de descobrir é uma conexão de teste em ambiente que não seja produção, não uma página web.

## Compartilhar resultado

No começo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a expressão como foi digitada depois do `#` e onde ela é usada quando é um critério de emissão (mapeamento de atributo é o padrão, então fica de fora). O popover dele diz primeiro o que o link leva e depois um aviso próprio: expressões citam atributos reais e às vezes grupos reais, então leia antes de mandar o link. Em seguida oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Uma expressão em que a verificação de segredos do site acha uma credencial escrita num formato que ela reconhece pela forma não ganha link, e o popover cita a credencial e a linha: uma chave privada PEM, um header Authorization, um access key ID da AWS, um JWT, uma senha numa URL ou um valor `ENC` do FortiOS. Troque por um placeholder e clique de novo; esta página explica os mesmos construtos de qualquer jeito.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então os valores não são enviados ao servidor quando o link é aberto; eles ficam na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-los.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho dele.
- **Ao abrir um link.** A expressão e o contexto preenchem a página, que a explica como numa colagem; nada é avaliado, como sempre, e nada é enviado. Um contexto que a página não oferece, ou uma expressão com credencial, faz o link inteiro ser ignorado. Nos dois casos os valores saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
