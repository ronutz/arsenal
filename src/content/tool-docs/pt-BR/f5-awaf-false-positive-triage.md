## O que faz

Escolha uma violação que você está triando no F5 AWAF - Advanced WAF (antigo BIG-IP ASM - Application Security Manager): sua categoria, seu violation rating médio, e se a verificação está enforced, staged ou em uma política Transparent. A ferramenta retorna o veredito baseado em rating do F5, se a violação está bloqueando tráfego agora, e a correção com escopo para aquela categoria se for um falso positivo genuíno. É a contraparte do estimador de envenenamento: aquele alerta contra relaxar demais, e este mostra como relaxar um falso positivo real corretamente. É determinística e roda inteiramente no seu navegador.

## O veredito vem do rating

O Advanced WAF atribui a cada transação um violation rating de 1 a 5, e esse rating decide como tratar um suspeito falso positivo. Ratings 4 ou 5 são provavelmente ataques reais e bloqueiam mesmo quando todo Block flag está desligado, então a ferramenta diz para limpar a sugestão sem mudar a política. Um rating 3 é ambíguo e precisa ser investigado no event log primeiro. Ratings 1 e 2 geralmente são falsos positivos genuínos, então a ferramenta diz para aplicar a correção com escopo (ou aceitar a sugestão de aprendizado) depois que você confirmar que a requisição é legítima.

## Ela considera staging e o modo Transparent

Se uma violação está de fato bloqueando depende do enforcement. A ferramenta marca uma violação como bloqueando apenas quando a política está em modo Blocking e o rating é 4 ou 5. Uma signature em staging registra mas não bloqueia, e uma política em modo Transparent não bloqueia nada, então nesses casos a ferramenta observa que o falso positivo é um sinal de aprendizado e não uma experiência de usuário quebrada, e que a correção importa para quando o enforcement for ligado.

## A correção é sempre com escopo

Para cada categoria de violação a ferramenta dá a correção documentada, e toda opção é com escopo na URL ou parâmetro específico, nunca um disable para toda a política. Desabilitar uma signature em uma URL, adicionar uma entidade permitida, adicionar um meta-caractere ao conjunto daquela entidade, aumentar um comprimento específico, marcar um parâmetro de file upload, anexar um content profile XML ou JSON, ou habilitar o Potential False Positive Detection são todas ações com escopo. A ferramenta sempre reafirma a disciplina que rege todo o exercício: relaxe apenas onde um falso positivo de fato ocorreu, nunca onde um ataque real causou a violação.

## Grounding

A lógica de rating para ação e as correções com escopo vêm do K70544352 do F5 (Reducing false positive violations), da documentação Working with Violations do BIG-IP ASM (que define como o rating dirige o bloqueio e quais violações são não aprendíveis), e da orientação Refining Security Policies with Learning. Nada que você seleciona é enviado ou sai da página. Para uma mudança de produção, confirme contra a documentação e a requisição específica no seu event log.
