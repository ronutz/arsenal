# Explicador de licença F5 BIG-IP

Cole o conteúdo do `/config/bigip.license`, o arquivo completo ou qualquer trecho, e receba uma leitura em linguagem clara do que a licença realmente diz. O parser roda inteiramente no seu navegador: nada é enviado, e valores de chaves ou assinaturas nunca são exibidos, apenas a presença e o tamanho.

## O que ele lê

O explicador decodifica toda a estrutura observável do arquivo. Ele identifica o tipo de gerenciamento: um cabeçalho `BIG-IQ Product License File` junto com os campos `license_manager_key` ou `pool_license_information` marca uma licença gerenciada pelo BIG-IQ License Manager, enquanto um cabeçalho `BIG-IP System License Key File` marca uma licença aplicada diretamente no sistema. Ele lê o bloco de identidade (`Auth vers`, `Usage`, `Vendor`), as datas de licenciamento (`Licensed date` e `Service check date`, ambas na forma compacta `yyyymmdd` do arquivo), a `Registration Key` (verificada contra o formato publicado 5-5-5-5-7 das F5 K7752 e K3782), a `Licensed version` e o `Platform ID` com uma decodificação conservadora (a família Z100 significa BIG-IP Virtual Edition, conforme a F5 K02011230; IDs fora do mapa apontam para a F5 K9476).

Os módulos são lidos a partir da gramática real: cada linha `active module` é separada por pipes em nome do módulo, a chave 7-7 daquele módulo e a lista de recursos, e um arquivo pode ter várias dessas linhas com chaves distintas. As linhas `optional module` listam recursos licenciáveis, porém dormentes até serem licenciados. As linhas repetíveis `Exclusive_version` (a faixa de software permitida, conforme a F5 K42091606), `Deny_version` e `Exclusive_Platform` viram listas de restrições, e cada token de recurso ou limite restante (`perf_VE_throughput_Mbps`, `mod_ltm`, `asm_apps` e os demais) aparece com o valor normalizado: o arquivo usa tanto `enabled` quanto `enable`, e tanto `UNLIMITED` quanto `unlimited`.

## O veredito da K7727

A `Service check date` é julgada contra a tabela de License Check Dates da F5 (K7727) usando a mesma tabela embarcada que a ferramenta F5 service check date usa, então as duas sempre concordam: você vê a versão mais nova que esta licença consegue inicializar e o branch mais próximo que exigiria uma reativação antes.

## Como usar

Cole e leia; o botão Exemplo carrega uma amostra mascarada e fiel à estrutura. Trate o arquivo como sensível: ele carrega sua registration key, as chaves por módulo e as assinaturas Dossier e Authorization. Esta ferramenta nunca exibe esses valores, e como os significados dos campos são documentação de fabricante e não um padrão fixo, confirme decisões de licenciamento na documentação ou no suporte da própria F5.
