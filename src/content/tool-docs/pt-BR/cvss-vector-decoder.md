## O que faz

Cole uma string de vetor CVSS v3.1 ou v3.0 e a ferramenta calcula a pontuação, mapeia-a para uma faixa de severidade e explica o que cada métrica significa. Ela calcula a pontuação Base e também as pontuações Temporal e Ambiental quando essas métricas estão presentes no vetor. É pura matemática e roda offline; nada é enviado a lugar nenhum.

## O que é o CVSS

O CVSS, o Common Vulnerability Scoring System da FIRST.org, é a forma padrão de expressar quão severa é uma vulnerabilidade como um único número de 0,0 a 10,0. Esse número não é atribuído à mão; ele é calculado a partir de uma string de vetor, uma lista compacta de métricas como `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`, em que cada campo é uma característica da vulnerabilidade. A ferramenta reverte essa string para linguagem clara e roda a fórmula oficial sobre ela.

## As métricas Base

A pontuação Base, a parte que todo vetor tem, é construída a partir de métricas em dois grupos. As métricas de explorabilidade descrevem quão difícil a vulnerabilidade é de usar: **Attack Vector** (rede, adjacente, local ou físico), **Attack Complexity**, **Privileges Required** e **User Interaction**. As métricas de impacto descrevem o que acontece se ela for usada: o efeito sobre **Confidencialidade**, **Integridade** e **Disponibilidade**. O **Scope** fica entre elas e captura se explorar o componente pode afetar recursos além dele. A ferramenta mostra o valor escolhido de cada métrica e seu significado, para que um vetor deixe de ser um código opaco.

## Pontuação, severidade e os outros grupos

A pontuação Base calculada mapeia para uma faixa qualitativa: Nenhuma, Baixa, Média, Alta ou Crítica. Dois grupos de métricas opcionais a refinam quando presentes: as métricas **Temporais** ajustam pelo estado atual do código de exploração e das correções, e as métricas **Ambientais** repesam a pontuação para a sua implantação específica, incluindo seus próprios requisitos de confidencialidade, integridade e disponibilidade. A aritmética segue exatamente a especificação da FIRST.org, incluindo a regra de arredondamento da própria especificação, então o número que a ferramenta mostra corresponde ao da calculadora oficial.

## Como usar

Cole um vetor v3.0 ou v3.1 e leia a pontuação, a faixa de severidade e as métricas decodificadas. O cálculo é determinístico: o mesmo vetor sempre dá a mesma pontuação, porque é a fórmula publicada e nada mais.

[PHP2Shell: as vulnerabilidades do PHP de outubro de 2026](/learn/php-october-2026-vulnerabilities) mostra um caso real: as mesmas falhas pontuadas 9.8 ou 8.1 na v3.1, conforme a complexidade de ataque (Attack Complexity) que cada avaliador escolheu.

## Compartilhar resultado

Abaixo das pontuações, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o vetor como foi digitado depois do `#`, assim que a página o decodifica. Um vetor CVSS é um descritor público de severidade e não cita nada seu. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** O vetor preenche a caixa como se tivesse sido colado e a página o decodifica. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
