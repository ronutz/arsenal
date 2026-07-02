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
