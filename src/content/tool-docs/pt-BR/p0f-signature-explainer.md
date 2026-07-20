## O que faz

Cole uma assinatura SYN do p0f v3 na gramática canônica - ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass - e a ferramenta decodifica os oito campos, explica o raciocínio de TTL inicial e janela, nomeia cada opção TCP e token de peculiaridade, e compara o formato dos campos com as assinaturas de referência de SO documentadas do p0f. Aceita tanto a assinatura pura quanto a forma "label = sig".

## Por que é passiva

O p0f identifica observando pacotes que um host já enviou - o SYN de uma conexão normal - e nunca envia uma sonda própria. É isso que "passiva" significa aqui, e é por isso que a técnica é invisível para o alvo. Esta ferramenta leva isso um passo adiante, ao ensino puro: você cola uma assinatura que já tem, e nada é lido da sua máquina nem enviado a lugar algum.

## O indício de proxy

A leitura mais útil é o TTL inicial. Como cada roteador decrementa o TTL, um valor perto de 64 indica Linux/BSD/Darwin, perto de 128 indica Windows, perto de 255 indica equipamento de rede. Quando esse TTL de pilha contradiz o sistema operacional que um User-Agent afirma, você quase certamente está diante de um proxy ou NAT: o pacote carrega a pilha do intermediário, não a do cliente. O layout de opções e as peculiaridades refinam o palpite; a ferramenta mostra a contribuição de cada um.
