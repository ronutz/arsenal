## O que faz

Cole uma lista de políticas de firewall do FortiGate e um pacote, e esta ferramenta executa a avaliação que o FortiOS faria: de cima para baixo, todos os critérios precisam corresponder, a primeira correspondência vence. Ela informa a política que corresponde, um rastreamento nomeando o **primeiro critério que eliminou** cada política anterior, e as políticas abaixo da correspondência que também teriam correspondido. Roda inteiramente no seu navegador e nunca contata um equipamento.

## Por que o rastreamento importa mais que o veredito

Saber que a política 7 correspondeu é uma parte pequena da resposta. A parte útil é por que as políticas 1 a 6 não corresponderam, porque é isso que diz se a lista está escrita como pretendido. Uma política com os endereços certos e a interface de saída errada silenciosamente deixa de corresponder, e nada na interface avisa: o contador de acertos simplesmente nunca incrementa.

O rastreamento nomeia um critério por política: o primeiro que falhou. O FortiOS exige todos, então uma única falha basta para eliminar uma política, e informar a primeira é o que mantém a saída legível numa lista longa.

## Encoberta contra regra abrangente, e por que a distinção é o ponto

Depois que uma política corresponde, as políticas posteriores que também teriam correspondido caem em duas categorias bem diferentes, e esta ferramenta as mantém separadas.

**Encoberta** significa que a política posterior é ao menos tão específica quanto a que venceu. Isso é falha genuína: está viva na configuração, parece correta na tela, e nunca pode ter efeito para aquele tráfego na ordem em que está. É o problema de política mais comum no FortiGate, e a correção é movê-la para cima da vencedora.

**Regra abrangente** significa que a política posterior é mais ampla que a vencedora. Uma permissão geral abaixo de um conjunto de regras específicas é projeto correto, e não erro, então a ferramenta a informa sem sinalizá-la. Confundir as duas é o que faz esse tipo de ferramenta gritar lobo em toda lista bem ordenada, e é por isso que a especificidade é calculada, e não presumida.

## Formatos de entrada

Dois formatos são aceitos, porque você pode ter um ou outro.

**CLI do FortiOS** — a saída de `show firewall policy` ou um bloco `config firewall policy`. Os membros são lidos das listas entre aspas, e uma política com `set status disable` é informada como ignorada, e não silenciosamente descartada.

**Uma tabela com barras verticais ou tabulações** — `id | srcintf | dstintf | srcaddr | dstaddr | service | action`, que é a aparência de uma cópia da interface gráfica ou de uma lista escrita à mão. Vários membros numa célula são separados por vírgula.

O pacote vai numa linha própria em qualquer formato:

```
packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS
```

## A limitação, dita com clareza

A correspondência compara **nomes de objeto**, e não endereços resolvidos. Uma lista de políticas colada não carrega as definições dos objetos de endereço, então a pergunta "10.1.1.5 está dentro do objeto chamado LAN_Subnet" não pode ser respondida a partir desta entrada. Forneça o nome do objeto, ou `all`.

Essa é uma escolha deliberada. A ferramenta poderia adivinhar extraindo endereços dos nomes de objeto, e estaria confiantemente errada sempre que um nome não descrevesse seu conteúdo. Um limite declarado é mais útil que uma resposta plausível e errada, e é a razão de esta ferramenta poder ser confiável nas partes que de fato responde.

Ela também modela **apenas a decisão de correspondência**. Resultados de NAT, desfechos de perfis de segurança, roteamento e estado de sessão dependem de configuração que esta entrada não carrega, e não são inferidos.

## Onde ela se encaixa

Forma par com o artigo de políticas de firewall e NAT do FortiGate, que explica o pipeline de avaliação que esta ferramenta percorre, inclusive por que o NAT de destino via VIP acontece antes da avaliação de política e o NAT de origem depois. Para candidatos ao NSE 4, cobre os objetivos 2.01 e 2.02.
