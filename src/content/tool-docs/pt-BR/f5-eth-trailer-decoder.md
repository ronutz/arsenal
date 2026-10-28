## O que faz

Cole a seção F5 Ethernet Trailer como o Wireshark a exibe, ou os bytes brutos do trailer em hexadecimal, e a ferramenta explica cada campo: direção, slot e TMM, o virtual server, os identificadores de fluxo e de par, e a causa de RST do próprio equipamento. Local e offline; analisa o texto colado e não contata nada.

## Por que o trailer vale a leitura

Rode o tcpdump **no próprio** BIG-IP com as flags de ruído — `:n` baixo, `:nn` médio, `:nnn` alto, com `-s0` — e cada frame carrega o relato do equipamento sobre aquele pacote. A **causa do RST** é o campo que justifica o exercício: uma captura sem ele mostra que a conexão morreu; com ele, o equipamento diz que a matou e por quê.

## Sobre o que ela avisa

**IDs de fluxo são únicos apenas dentro de uma combinação de slot e TMM, e são reutilizados.** O mesmo ID pode aparecer em pacotes sem relação antes ou depois na mesma captura. A ferramenta diz isso em toda decodificação, porque um flow ID tratado como globalmente único produz uma conclusão errada e confiante.

Ela também aponta o `f5ethtrailer.anyflowid`, que casa o ID como fluxo ou como par e portanto retorna **os dois lados** da conexão — filtrar só por `flowid` retorna metade do que você queria.

## *** A seção que ela se recusa a decodificar ***

A partir do **BIG-IP v15** o trailer pode carregar uma **seção de provider TLS contendo segredos de sessão**. O Wireshark os converte em entradas de keylog e descriptografa a captura.

**Esta ferramenta detecta essa seção, avisa que ela está ali e não decodifica nada dela.** Um golden vector garante que nenhum segredo apareça em qualquer parte da saída.

O motivo é o que vale saber: **uma captura feita em ruído alto num equipamento v15+ pode conter as chaves das suas próprias sessões TLS.** A F5 documenta que o trailer nunca sai do equipamento pelo fio — verdade, e diz respeito ao fio. O arquivo é outra questão, e enviá-lo a um chamado ou a um colega envia as chaves junto.

## O que ela não faz

Não lê arquivos pcap e não enxerga a sua captura. Quando uma causa de RST não está na sua tabela, ela diz isso em vez de inventar uma explicação.

## Compartilhar resultado

Abaixo da visão geral, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o texto do trailer como foi colado depois do `#`, mas nunca o que esta página se recusa a decodificar. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

- **Segredos de TLS: sem link.** Quando a página encontra uma seção de TLS provider, ou o texto cita um secret ou uma linha de keylog, não há link nenhum, e o popover diz por quê. A lista de campos do próprio Wireshark para o trailer ([referência de display filter do f5ethtrailer](https://www.wireshark.org/docs/dfref/f/f5ethtrailer.html), lida em 2026-10-27) inclui `f5ethtrailer.tls.master_secret`, os traffic secrets de cliente e servidor e `f5ethtrailer.tls.keylog`: as chaves das próprias sessões TLS da captura. Tirá-los mudaria o que esta página diz sobre o trailer, então nada é enviado.
- **Bytes: só o header.** Bytes colados só vão quando são apenas o header do trailer (o magic, o length e a version, 8 bytes na lista de campos do Wireshark). Qualquer outra coisa, antes ou depois dele, pode ser dado do próprio pacote ou seções de provider do trailer, segredos de TLS incluídos, que esta página nunca lê: sem link, e o popover sugere compartilhar a visão em texto do Wireshark.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado e a página o decodifica. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
