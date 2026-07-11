## O que faz

Um endereço MAC é um endereço de hardware de 48 bits, normalmente escrito como seis bytes hexadecimais como `00:1b:54:11:22:33`. Os três primeiros bytes são o OUI - o Organizationally Unique Identifier - que a IEEE atribui a um fabricante. Esta ferramenta recebe um MAC (em qualquer formato comum) ou apenas um OUI, consulta o OUI em um snapshot embutido do registro IEEE MA-L para nomear o fabricante, e lê os dois bits significativos do primeiro byte. Tudo roda no seu navegador.

## Os dois bits que importam

O primeiro byte de um MAC carrega dois sinalizadores nos seus bits mais baixos:

- O **bit I/G** (bit menos significativo) é unicast quando 0 e multicast quando 1. Um endereço multicast é um endereço de grupo, não uma única interface.
- O **bit U/L** (segundo bit menos significativo) é universal quando 0 e administrado localmente quando 1. Um endereço de administração universal é globalmente único e vem do OUI de um fabricante; um endereço administrado localmente foi definido por software (um hipervisor, uma interface agregada, um MAC de Wi-Fi aleatorizado) e não tem fabricante.

Assim, `02:...` é administrado localmente (não há fabricante a encontrar) e `01:...` é multicast.

## Formatos aceitos

As formas com dois-pontos (`00:1b:54:...`), hífen (`00-1b-54-...`), ponto no estilo Cisco (`001b.5411.2233`) e sem separadores (`001b5411...`) funcionam, em maiúsculas ou minúsculas, assim como um OUI de seis hex.

## Sobre os dados

Os nomes de fabricantes vêm da listagem pública IEEE MA-L (OUI), embutida aqui como um snapshot pontual. Por ser um snapshot, um bloco atribuído muito recentemente pode ainda não estar presente, e esta versão cobre o registro MA-L (24 bits), não os blocos menores MA-M (28 bits) ou MA-S (36 bits). O snapshot é carregado sob demanda na sua primeira consulta, então abrir a página é rápido e nada é buscado de um servidor no momento da consulta.

## Como usar

Digite ou cole um endereço MAC ou um OUI. Um endereço administrado localmente ou desconhecido é informado com honestidade, em vez de adivinhado.
