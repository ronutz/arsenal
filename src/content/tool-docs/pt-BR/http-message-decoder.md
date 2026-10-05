## O que faz

Lê uma mensagem HTTP/1.1 bruta, requisição ou resposta, do jeito que uma captura, o log de um proxy, um rastro de `curl -v` ou um exemplo de RFC a entrega, e a decodifica sem enviar nada:

- **A linha inicial.** Uma linha de requisição é lida como método, alvo e versão: o método contra a tabela que a [comparação de métodos HTTP](/tools/http-methods-comparison) usa (seguro, idempotente, a especificação que o define), o alvo contra as quatro formas da RFC 9112, seção 3.2 (origin-form `/caminho`, absolute-form `esquema://host/caminho`, authority-form `host:porta` para CONNECT, asterisk-form `*` para um OPTIONS ao servidor inteiro), a versão contra `HTTP-version = HTTP-name "/" DIGIT "." DIGIT`. Uma linha de status é lida como versão, código de três dígitos e frase de razão; o código é procurado no registro de códigos de status da IANA, e a frase enviada aparece ao lado da do registro, já que a RFC 9110 diz que as frases de razão "are only recommendations" e um cliente "SHOULD ignore the reason-phrase content".
- **Os campos.** Cada linha `nome: valor` é conferida contra o registro de nomes de campo da IANA (permanente, descontinuado, obsoleto; o resto é não registrado, e um prefixo `X-` é anotado com a RFC 6648) e arquivada sob a parte da especificação que a define: enquadramento (RFC 9112), roteamento e conexão, metadados da mensagem, contexto de requisição e de resposta, representação, negociação, requisições condicionais, requisições de intervalo (RFC 9110, seções 6 a 14), cache (RFC 9111), cookies (rfc6265bis), política de segurança, CORS e metadados de fetch (as especificações Fetch e HTML do WHATWG, CSP, HSTS), WebSocket, proxies e CDNs, WebDAV. Dobras de linha obsoletas são juntadas, espaço antes de um dois-pontos é apontado, campos singulares repetidos são apontados, e valores HTTP-date são conferidos contra os três formatos da RFC 9110, seção 5.6.7.
- **O enquadramento.** Qual das oito regras da RFC 9112, seção 6.3 decide onde o corpo termina: uma resposta que não pode carregar corpo (HEAD, 1xx, 204, 304), um túnel CONNECT, Transfer-Encoding sobrepondo Content-Length, chunked como codificação final, um Content-Length inválido, um válido, uma requisição sem nenhum dos dois (tamanho zero), uma resposta sem nenhum dos dois (lida até fechar). Content-Length é validado contra `1*DIGIT`, valores repetidos são comparados, e o tamanho declarado é comparado com os octetos realmente colados. Um corpo em chunks é decodificado pelo algoritmo da seção 7.1.3: tamanho, extensões e dados de cada chunk, o último chunk, os campos trailer, o tamanho decodificado e o que sobrar depois do fim do corpo, que um receptor leria como a próxima mensagem.
- **Credenciais e cookies.** `Authorization` e `Proxy-Authorization` são expostos com o valor mascarado; credenciais Basic são decodificadas só até o usuário (RFC 7617: usuário, dois-pontos e senha, em Base64; "not a secure method of user authentication"), e um token Bearer com forma de JWT é encaminhado ao [decodificador de JWT](/tools/jwt) sem viajar no link. Os pares de `Cookie` são listados com valores mascarados; cada `Set-Cookie` é lido quanto a Secure, HttpOnly, SameSite (Lax por padrão), as exigências dos prefixos `__Secure-` e `__Host-`, Max-Age sobre Expires e o formato de Expires.
- **Encaminhamentos.** O código de status ao [explicador de códigos de status](/tools/http-status-code-explainer), o método à comparação de métodos, a URL (quando não traz query) ao [inspetor de URL](/tools/url-inspector), os cabeçalhos de segurança ao avaliador de [cabeçalhos seguros](/tools/secure-headers), uma requisição ao [tradutor de requisições HTTP](/tools/http-request-translator) para as formas curl, fetch, HTTPie, Python e PowerShell.

## As regras

Vinte e oito regras, H1 a H28, cada uma citando a sua frase: a linha inicial (H1, H16, H17, H18, H24, H25), Host (H2), sintaxe dos campos (H3, H4, H5, H20, H21, H22, H23, H28), enquadramento (H6, H7, H8, H9, H10, H11, H12, H13, H26), credenciais e cookies (H14, H15), HTTP-dates (H19) e opções de conexão (H27). Os achados aparecem por linha e marcados numa cópia numerada da mensagem.

## O que deliberadamente não faz

- Nunca envia, repete, altera nem faz fuzzing: a metade que só decodifica de um inspetor (D-53). O [tradutor de requisições HTTP](/tools/http-request-translator) é onde uma requisição vira um comando que você mesmo roda.
- Não avalia cabeçalhos de segurança nem decodifica JWTs por conta própria; as ferramentas que o fazem estão a um clique, e o segredo nunca viaja no link.
- Não modela o enquadramento de HTTP/2 ou HTTP/3: esses levam os campos em quadros binários, e uma colagem em texto deles já é a saída de um decodificador.

## Limites

- As contagens de octetos são contagens UTF-8 do texto colado; um corpo com conteúdo binário ou outro charset mede diferente no fio, e uma colagem costuma perder bytes finais, então uma divergência de Content-Length é relatada como fato sobre a colagem.
- O esquema da URL de uma requisição não está numa mensagem HTTP/1.1; `http` é presumido quando a URL é montada a partir de Host e um alvo origin-form.
- Se uma resposta responde a um HEAD não se sabe só pela resposta; a regra 1 é aplicada só a 1xx, 204 e 304.
- Os valores dos campos aparecem como escritos, exceto credenciais e cookies, que são mascarados. A mensagem fica no navegador; um link de compartilhamento é revisado antes de ser criado, porque uma mensagem costuma carregar uma sessão.

## Fontes

- [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html) (lida em 2026-10-05): seções 2.1, 2.2, 2.3, 3, 3.2, 4, 5, 5.2, 6.1, 6.3, 7.1
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) (lida em 2026-10-05): seções 5.1, 5.3, 5.5, 5.6.7, 7.2, 7.6.1, 8.6, 9.2.1, 9.2.2, 11.1, 11.6.2, 15, 15.1
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html) (lida em 2026-10-05)
- [IANA: HTTP Field Name Registry](https://www.iana.org/assignments/http-fields/field-names.csv) (lido em 2026-10-05)
- [IANA: HTTP Status Code Registry](https://www.iana.org/assignments/http-status-codes/http-status-codes-1.csv) (lido em 2026-10-05)
- [draft-ietf-httpbis-rfc6265bis-22: Cookies: HTTP State Management Mechanism](https://www.ietf.org/archive/id/draft-ietf-httpbis-rfc6265bis-22.html) (lido em 2026-10-05)
- [RFC 7617: The 'Basic' HTTP Authentication Scheme](https://www.rfc-editor.org/rfc/rfc7617.html) (lida em 2026-10-05)
- [RFC 6648: Deprecating the "X-" Prefix and Similar Constructs in Application Protocols](https://www.rfc-editor.org/rfc/rfc6648.html) (lida em 2026-10-05)
