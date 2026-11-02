## O que faz

Lê uma Content-Security-Policy do modo como o Content Security Policy Level 3 a lê e gradua o que encontrou. O texto colado pode ser um valor de header, uma linha inteira `Content-Security-Policy:` ou `Content-Security-Policy-Report-Only:`, um elemento `<meta http-equiv="Content-Security-Policy">`, ou vários desses; os membros separados por vírgula de um header são políticas distintas, cada uma avaliada por si.

Para cada política: cada diretiva, nomeada e classificada (CSP3, depreciada, extensão, obsoleta, desconhecida) com uma linha sobre o que governa; cada expressão de fonte lida contra a gramática (palavra-chave, nonce, hash, esquema, host com esquema, porta, caminho e curingas) e explicada; a política em vigor por destino pela lista de recurso; o panorama de script (inline permitido, só com nonce ou hash, ou bloqueado; eval; WebAssembly; 'strict-dynamic'); e os achados, graduados em alto, médio, baixo, nota e bom, cada um citando a frase da especificação. A nota é uma de strict (a política atende à Strict CSP da própria especificação, seção 8.5), boa, razoável, fraca ou nenhuma (nada restringe script).

Só decodifica e gradua, offline: nada é buscado, nenhuma página é carregada. A API hospedada roda o mesmo código.

## Como a política é lida

- 2.2.1: divide nos pontos e vírgulas, apara, passa o nome a minúsculas, divide o valor nos espaços; "If policy's directive set contains a directive whose name is directive name, continue": uma diretiva duplicada é ignorada (C1).
- 2.3.1: cada token é uma `scheme-source`, `host-source`, `keyword-source`, `nonce-source` ou `hash-source`, ou `'none'` sozinho. Uma palavra-chave sem aspas casa com a gramática de host e é lida como host (C7); um nome de diretiva dentro de um valor significa um ponto e vírgula faltando (C6); um token fora de toda forma não casa com nada (C8).
- 6.8.3: a lista de recurso. script-src-elem → script-src → default-src; script-src-attr → script-src → default-src; style-src-elem e style-src-attr → style-src → default-src; worker-src → child-src → script-src → default-src; frame-src → child-src → default-src; connect-src, manifest-src, object-src, media-src, font-src, img-src → default-src; base-uri, form-action e frame-ancestors nunca recorrem. "There is no inheritance" (6.1.3).
- 6.7.3.2: 'unsafe-inline' é anulado por qualquer nonce ou hash na mesma lista, e para script por 'strict-dynamic' (C14 diz qual caso se aplica).
- 3.3 e 6.3.2: num elemento meta, frame-ancestors, report-uri e sandbox são ignoradas; em Report-Only, sandbox é ignorada (C5, C26).

## Os achados

C1 diretiva duplicada; C2 diretiva desconhecida; C3 diretiva obsoleta (block-all-mixed-content conforme Mixed Content 6.1; plugin-types, referrer, reflected-xss, disown-opener, navigate-to, prefetch-src, require-sri-for ausentes do CSP3); C4 report-uri depreciada (6.5.1); C5 diretiva ignorada nesta entrega; C6 ponto e vírgula faltando; C7 palavra-chave sem aspas; C8 não é expressão de fonte; C9 'none' ao lado de outras expressões; C10 lista de fontes vazia; C11 um valor que a diretiva não aceita (webrtc, upgrade-insecure-requests, require-trusted-types-for, tokens de sandbox); C12 fora da gramática de frame-ancestors; C13 nada restringe script; C14 'unsafe-inline' (anulado ou não; 'unsafe-hashes'; estilo); C15 'unsafe-eval', 'wasm-unsafe-eval', 'trusted-types-eval'; C16 'strict-dynamic' sem nonce nem hash (8.2); C17 curinga ou esquema solto para script (6.7.2.8); C18 lista de hosts para script (8.2, 8.5); C19 'self' para script; C20 object-src ausente, aberta, lista ou 'none' (6.1.9); C21 base-uri ausente, aberta ou fixada (8.5); C22 frame-ancestors ausente ou presente (6.4.2); C23 nonce abaixo de 128 bits (7.1); C24 esquemas inseguros (6.7.2.9) e endereços IP (6.7.2.10); C25 relatórios; C26 Report-Only.

Strict CSP (8.5), a nota "strict": "script-src: Only use nonce source-expression and/or hash source-expression with the 'strict-dynamic' keyword-source. ... base-uri: Specify a value of either 'self' or 'none'." O avaliador exige ainda nenhum 'unsafe-eval' e object-src 'none', como os exemplos da especificação têm.

## Compartilhar resultado

Logo no começo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi colada depois do `#`, assim que a página lê pelo menos uma política. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Uma política pode citar hosts internos e endpoints de relatório, e a CSP Level 3 ([seção 7.1](https://www.w3.org/TR/CSP3/#security-nonces), lida em 2026-11-01) manda o servidor "generate a unique value each time it transmits a policy" (gerar um valor novo a cada vez que envia uma política), então um nonce numa política compartilhada deve ser um já usado: o popover pede que você confira. A página lê cada linha da caixa como uma política, então uma resposta inteira colada aqui viajaria com os outros headers. Antes de oferecer um link, o texto é verificado em busca de uma credencial que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials"), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seções 4.1.1, 4.2.1 e 8.4, em que um cookie costuma guardar um identificador de sessão), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (um membro JSON `token`, um `password=` na query de uma URL) não impede o link; o popover cita o primeiro para você conferir.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada (nenhum preset fica marcado) e a página a lê. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Limites

- A página lê o texto da política, não a página que ela protege: não sabe que scripts inline existem, se um nonce muda a cada resposta ou se um host permitido serve JSONP ou conteúdo de usuários. Os achados sobre listas de hosts descrevem a classe.
- Várias políticas são avaliadas uma a uma; quando várias são impostas juntas, um carregamento precisa passar por todas (8.1).
- O conjunto de verificações segue o csp-evaluator do Google; a redação e os limiares vêm da especificação. Entradas acima de 20.000 caracteres são recusadas.

## Fontes

- [Content Security Policy Level 3, W3C Working Draft 16 September 2026](https://www.w3.org/TR/CSP3/) (lido em 2026-10-05)
- [Mixed Content, W3C Candidate Recommendation Draft 23 February 2023](https://www.w3.org/TR/mixed-content/#strict-checking) (lido em 2026-10-05)
- [Upgrade Insecure Requests, W3C Candidate Recommendation 8 October 2015](https://www.w3.org/TR/upgrade-insecure-requests/) (lido em 2026-10-05)
- [Trusted Types, W3C Working Draft 23 June 2026](https://www.w3.org/TR/trusted-types/) (lido em 2026-10-05)
- [Google csp-evaluator](https://github.com/google/csp-evaluator) (lido em 2026-10-05)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, janeiro de 2005](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-11-01): seção 3.5, o fragmento, e 3.2.1, o userinfo
- [RFC 6265, HTTP State Management Mechanism, abril de 2011](https://www.rfc-editor.org/rfc/rfc6265) (lida em 2026-11-01): seções 4.1.1, 4.2.1 e 8.4
- [RFC 9110, HTTP Semantics, junho de 2022](https://www.rfc-editor.org/rfc/rfc9110) (lida em 2026-11-01): seções 11.6.2 e 11.7.2
