## O que esta ferramenta faz

Ela responde uma pergunta: o tráfego destinado ao endereço traduzido vai de fato alcançar o gateway? Não se a política permite — se o pacote chega.

Essa distinção importa porque a falha usual está uma camada abaixo da base de regras. Se o endereço traduzido fica dentro de uma sub-rede à qual o gateway está diretamente conectado, algum dispositivo vai fazer ARP por ele, e se o gateway não responder, nada é enviado.

## A regra

O **NAT automático** acrescenta a entrada de proxy ARP sozinho na instalação de política, desde que *Automatic ARP configuration* esteja habilitado em Global Properties.

O **NAT manual não.** Nunca fez. O administrador cria a entrada.

**Nenhum dos dois importa** se o endereço traduzido não está numa sub-rede conectada. Nesse caso ninguém no segmento fará ARP por ele, e algo acima precisa roteá-lo — proxy ARP é o lugar errado para procurar.

## A assinatura do diagnóstico

Um NAT estático manual sobre um endereço na própria sub-rede do gateway, sem entrada de proxy ARP, produz um silêncio muito particular. A política instala limpa. A base de regras parece certa. O servidor está saudável.

E não há **nada nos logs do firewall** — nem drop, nem reject. Nada chegou para ser registrado. Uma captura na interface externa mostra requisições ARP sem resposta.

## Um caso que torna "use NAT automático" insuficiente

O NAT automático também não cria nada se *Automatic ARP configuration* estiver desligado em Global Properties. A ferramenta trata essa combinação exatamente como trata uma regra manual, porque o resultado é idêntico.

Se você acrescentar entradas à mão junto das automáticas, *Merge manual proxy ARP configuration* precisa estar habilitado ou elas não coexistirão.

## O que isto deliberadamente não faz

**Não ordena a base de regras de NAT.** Fontes publicadas se contradizem sobre se as regras manuais são avaliadas antes ou depois das automáticas — um guia diz manuais primeiro, outro diz que as camadas automáticas vêm antes — e o próprio guia de administração do Check Point descreve os dois tipos como aplicados de formas diferentes sem resolver a ordem.

Ordená-las significaria escolher um lado e apresentar um palpite como cálculo. O comportamento de proxy ARP é descrito de forma consistente em todo lugar, então é isso que esta ferramenta responde.

## Limites honestos

Uma interface por vez; um gateway com várias interfaces voltadas ao mesmo tráfego é questão de topologia que isto não modela. Apenas IPv4. E ela raciocina sobre alcance na camada 2, não sobre se a política de acesso permite a conexão depois que ela chega.
