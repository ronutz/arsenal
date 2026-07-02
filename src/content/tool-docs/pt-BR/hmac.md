## O que faz

Calcule um HMAC, um hash com chave, sobre uma mensagem usando uma chave secreta, com o resultado mostrado em hexadecimal e Base64. Você escolhe SHA-256, SHA-384 ou SHA-512 como o hash subjacente. O cálculo usa o Web Crypto nativo do navegador, e sua chave nunca sai do seu navegador. Esta é a mesma construção, pelo mesmo caminho de código, que o verificador de JWT usa para checar uma assinatura HS256, então os dois concordam por design.

## Para que serve o HMAC

Um hash simples prova que os dados não mudaram, mas qualquer um pode recalculá-lo, então não prova quem os produziu. O HMAC adiciona uma chave secreta ao hash, o que o transforma em um código de autenticação de mensagem: um valor que prova tanto que a mensagem está íntegra quanto que ela veio de alguém que possui a chave. O remetente calcula o HMAC e o envia junto com a mensagem; o destinatário, que compartilha a chave, o recalcula e verifica se os dois batem. É definido na RFC 2104 e na FIPS 198-1, com vetores de teste na RFC 4231.

## Simétrico por natureza

O HMAC usa um único segredo compartilhado tanto para produzir quanto para verificar o código. Isso o torna rápido e simples, mas também significa que quem consegue verificar um HMAC também consegue forjar um, porque ambas as operações usam a mesma chave. É a ferramenta certa quando a mesma parte, ou duas partes que já compartilham um segredo confiável, produzem e conferem os códigos. Quando partes independentes precisam verificar sem poder forjar, uma assinatura assimétrica encaixa melhor, que é o mesmo compromisso que separa HS256 de RS256 em JWTs.

## Como é construído

O HMAC não é simplesmente o hash da chave juntada à mensagem, o que seria vulnerável a ataques de extensão de comprimento. É uma construção aninhada: a mensagem é resumida junto com uma forma derivada da chave, e esse resultado é resumido de novo com uma segunda forma derivada. Essa estrutura é o que dá ao HMAC sua prova de segurança, e é por isso que você deve usar HMAC em vez de inventar seu próprio hash com chave.

## Como usar

Informe uma mensagem e uma chave secreta, escolha o hash e leia o HMAC em hex ou Base64. Forneça a mesma mensagem e chave a dois sistemas e os códigos vão bater; mude a mensagem ou a chave por um caractere e o código muda completamente.
