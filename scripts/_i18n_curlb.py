#!/usr/bin/env python3
# ============================================================================
# scripts/_i18n_curlb.py
# ----------------------------------------------------------------------------
# One-shot injector: adds the tools.curl-command-builder namespace to en.json
# and pt-BR.json (native copy in both, per the standing i18n rule; the other
# 14 locales serve English per-key fallback until translated). Additions-only,
# OrderedDict-preserving, ensure_ascii=False, trailing newline.
# ============================================================================
import json, io
from collections import OrderedDict

SLUG = "curl-command-builder"

EN = OrderedDict([
  ("name", "curl command builder"),
  ("blurb", "Pick any of the 27 protocols curl speaks, fill in protocol-aware fields, and get the exact command with every flag explained and safety warnings surfaced. The inverse of the HTTP request translator: that one reads a command, this one writes it."),
  ("ui", OrderedDict([
    ("group_web", "Web"), ("group_transfer", "File transfer"), ("group_mail", "Mail"),
    ("group_messaging", "Messaging"), ("group_lookup", "Lookup and legacy"),
    ("portDefault", "default port"), ("example", "Example"), ("clear", "Clear"),
    ("sec_target", "Target"), ("sec_request", "Request"), ("sec_auth", "Credentials"),
    ("sec_mail", "Mail envelope"), ("sec_transfer", "Transfer"),
    ("sec_connection", "Connection, TLS and timing"), ("sec_behavior", "Behavior and output"),
    ("host", "Host"), ("port", "Port"),
    ("pathUrl", "Path"), ("pathRemote", "Remote path"), ("pathTopic", "Topic"),
    ("pathMailbox", "Mailbox"), ("pathWord", "Lookup (d:word)"), ("pathLocal", "Local file path"),
    ("pathShare", "Share and path"),
    ("method", "Method"), ("httpVersion", "HTTP version"), ("httpAuto", "Negotiate (default)"),
    ("headers", "Headers"), ("headerName", "Name"), ("headerValue", "Value"),
    ("add", "Add"), ("remove", "Remove"),
    ("data", "Body data (-d)"), ("dataUrlencode", "URL-encode the data (--data-urlencode)"),
    ("form", "Multipart form fields (-F)"), ("formFile", "file (@)"),
    ("user", "User"), ("pass", "Password"),
    ("passNote", "Leaving the password empty makes curl prompt for it at run time, keeping it out of your shell history."),
    ("mailFrom", "Envelope sender (--mail-from)"), ("mailRcpt", "Recipients, comma-separated (--mail-rcpt)"),
    ("upload", "Upload local file (-T)"), ("output", "Save response"),
    ("outStdout", "To the terminal"), ("outRemote", "Remote file name (-O)"), ("outFile", "Named file (-o)"),
    ("outFileName", "Output file name"), ("listOnly", "Names-only listing (-l)"),
    ("proxy", "Proxy (-x)"), ("resolve", "Pin DNS (--resolve)"), ("cacert", "CA bundle (--cacert)"),
    ("insecure", "Skip TLS verification (-k), with a warning"),
    ("connectTimeout", "Connect timeout, s"), ("maxTime", "Max total time, s"), ("retry", "Retries"),
    ("cookie", "Send cookie (-b)"), ("cookieJar", "Save cookies to (-c)"), ("userAgent", "User-Agent (-A)"),
    ("followRedirects", "Follow redirects (-L)"), ("compressed", "Ask for compression (--compressed)"),
    ("include", "Include response headers (-i)"), ("verbose", "Verbose (-v)"), ("silent", "Silent (-s)"),
    ("preview", "Your command"), ("copyPretty", "Copy"), ("copyLine", "Copy one-line"), ("copied", "Copied"),
    ("partsTitle", "Every flag, explained"),
    ("err_host", "Enter a host to build the command."),
    ("err_path", "Enter a local file path for the file:// URL."),
    ("err_protocol", "Pick a protocol."),
    ("windowsNote", "Quoting targets POSIX shells (bash, zsh). cmd.exe and PowerShell quote differently; run these as written in Git Bash or WSL."),
    ("privacy", "Runs entirely in your browser. Nothing you type is sent anywhere and no request is ever executed."),
  ])),
  ("tls", OrderedDict([
    ("clear", "cleartext"), ("tls", "TLS"), ("upgrade", "cleartext, can upgrade to TLS"),
  ])),
  ("proto", OrderedDict([
    ("http", OrderedDict([("name", "HTTP"), ("desc", "The web's transfer protocol. curl speaks HTTP/0.9 through HTTP/3 and gives you full control over method, headers, body, cookies, and authentication.")])),
    ("https", OrderedDict([("name", "HTTPS"), ("desc", "HTTP inside TLS: the same request model with the transport encrypted and the server authenticated by certificate.")])),
    ("ws", OrderedDict([("name", "WebSocket"), ("desc", "A bidirectional, TCP-like channel set up over a plain HTTP request. The ws scheme is the cleartext flavor.")])),
    ("wss", OrderedDict([("name", "WebSocket Secure"), ("desc", "The same bidirectional WebSocket channel established over HTTPS, so the whole session runs inside TLS.")])),
    ("ftp", OrderedDict([("name", "FTP"), ("desc", "The classic File Transfer Protocol: downloads, uploads, and directory listings. Starts in cleartext; the session can upgrade to TLS.")])),
    ("ftps", OrderedDict([("name", "FTPS"), ("desc", "FTP with an implicit TLS layer from the first byte. Historically awkward through firewalls because of its separate data connections.")])),
    ("sftp", OrderedDict([("name", "SFTP"), ("desc", "The SSH File Transfer Protocol carried over SSH version 2: one encrypted connection for both commands and data.")])),
    ("scp", OrderedDict([("name", "SCP"), ("desc", "The classic SSH copy protocol over SSH version 2. Plain file-copy semantics; SFTP is the richer sibling.")])),
    ("tftp", OrderedDict([("name", "TFTP"), ("desc", "Trivial FTP over UDP: tiny, unauthenticated, cleartext by design. The firmware and network-boot workhorse.")])),
    ("smb", OrderedDict([("name", "SMB"), ("desc", "Windows file sharing. curl supports SMB version 1 for uploading and downloading files on a share.")])),
    ("smbs", OrderedDict([("name", "SMBS"), ("desc", "SMB wrapped in TLS: the same version 1 file semantics with the transport encrypted.")])),
    ("file", OrderedDict([("name", "Local file"), ("desc", "Local file access through a URL, no network at all. Handy for testing pipelines with real curl syntax.")])),
    ("smtp", OrderedDict([("name", "SMTP"), ("desc", "Mail submission: uploading a message to an SMTP server means sending it. The envelope sender and recipients are set with dedicated flags.")])),
    ("smtps", OrderedDict([("name", "SMTPS"), ("desc", "SMTP with implicit TLS from the first byte, conventionally on port 465.")])),
    ("pop3", OrderedDict([("name", "POP3"), ("desc", "Retrieve mail from a POP3 server: downloading means fetching a message. Starts cleartext and can upgrade with STLS.")])),
    ("pop3s", OrderedDict([("name", "POP3S"), ("desc", "POP3 inside implicit TLS on port 995.")])),
    ("imap", OrderedDict([("name", "IMAP"), ("desc", "Read mail and mailboxes on an IMAP server; the URL selects the mailbox and message. Starts cleartext, can upgrade to TLS.")])),
    ("imaps", OrderedDict([("name", "IMAPS"), ("desc", "IMAP inside implicit TLS on port 993.")])),
    ("mqtt", OrderedDict([("name", "MQTT"), ("desc", "The IoT publish-subscribe protocol, version 3. Downloading a topic subscribes to it; posting data publishes on it.")])),
    ("mqtts", OrderedDict([("name", "MQTTS"), ("desc", "MQTT carried inside TLS, conventionally on port 8883.")])),
    ("ldap", OrderedDict([("name", "LDAP"), ("desc", "Directory lookups: the URL encodes the base DN, attributes, scope, and filter in one line.")])),
    ("ldaps", OrderedDict([("name", "LDAPS"), ("desc", "LDAP inside implicit TLS on port 636.")])),
    ("dict", OrderedDict([("name", "DICT"), ("desc", "The dictionary server protocol: a URL like /d:word looks the word up on the server.")])),
    ("gopher", OrderedDict([("name", "Gopher"), ("desc", "The pre-web document protocol, still alive in niches. Retrieves menus and documents.")])),
    ("gophers", OrderedDict([("name", "GopherS"), ("desc", "Gopher over TLS, a modern extension to the old protocol.")])),
    ("rtsp", OrderedDict([("name", "RTSP"), ("desc", "The Real Time Streaming Protocol: curl supports RTSP 1.0 downloads for talking to streaming media servers.")])),
    ("telnet", OrderedDict([("name", "Telnet"), ("desc", "An interactive cleartext session: curl sends what it reads on stdin and prints what the server returns. Useful for poking raw TCP services.")])),
  ])),
  ("opt", OrderedDict([
    ("headOnly", "-I asks for headers only (a HEAD request); no body is transferred."),
    ("method", "-X sets the request method explicitly; curl only needs it when the method cannot be inferred."),
    ("httpVersion", "Pins the HTTP version instead of letting curl negotiate one."),
    ("header", "-H adds one request header exactly as written."),
    ("user", "-u sends credentials; with no password given, curl prompts for it."),
    ("data", "-d sends this data as the request body: on HTTP it implies POST, on MQTT it publishes to the topic."),
    ("dataUrlencode", "--data-urlencode sends the data URL-encoded, safe for arbitrary characters."),
    ("form", "-F builds a multipart/form-data body; a leading @ uploads the file at that path."),
    ("upload", "-T uploads the given local file to the URL (PUT on HTTP, STOR on FTP, the message on SMTP)."),
    ("mailFrom", "--mail-from sets the SMTP envelope sender."),
    ("mailRcpt", "--mail-rcpt adds one SMTP envelope recipient."),
    ("cookie", "-b sends the given cookie string, or reads cookies from a file."),
    ("cookieJar", "-c writes the cookies received during the transfer to this file."),
    ("userAgent", "-A sets the User-Agent string."),
    ("proxy", "-x sends the transfer through this proxy."),
    ("resolve", "--resolve pins host:port to a specific address, bypassing DNS for that name."),
    ("cacert", "--cacert verifies the server against this CA bundle instead of the system store."),
    ("insecure", "-k skips TLS certificate verification entirely."),
    ("connectTimeout", "--connect-timeout caps how long establishing the connection may take, in seconds."),
    ("maxTime", "--max-time caps the whole transfer duration, in seconds."),
    ("retry", "--retry retries a transient failure this many times, with backoff."),
    ("followRedirects", "-L follows HTTP redirects to the final location."),
    ("compressed", "--compressed asks for a compressed response and transparently decompresses it."),
    ("listOnly", "-l asks for a names-only listing (FTP directory or mailbox)."),
    ("outputRemote", "-O saves the download under its remote file name."),
    ("outputFile", "-o saves the download to the given file name."),
    ("include", "-i includes the response headers in the output."),
    ("verbose", "-v narrates the whole exchange, including connection and TLS details."),
    ("silent", "-s silences the progress meter and error output."),
  ])),
  ("warn", OrderedDict([
    ("insecure", "-k disables TLS certificate verification: the connection is encrypted but the peer is not authenticated. Fine against a lab box, dangerous anywhere else."),
    ("cleartext", "This protocol starts in cleartext: everything, including any credentials, crosses the network unencrypted unless the session upgrades to TLS."),
    ("passOnCli", "The password is part of the command line: it can land in shell history and show in the process list. Prefer -u user alone and let curl prompt, or use a .netrc file."),
    ("dataDefaultCt", "With -d and no Content-Type header, curl sends application/x-www-form-urlencoded. If this body is JSON, add a Content-Type: application/json header."),
    ("considerSslReqd", "This protocol can upgrade to TLS (STARTTLS style). Consider adding --ssl-reqd so the transfer fails rather than continue in cleartext."),
    ("telnetInteractive", "telnet: opens an interactive session; curl sends what it reads on stdin and prints what the server returns."),
    ("smbV1", "curl speaks SMB version 1, which many modern servers disable. Expect this to work mainly against legacy shares."),
  ])),
])

PT = OrderedDict([
  ("name", "Construtor de comandos curl"),
  ("blurb", "Escolha qualquer um dos 27 protocolos que o curl fala, preencha campos que se adaptam ao protocolo e receba o comando exato, com cada flag explicada e avisos de segurança. O inverso do tradutor de requisições HTTP: aquele lê um comando, este escreve um."),
  ("ui", OrderedDict([
    ("group_web", "Web"), ("group_transfer", "Transferência de arquivos"), ("group_mail", "E-mail"),
    ("group_messaging", "Mensageria"), ("group_lookup", "Consulta e legado"),
    ("portDefault", "porta padrão"), ("example", "Exemplo"), ("clear", "Limpar"),
    ("sec_target", "Destino"), ("sec_request", "Requisição"), ("sec_auth", "Credenciais"),
    ("sec_mail", "Envelope de e-mail"), ("sec_transfer", "Transferência"),
    ("sec_connection", "Conexão, TLS e tempo"), ("sec_behavior", "Comportamento e saída"),
    ("host", "Host"), ("port", "Porta"),
    ("pathUrl", "Caminho"), ("pathRemote", "Caminho remoto"), ("pathTopic", "Tópico"),
    ("pathMailbox", "Caixa de correio"), ("pathWord", "Consulta (d:palavra)"), ("pathLocal", "Caminho do arquivo local"),
    ("pathShare", "Compartilhamento e caminho"),
    ("method", "Método"), ("httpVersion", "Versão HTTP"), ("httpAuto", "Negociar (padrão)"),
    ("headers", "Cabeçalhos"), ("headerName", "Nome"), ("headerValue", "Valor"),
    ("add", "Adicionar"), ("remove", "Remover"),
    ("data", "Corpo da requisição (-d)"), ("dataUrlencode", "Codificar como URL (--data-urlencode)"),
    ("form", "Campos multipart (-F)"), ("formFile", "arquivo (@)"),
    ("user", "Usuário"), ("pass", "Senha"),
    ("passNote", "Deixar a senha vazia faz o curl perguntar na hora de executar, mantendo-a fora do histórico do shell."),
    ("mailFrom", "Remetente do envelope (--mail-from)"), ("mailRcpt", "Destinatários, separados por vírgula (--mail-rcpt)"),
    ("upload", "Enviar arquivo local (-T)"), ("output", "Salvar resposta"),
    ("outStdout", "No terminal"), ("outRemote", "Nome remoto do arquivo (-O)"), ("outFile", "Arquivo nomeado (-o)"),
    ("outFileName", "Nome do arquivo de saída"), ("listOnly", "Listagem só de nomes (-l)"),
    ("proxy", "Proxy (-x)"), ("resolve", "Fixar DNS (--resolve)"), ("cacert", "Bundle de CA (--cacert)"),
    ("insecure", "Pular verificação TLS (-k), com aviso"),
    ("connectTimeout", "Timeout de conexão, s"), ("maxTime", "Tempo total máximo, s"), ("retry", "Tentativas"),
    ("cookie", "Enviar cookie (-b)"), ("cookieJar", "Salvar cookies em (-c)"), ("userAgent", "User-Agent (-A)"),
    ("followRedirects", "Seguir redirecionamentos (-L)"), ("compressed", "Pedir compressão (--compressed)"),
    ("include", "Incluir cabeçalhos da resposta (-i)"), ("verbose", "Verboso (-v)"), ("silent", "Silencioso (-s)"),
    ("preview", "Seu comando"), ("copyPretty", "Copiar"), ("copyLine", "Copiar em uma linha"), ("copied", "Copiado"),
    ("partsTitle", "Cada flag, explicada"),
    ("err_host", "Informe um host para montar o comando."),
    ("err_path", "Informe o caminho de um arquivo local para a URL file://."),
    ("err_protocol", "Escolha um protocolo."),
    ("windowsNote", "As aspas seguem shells POSIX (bash, zsh). O cmd.exe e o PowerShell usam regras diferentes; execute como está no Git Bash ou no WSL."),
    ("privacy", "Roda inteiramente no seu navegador. Nada do que você digita é enviado e nenhuma requisição é executada."),
  ])),
  ("tls", OrderedDict([
    ("clear", "texto claro"), ("tls", "TLS"), ("upgrade", "texto claro, pode subir para TLS"),
  ])),
  ("proto", OrderedDict([
    ("http", OrderedDict([("name", "HTTP"), ("desc", "O protocolo de transferência da web. O curl fala de HTTP/0.9 a HTTP/3 e dá controle total sobre método, cabeçalhos, corpo, cookies e autenticação.")])),
    ("https", OrderedDict([("name", "HTTPS"), ("desc", "HTTP dentro de TLS: o mesmo modelo de requisição com o transporte cifrado e o servidor autenticado por certificado.")])),
    ("ws", OrderedDict([("name", "WebSocket"), ("desc", "Um canal bidirecional, parecido com TCP, estabelecido sobre uma requisição HTTP comum. O esquema ws é a variante em texto claro.")])),
    ("wss", OrderedDict([("name", "WebSocket Secure"), ("desc", "O mesmo canal WebSocket bidirecional estabelecido sobre HTTPS, com toda a sessão dentro de TLS.")])),
    ("ftp", OrderedDict([("name", "FTP"), ("desc", "O clássico File Transfer Protocol: download, upload e listagem de diretórios. Começa em texto claro; a sessão pode subir para TLS.")])),
    ("ftps", OrderedDict([("name", "FTPS"), ("desc", "FTP com camada TLS implícita desde o primeiro byte. Historicamente complicado atrás de firewalls por causa das conexões de dados separadas.")])),
    ("sftp", OrderedDict([("name", "SFTP"), ("desc", "O SSH File Transfer Protocol sobre SSH versão 2: uma única conexão cifrada para comandos e dados.")])),
    ("scp", OrderedDict([("name", "SCP"), ("desc", "O protocolo clássico de cópia do SSH, sobre SSH versão 2. Semântica simples de cópia de arquivos; o SFTP é o irmão mais completo.")])),
    ("tftp", OrderedDict([("name", "TFTP"), ("desc", "FTP trivial sobre UDP: minúsculo, sem autenticação, texto claro por definição. O burro de carga de firmware e boot de rede.")])),
    ("smb", OrderedDict([("name", "SMB"), ("desc", "Compartilhamento de arquivos do Windows. O curl suporta SMB versão 1 para enviar e baixar arquivos de um compartilhamento.")])),
    ("smbs", OrderedDict([("name", "SMBS"), ("desc", "SMB embrulhado em TLS: a mesma semântica da versão 1 com o transporte cifrado.")])),
    ("file", OrderedDict([("name", "Arquivo local"), ("desc", "Acesso a arquivo local via URL, sem rede nenhuma. Útil para testar pipelines com sintaxe real de curl.")])),
    ("smtp", OrderedDict([("name", "SMTP"), ("desc", "Envio de e-mail: fazer upload de uma mensagem para um servidor SMTP significa enviá-la. Remetente e destinatários do envelope têm flags próprias.")])),
    ("smtps", OrderedDict([("name", "SMTPS"), ("desc", "SMTP com TLS implícito desde o primeiro byte, convencionalmente na porta 465.")])),
    ("pop3", OrderedDict([("name", "POP3"), ("desc", "Busca de e-mail em um servidor POP3: baixar significa buscar uma mensagem. Começa em texto claro e pode subir com STLS.")])),
    ("pop3s", OrderedDict([("name", "POP3S"), ("desc", "POP3 dentro de TLS implícito na porta 995.")])),
    ("imap", OrderedDict([("name", "IMAP"), ("desc", "Leitura de e-mail e caixas em um servidor IMAP; a URL seleciona a caixa e a mensagem. Começa em texto claro, pode subir para TLS.")])),
    ("imaps", OrderedDict([("name", "IMAPS"), ("desc", "IMAP dentro de TLS implícito na porta 993.")])),
    ("mqtt", OrderedDict([("name", "MQTT"), ("desc", "O protocolo publish-subscribe de IoT, versão 3. Baixar um tópico é assinar; postar dados é publicar nele.")])),
    ("mqtts", OrderedDict([("name", "MQTTS"), ("desc", "MQTT dentro de TLS, convencionalmente na porta 8883.")])),
    ("ldap", OrderedDict([("name", "LDAP"), ("desc", "Consultas de diretório: a URL codifica DN base, atributos, escopo e filtro em uma linha só.")])),
    ("ldaps", OrderedDict([("name", "LDAPS"), ("desc", "LDAP dentro de TLS implícito na porta 636.")])),
    ("dict", OrderedDict([("name", "DICT"), ("desc", "O protocolo de servidores de dicionário: uma URL como /d:palavra consulta a palavra no servidor.")])),
    ("gopher", OrderedDict([("name", "Gopher"), ("desc", "O protocolo de documentos anterior à web, ainda vivo em nichos. Recupera menus e documentos.")])),
    ("gophers", OrderedDict([("name", "GopherS"), ("desc", "Gopher sobre TLS, uma extensão moderna do protocolo antigo.")])),
    ("rtsp", OrderedDict([("name", "RTSP"), ("desc", "O Real Time Streaming Protocol: o curl suporta downloads RTSP 1.0 para conversar com servidores de mídia.")])),
    ("telnet", OrderedDict([("name", "Telnet"), ("desc", "Uma sessão interativa em texto claro: o curl envia o que lê do stdin e imprime o que o servidor responde. Útil para cutucar serviços TCP crus.")])),
  ])),
  ("opt", OrderedDict([
    ("headOnly", "-I pede apenas os cabeçalhos (requisição HEAD); nenhum corpo é transferido."),
    ("method", "-X define o método explicitamente; o curl só precisa disso quando não dá para inferir."),
    ("httpVersion", "Fixa a versão HTTP em vez de deixar o curl negociar."),
    ("header", "-H adiciona um cabeçalho exatamente como escrito."),
    ("user", "-u envia credenciais; sem senha, o curl pergunta na hora."),
    ("data", "-d envia estes dados como corpo: em HTTP implica POST, em MQTT publica no tópico."),
    ("dataUrlencode", "--data-urlencode envia os dados codificados como URL, seguro para caracteres arbitrários."),
    ("form", "-F monta um corpo multipart/form-data; um @ no início envia o arquivo daquele caminho."),
    ("upload", "-T envia o arquivo local para a URL (PUT em HTTP, STOR em FTP, a mensagem em SMTP)."),
    ("mailFrom", "--mail-from define o remetente do envelope SMTP."),
    ("mailRcpt", "--mail-rcpt adiciona um destinatário ao envelope SMTP."),
    ("cookie", "-b envia o cookie informado, ou lê cookies de um arquivo."),
    ("cookieJar", "-c grava neste arquivo os cookies recebidos na transferência."),
    ("userAgent", "-A define o User-Agent."),
    ("proxy", "-x faz a transferência passar por este proxy."),
    ("resolve", "--resolve fixa host:porta em um endereço, ignorando o DNS para aquele nome."),
    ("cacert", "--cacert valida o servidor contra este bundle de CA em vez do repositório do sistema."),
    ("insecure", "-k pula completamente a verificação do certificado TLS."),
    ("connectTimeout", "--connect-timeout limita o tempo para estabelecer a conexão, em segundos."),
    ("maxTime", "--max-time limita a duração total da transferência, em segundos."),
    ("retry", "--retry repete uma falha transitória esta quantidade de vezes, com backoff."),
    ("followRedirects", "-L segue redirecionamentos HTTP até o destino final."),
    ("compressed", "--compressed pede resposta comprimida e descomprime de forma transparente."),
    ("listOnly", "-l pede uma listagem só com nomes (diretório FTP ou caixa de correio)."),
    ("outputRemote", "-O salva o download com o nome remoto do arquivo."),
    ("outputFile", "-o salva o download com o nome informado."),
    ("include", "-i inclui os cabeçalhos da resposta na saída."),
    ("verbose", "-v narra toda a conversa, incluindo detalhes de conexão e TLS."),
    ("silent", "-s silencia o medidor de progresso e as mensagens de erro."),
  ])),
  ("warn", OrderedDict([
    ("insecure", "-k desliga a verificação do certificado TLS: a conexão fica cifrada, mas o servidor não é autenticado. Aceitável contra uma máquina de laboratório, perigoso em qualquer outro lugar."),
    ("cleartext", "Este protocolo começa em texto claro: tudo, inclusive credenciais, cruza a rede sem cifra a menos que a sessão suba para TLS."),
    ("passOnCli", "A senha faz parte da linha de comando: pode parar no histórico do shell e aparecer na lista de processos. Prefira -u usuário sozinho e deixe o curl perguntar, ou use um arquivo .netrc."),
    ("dataDefaultCt", "Com -d e sem cabeçalho Content-Type, o curl envia application/x-www-form-urlencoded. Se o corpo é JSON, adicione um cabeçalho Content-Type: application/json."),
    ("considerSslReqd", "Este protocolo pode subir para TLS (estilo STARTTLS). Considere adicionar --ssl-reqd para a transferência falhar em vez de continuar em texto claro."),
    ("telnetInteractive", "telnet: abre uma sessão interativa; o curl envia o que lê do stdin e imprime o que o servidor responde."),
    ("smbV1", "O curl fala SMB versão 1, que muitos servidores modernos desabilitam. Espere funcionar principalmente contra compartilhamentos legados."),
  ])),
])

def inject(path, ns):
    with io.open(path, encoding="utf-8") as f:
        d = json.load(f, object_pairs_hook=OrderedDict)
    tools = d["tools"]
    if SLUG in tools:
        print(path, ": already present, skipping")
        return
    # Insert in alphabetical position among the existing tool keys.
    out = OrderedDict(); done = False
    for k, v in tools.items():
        if not done and k > SLUG:
            out[SLUG] = ns; done = True
        out[k] = v
    if not done:
        out[SLUG] = ns
    d["tools"] = out
    with io.open(path, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(path, ": injected", SLUG)

inject("src/i18n/messages/en.json", EN)
inject("src/i18n/messages/pt-BR.json", PT)
