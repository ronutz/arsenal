## O que faz

Cole uma entrada de request-log do F5 AWAF - Advanced WAF (antigo BIG-IP ASM - Application Security Manager), seja a linha syslog key-value ou a linha CEF que você vê no seu SIEM, e ela extrai os campos que importam: a política, o support ID para correlação de log, o status da requisição, o violation rating, o IP do cliente, o método e a URI. Ela classifica cada violação em uma categoria de triagem e dá o veredito baseado em rating do F5 para a requisição inteira, depois aponta para a ferramenta de triagem de falso-positivo para a correção por violação. É uma ferramenta decode-only que roda inteiramente no seu navegador.

## Por que um parser de log, e não um decodificador de support-ID

Um support ID é uma referência de correlação opaca: ele permite achar uma requisição exata no event log, mas não codifica as violações. Na linha de log o support ID fica em seu próprio campo ao lado da lista real de violações e do violation rating, então a coisa útil de ler é a entrada de log inteira, não o número. Esta ferramenta expõe o support ID para correlação e lê as violações da linha; ela nunca tenta decodificar o número em violações, porque essa informação não está no número.

## O veredito vem do rating

Se o log carrega um violation_rating, a ferramenta aplica a escala do F5: um 4 ou 5 é provavelmente um ataque real e bloqueia mesmo com os Block flags desligados, então você limpa qualquer sugestão de aprendizado em vez de relaxar; um 3 é ambíguo e precisa de investigação; um 1 ou 2 geralmente é um falso positivo genuíno que você pode corrigir se confirmar que é legítimo. Formatos de log mais antigos omitem o rating, e a ferramenta avisa isso e aponta para a tela de Requests para lê-lo.

## Ambos os formatos, e a ponte

O parser lida com o formato legado key-value (campos como policy_name, violations, support_id, violation_rating, request_status, ip_client, method, uri) e CEF (resolvendo externalId como o support ID e os campos de label csN para política e tipo de ataque). Depois que ele tem as violações classificadas, leve cada uma para a ferramenta de triagem de falso-positivo com sua categoria e o rating para obter a correção com escopo, para que uma requisição bloqueada no seu SIEM vire uma decisão de ajuste concreta e corretamente delimitada.

## Grounding

Os nomes de campo e a classificação de violações vêm da documentação de logging do ASM do F5, e o veredito de rating da orientação de reporting do ASM (rating 4-5 ataque, 1-2 falso positivo). Nada que você cola é enviado ou sai da página. Uma linha de log pode conter um IP de cliente e uma URI, então trate-a como qualquer dado de requisição.

## Compartilhar resultado

Abaixo do veredito, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que nunca leva a linha de log como foi colada. Uma linha do ASM pode trazer a requisição inteira: a referência de campos da F5 ([Fields in ASM Violations event messages](https://techdocs.f5.com/en-us/bigip-16-0-0/external-monitoring-of-big-ip-systems-implementations/event-messages-and-attack-types.html), a edição mais recente que a F5 publica, lida em 2026-11-01) lista `request` ("Request string sent by client", com os headers), `headers`, `query_string`, `response`, `username` e `session_id` ao lado dos campos que esta página lê, e o formato CEF leva a requisição em `cs3`. Um cookie guarda um identificador de sessão ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 8.4) e um valor `Authorization` "consists of credentials" ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), e nenhum dos dois pode ser cortado com segurança de uma linha de formato livre.

Por isso o link leva uma cópia refeita a partir dos campos que a página lê e mostra (a política, as violações, o rating, o support ID, o status, o endereço do cliente, o método, o protocolo, a URI, o tipo de ataque e o valor de X-Forwarded-For), escrita no formato key-value da F5 depois de `ASM:`, ou depois de um header CEF vazio para uma linha CEF, para que a página mostre o mesmo formato. Todo o resto fica de fora: a requisição, os headers e o corpo dela, a query string, a resposta, o nome de usuário, a sessão e os nomes do equipamento. Antes de oferecer o link, a cópia é lida pelo próprio parser da página e precisa dar a mesma leitura, senão não há link; e ela passa pela verificação do site em busca de credenciais que ainda estejam num campo que a página mostra (um token na URI, ou uma requisição que o parser leu como URI), o que impede o link e diz o que foi encontrado. Um texto que não é uma linha do ASM não tem campos para copiar, então o popover diz que não há link. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. A cópia mantém o endereço do cliente e a URI, e o popover pede que você os confira.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a lê. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
