## O que faz

Cole a saída de `diagnose sys session list` e esta ferramenta a lê de volta: o protocolo e seu estado, qual política admitiu o fluxo, o que foi traduzido em cada perna, os temporizadores, e se o outro lado chegou a responder. Roda inteiramente no seu navegador e nunca contata um equipamento.

## Por que vale ler a tabela de sessões

A tabela de sessões é o registro autoritativo do que o FortiGate de fato fez. A lista de políticas diz o que deveria acontecer; a sessão diz o que aconteceu. Quando alguém insiste que o firewall está bloqueando o tráfego, uma entrada de sessão mostrando o fluxo admitido pela política 7 com bytes contados nos dois sentidos encerra o assunto numa linha.

O problema dela é a apresentação. A saída é densa, posicional e difícil de memorizar, então a informação está presente e não é lida.

## A leitura que as pessoas pulam

```
statistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0
```

Pacotes de saída, resposta zero. O FortiGate encaminhou o tráfego e **nada voltou**. A sessão existe, o que significa que uma política permitiu, então isso não é o firewall bloqueando nada: o problema está além deste equipamento, no roteamento do caminho de volta, no host de destino, ou num filtro mais adiante.

Esta ferramenta lidera com essa leitura em vez de informar dois números, porque diagnosticá-la erradamente como problema de firewall é o erro mais comum e mais caro cometido com essa saída.

Para UDP, o `proto_state` diz a mesma coisa de forma mais direta: `00` é um sentido só, `01` é dois sentidos.

## Os hooks de NAT

As linhas `hook=` são onde a tradução fica visível.

```
hook=post dir=org  act=snat 192.168.1.10:52345->93.184.216.34:443(203.0.113.5:52345)
hook=pre  dir=reply act=dnat 93.184.216.34:443->203.0.113.5:52345(192.168.1.10:52345)
```

A tupla entre parênteses é a forma traduzida. `hook=post dir=org act=snat` carrega a origem pós-NAT, que é o que o outro lado vê. `hook=pre dir=reply act=dnat` carrega o destino pré-NAT. Uma sessão sem `snat` nem `dnat` em perna alguma foi roteada sem tradução, e a ferramenta diz isso em vez de deixar implícito.

## O que ela não vai dizer

Campos cujas tabelas completas de valores são documentação do fabricante são mostrados **crus**, com o significado declarado apenas onde é documentado e inequívoco. O `proto_state` de TCP é o caso mais claro: os dois dígitos são o estado da conexão em cada sentido, `01` é a sessão estabelecida que todo mundo encontra, e o resto da tabela cabe à Fortinet publicar. A ferramenta diz o que os dígitos significam e não inventa o mapeamento.

Esse é um limite deliberado. Um decodificador que adivinha uma tabela de valores parece mais completo e está errado exatamente quando o valor é incomum, que é exatamente quando você está lendo a tabela de sessões.

## Compartilhar resultado

Logo no começo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as sessões como foram coladas depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A saída de `diagnose sys session list` cita endereços, portas, traduções de NAT e a política de cada fluxo, e pode citar um usuário autenticado (por isso o popover traz uma linha de cuidado). Antes de oferecer um link, a caixa é verificada em busca de uma credencial que o FortiOS ou um padrão define: uma linha `set` de um setting que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e os demais; lida em 2026-11-01) ou o `name` de uma community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5), qualquer valor `ENC` (aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), lido em 2026-11-01: esses dados postados onde outros leem "should currently be considered "easy to decrypt""), um par `psksecret=` ou `password=` com os mesmos nomes numa linha de diretiva, uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma senha numa URL ou um access key ID da AWS. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo, então o que você compartilha é exatamente o que escolheu (um valor nunca é trocado dentro de uma caixa colada, o que mudaria o que foi enviado). Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada e a página lê cada sessão. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Onde ela se encaixa

Forma par com o explicador de correspondência de política do FortiGate: aquela ferramenta prevê qual política *deveria* corresponder, e esta confirma qual política *correspondeu*. Juntas fecham o ciclo entre configuração e comportamento. Para candidatos ao NSE 4, apoia os objetivos 1.02 e 1.04.
