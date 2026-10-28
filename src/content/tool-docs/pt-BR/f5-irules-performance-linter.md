## O que faz

Cole um iRule; o linter sinaliza um pequeno conjunto de anti-padrões de desempenho e correção de alta confiança, documentados pela F5, linha por linha, cada um com uma severidade, o token problemático, por que importa e a correção. É um analisador estático (sem parser Tcl, sem execução), então cobre deliberadamente apenas padrões que uma varredura de linha consegue detectar de forma confiável e com poucos falsos positivos. Não é um substituto para a medição: combine-o com a Calculadora de Runtime de iRules, que lê estatísticas reais de timing, para o custo real de uma regra. Tudo roda localmente.

## O que sinaliza

**Variáveis do namespace global** (`$::x`, `set ::x`, a palavra-chave `global`) são sinalizadas como ALTA. O validador da F5 captura a palavra-chave `global` a partir da v10 e demove o servidor virtual para uma única instância de TMM (demoção de CMP), então um processador lida com todas as conexões daquele virtual; variáveis globais estão descontinuadas desde a v10. A forma obsoleta `$::datagroup` é ainda pior: na versão 11 e posteriores, acessar um data group dessa forma levanta um erro de execução TCL e envia um reset para o cliente. A correção é o namespace `static::` seguro para CMP para constantes compartilhadas, variáveis locais comuns para dados por conexão, ou o comando `class` para data groups.

**`expr` sem chaves** é um AVISO. O Tcl substitui e re-analisa a forma sem chaves, e pode fazer dupla substituição; colocar a expressão entre chaves permite que o compilador de bytecode a otimize. A correção é `expr { ... }`.

**`matchclass` / `findclass`** são INFO. Ambos foram descontinuados na v10 em favor do comando `class`, que a F5 descreve como oferecendo melhor funcionalidade e desempenho. A correção é `class match` / `class search`.

**`regexp` / `regsub`** são INFO. Expressões regulares custam materialmente mais que trabalho fixo de string; quando o casamento é um prefixo, sufixo, valor exato ou glob simples, `string`, `scan`, `switch -glob` ou `class` são mais baratos. Quando uma expressão regular fica, a visão de portabilidade do [Kit de Regex](/tools/regex) lista as construções que se leem de outro jeito nas Advanced Regular Expressions do Tcl, o dialeto que ela rotula como iRules do BIG-IP, do que em JavaScript ou PCRE2.

## O que deliberadamente não sinaliza

Variáveis `static::` (seguras para CMP), `class match` / `class search` e `expr` com chaves estão corretas e passam limpas. Persistência, tabelas e o comando `session` são compatíveis com CMP em versões modernas, então não são tratados como problemas de CMP. Comentários de linha inteira são ignorados.

## Compartilhar resultado

Abaixo do resumo dos achados, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a iRule como foi colada depois do `#`, e mais nada. Antes de você copiar qualquer coisa, o popover acrescenta um alerta: uma iRule pode citar hosts internos, pools e data groups.

Antes de oferecer qualquer link, a página procura na iRule chaves e credenciais escritas por extenso onde as próprias referências da F5 as colocam (todas lidas em 2026-10-27):

- a passphrase de `HTTP::cookie encrypt` e `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- uma chave na forma de string `AES 128 <hex>`, ou a chave de `AES::encrypt` e `AES::decrypt` escrita por extenso ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- o valor de `-key` ou `-keyhex` em `CRYPTO::encrypt`, `decrypt`, `sign` e `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- um header `Authorization` ou `Proxy-Authorization` escrito com `HTTP::header insert` ou `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), cujo valor a [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (seções 11.6.2 e 11.7.2) define como as credenciais;
- um literal atribuído com `set` a uma variável usada num desses lugares, como no próprio exemplo de `CRYPTO::encrypt`;
- e, pela verificação de segredos do site, chave privada PEM, JWT, ID de chave de acesso da AWS ou senha dentro de uma URL.

Quando a página encontra um desses, não há link: o popover aponta a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (`set static::api_token "..."`) não impede o link; o alerta aponta esse valor em vez disso. Nenhuma verificação acha todo segredo, então leia o que vai mandar.

Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; uma iRule maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado, e a página o lê como lê uma colagem; a iRule nunca é executada. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.
