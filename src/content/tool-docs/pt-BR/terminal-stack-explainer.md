## O que faz

Rode `tty` num shell, cole o que ele imprimiu, e a ferramenta diz qual camada da pilha de terminal você está de fato olhando: um escravo de pseudoterminal, um console virtual, uma linha serial real, o sinônimo do terminal controlador, ou o console de sistema. Ela também trata **"not a tty"**, que é um achado e não um erro.

As quatro definições de uma linha aparecem **antes** de você colar qualquer coisa, porque quem chega confuso com as palavras não deveria precisar fornecer entrada para a página lhe dizer algo.

## O que cada resposta entrega

- **`/dev/pts/N`** — um escravo de pseudoterminal. Algo no espaço de usuário segura o mestre: o seu emulador, o `sshd` ou o `tmux`. **O número é alocado, não significativo** — dois shells com números consecutivos não têm relação. É também por isso que fechar uma janela mata o que estava rodando: o mestre some, o kernel desliga a linha, o líder de sessão recebe SIGHUP.
- **`/dev/ttyN`** — um console virtual, o kernel controlando o teclado e a tela da própria máquina. Sobrevive ao que um pseudoterminal não sobrevive, e por isso é onde você acaba quando o servidor gráfico morreu.
- **`/dev/ttyS0`, `/dev/ttyUSB0`** — uma linha serial real, o caso original inalterado. A ferramenta avisa que **os parâmetros seriais não são negociados**: uma divergência produz lixo convincente em vez de silêncio, então um console mostrando lixo costuma ser configuração de velocidade e não cabo quebrado.
- **`/dev/tty`** — não é um dispositivo, é um **sinônimo** para qualquer terminal que controle o processo que chama. Explica por que um prompt de senha ainda chega até você com a saída redirecionada.
- **`/dev/console`** — para onde o kernel fala, e num servidor com frequência a porta serial e não a tela.

## O que ela não faz

Ela lê um caminho, não um sistema. Não sabe dizer quem segura o mestre do seu `/dev/pts/3` específico, e não adivinha nomes de dispositivo desconhecidos — um caminho não reconhecido é reportado como não reconhecido, porque um dispositivo específico de plataforma não deve ser inferido pela grafia.
