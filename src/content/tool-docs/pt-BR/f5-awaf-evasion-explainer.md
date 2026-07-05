## O que faz

O F5 AWAF - Advanced WAF (antigo BIG-IP ASM - Application Security Manager) detecta toda uma classe de ataques que se escondem atrás de codificação, em que um payload é escapado ou codificado para que uma assinatura de ataque nunca veja os caracteres reais, e o servidor web o decodifica de volta no ataque só depois que o firewall já olhou. O F5 agrupa as defesas sob uma única violação, "Evasion technique detected" (`VIOL_EVASION`), dividida em oito subviolações. Esta ferramenta é o lado de decodificação dessa violação: digite o nome de uma subviolação (ou a palavra `evasions`) para as oito explicadas, ou cole o bloco `evasions` de uma política declarativa para ler cada uma como habilitada ou desabilitada. É baseada literalmente no próprio K7929 do F5 e no capítulo atual de violações do BIG-IP ASM, e roda inteiramente no seu navegador.

## Dois modos, uma entrada

Digite `evasions` e a ferramenta lista as oito subviolações do F5, cada uma com seu estado padrão (as oito vêm habilitadas), uma descrição em linguagem clara do que ela normaliza ou detecta, e o truque de codificação que um atacante usa para que ela detecte. Digite um único nome, como `Multiple decoding` ou `Bad unescape`, e você recebe apenas aquele card. A busca é tolerante quanto a espaços, maiúsculas e sinais de porcentagem, então `multiple decoding` e `Multiple decoding` ambos resolvem.

Cole JSON em vez disso, um array `evasions` isolado, o objeto `blocking-settings`, ou um wrapper `{ "policy": { ... } }` inteiro, e a ferramenta muda para o modo de leitura: reporta cada uma das oito subviolações como habilitada, desabilitada, ou não definida, em que "não definida" significa que a política herda o padrão do seu template em vez de desligar a verificação. Uma subviolação desabilitada é destacada como aviso, porque desligar uma significa que aquela normalização é pulada e a evasão que ela detectava pode chegar à aplicação sem ser resolvida.

## As oito subviolações

A ferramenta cobre exatamente as oito do F5, na ordem em que o manual as lista: `%u decoding` (escapes Unicode `%u` da Microsoft), `Apache whitespace` (os bytes de controle ASCII 9, 11, 12, 13), `Bad unescape` (hex ilegal como `%RR`), `Bare byte decoding` (bytes brutos acima de 127), `Directory traversals` (padrões `../`), `IIS backslashes` (dobrar `\` em `/`), `IIS Unicode codepoints` (mapeamentos `%u` específicos do IIS a partir da Windows-1252) e `Multiple decoding` (decodificação repetida de codificações aninhadas). Cada nome, padrão e descrição vem diretamente da documentação do F5.

## Multiple decoding e a contagem de passes

Multiple decoding é a única subviolação com um valor de ajuste. No schema declarativo ela carrega `maxDecodingPasses`, que o schema limita entre 2 e 5 com um padrão documentado de 3. A ferramenta mostra a contagem de passes quando uma política a define, sinaliza como nota um valor elevado acima do padrão, e sinaliza como aviso um valor fora do intervalo de 2 a 5, porque o sistema o rejeitaria ou limitaria. Quando a contagem não é definida, a ferramenta informa o padrão que se aplica em vez de adivinhar.

## A ponte para as ferramentas de codificação

Várias dessas subviolações são exatamente as mesmas operações de decodificação que a caixa de ferramentas já realiza. Os escapes `%u`, os bare bytes, e o percent-encoding `%XX` que o Bad unescape fiscaliza são território do codec Base64/Percent, e Multiple decoding é simplesmente percent-decoding rodado mais de uma vez. Cada card de referência nomeia a ferramenta relacionada, para que você possa pegar uma string codificada e ver a decodificação acontecer à mão, o que é o jeito mais rápido de construir intuição sobre o que o WAF está normalizando.

## Uma regra do schema

A ferramenta também lê o flag de learn da violação-pai quando um array `blocking-settings.violations` completo está presente. Conforme o schema, estas subviolações só são *aprendidas* quando o aprendizado está habilitado em `VIOL_EVASION`; se o learn estiver desligado lá, uma requisição que dispara ainda é detectada e pode ser alarmada ou bloqueada, mas nenhuma sugestão de aprendizado é gerada. A ferramenta mostra esse estado para que uma política que nunca aprenderá suas evasões não te surpreenda.

## Fundamentação e precisão

Cada nome, padrão e descrição de subviolação é baseado no K7929 do F5 e no capítulo atual "Working with Violations" do BIG-IP ASM 17.5 (a tabela Evasion Techniques Sub-Violations); os nomes de campo, o booleano `enabled`, o `maxDecodingPasses` e o limite de 2 a 5 vêm do schema de política declarativa de WAF do F5. É uma ferramenta somente de decodificação: lê o que você cola e nunca busca, nunca valida contra um BIG-IP ativo, e nunca avalia tráfego. Nada que você cola é enviado ou sai da página; para uma decisão de produção, confirme qualquer leitura na documentação da sua versão do BIG-IP.
