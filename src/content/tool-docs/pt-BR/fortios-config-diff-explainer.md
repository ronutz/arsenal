## O que faz

Cole duas configurações do FortiOS separadas por uma linha com `---` e obtenha um diff **estrutural**: o que mudou por seção, objeto e configuração. Roda inteiramente no seu navegador.

## Por que um diff por linha é a ferramenta errada aqui

Um diff textual encontra um **roteiro mínimo de edição**, que não é a mesma coisa que a mudança feita por uma pessoa. Aplicado à saída do FortiOS, isso produz três incômodos específicos:

- Um bloco que **mudou de lugar** é informado como remoção mais inserção, então revisar um objeto inalterado custa a mesma atenção que uma edição real.
- Um objeto parece alterado porque um vizinho ganhou uma linha e o alinhamento se deslocou.
- Três edições genuínas ficam enterradas em quatrocentas linhas de contexto inalterado.

Esta ferramenta analisa os dois lados em seção, objeto e configuração, e então compara as estruturas. Um bloco que mudou de lugar não é uma mudança. Uma configuração alterada é uma linha nomeando o valor antigo e o novo.

## O único lugar em que a ordem não é ruído

Na maioria das seções a ordem dos objetos é irrelevante: objetos de endereço, de serviço, interfaces. Informar um reordenamento ali seria ruído, então é ignorado.

Para **firewall policy** e suas parentes, a ordem **é** o comportamento. A primeira correspondência vence, então mover uma política acima de outra muda o que o equipamento faz sem alterar uma única configuração. Essa é a edição que um diff por linha enterra com mais eficácia, porque nada dos dois lados do movimento difere textualmente, exceto a posição.

Essas seções são tratadas como sensíveis à ordem pelo nome, e um reordenamento nelas é informado como achado real:

`firewall policy` · `firewall policy6` · `firewall proxy-policy` · `firewall local-in-policy` · `firewall shaping-policy` · `firewall security-policy` · `router policy` · `router policy6` · `system sdwan`

Tratar os dois casos do mesmo jeito, em qualquer direção, tornaria a ferramenta errada, então os dois comportamentos são fixados por vetores de ouro.

## Entrada

Duas configurações, separadas por uma linha contendo apenas `---`, ou rotuladas com `BEFORE:` e `AFTER:` em linhas próprias. Cada lado é a saída comum de `show` ou `show full-configuration`.

Blocos `config` aninhados dentro de um objeto são analisados, e suas configurações recebem prefixo com o caminho aninhado para que não colidam com uma configuração de mesmo nome no objeto pai.

## O que ela não faz

**Ela compara, não julga.** Vai dizer que uma política mudou de lugar ou que um endereço mudou; não vai dizer se isso foi uma boa ideia, porque isso depende de uma intenção que ela não enxerga.

Também não modela o peso semântico de uma configuração. Mudar um comentário e mudar uma ação aparecem ambos como uma configuração alterada, e cabe a quem lê saber qual importa.

Entrada idêntica produz silêncio, e não um aviso tranquilizador. Uma ferramenta de diff que encontra mudanças fantasma é pouco confiável nas que contam, então um vetor fixa isso também.

## Onde ela se encaixa

Forme par com o artigo de políticas de firewall e NAT do FortiGate, que explica por que a ordem determina comportamento nas seções que esta ferramenta trata como sensíveis à ordem.
