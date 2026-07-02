## O que faz

Toda mensagem de syslog começa com um valor de prioridade, o PRI, um número pequeno entre colchetes angulares como `<134>` bem no início da linha. Ele empacota duas informações em um só número. Esta ferramenta decodifica um PRI em sua facility e severity, e codifica uma facility e uma severity de volta em um PRI e sua forma `<PRI>` como aparece na rede. Tudo roda no seu navegador.

## A fórmula do PRI

O PRI combina uma facility e uma severity com a aritmética definida na RFC 5424:

    PRI = Facility * 8 + Severity
    Facility = PRI / 8   (divisão inteira)
    Severity = PRI % 8

Como a severity ocupa apenas os três bits mais baixos, dá para ler um PRI num relance quando você conhece as partes. A faixa válida é de 0 a 191, já que a facility vai de 0 a 23 e a severity de 0 a 7.

## Facility e severity

- A **facility** (0 a 23) nomeia o subsistema que produziu a mensagem: o kernel, o sistema de e-mail, o sistema de autenticação, o próprio daemon de syslog, e assim por diante, até as oito faixas `local0` a `local7` que dispositivos de rede e appliances costumam usar para suas próprias mensagens.
- A **severity** (0 a 7) classifica a urgência, e corre na direção contraintuitiva: 0 é a mais severa (Emergency) e 7 a menos (Debug), com Error em 3 e Informational em 6 no meio.

## Exemplo resolvido

- `<134>` decodifica para facility 16 (`local0`) e severity 6 (Informational), porque `134 = 16 * 8 + 6`. Esse valor específico é um padrão comum para dispositivos de rede registrando eventos rotineiros.

## Como usar

Informe um PRI para dividi-lo em facility e severity, ou escolha uma facility e uma severity para obter o PRI e a string `<PRI>` que você veria na rede. A RFC 5424 define o formato moderno de syslog; o formato BSD mais antigo, da RFC 3164, usa a mesma aritmética de PRI.
