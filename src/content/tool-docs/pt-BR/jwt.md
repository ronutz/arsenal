## O que faz

Cole um JSON Web Token para ler o que há dentro dele e, para um token assinado com HMAC, verificar se sua assinatura é válida. A ferramenta divide o token em suas três partes, decodifica o cabeçalho e os claims, traduz os claims de tempo em datas legíveis e, se você fornecer o segredo, verifica uma assinatura HS256, HS384 ou HS512. Tudo roda no seu navegador; um segredo colado nunca sai dele.

## O formato de um JWT

Um JWT na sua forma compacta usual são três segmentos Base64url unidos por pontos: `cabeçalho.payload.assinatura`. O **cabeçalho** nomeia o algoritmo de assinatura (`alg`) e frequentemente um id de chave (`kid`); o **payload** carrega os claims, um objeto JSON de afirmações sobre o sujeito; e a **assinatura** é calculada sobre os dois primeiros segmentos, de modo que qualquer adulteração deles possa ser detectada. Os claims registrados incluem o emissor (`iss`), o sujeito (`sub`), a audiência (`aud`) e os campos de tempo `iat`, `nbf` e `exp`, que são segundos numéricos desde a época Unix e que a ferramenta apresenta como datas legíveis.

## Decodificar não é verificar

Esta é a coisa mais importante de entender sobre um JWT: o cabeçalho e o payload são apenas codificados em Base64url, não criptografados. Qualquer um que tenha o token consegue lê-los, então um JWT não é lugar para colocar segredos. Decodificar diz o que um token afirma; não diz se essas afirmações são verdadeiras. Só verificar a assinatura contra a chave correta prova que o token foi emitido por quem ele diz e não foi alterado.

## Verificação da assinatura e o algoritmo

HS256, HS384 e HS512 assinam com um HMAC sobre um segredo compartilhado, a mesma construção que a ferramenta de HMAC usa, então este verificador e aquela ferramenta concordam. Como o segredo tanto assina quanto verifica, quem consegue verificar um token assinado com HS também consegue criar um; esse é o compromisso simétrico, e é por isso que serviços que precisam deixar outros verificarem sem poder forjar usam um algoritmo assimétrico como RS256 ou ES256. Uma família conhecida de ataques abusa do campo `alg`, seja definindo-o como `none`, seja enganando um servidor que possui uma chave pública RSA para que a trate como um segredo HMAC; a orientação de boas práticas atuais na RFC 8725 existe para fechar essas brechas, e a versão curta é: sempre confira que o algoritmo é o que você espera.

## Como usar

Cole um token para decodificar seu cabeçalho e seus claims e ler seus tempos em linguagem clara. Para verificar um token assinado com HMAC, cole o segredo compartilhado e a ferramenta confirma se a assinatura corresponde. Se um token está expirado agora é mostrado em relação ao seu relógio atual, sobreposto aos claims de tempo que o decodificador lê.
