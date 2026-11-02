## O que faz

Cole duas políticas de segurança declarativas do F5 AWAF - Advanced WAF (antigo BIG-IP ASM - Application Security Manager) — uma antes e uma depois — e ela as compara e classifica cada mudança relevante para segurança como afrouxamento ou aperto. Ela existe para responder a única pergunta que importa depois de uma sessão de ajuste: isto abriu uma brecha? Roda inteiramente no seu navegador e nunca contata um BIG-IP.

## A distinção que faz

Nem todo afrouxamento é perigoso. Adicionar uma URL ou parâmetro permitido é uma ampliação delimitada de entidade única — a forma normal e correta de resolver um falso positivo. O que merece escrutínio é um afrouxamento que amplia a proteção por toda a política: mudar o enforcement para Transparent (que para toda a política de bloquear), desabilitar uma violação ou uma evasion, desligar o Data Guard, confiar em um header X-Forwarded-For fornecido pelo cliente, mover signatures para staging, ou adicionar uma entidade wildcard que casa com muitas URLs de uma vez. A ferramenta separa esses afrouxamentos para toda a política dos delimitados, para que um diff de ajuste não vire silenciosamente uma regressão de segurança.

## O veredito

Se houver qualquer afrouxamento para toda a política, o veredito é "abriu uma brecha", e essas mudanças são listadas primeiro, cada uma com um nível de preocupação. Se as ampliações permanecerem por entidade, o veredito é "apenas mudanças delimitadas" — a zona segura para ajuste de falso positivo. Se toda mudança aumentar a proteção, é "apertado". Ela também lista os apertos para você ver o panorama completo do que mudou entre as duas políticas.

## O que compara

Ela lê as seções relevantes para segurança que o schema de política declarativa do F5 define: enforcementMode, staging de signature-settings, general.trustXff, data-guard, csrf-protection, os block flags por violação sob blocking-settings, a habilitação por evasion, e as listas de entidades URL, parâmetro e tipo de arquivo (onde um nome contendo asterisco é tratado como wildcard). Esses são os mesmos caminhos de campo validados no explicador de política declarativa e no explicador de evasion.

## Grounding

A semântica de afrouxamento segue o schema de política declarativa de WAF do F5 e a documentação do ASM sobre como uma política Transparent e um block flag limpo param o enforcement, junto com a regra do K70544352 de que você relaxa apenas onde um falso positivo ocorreu e o delimita. Nenhuma das políticas que você cola é enviada ou sai da página.

## Compartilhar resultado

Abaixo do veredito, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as duas políticas como foram coladas depois do `#`, chamadas `before` e `after` como as duas caixas, assim que a página as compara. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Políticas podem citar hosts, URLs e endereços internos, então o popover pede que você leia as duas antes de mandar o link. As duas caixas passam pela mesma verificação do explicador de política declarativa. Antes de oferecer um link, o texto é verificado em busca de uma credencial que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials"), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seções 4.1.1, 4.2.1 e 8.4, em que um cookie costuma guardar um identificador de sessão), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (um membro JSON `token`, um `password=` na query de uma URL) não impede o link; o popover cita o primeiro para você conferir. O popover diz em qual caixa está a linha.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** As duas caixas são preenchidas como se tivessem sido coladas e a página as compara como sempre. Um link sem uma das duas é ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
