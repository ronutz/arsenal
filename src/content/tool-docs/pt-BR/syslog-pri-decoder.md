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

## Compartilhar resultado

Abaixo do resultado, nos dois modos, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva um PRI e mais nada: no modo Decodificar, o campo como foi digitado (`#input=%3C34%3E`); no modo Codificar, o PRI que a facility e a severity formam, na forma usada na rede (`#input=%3C134%3E` para local0 e informational), então o link abre no modo Decodificar com a mesma facility e a mesma severity. Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; um PRI tem no máximo cinco caracteres.
- **Ao abrir um link.** O link é o mesmo endereço que outros links para esta ferramenta usam: o PRI preenche o campo do modo Decodificar como se tivesse sido digitado. Como em todo link para esta ferramenta, o valor fica depois do `#` até você mudar ou limpar o campo, e então sai do endereço sem nenhuma requisição.
