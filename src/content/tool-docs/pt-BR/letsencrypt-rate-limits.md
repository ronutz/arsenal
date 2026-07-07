## O que faz

Cole a lista de nomes de host que você pretende colocar em certificados Let's Encrypt, e esta ferramenta os agrupa por **domínio registrado** (eTLD+1) e mostra como eles se encaixam nos limites de emissão da Let's Encrypt. Ela informa a menor quantidade de certificados que o conjunto precisa, sinaliza onde um curinga colapsaria vários subdomínios, e avisa quando uma abordagem ingênua de um certificado por nome excederia o limite semanal por domínio. Tudo roda localmente no seu navegador; nada é enviado para lugar nenhum.

## Por que o domínio registrado importa

O limite principal da Let's Encrypt contabiliza novos certificados contra o **domínio registrado**, não contra cada nome de host. Então `www.example.com`, `api.example.com` e `blog.example.com` consomem todos de um único orçamento semanal sob `example.com`. A ferramenta calcula esse agrupamento com a Public Suffix List, então está correto mesmo para sufixos de múltiplos rótulos: `shop.example.co.uk` e `www.example.co.uk` se agrupam sob `example.co.uk`, com três rótulos de profundidade, não `co.uk`. Errar essa fronteira é o motivo usual pelo qual as pessoas se surpreendem com um erro de limite.

## O que ela calcula

Para cada domínio registrado ela mostra a contagem de nomes pretendidos (contra o limite semanal por domínio), a menor quantidade de certificados necessária se você empacotar até 100 nomes por certificado, e quaisquer **candidatos a curinga**: um pai com dois ou mais subdomínios diretos, que um único nome `*.pai` poderia cobrir. O resumo totaliza os nomes, os domínios registrados distintos e o mínimo de certificados no geral, e levanta um aviso se algum domínio registrado exceder o limite semanal quando emitido um certificado por nome. Entradas de endereço IP são listadas separadamente, já que usam sua própria unidade, e qualquer coisa que não seja um nome de host válido (inclusive um sufixo público puro como `co.uk`) é destacada.

## Os limites que ela usa

Os números mostrados são um instantâneo datado e com fonte dos limites publicados da Let's Encrypt: 50 novos certificados por domínio registrado a cada 7 dias, 300 novos pedidos por conta a cada 3 horas, 5 certificados para o mesmo conjunto exato de nomes a cada 7 dias, e até 100 nomes por certificado. O fato mais útil para planejamento é que **renovações coordenadas por ARI são isentas de todos os limites**, então, uma vez emitido, manter os certificados renovados não é uma preocupação de limite. Como a Let's Encrypt pode mudar esses números, a ferramenta mostra a data do instantâneo e vincula a fonte; verifique essa página para os valores atuais antes de depender de uma margem apertada.
