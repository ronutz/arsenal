## O que faz

Cole um bloco bruto de headers de requisição HTTP - uma linha de requisição e um "Nome: valor" por linha - e a ferramenta explica como a ordem e a caixa dos headers identificam o cliente. Ela classifica o remetente como um navegador da família Chromium, Firefox ou uma biblioteca HTTP, comparando a sequência de headers e verificando headers exclusivos de navegador como Sec-Fetch e Sec-CH-UA, aponta o sinal de minúsculas do HTTP/2 e lista os headers comuns de navegador que estejam ausentes.

## O análogo em HTTP passivo do JA3

O JA3 identifica um cliente TLS pela ordem das cifras e extensões no seu ClientHello. A ordem dos headers é a mesma ideia uma camada acima: navegadores, bibliotecas e bots emitem cada um os headers de requisição numa sequência característica, e essa sequência sobrevive mesmo quando os valores são forjados. Uma requisição cuja ordem de headers contradiz o User-Agent que afirma - o UA do Chrome com o conjunto de headers do curl - é um indício clássico de bot, e é por isso que sistemas de detecção de bots e WAFs se baseiam nela.

## Como ler o resultado

O hash da ordem é um id curto e estável para a sequência exata de headers, exibido apenas para visualização. As notas por header explicam por que cada posição importa; a nota de caixa sinaliza se o bloco parece uma captura HTTP/1.1 (Title-Case) ou HTTP/2 (minúsculas no fio). Apenas decodifica/explica; os headers que você cola nunca saem do seu navegador.

## Compartilhar resultado

Abaixo da leitura do cliente, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` uma cópia do bloco em que toda credencial é trocada pela palavra `REDACTED`, nunca o bloco como foi colado. O popover diz primeiro o que o link leva e quantos valores foram trocados, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Um bloco de headers copiado do devtools, de uma captura ou de um `curl -v` quase sempre traz um cookie de sessão, e muitas vezes um token, e a leitura não precisa de nenhum deles: ela lê os nomes dos headers (a ordem, a caixa, quais dos comuns faltam) e o valor do User-Agent. Então a cópia mantém todos os nomes, a ordem e o User-Agent, e troca, pelas regras que as ferramentas de HTTP do site compartilham: as credenciais de `Authorization` e `Proxy-Authorization`, mantendo o esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials", consiste em credenciais; o Basic mantém o user-id, [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), seção 2); todo valor de cookie de uma linha `Cookie`, mantendo os nomes ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1); o valor inteiro de um header cujo nome indica segredo (`X-API-Key`, `X-Auth-Token`); e a senha de uma URL ou um parâmetro secreto dentro de qualquer valor ou do alvo da requisição (`access_token`, `code`, [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seção 4.1.2). Tudo isso foi lido em 2026-11-01. A cópia precisa dar a mesma leitura que o texto colado; sempre dá, porque nada do que a página lê muda.

Um token onde nenhum nome avisa (um JWT no caminho) não pode ser trocado com segurança: a cópia é verificada de novo, e uma chave privada PEM, um JWS ou JWE, ou uma senha de URL que tenha sobrado impede o link; o popover diz a linha. Não há chave para mandar os valores trocados: são credenciais, e a leitura não precisa deles.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a lê; nada é enviado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
