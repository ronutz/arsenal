## O que faz

Cole uma resposta HTTP bruta e a ferramenta avalia sua postura de segurança: os cabeçalhos de segurança que ela define (e os que faltam), as flags dos seus cookies e sua política de origem cruzada. Cada achado é verificado contra o padrão relevante e contra as recomendações do OWASP Secure Headers, e o resultado é uma análise com nota sobre a qual você pode agir. Ela roda inteiramente no seu navegador.

## Os cabeçalhos que ela verifica

A segurança dos navegadores modernos é, em boa parte, opcional por meio de cabeçalhos de resposta, e a ferramenta olha os que importam:

- **Strict-Transport-Security** (HSTS, RFC 6797) diz ao navegador para usar apenas HTTPS; a ferramenta lê seu `max-age` e o `includeSubDomains`.
- **Content-Security-Policy** (CSP Level 3) restringe de onde scripts, estilos e frames podem vir, e é a defesa mais forte contra cross-site scripting; a ferramenta assinala palavras-chave que enfraquecem, como `unsafe-inline`.
- **X-Content-Type-Options: nosniff** impede o navegador de adivinhar tipos de conteúdo, e **X-Frame-Options** (ou o `frame-ancestors` do CSP) defende contra clickjacking.
- **Referrer-Policy** e **Permissions-Policy** controlam o que a página vaza no cabeçalho Referer e quais recursos do navegador ela pode usar.
- As **políticas de origem cruzada** (COOP, COEP, CORP) que governam o isolamento entre origens.

## Cookies e suas flags

A segurança de um cookie vive em seus atributos, e a ferramenta os verifica contra a especificação atual de cookies (RFC 6265bis): **Secure** (enviado apenas por HTTPS), **HttpOnly** (oculto do JavaScript, o que reduz o roubo via cross-site scripting) e **SameSite** (que limita o envio entre sites e mitiga CSRF). Ela também reconhece os prefixos de nome `__Host-` e `__Secure-`, que impõem algumas dessas propriedades pelo próprio nome.

## Lendo a nota

O objetivo da nota é priorização: ela diz não só o que está presente, mas o que falta ou está fraco, e por que cada cabeçalho importa, para que você corrija primeiro as lacunas de maior impacto. As verificações seguem o conjunto recomendado do OWASP e as especificações subjacentes, e não a opinião de uma única ferramenta.

## Como usar

Cole uma resposta HTTP, incluindo seus cabeçalhos, e leia a análise com nota de cabeçalhos, cookies e política de origem cruzada. A análise é determinística e local, então é seguro rodá-la em uma resposta capturada de qualquer site.
