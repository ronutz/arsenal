# Classificador iRules vs LTM Policy

O fabricante entrega seus exemplos de Local Traffic Policies nas duas formas, policy e iRule equivalente, porque as duas genuinamente se sobrepõem. A pergunta que vale automatizar é quais dos seus blocos when vivem na sobreposição.

Cole uma iRule e cada bloco recebe um de três vereditos, e apenas três, porque honestidade precisa de um balde do meio. Exprimível em policy significa que cada construção mapeia para a gramática que os próprios exemplos 12.1 do fabricante demonstram: condições http-uri, http-header e http-cookie com equals, contains, starts-with e ends-with; encaminhar para um pool ou resetar; log write, incluindo substituição tcl:; replace e insert de header; habilitar compressão. Esses blocos vêm com um esboço de migração exatamente nessa gramática, marcado para validação com tmsh. Verifique na sua versão significa que as construções são plausivelmente cobertas em releases atuais mas as fontes que esta ferramenta verificou não as demonstraram; HTTP::redirect é o residente canônico, e a ferramenta manda checar as listas de condições e ações da sua versão em vez de adivinhar. iRule obrigatória nomeia os bloqueadores: eventos além do par de request e response HTTP, loops e procedures Tcl, lógica de regex (a gramática verificada casa com listas de operandos, não padrões), variáveis (policies não têm nenhuma; a substituição tcl: dentro de uma ação é a exceção estreita documentada), estado de table e session, conexões sideband, coleta de payload, timers.

A palavra strategies renderiza as três estratégias de correspondência com a semântica da própria referência ltm policy-strategy: first-match encerra o motor na primeira condição que casa; all-match executa as ações de tudo que casa; best-match deixa a correspondência mais específica vencer, com empates caindo para a tabela de precedência embutida cujo topo a ferramenta reproduz. O [manual Getting Started with Policies](https://techdocs.f5.com/en-us/bigip-15-1-0/big-ip-local-traffic-management-getting-started-with-policies/introducing-local-traffic-policies.html) (Applies To de 15.1.0 a 17.5.1, lido em 2026-10-26) detalha a ordem do best-match em quatro passos: vence a regra com mais condições, sem olhar quais são; depois, a regra com os tipos de condição de maior prioridade; depois, correspondência igual (equals) sobre starts-with, ends-with ou contains; por fim, o ordinal do operando. O mesmo capítulo resolve dois casos que os nomes das estratégias deixam em aberto: no all-match, quando regras que casam especificam ações conflitantes, só a ação da regra best-match é aplicada, e no best-match ou no first-match uma regra sem condições vira a regra padrão quando é a última da lista de Rules.

Por que migrar o que pode migrar: LTM Policy, nativa do BIG-IP LTM - Local Traffic Manager, é a camada que as fontes descrevem como altamente performática e que, ao contrário de iRules, não exige programação, e nenhum dos riscos de rebaixamento de CMP das iRules existe dentro de uma policy. A mecânica de migração pelo manual de Getting Started: rascunho, publicar, anexar ao virtual.

Tudo roda localmente; nada do que você cola sai da página.

## Compartilhar resultado

No alto dos vereditos, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa (uma iRule, ou `strategies`) como foi colada depois do `#`, e mais nada. Antes de você copiar qualquer coisa, o popover acrescenta um alerta: uma iRule pode citar hosts internos, pools e data groups.

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
