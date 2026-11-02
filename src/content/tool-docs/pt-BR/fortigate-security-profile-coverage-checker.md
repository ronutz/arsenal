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

**Degradado** significa funcionar com menos que a visão completa. Controle de aplicações e filtro web ainda conseguem identificar parte do tráfego por metadados do handshake, como o SNI, então uma política por nome de host ainda se aplica enquanto uma por caminho de URL não.

Dizer a alguém que um perfil está funcionando em parte quando ele não vê nada é o erro mais perigoso, então os dois são informados separadamente e estilizados de forma diferente.

## Inspeção de certificado é outra coisa, não uma versão mais fraca

Ela valida o certificado e lê o handshake. Nunca descriptografa o payload. Descrevê-la como "inspeção profunda mais leve" leva diretamente à situação do perfil cego, e é por isso que a ferramenta a apresenta como mecanismo diferente, e não como configuração inferior.

Mudar uma política para inspeção profunda é a única alteração que corrige todos os perfis cegos de uma vez — e é decisão real, não uma caixa de seleção. Inspeção profunda significa terminar o TLS no FortiGate, o que traz consequências de confiança em certificados, privacidade e desempenho que pertencem à decisão.

## Ressalvas de modo

Mesmo onde há cobertura, o modo fluxo restringe alguns comportamentos, e a ferramenta diz onde. O antivírus em modo fluxo varre conforme o arquivo flui, em vez de armazená-lo inteiro, então arquivos muito grandes e compactados profundamente aninhados são onde a cobertura afina. Ela também sinaliza a ação para arquivos grandes demais, cujo padrão **libera** arquivos acima do limiar, deixando os maiores downloads sem inspeção salvo mudança deliberada.

## O que ela não modela

**Cobertura, não detecção.** Ela responde se um perfil consegue ver o tráfego. Nunca afirma que um perfil pegaria uma ameaça específica, porque isso depende de assinaturas, bases e da própria ameaça, nada disso computável a partir de uma descrição de política.

Ela também não avalia a qualidade da configuração do perfil: um perfil de antivírus com todas as varreduras desligadas aparece como efetivo aqui, porque a pergunta feita é sobre visibilidade.

## Compartilhar resultado

Abaixo da tabela de cobertura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi colada depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

As linhas de diretiva citam tipos de profile e modos de inspeção, não a sua rede, então o popover não traz uma linha de cuidado própria. Antes de oferecer um link, a caixa é verificada em busca de uma credencial que o FortiOS ou um padrão define: uma linha `set` de um setting que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e os demais; lida em 2026-11-01) ou o `name` de uma community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5), qualquer valor `ENC` (aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), lido em 2026-11-01: esses dados postados onde outros leem "should currently be considered "easy to decrypt""), um par `psksecret=` ou `password=` com os mesmos nomes numa linha de diretiva, uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma senha numa URL ou um access key ID da AWS. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo, então o que você compartilha é exatamente o que escolheu (um valor nunca é trocado dentro de uma caixa colada, o que mudaria o que foi enviado). Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada e a página verifica a cobertura. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Onde ela se encaixa

Forma par com o artigo de perfis de segurança do FortiGate, que explica fluxo contra proxy por completo, e com o artigo de modos de inspeção SSL. Para candidatos ao NSE 4, apoia os objetivos 3.02 a 3.05.
