## O que faz

Cole um JSON Web Token para ler o que há dentro dele e, para um token assinado com HMAC, verificar se sua assinatura é válida. A ferramenta divide o token em suas três partes, decodifica o header e os claims, traduz os claims de tempo em datas legíveis e, se você fornecer o segredo, verifica uma assinatura HS256, HS384 ou HS512. Tudo roda no seu navegador; um segredo colado nunca sai dele.

## O formato de um JWT

Um JWT na sua forma compacta usual são três segmentos Base64url unidos por pontos: `header.payload.signature`. O **header** nomeia o algoritmo de assinatura (`alg`) e frequentemente um id de chave (`kid`); o **payload** carrega os claims, um objeto JSON de afirmações sobre o sujeito; e a **assinatura** é calculada sobre os dois primeiros segmentos, de modo que qualquer adulteração deles possa ser detectada. Os claims registrados incluem o emissor (`iss`), o sujeito (`sub`), a audiência (`aud`) e os campos de tempo `iat`, `nbf` e `exp`, que são segundos numéricos desde a época Unix e que a ferramenta apresenta como datas legíveis.

## Decodificar não é verificar

Esta é a coisa mais importante de entender sobre um JWT: o header e o payload são apenas codificados em Base64url, não criptografados. Qualquer um que tenha o token consegue lê-los, então um JWT não é lugar para colocar segredos. Decodificar diz o que um token afirma; não diz se essas afirmações são verdadeiras. Só verificar a assinatura contra a chave correta prova que o token foi emitido por quem ele diz e não foi alterado.

## Verificação da assinatura e o algoritmo

HS256, HS384 e HS512 assinam com um HMAC sobre um segredo compartilhado, a mesma construção que a ferramenta de HMAC usa, então este verificador e aquela ferramenta concordam. Como o segredo tanto assina quanto verifica, quem consegue verificar um token assinado com HS também consegue criar um; esse é o compromisso simétrico, e é por isso que serviços que precisam deixar outros verificarem sem poder forjar usam um algoritmo assimétrico como RS256 ou ES256. Uma família conhecida de ataques abusa do campo `alg`, seja definindo-o como `none`, seja enganando um servidor que possui uma chave pública RSA para que a trate como um segredo HMAC; a orientação de boas práticas atuais na RFC 8725 existe para fechar essas brechas, e a versão curta é: sempre confira que o algoritmo é o que você espera.

## Como usar

Cole um token para decodificar seu header e seus claims e ler seus tempos em linguagem clara. Para verificar um token assinado com HMAC, cole o segredo compartilhado e a ferramenta confirma se a assinatura corresponde. Se um token está expirado agora é mostrado em relação ao seu relógio atual, sobreposto aos claims de tempo que o decodificador lê.

## Compartilhar resultado

Abaixo dos selos de status do token, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o header e os claims do token depois do `#`: os dois primeiros segmentos exatamente como você colou, seguidos de um segmento de assinatura vazio (`header.payload.`), e uma marca dizendo que o token colado tinha assinatura. Ele nunca leva a assinatura, o token como você colou nem o segredo da caixa de verificação. O popover dele diz primeiro o que o link leva e depois um aviso próprio: os claims podem identificar uma pessoa e os serviços que confiam no token, então leia antes de mandar o link. Em seguida oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Por que não o próprio token: um JWT é uma credencial bearer enquanto vale. A [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) (seção 1.2, lida em 2026-11-01) define um bearer token como um que "any party in possession of the token (a "bearer") can use" (qualquer um que tenha o token pode usar), e a [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) (seção 1, lida em 2026-11-01) leva os claims de um JWT como o payload de um JWS. Sem a assinatura, a cópia não é um token que algum verificador aceite: a [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) (seção 5.2, lida em 2026-11-01) diz que, quando nenhuma assinatura é validada, "the JWS MUST be considered invalid" (o JWS deve ser considerado inválido). Deixar a assinatura de fora também faz o link não dar a ninguém o que seria preciso para testar palpites de um segredo HMAC fraco offline. Um header cujo membro `jwk` traz material de chave privada (`d`, `p`, `q`, `dp`, `dq`, `qi`, `oth` ou `k`; a RFC 7515, seção 4.1.3, faz o `jwk` levar a chave pública) não ganha link, e o popover cita os membros.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então os valores não são enviados ao servidor quando o link é aberto; eles ficam na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-los.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho dele.
- **Ao abrir um link.** A cópia preenche a caixa e a página a decodifica como numa colagem: o mesmo header, os mesmos claims e as mesmas datas, com a expiração lida no relógio de quem abre. Quando o token de quem mandou era assinado, o painel da assinatura diz que ela ficou de fora do link, no lugar da assinatura e da caixa de verificação. Só um valor no formato da cópia que a página decodifica é aceito; um token inteiro, ou qualquer outra coisa, é ignorado. Nos dois casos os valores saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
