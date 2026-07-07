## O que faz

Cole um iRule; o linter sinaliza um pequeno conjunto de anti-padrões de desempenho e correção de alta confiança, documentados pela F5, linha por linha, cada um com uma severidade, o token problemático, por que importa e a correção. É um analisador estático (sem parser Tcl, sem execução), então cobre deliberadamente apenas padrões que uma varredura de linha consegue detectar de forma confiável e com poucos falsos positivos. Não é um substituto para a medição: combine-o com a Calculadora de Runtime de iRules, que lê estatísticas reais de timing, para o custo real de uma regra. Tudo roda localmente.

## O que sinaliza

**Variáveis do namespace global** (`$::x`, `set ::x`, a palavra-chave `global`) são sinalizadas como ALTA. O validador da F5 captura a palavra-chave `global` a partir da v10 e demove o servidor virtual para uma única instância de TMM (demoção de CMP), então um processador lida com todas as conexões daquele virtual; variáveis globais estão descontinuadas desde a v10. A forma obsoleta `$::datagroup` é ainda pior: na versão 11 e posteriores, acessar um data group dessa forma levanta um erro de execução TCL e envia um reset para o cliente. A correção é o namespace `static::` seguro para CMP para constantes compartilhadas, variáveis locais comuns para dados por conexão, ou o comando `class` para data groups.

**`expr` sem chaves** é um AVISO. O Tcl substitui e re-analisa a forma sem chaves, e pode fazer dupla substituição; colocar a expressão entre chaves permite que o compilador de bytecode a otimize. A correção é `expr { ... }`.

**`matchclass` / `findclass`** são INFO. Ambos foram descontinuados na v10 em favor do comando `class`, que a F5 descreve como oferecendo melhor funcionalidade e desempenho. A correção é `class match` / `class search`.

**`regexp` / `regsub`** são INFO. Expressões regulares custam materialmente mais que trabalho fixo de string; quando o casamento é um prefixo, sufixo, valor exato ou glob simples, `string`, `scan`, `switch -glob` ou `class` são mais baratos.

## O que deliberadamente não sinaliza

Variáveis `static::` (seguras para CMP), `class match` / `class search` e `expr` com chaves estão corretas e passam limpas. Persistência, tabelas e o comando `session` são compatíveis com CMP em versões modernas, então não são tratados como problemas de CMP. Comentários de linha inteira são ignorados.
