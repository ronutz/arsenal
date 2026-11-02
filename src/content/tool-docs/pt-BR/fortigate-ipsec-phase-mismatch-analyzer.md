## O que faz

Descreva as duas pontas de um túnel IPsec e esta ferramenta nomeia sobre o que elas divergem e, a parte que de fato importa, **qual fase falharia**. Roda inteiramente no seu navegador.

## Por que a fase é todo o diagnóstico

A fase 1 autentica os pares e protege a negociação. A fase 2 roda dentro desse canal protegido e negocia as associações de segurança e os seletores.

Essa divisão é por que saber a fase estreita um defeito de imediato. Uma falha de fase 1 é sobre identidade ou proposta, e fase 2 alguma é tentada, então a ausência dela nos logs é esperada, e não um segundo problema. Uma falha de fase 2 significa que os pares se autenticaram com sucesso e *então* discordaram sobre o que proteger, o que aponta para seletores, transformações ou PFS e nada mais.

Inverter isso manda o engenheiro para a metade errada da configuração, e é por isso que esta ferramenta lidera com o veredito, e não com uma tabela campo a campo.

## Os três falsos positivos que ela se recusa a produzir

Um analisador de divergências que reporta configurações saudáveis como quebradas é pior que analisador nenhum, porque as pessoas param de ler. Três diferenças parecem falhas e não são:

**Listas de propostas não precisam ser idênticas.** O FortiOS aceita uma lista, e o túnel sobe se qualquer valor for comum. Comparar `aes256` com `aes128 aes256` e chamar de divergência estaria errado, então isto calcula a interseção e informa um valor compartilhado como adequado.

**Tempos de vida não precisam coincidir.** O menor vence. A ferramenta nomeia o valor efetivo e diz explicitamente que isso não é falha. Valores muito diferentes significam apenas renegociações em intervalos incômodos.

**Seletores são espelhados.** A sub-rede local de um par é a remota do outro, então comparar local com local sinalizaria todo túnel corretamente montado. A comparação é deliberadamente cruzada.

Os achados são separados entre divergências que bloqueiam e diferenças que não são falhas, e mantidos visualmente apartados. Apresentar "seus tempos de vida diferem" com o mesmo peso de "nenhuma criptografia comum" é como a saída vira ruído.

## O que ela detecta

Fase 1: versão do IKE, método de autenticação, modo do IKEv1, e ausência de criptografia, hash ou grupo DH comuns. O modo só é comparado quando a versão é v1, porque sinalizar main contra aggressive em IKEv2 seria um falso positivo exatamente do tipo acima.

Fase 2: ausência de transformação comum, PFS habilitado de um lado só, divergência de grupo DH do PFS quando os dois o têm ligado, e divergências de seletor nos dois sentidos.

O caso do PFS merece menção própria: a mensagem de log dessa falha em geral não diz PFS, e é por isso que ela custa tanto tempo e por que vale ter uma ferramenta que a nomeia.

## Seletores são exatos, não aproximados

`10.1.0.0/16` contra `10.1.0.0/24` é **divergência**, e não quase-correspondência. Os dois lados precisam concordar exatamente sobre as redes que o túnel carrega. Quando um par é um equipamento com suporte estreito a seletores, as duas pontas precisam ser configuradas de forma simétrica, e não conveniente.

## O que ela não vai dizer

Ela compara o que você fornece. Um campo presente de um lado e ausente do outro é tratado como *não declarado*, e não como divergência, porque uma colagem parcial não é evidência de falha.

Ela também não diagnostica o caso que mais desperdiça tempo na prática: um túnel que reporta **ativo e não passa tráfego**. Isso não é problema de IPsec: é rota ausente ou política de firewall ausente, e a ferramenta diz isso quando não encontra divergência fatal.

## Compartilhar resultado

Abaixo do veredito, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva os dois pares como foram colados depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Os nomes dos pares e as sub-redes protegidas descrevem sua rede (por isso o popover traz uma linha de cuidado). A página não lê nenhuma pre-shared key, mas quem descreve um túnel pode escrever uma numa linha `phase1:` ou colar um bloco phase1-interface junto das diretivas. Antes de oferecer um link, a caixa é verificada em busca de uma credencial que o FortiOS ou um padrão define: uma linha `set` de um setting que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e os demais; lida em 2026-11-01) ou o `name` de uma community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5), qualquer valor `ENC` (aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), lido em 2026-11-01: esses dados postados onde outros leem "should currently be considered "easy to decrypt""), um par `psksecret=` ou `password=` com os mesmos nomes numa linha de diretiva, uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma senha numa URL ou um access key ID da AWS. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo, então o que você compartilha é exatamente o que escolheu (um valor nunca é trocado dentro de uma caixa colada, o que mudaria o que foi enviado). Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada e a página compara os dois pares. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Onde ela se encaixa

Forma par com o artigo de VPN IPsec do FortiGate, organizado em torno da mesma pergunta e que cobre as escolhas de topologia que esta ferramenta não modela. Para candidatos ao NSE 4, apoia o objetivo 5.01.
