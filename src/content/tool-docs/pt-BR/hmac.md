## O que faz

Calcule um HMAC, um hash com chave, sobre uma mensagem usando uma chave secreta, com o resultado mostrado em hexadecimal e Base64. Você escolhe SHA-256, SHA-384 ou SHA-512 como o hash subjacente. O cálculo usa o Web Crypto nativo do navegador, e sua chave nunca sai do seu navegador. Esta é a mesma construção, pelo mesmo caminho de código, que o verificador de JWT usa para checar uma assinatura HS256, então os dois concordam, e isso é intencional.

## Para que serve o HMAC

Um hash simples prova que os dados não mudaram, mas qualquer um pode recalculá-lo, então não prova quem os produziu. O HMAC adiciona uma chave secreta ao hash, o que o transforma em um código de autenticação de mensagem: um valor que prova tanto que a mensagem está íntegra quanto que ela veio de alguém que possui a chave. O remetente calcula o HMAC e o envia junto com a mensagem; o destinatário, que compartilha a chave, o recalcula e verifica se os dois batem. É definido na RFC 2104 e na FIPS 198-1, com vetores de teste na RFC 4231.

## Simétrico por natureza

O HMAC usa um único segredo compartilhado tanto para produzir quanto para verificar o código. Isso o torna rápido e simples, mas também significa que quem consegue verificar um HMAC também consegue forjar um, porque ambas as operações usam a mesma chave. É a ferramenta certa quando a mesma parte, ou duas partes que já compartilham um segredo confiável, produzem e conferem os códigos. Quando partes independentes precisam verificar sem poder forjar, uma assinatura assimétrica encaixa melhor, que é o mesmo compromisso que separa HS256 de RS256 em JWTs.

## Como é construído

O HMAC não é simplesmente o hash da chave juntada à mensagem, o que seria vulnerável a ataques de extensão de comprimento. É uma construção aninhada: a mensagem é resumida junto com uma forma derivada da chave, e esse resultado é resumido de novo com uma segunda forma derivada. Essa estrutura é o que dá ao HMAC sua prova de segurança, e é por isso que você deve usar HMAC em vez de inventar seu próprio hash com chave.

## Como usar

Informe uma mensagem e uma chave secreta, escolha o hash e leia o HMAC em hex ou Base64. Forneça a mesma mensagem e chave a dois sistemas e os códigos vão bater; mude a mensagem ou a chave por um caractere e o código muda completamente.

## Compartilhar resultado

Abaixo do MAC, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a mensagem como foi digitada e o algoritmo depois do `#`, e nunca a chave. Quem recebe o link digita a chave que você compartilha com essa pessoa, por outro caminho, e obtém o mesmo MAC; o próprio MAC também não vai, porque junto da mensagem ele deixaria qualquer um testar palpites de uma chave fraca offline. Uma exceção: a chave `Jefe` também vai, porque é a chave de teste publicada na [RFC 4231](https://www.rfc-editor.org/rfc/rfc4231) (caso de teste 2, lida em 2026-11-01), que o Exemplo da página usa. O popover dele diz primeiro o que o link leva, depois um aviso próprio (a mensagem vai como foi digitada, então leia antes de mandar o link) e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Uma chave de HMAC é uma chave: a [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104) (seção 3, lida em 2026-11-01) pede chaves "chosen at random" (escolhidas ao acaso) e "periodically refreshed" (trocadas periodicamente), uma prática que "limits the damage of an exposed key" (limita o estrago de uma chave exposta), e quem tem a chave calcula um MAC válido para qualquer mensagem.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então os valores não são enviados ao servidor quando o link é aberto; eles ficam na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-los.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho dele.
- **Ao abrir um link.** A mensagem e o algoritmo preenchem a página. A caixa da chave recebe a chave de teste publicada quando ela chega e, nos outros casos, mantém o que quem abre digitou; numa página nova ela fica vazia, e uma nota diz que a chave nunca vai no link. O MAC é calculado com Web Crypto no navegador quando os dois campos estão preenchidos. Um algoritmo que a página não oferece, ou uma chave que não seja a publicada, faz o link inteiro ser ignorado. Nos dois casos os valores saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
