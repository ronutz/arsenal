## O que faz

Dê à ferramenta uma versão do BIG-IP e ela retorna a service check date mínima que a licença daquela versão precisa ter; dê a ela uma service check date e ela retorna a versão mais recente para a qual você pode atualizar, junto com os branches mais novos que você ainda não pode alcançar e a data que cada um precisa. É uma consulta de mão dupla sobre uma cópia embutida da tabela pública de License Check Date da F5, e roda inteiramente no seu navegador.

## As duas datas com que ela trabalha

Toda versão do BIG-IP carrega uma **License Check Date** estática: a service check date mínima que uma licença precisa ter para ter permissão de inicializar aquela versão. Toda licença carrega uma **Service Check Date**: a mais antiga entre a data em que foi ativada pela última vez e a data em que seu contrato de serviço expira. Quando você atualiza para uma nova versão major ou minor, o sistema compara as duas, e se a Service Check Date da licença for anterior à License Check Date da versão, o sistema atualizado inicializa mas não carrega sua configuração até a licença ser reativada. A ferramenta codifica a tabela de License Check Date da F5 (da K7727) e faz essa comparação para você, em qualquer direção.

As datas são tratadas na forma exata que o BIG-IP escreve no `bigip.license`, o `yyyymmdd` de oito dígitos (então `20230208` é 8 de fevereiro de 2023), e também mostradas na forma ISO. A comparação é pura aritmética de datas, sem relógio envolvido: tanto a data da versão quanto a service check date são entradas, então as mesmas entradas sempre dão a mesma resposta.

## Exemplos resolvidos

Informe uma versão, obtenha seu piso. `17.1.3` resolve para o branch `17.1.x` e reporta uma service check date mínima de `2023-02-08` (`20230208`); `21.1` reporta `2026-04-15`; `16.1.x` reporta `2021-06-11`.

Informe uma service check date, obtenha seu teto. Uma service check date de `2023-06-15` alcança até o `17.1.x` como branch mais recente, e reporta os branches que você ainda não pode alcançar: `17.5.x` (precisa de `2025-02-12`), `21.0.x` (precisa de `2025-10-29`) e `21.1.x` (precisa de `2026-04-15`). Uma data recente como `2026-05-01` alcança o branch mais recente sem nada bloqueado; uma data mais antiga do que toda a tabela não alcança nada, o sinal de que a licença precisa ser reativada antes de qualquer atualização.

## Apenas upgrades major e minor são verificados

A verificação se aplica a um upgrade, que a F5 define como uma mudança no primeiro ou segundo número de versão. Um movimento entre maintenance ou point releases dentro do mesmo branch é um update, e não dispara nenhuma verificação de service check date. É por isso que a ferramenta trabalha na granularidade major.minor: uma vez que sua service check date é recente o suficiente para alcançar o `17.1.x`, ela é recente o suficiente para todo maintenance e point release naquele branch. Então a resposta para `17.1.0`, `17.1.3` e `17.1.x` é a mesma data única.

## Como usar

Digite uma versão do BIG-IP (`17.1.3`, `21.1`, `16.1.x`) ou uma service check date (`20230611`, `2023-06-11` ou `2023/06/11`); a ferramenta detecta qual você forneceu e responde de acordo. Como isto codifica documentação de fabricante e não um padrão fixo, e a F5 adiciona uma linha a cada release, confirme qualquer valor na F5 K7727 ou no `/etc/version_date` do sistema de destino antes de um upgrade em produção.

## Colando a licença ou a saída do tmsh

Você pode colar o conteúdo completo do `/config/bigip.license`, um trecho dele, ou a saída de `tmsh show sys license`; a ferramenta localiza a linha da service check date e responde à mesma pergunta de elegibilidade de upgrade. As duas formas publicadas são reconhecidas: a do arquivo, `Service check date : 20151008` (espaçamento flexível ao redor dos dois-pontos), e a do tmsh, `Service Check Date 2016/08/18`. A licença tem exatamente uma linha dessas, então a primeira ocorrência vale, e a linha encontrada é exibida de volta para você confirmar o valor. Todo o resto do texto é ignorado e, como sempre, nada sai do seu navegador.
