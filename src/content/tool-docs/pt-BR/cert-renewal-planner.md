## O que faz

Dê à ferramenta as datas de início e de fim de um certificado, seu `notBefore` e seu `notAfter`, e ela deduz as consequências práticas: por quanto tempo o certificado é válido, sob qual fase do cronograma de redução de validade do CA/Browser Forum ele foi emitido e se seu comprimento cabe no limite daquela fase, quantas renovações por ano essa cadência implica, as janelas de reúso para validação de domínio e de identidade naquela era, e um tempo de antecedência recomendado e uma data de "renovar até". É pura aritmética de datas e roda inteiramente offline.

## Por que a validade dos certificados está encolhendo

Os certificados TLS publicamente confiáveis vêm ficando mais curtos há anos, e o ballot SC-081v3 do CA/Browser Forum estabelece um cronograma que reduz a validade máxima de 398 dias, passando por 200 e 100 dias, até 47 dias em 2029. Certificados mais curtos limitam por quanto tempo um certificado comprometido ou emitido por engano continua útil, mas também tornam a renovação manual impraticável, o que é justamente o ponto: o cronograma efetivamente força a automação. Duas janelas relacionadas encolhem junto com a validade: o período pelo qual uma validação de controle de domínio (DCV) pode ser reutilizada, e o período pelo qual informações de identidade validadas (SII) podem ser reutilizadas, de modo que mais do processo precisa ser repetido com mais frequência.

## O que o plano informa

A partir apenas das duas datas, a ferramenta deriva o quadro completo:

- o **comprimento da validade** e a qual fase do SC-081v3 ele corresponde, com um sim ou não claro sobre se o comprimento está dentro do limite daquela fase;
- a **cadência de renovação**, expressa em renovações por ano, tanto para o limite atual quanto para cada limite futuro, para você ver como a carga de trabalho cresce;
- as **janelas de reúso de DCV e SII** que se aplicam à era de emissão; e
- um **tempo de antecedência de renovação recomendado** e a data de "renovar até" resultante, para que uma renovação seja concluída antes da expiração, e não em cima da hora.

## A automação é a verdadeira resposta

Como o ponto final desse cronograma é um certificado de 47 dias, renovar à mão muitas vezes por ano por certificado não escala. A resposta padrão é o protocolo ACME (RFC 8555), a emissão e renovação automatizadas que ferramentas como o certbot usam; os números de cadência do planejador são, na verdade, um argumento para adotá-lo.

## Como usar

Informe as datas `notBefore` e `notAfter` do certificado e leia a validade, o encaixe no cronograma, a cadência de renovação, as janelas de reúso e a data de renovação recomendada. O cálculo é uma função pura dessas duas datas; se um certificado está expirado agora é mostrado separadamente, em relação ao relógio do seu dispositivo.
