## O que faz

Cole uma resposta HTTP bruta e a ferramenta avalia sua postura de segurança: os headers de segurança que ela define (e os que faltam), as flags dos seus cookies e sua política de origem cruzada. Cada achado é verificado contra o padrão relevante e contra as recomendações do OWASP Secure Headers, e o resultado é uma análise com nota sobre a qual você pode agir. Ela roda inteiramente no seu navegador.

## Os headers que ela verifica

A segurança dos navegadores modernos é, em boa parte, opcional por meio de headers de resposta, e a ferramenta olha os que importam:

- **Strict-Transport-Security** (HSTS, RFC 6797) diz ao navegador para usar apenas HTTPS; a ferramenta lê seu `max-age` e o `includeSubDomains`.
- **Content-Security-Policy** (CSP Level 3) restringe de onde scripts, estilos e frames podem vir, e é a defesa mais forte contra cross-site scripting; a ferramenta assinala palavras-chave que enfraquecem, como `unsafe-inline`.
- **X-Content-Type-Options: nosniff** impede o navegador de adivinhar tipos de conteúdo, e **X-Frame-Options** (ou o `frame-ancestors` do CSP) defende contra clickjacking.
- **Referrer-Policy** e **Permissions-Policy** controlam o que a página vaza no header Referer e quais recursos do navegador ela pode usar.
- As **políticas de origem cruzada** (COOP, COEP, CORP) que governam o isolamento entre origens.

## Cookies e suas flags

A segurança de um cookie vive em seus atributos, e a ferramenta os verifica contra a especificação atual de cookies (RFC 6265bis): **Secure** (enviado apenas por HTTPS), **HttpOnly** (oculto do JavaScript, o que reduz o roubo via cross-site scripting) e **SameSite** (que limita o envio entre sites e mitiga CSRF). Ela também reconhece os prefixos de nome `__Host-` e `__Secure-`, que impõem algumas dessas propriedades pelo próprio nome.

## Como interpretar a nota

O objetivo da nota é priorização: ela diz não só o que está presente, mas o que falta ou está fraco, e por que cada header importa, para que você corrija primeiro as lacunas de maior impacto. As verificações seguem o conjunto recomendado do OWASP e as especificações subjacentes, e não a opinião de uma única ferramenta.

## Como usar

Cole uma resposta HTTP, incluindo seus headers, e leia a análise com nota de headers, cookies e política de origem cruzada. A análise é determinística e local, então é seguro rodá-la em uma resposta capturada de qualquer site.

## Compartilhar resultado

Abaixo da nota, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva uma cópia da resposta depois do `#`; ele só leva a resposta como foi colada se você marcar a opção descrita abaixo. Uma resposta colada traz cookies, cujos valores costumam ser identificadores de sessão ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 8.4, lida em 2026-11-01), e headers que esta página nunca lê, como um `Location` com um código de autorização na query ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seção 4.1.2, lida em 2026-11-01). A página avalia os headers de segurança que conhece e o nome e os atributos de cada cookie, nunca o valor de um cookie. Por isso a cópia mantém a linha de status e cada linha de header pelo nome, os valores dos headers que a página avalia como foram lidos, e cada `Set-Cookie` com nome e atributos; o valor de cada cookie, e o valor de todo outro header, vira `[redacted]`. Antes de oferecer o link, a cópia é avaliada de novo e precisa dar a mesma nota, e passa pela verificação do site em busca de credenciais que ainda estejam num valor avaliado. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. O popover também diz quantos valores foram trocados. Quando algum foi trocado, uma opção logo abaixo da primeira linha, **Incluir no link os valores trocados**, permite mandá-los mesmo assim: ela vem desmarcada toda vez que o popover abre; marcada, o link leva a resposta como foi colada, com todos os valores, e o popover avisa que valores de cookie costumam ser sessões ativas e que outros headers podem conter tokens, então o link é para quem você mostraria a resposta. A opção não aparece quando uma credencial num valor avaliado já impediu o link.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a avalia. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
