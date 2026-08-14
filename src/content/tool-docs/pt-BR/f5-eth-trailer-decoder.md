## O que faz

Cole a seção F5 Ethernet Trailer como o Wireshark a exibe, ou os bytes brutos do trailer em hexadecimal, e a ferramenta explica cada campo: direção, slot e TMM, o virtual server, os identificadores de fluxo e de par, e a causa de RST do próprio equipamento. Local e offline; analisa o texto colado e não contata nada.

## Por que o trailer vale a leitura

Rode o tcpdump **no próprio** BIG-IP com as flags de ruído — `:n` baixo, `:nn` médio, `:nnn` alto, com `-s0` — e cada quadro carrega o relato do equipamento sobre aquele pacote. A **causa do RST** é o campo que justifica o exercício: uma captura sem ele mostra que a conexão morreu; com ele, o equipamento diz que a matou e por quê.

## Sobre o que ela avisa

**IDs de fluxo são únicos apenas dentro de uma combinação de slot e TMM, e são reutilizados.** O mesmo ID pode aparecer em pacotes sem relação antes ou depois na mesma captura. A ferramenta diz isso em toda decodificação, porque um flow ID tratado como globalmente único produz uma conclusão errada e confiante.

Ela também aponta o `f5ethtrailer.anyflowid`, que casa o ID como fluxo ou como par e portanto retorna **os dois lados** da conexão — filtrar só por `flowid` retorna metade do que você queria.

## *** A seção que ela se recusa a decodificar ***

A partir do **BIG-IP v15** o trailer pode carregar uma **seção de provider TLS contendo segredos de sessão**. O Wireshark os converte em entradas de keylog e descriptografa a captura.

**Esta ferramenta detecta essa seção, avisa que ela está ali e não decodifica nada dela.** Um golden vector garante que nenhum segredo apareça em qualquer parte da saída.

O motivo é o que vale saber: **uma captura feita em ruído alto num equipamento v15+ pode conter as chaves das suas próprias sessões TLS.** A F5 documenta que o trailer nunca sai do equipamento pelo fio — verdade, e diz respeito ao fio. O arquivo é outra questão, e enviá-lo a um chamado ou a um colega envia as chaves junto.

## O que ela não faz

Não lê arquivos pcap e não enxerga a sua captura. Quando uma causa de RST não está na sua tabela, ela diz isso em vez de inventar uma explicação.
