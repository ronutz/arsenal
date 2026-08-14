## What it does

Run `tty` in a shell, paste what it printed, and the tool tells you which layer of the terminal stack you are actually looking at: a pseudoterminal slave, a virtual console, a real serial line, the controlling-terminal synonym, or the system console. It also handles **"not a tty"**, which is a finding rather than an error.

The four one-line definitions are shown **before** you paste anything, because a reader who arrives confused about the words should not have to supply input before the page tells them something.

## What each answer gives you

- **`/dev/pts/N`** — a pseudoterminal slave. Something in userspace holds the master: your emulator, `sshd`, or `tmux`. **The number is allocated, not meaningful** — two shells with consecutive numbers are unrelated. This is also why closing a window kills what was running: the master goes, the kernel hangs up, the session leader gets SIGHUP.
- **`/dev/ttyN`** — a virtual console, the kernel driving the machine's own keyboard and screen. Survives what a pseudoterminal does not, which is why it is where you end up when the display server has died.
- **`/dev/ttyS0`, `/dev/ttyUSB0`** — a real serial line, the original case unchanged. The tool warns that **serial parameters are not negotiated**: a mismatch produces convincing rubbish rather than silence, so a console showing garbage is usually a speed setting rather than a broken cable.
- **`/dev/tty`** — not a device but a **synonym** for whatever terminal controls the calling process. It explains why a password prompt still reaches you when output is redirected.
- **`/dev/console`** — where the kernel talks, and on a server frequently the serial port rather than the screen.

## What it will not do

It reads a path, not a system. It cannot tell you who holds the master for your particular `/dev/pts/3`, and it does not guess at unfamiliar device names — an unrecognised path is reported as unrecognised, because a platform-specific device should not be inferred from its spelling.
