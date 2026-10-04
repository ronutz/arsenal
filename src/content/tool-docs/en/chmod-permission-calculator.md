## What it does

Reads a file mode written any of the three ways people write it and gives back every other spelling with the reading. The three spellings:

- **Octal**, one to five digits: `755`, `0644`, `4755`, `02775`, `00755`. The fourth digit from the right is the special bits (4 set-user-ID, 2 set-group-ID, 1 restricted deletion or sticky); the three to its right are owner, group and others, each the sum of read 4, write 2 and execute 1.
- **An ls string**, nine characters or ten with the type letter: `rwxr-xr-x`, `-rwsr-xr-x`, `drwxrwxrwt`, `rwSr--r--`. A leading `d` sets the kind to directory.
- **chmod clauses** applied to a base mode under a umask: `u+x,go-w`, `a=rX`, `g+s,o-rwx`, `=755`. The base is 644 for a file and 755 for a directory unless you give one; the umask is 022 unless you give one.

For the mode it reads, the page shows the four octal digits and the ten-character ls string, the twelve bits as a grid you can click to flip, the plain reading per class (what the owner, the group and others may do, worded for a file or for a directory), the three special bits with what each means for this kind, the combinations worth a second look, the chmod commands that reach the mode (absolute octal, absolute symbolic, and the minimal change from the base), the umask that would create the mode from a program's default, and, for clauses, a trace of the mode after each one.

## The rules it follows

- **The symbolic grammar is POSIX's.** Classes `u`, `g`, `o` and `a`; operators `+`, `-`, `=`; permissions `r`, `w`, `x`, `X`, `s`, `t`; or a class to copy from, `u`, `g` or `o`. Several actions may follow one class list (`u+r-w`), and clauses are separated by commas.
- **`X`** sets execute "if the file is a directory or if the current file mode bits have at least one of the execute bits set" (POSIX chmod). On a plain file with no execute bit, `a+X` changes nothing, and the trace says so.
- **`=`** first clears the bits of the classes named (all twelve when no class is named), then sets the permissions given. `o=` with nothing after it clears the others' bits.
- **No class named** means all three, "but bits that are set in the umask are not affected" for `+` and `-` (chmod(1)); the calculator applies the umask you give, 022 by default, and notes when it masked something.
- **`s`** follows the class: with `u` it is set-user-ID, with `g` set-group-ID, with only `o` it changes nothing (POSIX). **`t`** is the restricted deletion flag, applied whatever class is named, as GNU chmod does.
- **The ls letters are POSIX's.** `s` where set-user-ID or set-group-ID is set and the class can execute, `S` when it cannot; `t` where the restricted deletion flag is set and others can search, `T` when they cannot.
- **GNU directory rule.** When the base is a directory, a numeric mode of up to four digits keeps the base's set-user-ID and set-group-ID bits, as chmod(1) states: "For directories chmod preserves set-user-ID and set-group-ID bits unless you explicitly specify otherwise." Writing `00755`, `-6000` or `=755` clears them, and the trace names the rule when it applied.
- **Numeric modes with an operator** (`=755`, `+111`, `-022`) are read as GNU reads them: set exactly, add, remove.

## Reading the special bits

| Bit | Value | On a file | On a directory |
|---|---|---|---|
| set-user-ID | 4000 | the process runs with the owner's effective user ID | no portable meaning |
| set-group-ID | 2000 | the process runs with the file's group | new entries take the directory's group (most systems) |
| restricted deletion or sticky | 1000 | no portable meaning today; some older systems kept the program text in swap | only an entry's owner, the directory's owner or a privileged user may remove or rename it |

The capital letters are the ones to notice: `S` means the special bit is set but the matching execute bit is not, so the bit does nothing until execute is granted; `T` means the restricted deletion flag is set on a directory others cannot search.

## The umask line

A program creating a file asks for 666 and a program creating a directory asks for 777; the kernel clears the bits set in the process's umask. So the calculator can say which umask creates the mode you typed, and when none can: a file mode with an execute bit is never produced by creation alone, and the special bits never come from a umask.

## Limits

- The calculator knows the twelve mode bits, not the file system. It cannot see ownership, access control lists, capabilities, mount options, immutable attributes or mandatory access control, any of which may override what the bits say.
- The GNU-specific behaviours are modelled as chmod(1) from coreutils 9.11 describes them. Other implementations may treat a numeric mode on a directory, or `=755`, differently.
- Whether clearing all execute bits also clears set-user-ID and set-group-ID is implementation-defined (POSIX chmod); the calculator does not clear them on its own.
- Every field is cut at 64 characters.

## Sources

- [POSIX.1-2024 (IEEE Std 1003.1-2024): chmod](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/chmod.html) (read 2026-10-03)
- [POSIX.1-2024 (IEEE Std 1003.1-2024): ls](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/ls.html) (read 2026-10-03)
- [GNU coreutils manual: Mode Structure](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html) (read 2026-10-03)
- [chmod(1), GNU coreutils 9.11, man7.org](https://man7.org/linux/man-pages/man1/chmod.1.html) (read 2026-10-03)
