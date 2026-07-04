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
