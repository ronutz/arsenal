## O que faz

Disseca qualquer URL em suas partes nomeadas: o esquema, o host, a porta, o caminho, os parâmetros de query individuais e o fragmento. Ela decodifica escapes percent e hostnames internacionalizados (punycode), sinaliza credenciais embutidas e outros problemas, e mostra a porta padrão do esquema. Tudo roda no seu navegador.

## As partes de uma URL

Uma URL tem uma gramática definida, estabelecida na RFC 3986, e a ferramenta divide uma URL em seus componentes de nível superior: o **esquema** (como `https`), a **autoridade** (que contém qualquer userinfo, o **host** e a **porta**), o **caminho**, a **query** e o **fragmento**. Em seguida, ela quebra a string de query em parâmetros individuais e decodifica o percent de cada um, para que uma query longa vire uma lista legível de pares nome-e-valor, em vez de uma única string opaca. Seguindo o WHATWG URL Standard, ela trata um `+` em uma query codificada como formulário como um espaço.

## Analisada como escrita, não normalizada

Uma escolha de design importante: a ferramenta analisa a URL exatamente como você a forneceu e não a normaliza silenciosamente. Isso importa porque as diferenças que um navegador suavizaria discretamente são muitas vezes exatamente o que você está tentando ver: uma porta inesperada, uma barra duplicada, um caractere codificado perdido. Mostrar a URL como escrita é o que a torna útil para depuração e para perceber algo suspeito.

## Decodificação e sinalização

Duas coisas em particular a ferramenta destaca:

- **Hostnames internacionalizados.** Um rótulo de host em forma punycode (começando com `xn--`) é decodificado de volta para seu texto Unicode (RFC 3492 e o arcabouço IDNA da RFC 5890), para você ver o nome real, o que também ajuda a revelar truques de domínios parecidos.
- **Credenciais embutidas.** Uma URL pode carregar um nome de usuário e uma senha na forma `usuário:senha@host`, e a ferramenta sinaliza isso, porque credenciais em uma URL são um erro comum e uma preocupação de segurança.

## Como usar

Cole uma URL e leia seu esquema, host, porta, caminho, parâmetros de query decodificados e fragmento, com quaisquer credenciais ou outros problemas sinalizados. A análise é determinística e local, então é seguro inspecionar qualquer URL, inclusive uma que você não queira visitar.

## Compartilhar resultado

Abaixo da faixa de anatomia, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a URL depois do `#` com a senha e qualquer parâmetro de token trocados por `REDACTED`, nunca como foi digitada: a faixa de anatomia mostra a URL inteira, com a senha. O popover diz primeiro o que o link leva e quantos valores foram trocados, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

O que é trocado:

- **A senha no userinfo**, o texto depois do primeiro dois-pontos: a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1, diz que as aplicações "should not render as clear text any data after the first colon" (não devem mostrar em claro nada depois do primeiro dois-pontos). O nome de usuário fica.
- **Parâmetros da query e do fragmento** com nome de segredo: `access_token` numa query ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), seção 2.3) ou num fragmento, onde a concessão implícita o devolve ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seção 4.2.2); `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seção 4.1.2); `X-Amz-Signature` e `X-Amz-Security-Token` inteiros, e do `X-Amz-Credential` só o ID da chave de acesso, então o escopo da credencial depois dele (a data, a região e o serviço) continua legível, que é onde uma URL pré-assinada costuma falhar ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), lida em 2026-11-01); `sig` ([Create a service SAS](https://learn.microsoft.com/en-us/rest/api/storageservices/create-service-sas), lida em 2026-11-01); `key` ([Use API keys to access APIs](https://cloud.google.com/docs/authentication/api-keys-use), lida em 2026-11-01); e qualquer nome terminado em token, secret, password ou api key.

O host, a porta, o caminho e todo outro parâmetro vão como foram digitados, e os vetores de compartilhamento da ferramenta conferem que a página que abre o link lê as mesmas partes. Uma observação que era só sobre um valor trocado (um escape percentual ou um `+` dentro dele) sai junto. Se sobrar uma chave ou token onde nenhum nome o marca (um JWT no caminho), não há link, e o popover diz isso.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviada ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche o campo como se tivesse sido colada e a página a disseca. Como em todo link `#input=` para esta página, o valor fica no endereço até você editar o campo.
