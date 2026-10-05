## O que faz

Três campos: um tamanho, uma taxa e um tempo. Qualquer um deles é explicado sozinho; quaisquer dois dão o terceiro.

- **Um tamanho** ("1.5 GB", "700 MiB", "10K", "8 bits", "2 kilobytes") volta como um número exato de bits e de bytes, como um valor em todas as unidades das duas convenções (bits com prefixos do SI e binários, bytes com prefixos do SI, bytes com prefixos do IEC) e, quando o rótulo era um prefixo do SI em bytes, como o mesmo rótulo lido das duas maneiras, com a diferença entre elas.
- **Uma taxa** ("100 Mbit/s", "12.5 MB/s", "1 Gbps", "56k") volta em bits e bytes por segundo, em todas as unidades de taxa, e como o volume que ela move num minuto, numa hora e num dia.
- **Um tempo** ("90 s", "2h 30min", "1 dia") é lido exatamente, ao milissegundo. As unidades são ms, s, min, h e d, por extenso em inglês ou em português (segundos, minutos, horas, dias).
- **Dois dos três** dão o terceiro: tamanho sobre taxa é o tempo de transferência (com as suas partes), tamanho sobre tempo é a taxa alcançada, taxa vezes tempo é o volume movido. Com os três, o tempo é recalculado a partir de tamanho e taxa.
- **A eficiência** escala a taxa: um predefinido para TCP sobre IPv4 sobre Ethernet, TCP sobre IPv6, UDP sobre IPv4, ou qualquer porcentagem.
- **A tabela de conexões** responde à pergunta do tempo de transferência para um conjunto de enlaces padrão de uma vez, na eficiência escolhida.

## Os dois tipos de quilo

Os prefixos têm dois sentidos em computação, e a calculadora os mantém separados pela grafia, como as normas fazem:

- **Os prefixos do SI são decimais.** k é 1000, M é 1 000 000 e assim por diante; um kilobyte (kB) são 1000 bytes, um megabit (Mbit) são 1 000 000 bits. É o que os prefixos significam em todo o resto da ciência, e o que os fabricantes de discos e de redes querem dizer.
- **Os prefixos binários do IEC são potências de 1024.** O IEC os aprovou em dezembro de 1998 (IEC 60027-2, Emenda 2, publicada em 1999-01; hoje IEC 80000-13): kibi Ki 2^10, mebi Mi 2^20, gibi Gi 2^30, tebi Ti 2^40, pebi Pi 2^50, exbi Ei 2^60. Um kibibyte (KiB) são 1024 bytes; um mebibyte (MiB) são 1 048 576 bytes. O NIST observa que eles não fazem parte do SI.
- **O hábito antigo.** Antes de 1998, e em alguns softwares ainda, "KB" e "MB" significavam 1024 e 1 048 576 bytes. A diferença cresce com o prefixo: 2,4 % no quilo, 4,86 % no mega, 7,37 % no giga, 10 % no tera, 12,6 % no peta. Um disco de "1 TB" guarda 1 000 000 000 000 bytes, que um sistema contando em potências de 1024 mostra como 931 GiB e pode rotular "931 GB"; não falta nada. A calculadora imprime as duas leituras para qualquer rótulo do SI em bytes, para que a pergunta nunca precise ser discutida.

Como a entrada é lida:

- `b` é bit e `B` é byte; `bit`, `bits`, `byte`, `bytes` e `octet` são aceitos, e os prefixos por extenso (kilobyte, mebibit).
- `k`, `K`, `M`, `G`, `T`, `P`, `E`, `Z` são decimais; `Ki`, `Mi`, `Gi`, `Ti`, `Pi`, `Ei`, `Zi` são binários.
- Um prefixo sozinho, sem unidade (`10K`, `1.5M`), é lido como potência de 1024 de bytes, que é como `ls -h` e `du -h` imprimem tamanhos (a página do ls do GNU: K, M, G, T, P, E, Z, Y, R, Q são potências de 1024, KB, MB etc. potências de 1000, e KiB equivale a K); o resultado diz isso.
- `Kb`, `Mb`, `Gb` (prefixo maiúsculo com b minúsculo) são lidos como bits, que é o que o símbolo diz, e sinalizados, porque algumas fichas de produto escrevem bytes assim.
- Uma taxa é um tamanho seguido de `/s` ou `ps`: `Mbit/s`, `MB/s`, `Mbps`, `kbps`. Um `56k` sozinho como taxa são 56 000 bit/s.
- A vírgula e o ponto servem de separador decimal na entrada (`1,5 GB` e `1.5 GB` são o mesmo tamanho); os resultados são impressos com o separador do idioma da página.

## Predefinidos de eficiência

A taxa nominal de um enlace conta cada bit no fio. A carga útil anda mais devagar, porque cada quadro carrega cabeçalhos, um preâmbulo e um intervalo. Para quadros cheios de 1500 bytes:

| Predefinido | Carga útil por quadro | No fio por quadro | Eficiência |
|---|---|---|---|
| TCP sobre IPv4 sobre Ethernet | 1500 - 20 (IPv4) - 20 (TCP) = 1460 | 1500 + 14 + 4 + 8 + 12 = 1538 | 94,93 % |
| TCP sobre IPv6 sobre Ethernet | 1500 - 40 (IPv6) - 20 (TCP) = 1440 | 1538 | 93,63 % |
| UDP sobre IPv4 sobre Ethernet | 1500 - 20 (IPv4) - 8 (UDP) = 1472 | 1538 | 95,71 % |

Os mínimos dos cabeçalhos são a RFC 791 (IPv4, 20 octetos), a RFC 8200 (IPv6, 40 octetos, declarados na sua seção 8.3 como 20 octetos a mais que o mínimo do IPv4), a RFC 9293 (TCP, 20 octetos) e a RFC 768 (UDP, 8 octetos). A sobrecarga do quadro é o Apêndice C da RFC 2544: "Preamble 64 bits, Frame 8 x N bits, Gap 96 bits", com N o quadro incluindo o cabeçalho de 14 bytes e o FCS de 4; os 812 quadros por segundo de 1518 bytes a 10 Mb/s do mesmo apêndice são 10 000 000 / (1538 x 8), e o vetor dourado `rfc2544-frame-time` os reproduz. Esses predefinidos são tetos: uma transferência TCP real também gasta capacidade com confirmações, slow start e retransmissão.

## A tabela de conexões

| Enlace | Taxa nominal | Fonte |
|---|---|---|
| Modem 56k | 56 000 bit/s de descida | ITU-T V.90 (09/98) |
| ISDN, um canal B | 64 kbit/s | a tabela da calculadora de 2004 |
| T1 | 1 544 kbit/s | ITU-T G.704 (10/98) |
| E1 | 2 048 kbit/s | ITU-T G.704 (10/98) |
| Ethernet de 10 Mb/s a 400 Gb/s | 10, 100, 1000 Mb/s; 2,5, 5, 10, 25, 40, 100, 400 Gb/s | IEEE 802.3-2022 |

As linhas marcadas 2004 estavam na tabela de conexões da calculadora de bits e bytes do nutzmann.net em 2004 e do ntz.com.br em 2013, o ancestral mais antigo das ferramentas deste site. O exemplo resolvido dela é o botão Exemplo aqui: um arquivo de "56k" por um modem de "56k" leva cerca de 8,2 segundos, não um, porque o arquivo tem 56 KiB (57 344 bytes, 458 752 bits) e o modem move 56 000 bits por segundo: 8,192 s exatos.

## Exatidão

Toda grandeza é guardada como uma mantissa inteira e uma potência de dez, e toda taxa e todo tempo como uma razão de dois desses números, de modo que nada é arredondado até ser impresso. Os valores impressos mantêm até seis casas decimais; um valor cuja forma exata não termina (um terço de segundo) é marcado como arredondado. As durações são divididas em dias, horas, minutos, segundos e milissegundos, arredondadas para cima a partir da metade no milissegundo, e o total também é dado em segundos com seis casas. Um zettabyte em bits é escrito por extenso.

## Limites

- Não modelado: janelas TCP e tempo de ida e volta, perdas, compressão, e a distância entre a taxa nominal de um enlace e o que um provedor entrega. Os predefinidos de eficiência são tetos por quadro.
- A calculadora diz o que um rótulo significa em cada convenção. Qual convenção um sistema operacional específico usa para exibir tamanhos é a documentação daquele sistema que deve dizer; a calculadora não afirma isso.
- Cada campo é cortado em 64 caracteres e lido por uma única expressão ancorada; a aritmética é BigInt, então nenhum valor transborda.

## Fontes

- [NIST: Prefixes for binary multiples](https://physics.nist.gov/cuu/Units/binary.html) (lido em 2026-10-04)
- [ls(1), GNU coreutils (man7.org)](https://man7.org/linux/man-pages/man1/ls.1.html) (lido em 2026-10-04): -h, --si e o argumento SIZE
- [RFC 2544, Apêndice C](https://www.rfc-editor.org/rfc/rfc2544#appendix-C) (lida em 2026-10-04)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791) (lida em 2026-10-04)
- [RFC 8200: IPv6, seção 8.3](https://www.rfc-editor.org/rfc/rfc8200#section-8.3) (lida em 2026-10-04)
- [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293) (lida em 2026-10-04)
- [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768) (lida em 2026-10-04)
- [ITU-T V.90 (09/98)](https://www.itu.int/rec/T-REC-V.90/en) (lida em 2026-10-04)
- [ITU-T G.704 (10/98)](https://www.itu.int/rec/T-REC-G.704/en) (lida em 2026-10-04)
- [IEEE 802.3-2022](https://standards.ieee.org/ieee/802.3/10422/) (lido em 2026-10-04)
- [nutzmann.net, Calculadora de bits e bytes (2004), Internet Archive](https://web.archive.org/web/20041009131549/http://nutzmann.net:80/bitsandbytes.htm) (lido em 2026-10-04): o exemplo resolvido da calculadora de 2004, a sua nota sobre o IEC e a sua tabela de conexões
- [ntz.com.br, Calculadora e conversão de bits e bytes (2013), Internet Archive](https://web.archive.org/web/2013/http://ntz.com.br/bitsandbytes.html) (lido em 2026-10-04): a mesma calculadora no site de 2013, com a sua tabela de prefixos do IEC
