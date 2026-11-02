## O que faz

Cole uma assinatura SYN do p0f v3 na gramática canônica - ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass - e a ferramenta decodifica os oito campos, explica o raciocínio de TTL inicial e janela, nomeia cada opção TCP e token de peculiaridade, e compara o formato dos campos com as assinaturas de referência de SO documentadas do p0f. Aceita tanto a assinatura pura quanto a forma "label = sig".

## Por que é passiva

O p0f identifica observando pacotes que um host já enviou - o SYN de uma conexão normal - e nunca envia uma sonda própria. É isso que "passiva" significa aqui, e é por isso que a técnica é invisível para o alvo. Esta ferramenta leva isso um passo adiante, ao ensino puro: você cola uma assinatura que já tem, e nada é lido da sua máquina nem enviado a lugar algum.

## O indício de proxy

A leitura mais útil é o TTL inicial. Como cada roteador decrementa o TTL, um valor perto de 64 indica Linux/BSD/Darwin, perto de 128 indica Windows, perto de 255 indica equipamento de rede. Quando esse TTL de pilha contradiz o sistema operacional que um User-Agent afirma, você quase certamente está diante de um proxy ou NAT: o pacote carrega a pilha do intermediário, não a do cliente. O layout de opções e as peculiaridades refinam o palpite; a ferramenta mostra a contribuição de cada um.

## Compartilhar resultado

Abaixo da leitura do sistema operacional, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a assinatura como foi digitada (`input`) depois do `#`, e nada mais. O popover diz primeiro o que o link leva, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Uma assinatura p0f descreve como um host monta um SYN de TCP (TTL, opções, janela, peculiaridades); não cita host nem pessoa.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a assinatura não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Ao abrir um link.** A assinatura preenche a caixa como se tivesse sido colada e a página a decodifica; nada é enviado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
