# Explicador de comandos / contexto de iRules

Uma iRule é Tcl com um contrato: o código roda quando eventos disparam, comandos valem em alguns eventos e não em outros, e um punhado de construções silenciosamente custa todos os núcleos de CPU menos um. Esta ferramenta lê o contrato de volta.

Cole uma iRule e cada bloco `when` vira um cartão. A identidade do evento vem da Master List of iRule Events no clouddocs, condensada fielmente, com seu módulo e um link para a página de referência; eventos fora da tabela curada de escopo BIG-IP LTM - Local Traffic Manager ainda são interpretados e sinalizados, em vez de adivinhados. Os comandos do bloco são inventariados, com namespace e simples, cada um vinculado diretamente à sua página de referência.

Quando um evento aparece em mais de um bloco, a ordem de avaliação é renderizada conforme as regras documentadas do comando priority: valores de 0 a 1000, padrão 500, menor roda primeiro, mesma prioridade roda em ordem de inserção, e entre múltiplas iRules em um virtual a ordem de listagem das regras desempata o resto.

A auditoria de CMP é a parte que paga o aluguel, e cada achado tem fonte na página de CMP Compatibility. Variáveis globais não são compatíveis com CMP; o validador captura a forma global a partir da v10 e o virtual server é rebaixado, o que significa que cada conexão dele cai em um único TMM. A alternativa documentada para estáticos compartilhados é o namespace `static::`, e a ferramenta diz isso na hora. Chaves geradas em RULE_INIT ganham uma instância por TMM, então a descriptografia entre TMMs falha; perfis de estatísticas contam por instância de TMM. A auditoria nomeia cada um desses casos onde os vê.

Uma nota de honestidade, projetada de propósito: as listas de validade por comando vivem na página de referência de cada comando e variam por versão, então a ferramenta vincula a página de cada comando em vez de reproduzir tabelas de validade que não verificou. Um único nome de evento renderiza seu cartão; a palavra `events` renderiza o catálogo agrupado por módulo.

A iRule é interpretada e lida, nunca executada. Tudo roda localmente; nada do que você cola sai da página.

## Compartilhar resultado

No alto da leitura, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa (uma iRule, um nome de evento ou `events`) como foi colada depois do `#`, e mais nada. Antes de você copiar qualquer coisa, o popover acrescenta um alerta: uma iRule pode citar hosts internos, pools e data groups.

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
