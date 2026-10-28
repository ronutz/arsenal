# Explicador de métodos SSO do APM

O trabalho do BIG-IP Zero Trust Access (antigo BIG-IP APM - Access Policy Manager) depois da autenticação é continuar autenticando por você, e o capítulo de Single Sign-On Methods define exatamente oito jeitos de fazer isso: HTTP Basic, NTLMv1, NTLMv2, Kerberos com delegação restrita, Form Based, Forms - Client Initiated, OAuth Bearer e SAML. Esta ferramenta renderiza cada um como um cartão com seu mecanismo, seu encanamento de credenciais, seus pré-requisitos e suas peculiaridades, tudo condensado fielmente do capítulo e dos guias específicos de cada método.

O veredito em cada cartão é o próprio parágrafo de raio de explosão do capítulo, e ele é a manchete operacional: um objeto SSO mal configurado de HTTP Basic, NTLMv1, NTLMv2, Kerberos, OAuth Bearer ou SAML pode desabilitar o SSO de todos os métodos de autenticação naquela sessão do usuário. Form Based e Forms - Client Initiated são os únicos dois métodos que não são desabilitados quando o objeto de outro método quebra. Uma configuração Kerberos SSO ruim e toda aplicação da sessão pode perder seu SSO; uma configuração de formulário ruim e só aquela aplicação perde. Essa assimetria decide o cuidado que cada classe de objeto merece.

O cartão do Kerberos carrega a lista completa de pré-requisitos: uma conta de delegação no Active Directory por realm de servidor, seu SPN inserido como Account Name em formato SPN, o realm em maiúsculas, Resource-Based Constrained Delegation para ambientes multi-realm, e a linha do próprio manual, que vale emoldurar: o Kerberos SSO do APM não precisa nem usa um arquivo keytab. Suas portas de entrada naturais são os métodos em que a senha nunca viaja em texto claro, certificados de cliente e NTLM entre os exemplos do próprio capítulo. O NTLMv2 carrega a peculiaridade documentada de que um 401 com mais de um header WWW-Authenticate: NTLM faz o SSO falhar, comportamento esperado segundo o manual. O Forms - Client Initiated carrega o detalhe mais engenhoso do seu desenho: o JavaScript que o APM insere atribui ao parâmetro de senha um token em vez da senha real, então a credencial nunca fica na página.

A nota de encanamento em cada consulta amarra os métodos à maquinaria: agentes da access policy populam as variáveis de sessão que o SSO consome, sendo a fiação clássica uma Logon Page seguida de SSO Credential Mapping, alimentando session.logon.last.* em session.sso.token.last.*.

Tudo roda localmente; nada do que você digita sai da página.

## Compartilhar resultado

No topo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o nome do método como foi digitado depois do `#`, e mais nada. O popover dele diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Esta página não recebe configuração de SSO nenhuma: ela lê um nome da sua tabela de oito métodos, ou `methods`, e recusa qualquer outra coisa. Só há link para um nome que ela lê, e um link que chega só é aceito nesse mesmo caso, então nem um objeto de SSO nem uma credencial conseguem viajar num link.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado e a página o lê; nada é enviado a lugar nenhum. O valor então sai do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
