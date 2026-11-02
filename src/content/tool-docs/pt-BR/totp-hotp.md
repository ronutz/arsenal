## O que faz

Gere e verifique os códigos de uso único usados para autenticação de dois fatores: senhas baseadas em tempo (TOTP, RFC 6238), os códigos de seis dígitos que um aplicativo autenticador mostra, e senhas baseadas em contador (HOTP, RFC 4226), os códigos que um token físico produz. Você pode escolher o hash (SHA-1, SHA-256 ou SHA-512), o número de dígitos e o intervalo de tempo. O cálculo usa o Web Crypto nativo do navegador, e seu segredo compartilhado nunca sai do seu navegador.

## Uma construção, dois fatores móveis

HOTP e TOTP são o mesmo algoritmo por baixo. Ambos tomam um segredo compartilhado e um fator móvel, calculam um HMAC do fator móvel sob o segredo e então aplicam a "truncagem dinâmica" definida na RFC 4226 para reduzir esse MAC a um código decimal curto. A única diferença é de onde vem o fator móvel:

- **HOTP** usa um contador de eventos explícito que incrementa em um a cada vez que um código é usado. O token e o servidor precisam se manter sincronizados nesse contador.
- **TOTP** usa o relógio: o fator móvel é o número de intervalos de tempo desde uma época, `floor((tempo atual - T0) / intervalo)`, com `T0` em 0 e o intervalo de 30 segundos por padrão. Em outras palavras, o TOTP é simplesmente o HOTP cujo contador é a fatia de tempo atual, e é por isso que um código TOTP muda a cada 30 segundos.

## O segredo compartilhado

O segredo é a semente que os dois lados possuem. Ele costuma ser trocado como uma string Base32, que é o que uma URI `otpauth://` ou um QR code de configuração codifica, então a ferramenta decodifica o Base32 para recuperar os bytes da chave. O hash padrão é SHA-1, que é o que a maioria dos aplicativos autenticadores e tokens ainda usa para senhas de uso único; SHA-256 e SHA-512 estão disponíveis onde ambos os lados oferecem suporte.

## Verificação e desvio de relógio

Como o relógio de um dispositivo e o de um servidor nunca estão perfeitamente alinhados, uma verificação TOTP normalmente aceita códigos de uma pequena janela de intervalos de tempo adjacentes, e não apenas do atual, trocando um pouco de rigor por confiabilidade. O HOTP tem o problema análogo no contador, em que um token pode avançar se um código gerado não for usado, então servidores aceitam uma janela de antecipação e ressincronizam.

## Como usar

Informe o segredo compartilhado e gere o código TOTP atual, ou defina um contador para gerar um código HOTP, e ajuste o hash, a quantidade de dígitos e o intervalo para corresponder ao seu sistema. Você também pode validar um código que recebeu. O algoritmo é determinístico dados o segredo e o fator móvel, então as mesmas entradas sempre produzem o mesmo código.

## Compartilhar resultado

Abaixo do código gerado, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as configurações depois do `#`: o modo, o algoritmo, o número de dígitos, como o segredo está escrito e o intervalo ou o contador; e a hora Unix só quando você digitou uma em vez de usar o relógio. Ele nunca leva o segredo compartilhado. Quem recebe o link digita o segredo que você compartilha com essa pessoa, por outro caminho, e obtém os mesmos códigos. O popover dele diz primeiro o que o link leva e depois oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

O segredo é o próprio segundo fator: quem o tem gera todos os códigos. A [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226) (seção 7.5, lida em 2026-11-01) pede que as operações com segredos compartilhados "be performed securely, in order to mitigate risks of any leakage of sensitive information" (sejam feitas com segurança, para reduzir o risco de vazamento de informação sensível), e a [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) (seção 3, requisito R7, lida em 2026-11-01) que as chaves "SHOULD be protected against unauthorized access and usage" (sejam protegidas contra acesso e uso não autorizados). Uma exceção: as chaves de teste publicadas também vão, porque qualquer um já pode lê-las. São o segredo do Apêndice D da RFC 4226 (a string ASCII `12345678901234567890`) e as seeds de 32 e 64 bytes da RFC 6238 para HMAC-SHA-256 e HMAC-SHA-512 (o Apêndice A dela), impressos nas normas, cujas tabelas a hora manual existe para reproduzir; e a chave com que esta página abre, `JBSWY3DPEHPK3PXP`, que o próprio site imprime (na página, na descrição da API e no [artigo sobre URIs de provisionamento](/learn/totp-provisioning-uris-and-qr)), para que a página compartilhada como abre reabra como estava. Elas são reconhecidas pelos bytes, em qualquer uma das três codificações.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então os valores não são enviados ao servidor quando o link é aberto; eles ficam na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-los.

- **Ao abrir um link.** As configurações substituem as do formulário; o relógio só é desligado quando chega uma hora. A caixa do segredo recebe uma chave de teste publicada quando ela chega (inclusive a da própria página) e é esvaziada nos outros casos, com uma nota pedindo o segredo, então a página nunca mostra um código de uma chave que quem mandou não usou. Os códigos são calculados com Web Crypto no navegador. Uma opção que o formulário não oferece, um número fora da faixa, um campo do outro modo ou um segredo que não seja chave de teste publicada faz o link inteiro ser ignorado. Nos dois casos os valores saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
