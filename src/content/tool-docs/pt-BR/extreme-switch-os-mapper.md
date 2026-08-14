## O que faz

Informe uma série de modelo ou um nome de SO e a ferramenta diz qual nomenclatura se aplica, em quais versões a renomeação entrou, e o que vem junto com aquela série. Os dois pares de nomes aparecem **antes de qualquer entrada**, porque quem chega depois de um documento dizer uma palavra e o switch dizer outra precisa da resposta imediatamente.

## A renomeação, em uma linha cada

- **ExtremeXOS (EXOS) → Switch Engine**, a partir da 31.6
- **VOSS → Fabric Engine**, a partir da 8.6

As duas se aplicam **apenas ao hardware Universal**: 4120, 4220, 5320, 5420, 5520, 5720, 7520, 7720. Qualquer outro mantém os nomes originais, e **os nomes dos arquivos de imagem e os menus de boot também continuam usando os antigos** — então um menu de boot oferecendo mudar o SO "para VOSS" num switch Fabric Engine não é bug nem build desatualizada.

## O aviso que ela sempre dá

**Trocar a persona apaga a configuração.** Na redação da própria Extreme: trocar o sistema operacional de rede apaga todos os arquivos de configuração, informações de debug, logs, eventos e estatísticas do anterior. **É uma reconstrução, não uma migração**, e a ferramenta diz isso em toda consulta, e não só quando um modelo é reconhecido.

Ela também sinaliza que a pergunta do boot é feita na negativa — **N mantém o Switch Engine, Y vai para o Fabric Engine**.

## Ressalvas por série que ela mostra

- **7520**: stacking funciona sob Switch Engine e **não** sob Fabric Engine. Se o projeto precisa de stacking, a escolha da persona já está feita.
- **5420 e 5520**: atualizar para o Switch Engine 31.6 **muda o SysObjectID de SNMP**, então o monitoramento que identifica o equipamento por esse valor deixa de reconhecê-lo — sem que nada pareça errado no console.
- **Os mínimos de Fabric Engine diferem**: 8.6 no 5320, 5420 e 5520; 8.7 no 5720.

## O que ela não faz

Trabalha em nível de série e não por part number individual, deliberadamente: a pergunta de nomenclatura é respondida por série, e uma tabela de SKUs envelheceria mais rápido do que ajudaria. Não conhece o seu inventário nem as suas versões instaladas.
