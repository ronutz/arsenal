## O que esta ferramenta faz

Cole as linhas `location` de um bloco server mais uma linha `request <uri>`, e o comparador roda o algoritmo de seleção documentado do NGINX à sua frente. Ele nomeia o bloco vencedor e mostra o percurso inteiro: o que aconteceu em cada passo e por quê, inclusive nos passos que não decidiram nada. A linha de requisição pode trazer uma query string; ela fica fora da comparação e só alimenta as variáveis `$arg_<nome>`.

## A regra que ela existe para ensinar

**O NGINX não escolhe o primeiro location que casa, nem o último.** Ele tenta uma correspondência exata primeiro e para se uma acertar. Depois verifica cada location de prefixo e memoriza o **mais longo**, não o primeiro. Se esse prefixo tiver `^~`, ele vence de imediato. Caso contrário, as expressões regulares são tentadas **na ordem do arquivo** e a primeira que casar vence, batendo o prefixo memorizado. A partir do nginx 1.31.5, se nenhuma regex casar, os locations com predicado (`location $variavel`) são tentados na ordem do arquivo, e vence o primeiro cuja variável não seja vazia nem `0`. Só se nada casar nessas duas rodadas é que o prefixo vence afinal.

A ordem do arquivo decide apenas as rodadas das expressões regulares e dos predicados, e é por isso que ler a configuração de cima para baixo engana sobre o resultado.

## Os dois resultados que as pessoas descobrem na prática

Um bloco de prefixo `/images/` perde para um bloco `~ \.(gif|jpg|png)$` escrito abaixo dele, porque as regexes são tentadas depois da rodada de prefixos e a vencem. O bloco de aparência mais específica, escrito primeiro, é superado por projeto.

E `^~` não significa "prioridade maior" — significa **pare antes das expressões regulares** (e, a partir da 1.31.5, também antes dos locations com predicado). É exatamente por isso que ele corrige o caso acima.

A mesma ordem decide qual bloco entrega uma URL `.php` ao PHP-FPM; [PHP-FPM e FastCGI](/learn/php-fpm-and-fastcgi) trata do que passa entre o NGINX e o PHP depois disso.

## O que mais ela reporta

Além do percurso, a ferramenta inspeciona a própria configuração: blocos de prefixo que uma expressão regular poderia tomar (com a correção `^~` nomeada), locations duplicados, a ausência de um `location /` de captura geral, a versão do nginx que um location com predicado exige, e qualquer predicado cuja variável não tenha valor.

## Limites honestos

Um bloco server: sem seleção por `server_name` e sem correspondência de porta. Os padrões `~` e `~*` compilam para expressões regulares JavaScript — PCRE e JS concordam na sintaxe usada em blocos location comuns, mas são motores diferentes, então confie no próprio NGINX para qualquer coisa exótica. A visão de portabilidade do [Kit de Regex](/tools/regex) lista, construção por construção, onde o PCRE2 e o JavaScript leem um padrão de outro jeito. Sem `rewrite`, `try_files` ou redirecionamentos internos: isto responde qual bloco é selecionado, não o que a requisição inteira faz. A URI é comparada como escrita, porque o NGINX decodifica antes de comparar e fazer metade disso aqui seria pior que não fazer nada. Variáveis não são avaliadas: um predicado `$arg_<nome>` lê a query string, qualquer outra variável recebe o valor que você der numa linha `variable $nome valor`, e uma variável não declarada conta como vazia, então o predicado dela não casa.

## Compartilhar resultado

Abaixo do vencedor, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi digitada depois do `#`, assim que a página tem o passo a passo. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. A gramática aceita linhas location, linhas `variable` e a linha `request`, nada mais, então nenhuma outra diretiva vai junto; mas uma linha request pode trazer uma query string e uma linha `variable` um valor. Antes de oferecer o link, a caixa passa por uma busca de credenciais que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials", consiste em credenciais), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 8.4: os servidores "commonly store a nonce (or "session identifier") in a cookie", costumam guardar num cookie um identificador de sessão), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todas lidas em 2026-11-01. Qualquer um deles impede o link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (um membro JSON `token`, um `token=` numa query) não impede o link; o popover cita o primeiro para você conferir.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada, e a página faz o passo a passo. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Fontes

- [Documentação do NGINX, ngx_http_core_module, location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location) (lida em 26/10/2026): a ordem de seleção, o `^~` pulando expressões regulares e locations com predicado, a regra do predicado e o exemplo resolvido (configurações A a F) que os testes da ferramenta reproduzem
- [Documentação do NGINX, How nginx processes a request](https://nginx.org/en/docs/http/request_processing.html) (lida em 26/10/2026): os locations testam só a parte URI da linha de requisição, sem os argumentos
- [Log de mudanças do NGINX, nginx 1.31.5, 02/09/2026](https://nginx.org/en/CHANGES) (lida em 26/10/2026): "Feature: predicate locations"
