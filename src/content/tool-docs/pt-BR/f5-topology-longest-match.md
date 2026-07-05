# Pontuador longest-match de topologia GTM

O folclore diz que a correspondência mais longa vence. A documentação diz algo mais afiado: Longest Match é uma ordenação da lista de registros, e as pontuações decidem. Esta ferramenta computa tudo do jeito que o BIG-IP DNS (antigo GTM - Global Traffic Manager) computa.

Cole registros `gtm topology` (como o tmsh os imprime: `gtm topology ldns: <origem> server: <destino> { score N }`, com negação `not` suportada em ambos os lados), estrofes `gtm region` opcionais (membros positivos; regiões aninhadas resolvem), uma linha `source` declarando os atributos do LDNS a avaliar (`ip=`, `country=`, `continent=`, `isp=`, `region=`), e opcionalmente uma linha `candidates` nomeando os destinos a pontuar (caso contrário os destinos pool e datacenter dos registros viram os candidatos).

A saída mostra os registros na ordem do Longest Match, cada um com sua justificativa de posição: o balde de negação (entradas simples acima de negações do lado servidor, acima de negações do lado LDNS, acima de curingas, conforme o K10721), a escada de tipos (subnets pela máscara mais longa, depois datacenter e pool, region, ISP, país, continente) e o peso. Tipos que as fontes não classificam são colocados depois da escada verificada e sinalizados, nunca adivinhados.

Depois, a caminhada de pontuação: cada candidato recebe sua pontuação do primeiro registro da lista ordenada que o corresponde, e registros posteriores para aquele candidato são marcados como sombreados. O candidato com a maior pontuação vence; pontuações máximas iguais fazem round robin. E é por isso que um curinga carregando peso 100 realmente vence um /32 carregando peso 5, e a ferramenta mostra exatamente onde isso acontece.

Sem uma linha `source`, a lista ordenada é exibida sozinha. Tudo roda localmente; nada do que você cola sai da página.
