## O que faz

Cole uma URL do iControl REST e a ferramenta a decodifica: o módulo do TMOS, a coleção, o caminho de partição e pastas codificado com til junto do seu equivalente em `tmsh`, qualquer subcoleção como os members de um pool, e as opções de consulta. Analisa apenas o texto da URL — nada é buscado e nada sai do navegador.

## O til

`/mgmt/tm/ltm/pool/~Common~apps~web_pool` endereça `/Common/apps/web_pool`. O til é um separador de pastas, usado porque **a URL já usa a barra para a sua própria estrutura**. A ferramenta sempre mostra a forma `tmsh` ao lado das partes decodificadas, porque é a forma que a maioria dos leitores já conhece.

## O detalhe de partição que gera 404

Um nome escrito sem partição é resolvido **na partição atual de quem chamou**. A mesma requisição pode funcionar para um administrador e retornar 404 para outro, sem que nada esteja errado. A ferramenta avisa sempre que o nome do objeto vem sem qualificação.

## Opções de consulta

`$select`, `$filter`, `$top`, `$skip`, `expandSubcollections`, `options` e `ver` são explicadas individualmente. A que vale conhecer é **`expandSubcollections`**: sem ela, um pool volta sem members, que é a surpresa mais comum desta API.

## O que ela não faz

A tabela de módulos é finita. Se um caminho usar um módulo que a ferramenta não conhece, ela decodifica a estrutura e **diz que o módulo não é reconhecido, em vez de descrevê-lo por palpite**. Não valida nada contra um equipamento e não pode dizer se o objeto existe.

## Compartilhar resultado

Abaixo da visão geral, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o caminho depois do `#` com qualquer credencial nele trocada, nunca como foi digitado. O popover diz primeiro o que o link leva e quantos valores foram trocados, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

- **Um token de autenticação no caminho** é mascarado mantendo o formato (maiúsculas viram `X`, minúsculas `x`, dígitos `0`), então a página continua lendo como o objeto endereçado. O próprio guia da F5 estende um token com `PATCH /mgmt/shared/authz/tokens/{{ bigip_auth_token }}` ([AS3, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), lido em 2026-10-27), o que coloca o token no caminho.
- **Uma senha antes do host** (`https://usuário:senha@host/...`) vira `[redacted]`: a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1 (lida em 2026-10-27), diz que as aplicações "should not render as clear text any data after the first colon" (não devem mostrar em claro nada depois do primeiro dois-pontos) de um userinfo.
- **Um header `X-F5-Auth-Token` ou `Authorization`** colado com o caminho tem as credenciais trocadas por `[redacted]` (o mesmo guia manda o token no `X-F5-Auth-Token`; [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2).

O host, o módulo, a coleção, os nomes de objeto e as opções de consulta vão como foram digitados; os vetores de compartilhamento da ferramenta conferem que a página que recebe lê as mesmas partes. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviada ao servidor quando o link é aberto; ela fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-la.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a decodifica. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## A ferramenta companheira

O explicador de caminhos RESTCONF do F5OS decodifica a camada de plataforma sob um tenant, que usa RESTCONF sobre YANG em vez deste modelo de objetos. As duas APIs não se parecem porque vêm de tradições diferentes, não de versões diferentes.
