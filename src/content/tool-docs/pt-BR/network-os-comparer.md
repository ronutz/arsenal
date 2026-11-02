## O que faz

Quatorze sistemas operacionais de rede — IOS, IOS XE, IOS XR, NX-OS, Junos, Junos Evolved, EOS, TMOS, F5OS, EXOS, VOSS, FortiOS, PAN-OS e Gaia — cada um com a sua linhagem, sobre o que roda, como os componentes compartilham estado, onde controle e encaminhamento se dividem, como as mudanças são aplicadas, e quanto custa uma atualização.

**Escolha um para o perfil completo. Escolha dois para vê-los eixo a eixo**, com uma nota em cada eixo explicando por que aquele eixo prevê alguma coisa.

## O eixo que mais importa

**Como o estado é compartilhado** prevê o comportamento sob falha melhor que qualquer outra coisa:

- **Memória compartilhada** — a falha se espalha. O IOS clássico roda tudo num espaço de endereçamento sem proteção de memória.
- **Troca de mensagens** — a falha é contida. O IOS XR reinicia o processo.
- **Um banco de estado** — um processo reiniciado **retoma** em vez de reconstruir. O SysDB da Arista e o banco distribuído do Junos Evolved funcionam assim, e o do Evolved sobrevive ao processo voltar em outro nó.

O segundo eixo é **imediato versus candidato e commit**. Imediato significa que um erro está em produção. Commit significa que um erro é uma edição abandonada — a diferença entre um incidente e uma tarde.

## Toda entrada lista fraquezas

**Um golden vector garante que nenhuma entrada tenha menos de duas.** Uma entrada sem custo listado é um anúncio, e o leitor teria razão em desconfiar do resto da tabela. Isso inclui as plataformas que o autor deste site ensina e nas quais é autorizado.

A mesma auditoria confere que toda entrada tenha linhagem, ao menos duas forças, e um diferenciador substancial o bastante para dizer algo — ela pegou um campo raso já na primeira execução.

## O que ela não faz

Não é uma matriz de recursos nem um guia de compra. Não acompanha versões atuais, deliberadamente: **versões mudam e arquitetura não**, e uma tabela que envelhecesse a cada trimestre seria pior que tabela nenhuma.

Também não sabe dizer qual comprar. O que sabe dizer é o que cada um vai fazer quando algo quebrar, que é uma pergunta mais duradoura.

## Compartilhar resultado

Abaixo dos fatos do perfil, ou abaixo do título da comparação, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva os sistemas escolhidos depois do `#`, pelos ids: `os` sempre (para o link manter o sentido se o sistema inicial mudar) e `with` quando há um segundo sistema. O popover diz primeiro o que o link leva, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a escolha não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Ao abrir um link.** As duas seleções são preenchidas e a página mostra o perfil ou a comparação, como ao escolher. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
