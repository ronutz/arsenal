## O que faz

Descreva uma política — o tráfego, a configuração de inspeção SSL, o modo de inspeção e quais perfis de segurança estão anexados — e esta ferramenta informa quais perfis conseguem de fato **enxergar** aquele tráfego. Roda inteiramente no seu navegador.

## A cadeia de dependências

Um perfil de segurança só age quando toda precondição acima dele se sustenta:

1. Uma política de firewall **permite** o tráfego. Nada inspeciona o que foi negado.
2. A inspeção SSL o **descriptografa**, se estiver criptografado.
3. O **modo** de inspeção suporta o recurso.
4. Só então o perfil age.

A ferramenta percorre essa cadeia por perfil e nomeia o elo que falhou. A maioria dos relatos de que um perfil não está funcionando se resolve na **etapa 2**: o tráfego é HTTPS, a política usa inspeção de certificado em vez de inspeção profunda, e simplesmente não há nada para ler. O perfil parece anexado, a configuração parece correta, e ele está cego.

## Cego não é o mesmo que degradado

Essa distinção é o julgamento pelo qual a ferramenta existe, e errá-la em qualquer direção seria pior que não dizer nada.

**Cego** significa anexado, configurado e sem fazer nada. Antivírus, IPS, DLP e filtro de arquivos precisam todos do corpo da mensagem. Atrás da inspeção de certificado não há corpo, então eles não estão parcialmente eficazes: estão inertes.

**Degradado** significa funcionando com menos que o quadro completo. Controle de aplicações e filtro web ainda conseguem identificar parte do tráfego por metadados do handshake, como o SNI, então uma política por nome de host ainda se aplica enquanto uma por caminho de URL não.

Dizer a alguém que um perfil está funcionando em parte quando ele não vê nada é o erro mais perigoso, então os dois são informados separadamente e estilizados de forma diferente.

## Inspeção de certificado é outra coisa, não uma versão mais fraca

Ela valida o certificado e lê o handshake. Nunca descriptografa a carga. Descrevê-la como "inspeção profunda mais leve" leva diretamente à situação do perfil cego, e é por isso que a ferramenta a apresenta como mecanismo diferente, e não como configuração inferior.

Mudar uma política para inspeção profunda é a única alteração que corrige todos os perfis cegos de uma vez — e é decisão real, não uma caixa de seleção. Inspeção profunda significa terminar o TLS no FortiGate, o que traz consequências de confiança em certificados, privacidade e desempenho que pertencem à decisão.

## Ressalvas de modo

Mesmo onde há cobertura, o modo fluxo restringe alguns comportamentos, e a ferramenta diz onde. O antivírus em modo fluxo varre conforme o arquivo flui, em vez de armazená-lo inteiro, então arquivos muito grandes e compactados profundamente aninhados são onde a cobertura afina. Ela também sinaliza a ação para arquivos grandes demais, cujo padrão **libera** arquivos acima do limiar, deixando os maiores downloads sem inspeção salvo mudança deliberada.

## O que ela não modela

**Cobertura, não detecção.** Ela responde se um perfil consegue ver o tráfego. Nunca afirma que um perfil pegaria uma ameaça específica, porque isso depende de assinaturas, bases e da própria ameaça, nada disso computável a partir de uma descrição de política.

Ela também não avalia a qualidade da configuração do perfil: um perfil de antivírus com todas as varreduras desligadas aparece como efetivo aqui, porque a pergunta feita é sobre visibilidade.

## Onde ela se encaixa

Forma par com o artigo de perfis de segurança do FortiGate, que explica fluxo contra proxy por completo, e com o artigo de modos de inspeção SSL. Para candidatos ao NSE 4, apoia os objetivos 3.02 a 3.05.
