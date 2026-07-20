## O que faz

Cole uma string de User-Agent e a ferramenta separa os tokens identificadores que ela carrega - navegador e versão, motor de renderização, sistema operacional e versão, classe de dispositivo e arquitetura de CPU - estima os bits distintivos que cada um contribui e sinaliza se a string está na forma reduzida e congelada que os navegadores modernos agora enviam.

## O ponto que ela mostra

Um User-Agent é um pequeno monte de entropia. Nenhum token isolado identifica você, mas juntos eles estreitam o campo, e quanto mais detalhada a string, mais distintiva ela é. A ferramenta mostra essa superfície com honestidade. Os valores de bits são ilustrativos, extraídos de pesquisa publicada sobre fingerprinting, não uma medição ao vivo de nenhuma população - o objetivo é tornar visível o formato da superfície, não pontuar você.

## Para onde foi o detalhe

Os navegadores modernos congelam o User-Agent: o Chromium fixa a versão menor em 0.0.0 e limita o detalhe de plataforma, e o Safari há muito fixou boa parte da sua string. O detalhe não desapareceu - migrou para os User-Agent Client Hints (Sec-CH-UA e afins), que um site precisa solicitar ativamente pelo cabeçalho Accept-CH. A consequência é que a coleta de alta entropia agora é visível em cabeçalhos, em vez de implícita numa string. Apenas decodifica/explica: a entrada é uma string que você cola, nada é lido do seu próprio navegador e nada é enviado.
