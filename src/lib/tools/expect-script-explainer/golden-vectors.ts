// ============================================================================
// src/lib/tools/expect-script-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Expect script explainer
// (set "expect-script-explainer-golden-2026-10-05").
//
// Each vector is an Expect script. The pinned fields are every finding (rule,
// severity, line, parameters), the counts, the programs spawned, the dialogue,
// the timeout in force at the first expect, whether the script hands control to
// the user, whether it waits for eof, the command count and the syntax error.
//
// Expected values were captured from compute.run() on 2026-10-05. The scripts
// were written for the vectors against expect(1) (Expect version 5, read
// 2026-10-05); where a vector states a fact about Expect, the rule's message cites
// the manual.
// ============================================================================

import { run, type ExpectResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "expect-script-explainer-golden-2026-10-05";

/** The fields a vector pins. */
export type ExpectPinned = {
  // Each finding as [rule, severity, line, params as JSON or ""].
  findings: (string | number)[][];
  // The counts.
  counts: ExpectResult["counts"];
  // The programs spawned.
  spawned: string[];
  // The dialogue.
  dialogue: ExpectResult["dialogue"];
  // The timeout at the first expect.
  timeoutAtFirstExpect: string;
  // interact seen.
  interactive: boolean;
  // eof waited for.
  waitsForEof: boolean;
  // Commands explained.
  commandCount: number;
  // The syntax error, or null.
  syntaxError: ExpectResult["syntaxError"];
};

/** One vector: a name, an input, and the pinned fields of its result. */
export interface ExpectVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: { script: string };
  // The pinned fields of the result.
  expect: ExpectPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: ExpectResult): ExpectPinned {
  // Each finding as a compact row: rule, severity, line, parameters.
  const findings = r.findings.map((f) => [f.rule, f.severity, f.line, f.params ? JSON.stringify(f.params) : ""]);
  // The pinned fields.
  return { findings, counts: r.counts, spawned: r.spawned, dialogue: r.dialogue, timeoutAtFirstExpect: r.timeoutAtFirstExpect, interactive: r.interactive, waitsForEof: r.waitsForEof, commandCount: r.commandCount, syntaxError: r.syntaxError };
}

/** The vectors. */
export const VECTORS: ExpectVector[] = [
  // A sound script: argv for the secrets, a timeout, a host-key answer, eof at the end; two expects without a timeout handler remain.
  {
    id: "ssh-show-version",
    input: { script: "#!/usr/bin/expect -f\n# Log in to a switch over SSH, run one command, read the answer.\nset host [lindex $argv 0]\nset user [lindex $argv 1]\nset password [lindex $argv 2]\nset timeout 20\n\nspawn ssh -o StrictHostKeyChecking=no $user@$host\nexpect {\n    -re \"\\\\(yes/no.*\\\\)\\\\?\" { send \"yes\\r\"; exp_continue }\n    -nocase \"password:\" { send \"$password\\r\" }\n    timeout { puts \"No prompt from $host\"; exit 1 }\n}\nexpect -re {[>#]\\s*$}\nsend \"show version\\r\"\nexpect -re {[>#]\\s*$}\nset output $expect_out(buffer)\nsend \"exit\\r\"\nexpect eof\nputs $output\n" },
    expect: {"findings":[["E7","info",9,"{\"count\":2}"]],"counts":{"error":0,"warning":0,"info":1},"spawned":["ssh"],"dialogue":[{"line":9,"waitsFor":["\\(yes/no.*\\)\\?","password:","timeout"],"thenSends":"yes\\r"},{"line":14,"waitsFor":["[>#]\\s*$"],"thenSends":"show version\\r"},{"line":16,"waitsFor":["[>#]\\s*$"],"thenSends":"exit\\r"},{"line":19,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"20","interactive":false,"waitsForEof":true,"commandCount":18,"syntaxError":null},
  },
  // The classic: a password typed in clear, no timeout set, one-character prompts, and the script ends on a send.
  {
    id: "telnet-hardcoded",
    input: { script: "#!/usr/bin/expect\nspawn telnet 10.0.0.1\nexpect \"login:\"\nsend \"admin\\r\"\nexpect \"Password:\"\nsend \"Cisco123\\r\"\nexpect \">\"\nsend \"terminal length 0\\r\"\nexpect \">\"\nsend \"show running-config\\r\"\n" },
    expect: {"findings":[["E2","info",3,"{\"what\":\"default\"}"],["E7","info",3,"{\"count\":4}"],["E1","error",6,"{\"what\":\"send\",\"preview\":\"••••••••\"}"],["E3","info",7,"{\"what\":\"short\",\"pattern\":\">\"}"],["E3","info",9,"{\"what\":\"short\",\"pattern\":\">\"}"],["E4","warning",10,""]],"counts":{"error":1,"warning":1,"info":4},"spawned":["telnet"],"dialogue":[{"line":3,"waitsFor":["login:"],"thenSends":"admin\\r"},{"line":5,"waitsFor":["Password:"],"thenSends":"••••••••"},{"line":7,"waitsFor":[">"],"thenSends":"terminal length 0\\r"},{"line":9,"waitsFor":[">"],"thenSends":"show running-config\\r"}],"timeoutAtFirstExpect":"default","interactive":false,"waitsForEof":false,"commandCount":9,"syntaxError":null},
  },
  // set timeout -1: the script can wait forever.
  {
    id: "infinite-timeout",
    input: { script: "set timeout -1\nspawn ./backup.sh\nexpect \"Done.\"\nsend \"\\r\"\nexpect eof\n" },
    expect: {"findings":[["E2","warning",1,"{\"what\":\"infinite\"}"],["E7","info",3,"{\"count\":1}"]],"counts":{"error":0,"warning":1,"info":1},"spawned":["./backup.sh"],"dialogue":[{"line":3,"waitsFor":["Done."],"thenSends":"\\r"},{"line":5,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"infinite","interactive":false,"waitsForEof":true,"commandCount":5,"syntaxError":null},
  },
  // expect "*" flushes the buffer without waiting; expect "$" is a one-character prompt.
  {
    id: "broad-pattern",
    input: { script: "spawn ftp files.example.net\nexpect \"*\"\nsend \"anonymous\\r\"\nexpect \"$\"\nsend \"bye\\r\"\nexpect eof\n" },
    expect: {"findings":[["E2","info",2,"{\"what\":\"default\"}"],["E3","warning",2,"{\"what\":\"flush\",\"pattern\":\"*\"}"],["E7","info",2,"{\"count\":2}"],["E3","info",4,"{\"what\":\"short\",\"pattern\":\"$\"}"]],"counts":{"error":0,"warning":1,"info":3},"spawned":["ftp"],"dialogue":[{"line":2,"waitsFor":["*"],"thenSends":"anonymous\\r"},{"line":4,"waitsFor":["$"],"thenSends":"bye\\r"},{"line":6,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"default","interactive":false,"waitsForEof":true,"commandCount":6,"syntaxError":null},
  },
  // A password sent without a return, then one sent with a newline instead of a return.
  {
    id: "send-no-return",
    input: { script: "set timeout 15\nspawn passwd\nexpect \"New password:\"\nsend \"$env(NEWPW)\"\nexpect \"Retype new password:\"\nsend \"$env(NEWPW)\\n\"\nexpect eof\n" },
    expect: {"findings":[["E7","info",3,"{\"count\":2}"],["E5","info",4,"{\"what\":\"none\"}"],["E6","info",6,""]],"counts":{"error":0,"warning":0,"info":3},"spawned":["passwd"],"dialogue":[{"line":3,"waitsFor":["New password:"],"thenSends":"$env(NEWPW)"},{"line":5,"waitsFor":["Retype new password:"],"thenSends":"$env(NEWPW)\\n"},{"line":7,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"15","interactive":false,"waitsForEof":true,"commandCount":7,"syntaxError":null},
  },
  // The script logs in and hands the keyboard to the user; ssh with the host-key question unanswered.
  {
    id: "interact",
    input: { script: "set timeout 10\nspawn ssh -l operator core-rtr-1\nexpect \"assword:\"\nsend \"$env(OPERPW)\\r\"\nexpect -re {\\$ $}\nsend \"sudo -i\\r\"\ninteract\n" },
    expect: {"findings":[["E10","info",2,""],["E7","info",3,"{\"count\":2}"]],"counts":{"error":0,"warning":0,"info":2},"spawned":["ssh"],"dialogue":[{"line":3,"waitsFor":["assword:"],"thenSends":"$env(OPERPW)\\r"},{"line":5,"waitsFor":["\\$ $"],"thenSends":"sudo -i\\r"}],"timeoutAtFirstExpect":"10","interactive":true,"waitsForEof":false,"commandCount":7,"syntaxError":null},
  },
  // exp_continue inside the expect body is legal; the one after it at the top level is an error.
  {
    id: "exp-continue",
    input: { script: "set timeout 30\nspawn scp big.iso backup@nas:/vol/\nexpect {\n    -re \"(\\\\d+)%\" { exp_continue }\n    \"assword:\" { send \"$env(NASPW)\\r\"; exp_continue }\n    eof { puts \"copied\" }\n    timeout { puts \"stalled\"; exit 1 }\n}\nexp_continue\n" },
    expect: {"findings":[["E8","error",9,""]],"counts":{"error":1,"warning":0,"info":0},"spawned":["scp"],"dialogue":[{"line":3,"waitsFor":["(\\d+)%","assword:","eof","timeout"],"thenSends":"$env(NASPW)\\r"}],"timeoutAtFirstExpect":"30","interactive":false,"waitsForEof":true,"commandCount":10,"syntaxError":null},
  },
  // -re "[Pp]assword: $": the brackets run a command named Pp before Expect sees the pattern.
  {
    id: "unbraced-regex",
    input: { script: "set timeout 5\nspawn telnet $host\nexpect -re \"login: $\"\nsend \"$user\\r\"\nexpect -re \"[Pp]assword: $\"\nsend \"$pw\\r\"\nexpect -re {[>#]$}\nsend \"show ip int brief\\r\"\nexpect -re {[>#]$}\nsend \"exit\\r\"\nexpect eof\n" },
    expect: {"findings":[["E7","info",3,"{\"count\":4}"],["E9","warning",5,"{\"what\":\"command\",\"pattern\":\"[Pp]assword: $\"}"]],"counts":{"error":0,"warning":1,"info":1},"spawned":["telnet"],"dialogue":[{"line":3,"waitsFor":["login: $"],"thenSends":"$user\\r"},{"line":5,"waitsFor":["[Pp]assword: $"],"thenSends":"$pw\\r"},{"line":7,"waitsFor":["[>#]$"],"thenSends":"show ip int brief\\r"},{"line":9,"waitsFor":["[>#]$"],"thenSends":"exit\\r"},{"line":11,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"5","interactive":false,"waitsForEof":true,"commandCount":11,"syntaxError":null},
  },
  // log_user 0 never restored, a sleep where an expect belongs.
  {
    id: "sleep-and-silence",
    input: { script: "log_user 0\nset timeout 8\nspawn ssh user@host uptime\nexpect \"assword:\"\nsend \"$env(PW)\\r\"\nsleep 2\nsend \"\\r\"\nexpect eof\nputs $expect_out(buffer)\n" },
    expect: {"findings":[["E12","info",1,""],["E10","info",3,""],["E7","info",4,"{\"count\":1}"],["E11","info",6,"{\"seconds\":\"2\"}"]],"counts":{"error":0,"warning":0,"info":4},"spawned":["ssh"],"dialogue":[{"line":4,"waitsFor":["assword:"],"thenSends":"$env(PW)\\r"},{"line":8,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"8","interactive":false,"waitsForEof":true,"commandCount":9,"syntaxError":null},
  },
  // set timeout 60 after the first expect, which ran on the default 10 seconds.
  {
    id: "timeout-after-expect",
    input: { script: "spawn ssh netops@fw1\nexpect \"assword:\"\nsend \"$env(PW)\\r\"\nset timeout 60\nexpect \"# \"\nsend \"show system status\\r\"\nexpect \"# \"\nsend \"exit\\r\"\nexpect eof\n" },
    expect: {"findings":[["E10","info",1,""],["E2","info",2,"{\"what\":\"default\"}"],["E7","info",2,"{\"count\":3}"],["E13","warning",4,"{\"firstExpectLine\":2}"]],"counts":{"error":0,"warning":1,"info":3},"spawned":["ssh"],"dialogue":[{"line":2,"waitsFor":["assword:"],"thenSends":"$env(PW)\\r"},{"line":5,"waitsFor":["# "],"thenSends":"show system status\\r"},{"line":7,"waitsFor":["# "],"thenSends":"exit\\r"},{"line":9,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"default","interactive":false,"waitsForEof":true,"commandCount":9,"syntaxError":null},
  },
  // The manual's password-reading idiom, but stty echo is never restored.
  {
    id: "stty-echo",
    input: { script: "stty -echo\nsend_user \"Password: \"\nexpect_user -re \"(.*)\\n\"\nset password $expect_out(1,string)\nspawn su -\nexpect \"assword:\"\nsend \"$password\\r\"\nexpect \"# \"\nsend \"id\\r\"\nexpect \"# \"\nsend \"exit\\r\"\nexpect eof\n" },
    expect: {"findings":[["E15","warning",1,""],["E2","info",6,"{\"what\":\"default\"}"],["E7","info",6,"{\"count\":3}"]],"counts":{"error":0,"warning":1,"info":2},"spawned":["su"],"dialogue":[{"line":6,"waitsFor":["assword:"],"thenSends":"$password\\r"},{"line":8,"waitsFor":["# "],"thenSends":"id\\r"},{"line":10,"waitsFor":["# "],"thenSends":"exit\\r"},{"line":12,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"default","interactive":false,"waitsForEof":true,"commandCount":12,"syntaxError":null},
  },
  // Tcl that never spawns anything: Expect has nothing to talk to.
  {
    id: "no-spawn",
    input: { script: "#!/usr/bin/expect -f\nset hosts {sw1 sw2 sw3}\nforeach h $hosts {\n    puts \"would connect to $h\"\n}\n" },
    expect: {"findings":[["E14","info",1,""]],"counts":{"error":0,"warning":0,"info":1},"spawned":[],"dialogue":[],"timeoutAtFirstExpect":"default","interactive":false,"waitsForEof":false,"commandCount":3,"syntaxError":null},
  },
  // A missing close brace: the parser stops where Tcl would, the commands before it are explained.
  {
    id: "syntax-error",
    input: { script: "spawn ssh user@host\nexpect {\n    \"assword:\" { send \"$pw\\r\" \n    eof { exit }\n}\n" },
    expect: {"findings":[["E10","info",1,""],["syntax","error",2,"{\"message\":\"missing close-brace\"}"]],"counts":{"error":1,"warning":0,"info":1},"spawned":["ssh"],"dialogue":[],"timeoutAtFirstExpect":"default","interactive":false,"waitsForEof":false,"commandCount":1,"syntaxError":{"line":2,"message":"missing close-brace"}},
  },
  // close without wait: the process is not reaped.
  {
    id: "close-without-wait",
    input: { script: "set timeout 10\nspawn ping -c 3 10.1.1.1\nexpect eof\nclose\n" },
    expect: {"findings":[["E16","info",4,""]],"counts":{"error":0,"warning":0,"info":1},"spawned":["ping"],"dialogue":[{"line":3,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"10","interactive":false,"waitsForEof":true,"commandCount":4,"syntaxError":null},
  },
  // A proc, a foreach, an if and a switch: every body is walked.
  {
    id: "proc-and-switch",
    input: { script: "set timeout 20\nproc login {host} {\n    spawn ssh $host\n    expect {\n        \"assword:\" { send \"$::env(PW)\\r\" }\n        timeout { return 0 }\n    }\n    expect -re {[>#] $}\n    return 1\n}\nforeach h [lrange $argv 0 end] {\n    if {[login $h]} {\n        switch -glob -- $h {\n            core* { send \"show bgp summary\\r\" }\n            default { send \"show version\\r\" }\n        }\n        expect -re {[>#] $}\n        send \"exit\\r\"\n        expect eof\n    } else {\n        puts \"skip $h\"\n    }\n}\n" },
    expect: {"findings":[["E10","info",3,""],["E7","info",4,"{\"count\":2}"]],"counts":{"error":0,"warning":0,"info":2},"spawned":["ssh"],"dialogue":[{"line":4,"waitsFor":["assword:","timeout"],"thenSends":"$::env(PW)\\r"},{"line":8,"waitsFor":["[>#] $"],"thenSends":null},{"line":17,"waitsFor":["[>#] $"],"thenSends":"exit\\r"},{"line":19,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"20","interactive":false,"waitsForEof":true,"commandCount":17,"syntaxError":null},
  },
  // A script the rules have nothing to say about.
  {
    id: "clean",
    input: { script: "#!/usr/bin/expect -f\n# show-version.exp HOST USER: the password comes from the environment, never from the script.\nset timeout 30\nset host [lindex $argv 0]\nset user [lindex $argv 1]\nspawn -noecho ssh -o StrictHostKeyChecking=accept-new $user@$host\nexpect {\n    -nocase \"password:\" { send -- \"$env(SSHPASS)\\r\" }\n    timeout { send_user \"no password prompt from $host\\n\"; exit 1 }\n    eof { send_user \"connection closed by $host\\n\"; exit 1 }\n}\nexpect {\n    -re {[>#] ?$} { send -- \"show version\\r\" }\n    timeout { send_user \"no prompt after login\\n\"; exit 1 }\n}\nexpect {\n    -re {[>#] ?$} { set output $expect_out(buffer) }\n    timeout { send_user \"command did not finish\\n\"; exit 1 }\n}\nsend -- \"exit\\r\"\nexpect eof\nputs $output\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"spawned":["ssh"],"dialogue":[{"line":7,"waitsFor":["password:","timeout","eof"],"thenSends":"$env(SSHPASS)\\r"},{"line":12,"waitsFor":["[>#] ?$","timeout"],"thenSends":"show version\\r"},{"line":16,"waitsFor":["[>#] ?$","timeout"],"thenSends":"exit\\r"},{"line":21,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"30","interactive":false,"waitsForEof":true,"commandCount":21,"syntaxError":null},
  },
  // A send right after spawn: the process may not be running yet.
  {
    id: "send-before-expect",
    input: { script: "set timeout 10\nspawn telnet 192.0.2.10\nsend \"admin\\r\"\nexpect \"assword:\"\nsend \"$env(PW)\\r\"\nexpect -re {[>#] $}\nsend \"show clock\\r\"\nexpect -re {[>#] $}\nsend \"exit\\r\"\nexpect eof\n" },
    expect: {"findings":[["E17","warning",3,""],["E7","info",4,"{\"count\":3}"]],"counts":{"error":0,"warning":1,"info":1},"spawned":["telnet"],"dialogue":[{"line":4,"waitsFor":["assword:"],"thenSends":"$env(PW)\\r"},{"line":6,"waitsFor":["[>#] $"],"thenSends":"show clock\\r"},{"line":8,"waitsFor":["[>#] $"],"thenSends":"exit\\r"},{"line":10,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"10","interactive":false,"waitsForEof":true,"commandCount":10,"syntaxError":null},
  },
  // set timeout inside a proc is local unless global timeout is declared.
  {
    id: "timeout-in-proc",
    input: { script: "proc slow_login {host} {\n    set timeout 120\n    spawn ssh -o StrictHostKeyChecking=no $host\n    expect {\n        \"assword:\" { send \"$::env(PW)\\r\" }\n        timeout { return 0 }\n    }\n    return 1\n}\nproc fast_login {host} {\n    global timeout\n    set timeout 5\n    spawn ssh -o StrictHostKeyChecking=no $host\n    expect {\n        \"assword:\" { send \"$::env(PW)\\r\" }\n        timeout { return 0 }\n    }\n    return 1\n}\nif {[slow_login [lindex $argv 0]]} {\n    expect -re {[>#] $}\n    send \"exit\\r\"\n    expect eof\n}\n" },
    expect: {"findings":[["E18","info",2,""],["E7","info",4,"{\"count\":1}"]],"counts":{"error":0,"warning":0,"info":2},"spawned":["ssh","ssh"],"dialogue":[{"line":4,"waitsFor":["assword:","timeout"],"thenSends":"$::env(PW)\\r"},{"line":14,"waitsFor":["assword:","timeout"],"thenSends":"$::env(PW)\\r"},{"line":21,"waitsFor":["[>#] $"],"thenSends":"exit\\r"},{"line":23,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"120","interactive":false,"waitsForEof":true,"commandCount":19,"syntaxError":null},
  },
  // send {...\r}: in braces the \r is two characters and $env(PW) is a name, not a value.
  {
    id: "braced-return",
    input: { script: "set timeout 10\nspawn ssh -o StrictHostKeyChecking=no admin@sw1\nexpect {\n    \"assword:\" { send {$env(PW)\\r} }\n    timeout { exit 1 }\n}\nexpect -re {[>#] $}\nsend {show version\\r}\nexpect -re {[>#] $}\nsend \"exit\\r\"\nexpect eof\n" },
    expect: {"findings":[["E7","info",3,"{\"count\":2}"],["E5","warning",4,"{\"what\":\"braced\",\"text\":\"$env(PW)\\\\r\"}"],["E5","warning",8,"{\"what\":\"braced\",\"text\":\"show version\\\\r\"}"]],"counts":{"error":0,"warning":2,"info":1},"spawned":["ssh"],"dialogue":[{"line":3,"waitsFor":["assword:","timeout"],"thenSends":"$env(PW)\\r"},{"line":7,"waitsFor":["[>#] $"],"thenSends":"show version\\r"},{"line":9,"waitsFor":["[>#] $"],"thenSends":"exit\\r"},{"line":11,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"10","interactive":false,"waitsForEof":true,"commandCount":10,"syntaxError":null},
  },
  // -re "$user@...": the variable is substituted before the regexp is read (meant here).
  {
    id: "variable-in-regex",
    input: { script: "set timeout 10\nset user admin\nspawn ssh -o StrictHostKeyChecking=no $user@sw1\nexpect {\n    \"assword:\" { send \"$env(PW)\\r\" }\n    timeout { exit 1 }\n}\nexpect -re \"$user@.*\\\\$ $\"\nsend \"exit\\r\"\nexpect eof\n" },
    expect: {"findings":[["E7","info",4,"{\"count\":1}"],["E9","info",8,"{\"what\":\"variable\",\"pattern\":\"$user@.*\\\\\\\\$ $\"}"]],"counts":{"error":0,"warning":0,"info":2},"spawned":["ssh"],"dialogue":[{"line":4,"waitsFor":["assword:","timeout"],"thenSends":"$env(PW)\\r"},{"line":8,"waitsFor":["$user@.*\\\\$ $"],"thenSends":"exit\\r"},{"line":10,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"10","interactive":false,"waitsForEof":true,"commandCount":9,"syntaxError":null},
  },
  // set password "s3cr3t!": the secret sits in the script.
  {
    id: "secret-variable",
    input: { script: "set timeout 10\nset password \"s3cr3t!\"\nspawn ssh -o StrictHostKeyChecking=no admin@sw1\nexpect {\n    \"assword:\" { send \"$password\\r\" }\n    timeout { exit 1 }\n}\nexpect -re {[>#] $}\nsend \"exit\\r\"\nexpect eof\n" },
    expect: {"findings":[["E1","error",2,"{\"what\":\"variable\",\"preview\":\"•••••••\",\"variable\":\"password\"}"],["E7","info",4,"{\"count\":1}"]],"counts":{"error":1,"warning":0,"info":1},"spawned":["ssh"],"dialogue":[{"line":4,"waitsFor":["assword:","timeout"],"thenSends":"$password\\r"},{"line":8,"waitsFor":["[>#] $"],"thenSends":"exit\\r"},{"line":10,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"10","interactive":false,"waitsForEof":true,"commandCount":9,"syntaxError":null},
  },
  // login and password bodies in one expect: "admin" answers login and is not a secret.
  {
    id: "login-and-password-bodies",
    input: { script: "set timeout 10\nspawn telnet 192.0.2.10\nexpect {\n    \"login:\" { send \"admin\\r\"; exp_continue }\n    \"assword:\" { send \"$env(PW)\\r\" }\n    timeout { exit 1 }\n}\nexpect -re {[>#] $}\nsend \"exit\\r\"\nexpect eof\n" },
    expect: {"findings":[["E7","info",3,"{\"count\":1}"]],"counts":{"error":0,"warning":0,"info":1},"spawned":["telnet"],"dialogue":[{"line":3,"waitsFor":["login:","assword:","timeout"],"thenSends":"admin\\r"},{"line":8,"waitsFor":["[>#] $"],"thenSends":"exit\\r"},{"line":10,"waitsFor":["eof"],"thenSends":null}],"timeoutAtFirstExpect":"10","interactive":false,"waitsForEof":true,"commandCount":10,"syntaxError":null},
  },
];

/** What verifyVectors reports (the shape scripts/run-golden-vectors.mts reads). */
export interface VerifyReport {
  // The set id.
  setId: string;
  // Vectors run.
  total: number;
  // Vectors whose pinned fields matched.
  passed: number;
  // The ones that did not, with the first difference.
  failures: { id: string; reason: string }[];
}

/** Run every vector and compare its pinned fields byte for byte. */
export function verifyVectors(): VerifyReport {
  // Failures found.
  const failures: { id: string; reason: string }[] = [];
  // Each vector.
  for (const v of VECTORS) {
    // A throw is a failure too.
    try {
      // Run and reduce (through JSON, as the expected values were captured).
      const got = JSON.stringify(pin(run(v.input)));
      // The expected text.
      const want = JSON.stringify(v.expect);
      // Compare.
      if (got !== want) {
        // The first differing character, for a readable reason.
        let k = 0;
        // Walk to it.
        while (k < got.length && got[k] === want[k]) k++;
        // Record.
        failures.push({ id: v.id, reason: `differs at ${k}: got ...${got.slice(Math.max(0, k - 30), k + 50)}... want ...${want.slice(Math.max(0, k - 30), k + 50)}...` });
      }
    } catch (e) {
      // The error.
      failures.push({ id: v.id, reason: `threw: ${(e as Error).message}` });
    }
  }
  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total: VECTORS.length, passed: VECTORS.length - failures.length, failures };
}
