## O que faz

As sessões de Bidirectional Forwarding Detection (BFD) são configuradas com três intervalos e um multiplicador em cada roteador, mas o número que importa, o tempo de detecção, nunca é enviado: cada receptor o calcula ([RFC 5880, seção 6.8.4](https://www.rfc-editor.org/rfc/rfc5880.txt)). Informe os valores dos dois sistemas e a calculadora mostra, para cada sentido separadamente, o intervalo de transmissão acordado e qual lado o definiu, a faixa de jitter aplicada, a taxa de pacotes, o tempo de detecção que o sistema receptor calcula, se o intervalo é um dos Common Intervals da RFC 7419 e se pacotes de Echo podem circular. Cada número vem com uma explicação em linguagem simples e a seção da norma de onde vem. Um segundo modo decodifica um pacote de controle do BFD em hex. Tudo é calculado no seu navegador.

## As entradas

Para cada sistema, A e B:

- **Desired Min TX Interval**: a que ritmo o sistema gostaria de enviar pacotes de controle.
- **Required Min RX Interval**: a que ritmo ele consegue recebê-los. `0` significa que ele não quer pacotes de controle periódicos.
- **Detect Mult**: de 1 a 255.
- **Required Min Echo RX Interval** (opcional): a que ritmo ele devolve pacotes de Echo. Vazio ou `0` significa que não devolve.
- **Modo Demand**: se o sistema pede o modo Demand.

Os intervalos levam unidade: `us` (ou `µs`), `ms` ou `s`, como em `300ms`, `300000us`, `16.7ms` ou `1s`. O protocolo carrega microssegundos inteiros em campos de 32 bits ([RFC 5880, seção 4.1](https://www.rfc-editor.org/rfc/rfc5880.txt)), então o valor precisa dar um número inteiro de microssegundos, de no máximo 4294967295. Um Desired Min TX igual a `0` é recusado: a RFC o reserva.

Duas escolhas valem para a sessão inteira: o **estado da sessão**, Up ou fora de Up, e o **caminho**, de um hop ([RFC 5881](https://www.rfc-editor.org/rfc/rfc5881.txt)) ou multihop ([RFC 5883](https://www.rfc-editor.org/rfc/rfc5883.txt)).

## As regras que aplica

Todas de documentos lidos em 2026-10-19:

- **Início lento.** Enquanto a sessão não está Up, cada sistema anuncia um Desired Min TX de pelo menos um segundo: "When bfd.SessionState is not Up, the system MUST set bfd.DesiredMinTxInterval to a value of not less than one second (1,000,000 microseconds)", fora de Up, no mínimo um segundo ([RFC 5880, seção 6.8.3](https://www.rfc-editor.org/rfc/rfc5880.txt)). A calculadora sobe qualquer valor menor e avisa.
- **O intervalo acordado.** Em cada sentido, o maior entre o Desired Min TX do emissor e o Required Min RX do receptor: "the system reporting the slower rate determines the transmission rate", o lado mais lento define a taxa ([RFC 5880, seção 6.8.7](https://www.rfc-editor.org/rfc/rfc5880.txt)). Os dois sentidos são negociados de forma independente (seção 6.8.2).
- **Jitter.** Cada intervalo é reduzido ao acaso em 0 a 25%, então o espaço entre pacotes fica entre 75% e 100% do intervalo acordado, cerca de 87,5% em média. Quando o Detect Mult do emissor é 1, o espaço precisa ficar entre 75% e 90% (seção 6.8.7).
- **O tempo de detecção.** No modo assíncrono, o receptor multiplica o Detect Mult que recebe do emissor pelo intervalo acordado. No modo Demand, o sistema em Demand usa o próprio Detect Mult vezes o próprio intervalo de transmissão acordado, contado a partir do início de uma Poll Sequence (seção 6.8.4).
- **Quando não há pacotes periódicos.** Um Required Min RX igual a 0 interrompe os pacotes de controle periódicos do outro lado (seções 4.1 e 6.8.7), e o modo Demand também, depois que a sessão está Up dos dois lados ([RFC 5880, seção 6.6](https://www.rfc-editor.org/rfc/rfc5880.txt)). O modo Demand pedido com a sessão fora de Up é informado, mas não aplicado.
- **Echo.** Um sistema só pode enviar pacotes de Echo com a sessão Up e com o outro sistema anunciando um Required Min Echo RX diferente de zero, no máximo nessa frequência (pode haver jitter de 25%) ([RFC 5880, seção 6.8.9](https://www.rfc-editor.org/rfc/rfc5880.txt)); nunca em caminho multihop ([RFC 5883, seção 3](https://www.rfc-editor.org/rfc/rfc5883.txt)). A forma de detectar falhas de Echo fica fora do escopo da RFC 5880 (seção 6.8.5), por isso não há tempo de detecção de Echo calculado. Com o Echo ativo, um sistema SHOULD subir o próprio Required Min RX para pelo menos um segundo (seção 6.8.3), e a calculadora lembra disso quando o valor é menor.
- **Common Intervals.** A RFC 7419 define o conjunto 3,3, 10, 20, 50, 100 ms e 1 s, recomenda 10 s para graceful restart e diz que o ajuste é "always towards larger (i.e., slower) interval values", sempre para intervalos maiores ([RFC 7419, seção 3](https://www.rfc-editor.org/rfc/rfc7419.txt)). A calculadora diz se cada intervalo acordado está no conjunto e, se não estiver, qual é o próximo Common Interval acima.
- **Pisos de implementação.** Um aviso só aparece onde um documento de fabricante baixado declara um mínimo: o bfdd do FRRouting aceita `receive-interval`, `transmit-interval` e `echo receive-interval` de 10 a 4294967 milissegundos ([documentação do FRRouting, BFD](https://docs.frrouting.org/en/latest/bfd.html)), e a documentação do Junos OS 13.1, publicada em 2013-08-15, dá de 1 a 255.000 milissegundos para `minimum-interval` e suas metades de recepção e transmissão ([Juniper Networks, Junos OS 13.1](https://juniper.net/documentation/en_US/junos13.1/topics/reference/configuration-statement/bfd-liveness-detection-edit-protocols-bgp.html)). A página do Junos é antiga, e o aviso cita a versão.

A calculadora também avisa quando os dois sentidos detectam em tempos diferentes e mostra as portas UDP em uso: 3784 para pacotes de controle de um hop e 3785 para Echo ([RFC 5881, seção 4](https://www.rfc-editor.org/rfc/rfc5881.txt)), 4784 para multihop ([RFC 5883, seção 5](https://www.rfc-editor.org/rfc/rfc5883.txt)).

## Modo de decodificação

Cole um pacote de controle do BFD em hex: a seção obrigatória de 24 bytes, seguida ou não de uma seção de autenticação. Espaços, dois-pontos, hífens, pontos e um `0x` no início são aceitos. O decodificador mostra versão, diagnóstico (com o nome da RFC 5880, seção 4.1, ou do registro da IANA para o 9), estado, as seis flags P, F, C, A, D e M, Detect Mult, Length, os dois discriminadores e os três intervalos em microssegundos e em unidades legíveis. Depois aplica as verificações de recepção da RFC 5880, seção 6.8.6, na ordem (versão 1, Length mínimo, Length não maior que os bytes informados, Detect Mult diferente de zero, M desligado, My Discriminator diferente de zero e Your Discriminator diferente de zero, a menos que o estado seja Down ou AdminDown) e informa a primeira que descarta o pacote. Entre os outros achados estão Poll e Final ligados juntos (seção 6.5), o bit Demand ligado fora de Up (seção 6.8.7) e um Desired Min TX abaixo de um segundo fora de Up (seção 6.8.3). Com o bit A ligado, mostra só o Auth Type e o Auth Len; os dados de autenticação nunca aparecem.

## Exemplos resolvidos

- Os padrões do FRRouting dos dois lados, 300 ms em cada sentido e multiplicador 3: cada sentido acorda 300 ms, os pacotes saem a cada 225 a 300 ms (cerca de 262,5 ms em média), 3,333 pacotes por segundo, e cada lado detecta uma falha depois de 900 ms. 300 ms não é Common Interval; o próximo acima é 1 s.
- O botão Exemplo, o caso do próprio FRRouting: A a 300 ms com multiplicador 3, B recebendo a 200 ms. B detecta depois de 900 ms, o número que a documentação do FRRouting dá.
- Os mesmos peers fora de Up, como na amostra de `show bfd peers` do FRRouting (local a 300 ms, remoto a 1000 ms): os dois sentidos rodam a 1 s e o tempo de detecção é 3000 ms, o `Detection timeout: 3000ms` da amostra; o intervalo real de `970ms` cai dentro da faixa de jitter de 750 a 1000 ms.
- 100 ms com multiplicador 9: 900 ms, a alternativa da RFC 7419 a 3 vezes 300 ms. 10 s com multiplicador 255: 2550 s, os 42,5 minutos do Apêndice A da RFC 7419.
- A a 10 ms, B a 20 ms: os dois sentidos negociam 20 ms, como na seção 2 da RFC 7419, e detectam depois de 60 ms.
- A com Required Min RX de 1000 ms contra os padrões do FRRouting: A detecta depois de 3000 ms, B depois de 900 ms.
- Decodificar `20 c0 03 18 00 00 00 01 00 00 00 02 00 04 93 e0 00 04 93 e0 00 00 00 00`: versão 1, diagnóstico 0, Up, nenhuma flag, Detect Mult 3, Length 24, discriminadores 1 e 2, 300 ms em cada sentido, sem Echo; nenhuma verificação de recepção o descarta.

## Procedência

O engine é aritmética fixa sobre as regras acima, sem relógio, sem rede e sem aleatoriedade. Ele traz 42 golden vectors (conjunto `bfd-timers-golden-2026-10-19`): 16 casos da calculadora, 13 do decodificador e 13 recusas. Cada caso cita o documento e a seção que fixam os números esperados, entre eles o exemplo de 900 ms e a amostra de `show bfd peers` do FRRouting, os casos de 20 ms, 9 vezes 100 ms e 42,5 minutos da RFC 7419 e a sessão de 16,7 ms da RFC 5880. As errata da RFC 5880 foram lidas no mesmo dia: nenhuma muda a aritmética dos timers (a 5205 e a 4410 estão guardadas para uma revisão futura; a 7082 e a 7083 ordenam as verificações de autenticação). A RFC 7419 e a RFC 5883 não têm errata.

## API

O mesmo engine responde à operação `/api/v1/bfd-timers` da API HTTP do site, descrita campo a campo no contrato OpenAPI na [página da API](/api), com exemplos tirados dos golden vectors. O contrato também diz se este site serve a API.

- **Requisição.** Um objeto JSON. Calculadora: `{"a": {...}, "b": {...}, "sessionUp": true, "path": "single-hop"}`, em que cada sistema tem `desiredMinTx`, `requiredMinRx`, `detectMult` e, opcionalmente, `requiredMinEchoRx` e `demand`. Os intervalos são strings com unidade (`"300ms"`) ou números de microssegundos (`300000`). Decodificador: `{"mode": "decode", "packet": "20 c0 03 18 ..."}`.
- **Resposta da calculadora.** `mode` (`timers`), `sessionUp`, `path`, `systems` (cada um com os valores em microssegundos, o Desired Min TX anunciado depois da regra do início lento e se o modo Demand foi pedido e está ativo), `directions` (de A para B, depois de B para A, cada um com `intervalUs`, `setBy`, `periodic`, `silentReason`, `jitter`, `packetsPerSecond`, `detection` com `kind`, `detectMult`, `intervalUs` e `timeUs`, `commonInterval`, `nextCommonIntervalUs`, `echo` e `explanations`), `warnings` e `notes`. Cada explicação, aviso e nota tem um `id`, a `section` de onde vem, os `params` e um `text` em inglês. Para o exemplo do FRRouting, a API responde `intervalUs` 300000 e `detection.timeUs` 900000 de A para B.
- **Resposta do decodificador.** `mode` (`decode`), `hex`, `bytes`, `version`, `diagnostic`, `state`, `flags`, `detectMult`, `length`, `myDiscriminator`, `yourDiscriminator`, `desiredMinTxUs`, `requiredMinRxUs`, `requiredMinEchoRxUs`, `auth`, `discardedBy` (a primeira verificação de recepção que falha, ou null) e `findings`.
- **Erros.** HTTP 400, `invalid_input`, com a mensagem do engine, por exemplo `a.desiredMinTx: "300" is not an interval; write a number and a unit (us, ms or s), such as 300ms`.

## Fontes

- [RFC 5880, Bidirectional Forwarding Detection (BFD), junho de 2010](https://www.rfc-editor.org/rfc/rfc5880.txt) (lida em 2026-10-19): seções 4.1, 6.5, 6.6, 6.8.2, 6.8.3, 6.8.4, 6.8.5, 6.8.6, 6.8.7 e 6.8.9; [errata](https://www.rfc-editor.org/errata/rfc5880) (lidas em 2026-10-19)
- [RFC 5881, Bidirectional Forwarding Detection (BFD) for IPv4 and IPv6 (Single Hop), junho de 2010](https://www.rfc-editor.org/rfc/rfc5881.txt) (lida em 2026-10-19): seção 4
- [RFC 5883, Bidirectional Forwarding Detection (BFD) for Multihop Paths, junho de 2010](https://www.rfc-editor.org/rfc/rfc5883.txt) (lida em 2026-10-19): seções 3 e 5
- [RFC 7419, Common Interval Support in Bidirectional Forwarding Detection, dezembro de 2014](https://www.rfc-editor.org/rfc/rfc7419.txt) (lida em 2026-10-19): seções 2 e 3 e Apêndice A; [página de errata](https://www.rfc-editor.org/errata/rfc7419): nenhuma errata
- [Documentação do FRRouting, BFD (bfdd), latest](https://docs.frrouting.org/en/latest/bfd.html) (lida em 2026-10-19): Peer / Profile Configuration e Status
- [Juniper Networks, Junos OS 13.1, bfd-liveness-detection (Protocols BGP), publicada em 2013-08-15](https://juniper.net/documentation/en_US/junos13.1/topics/reference/configuration-statement/bfd-liveness-detection-edit-protocols-bgp.html) (lida em 2026-10-19)
- [IANA, Bidirectional Forwarding Detection (BFD) Parameters](https://www.iana.org/assignments/bfd-parameters/bfd-parameters.xhtml) (lido em 2026-10-19): BFD Diagnostic Codes e BFD Authentication Types
