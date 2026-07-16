## O que a ferramenta faz

Declare a comparação que você está fazendo - por quê (validação pós-mudança, recuperação pós-incidente, cutover de migração, checagem de deriva ou decisão de rollback), contra qual classe de alvo, em qual escopo, quão boa a baseline realmente é, quão completa está a captura do depois, por quanto tempo você observou e quanto o alvo muda por conta própria - e um registro fixo de 27 regras originais produz o RELATÓRIO DE COMPARAÇÃO EM CAMADAS: uma declaração de qualidade da baseline; o catálogo de dimensões que vale fotografar para aquele alvo (14 dimensões, cada uma com classe de churn e exatamente o que registrar); orientação de INTERPRETAÇÃO DE DELTA por dimensão - deve-coincidir, ler-com-cuidado ou deriva-esperada sob o churn declarado, cada uma com o que SUSTENTARIA um achado e o que ENFRAQUECERIA uma conclusão; as lacunas de completude da validação; e o PORTÃO: continuar, observar, investigar ou manter-rollback-armado, com condições explícitas que subiriam ou desceriam o patamar.

## O contrato de honestidade no nome

Esta ferramenta nunca ingere dados de estado e nunca faz diff de nada. VOCÊ DECLARA OS ESTADOS, A FERRAMENTA CONDICIONA A CONCLUSÃO - essa frase não é marketing, é a arquitetura: a regra base do motor dispara em toda execução para dizer que o relatório está condicionado a classes declaradas, e a primeira linha do checklist é verificar as declarações contra as capturas reais. O que o portão compra é disciplina, não onisciência: uma baseline de memória trava o veredito em investigar por mais limpo que o depois pareça; uma janela de observação imediata trava em observar porque a convergência ainda não falou; e num contexto de decisão de rollback, QUALQUER lacuna de evidência converte o veredito em manter-rollback-armado - quando a pergunta é "fazer rollback?", qualquer coisa aquém de evidência limpa significa manter o rollback armado.

## Nunca só por componentes verdes

A regra de risco do cânone é estrutural: a regra estado-versus-serviço também dispara incondicionalmente, e mesmo o melhor veredito permanece condicionado a uma dimensão de camada de serviço (uma sonda fim a fim, uma transação real de autenticação) concordando com a camada de componentes. Configuração inalterada não é saúde; componentes verdes não são um serviço funcionando; o relatório diz isso em toda execução.

## Determinismo e verificação

Regras são predicados puros sobre os sete enums; a escada de severidade (0 continuar, 1 observar, 2 investigar) toma o máximo, e a conversão de rollback é explícita no código. A verificação segue o modelo de snapshot de disparo de regras do cluster com dois pinos específicos da ferramenta: o VEREDITO DO PORTÃO exato e o CONJUNTO DE DIMENSÕES selecionado exato são congelados nos vetores junto com regras disparadas e alertas - treze vetores (nove cenários, quatro rejeições), fixados a partir da execução do motor; qualquer deriva quebra o build.

## Entrada da API

A entrada com paridade de API recebe um objeto JSON: `{"context", "target", "scope", "beforeConfidence", "afterState", "window", "churn", "preset", "notes": {"changeRef", "title", "notes"}}`. Todos os campos exceto `notes` usam os vocabulários fechados do formulário; um valor fora do vocabulário é erro de formato, nunca um palpite.
