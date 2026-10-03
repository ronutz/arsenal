## What it does

Type a value the way it appears in an iRule, such as `010`, `0x1F`, `08`, `1e3` or `" 12 "`, and the tool shows how Tcl 8.4.6 reads it. F5 states in K6091 that the iRules command set was developed from Tcl base version 8.4.6, so these are the rules a BIG-IP applies. The engine behind the tool was checked against a real Tcl 8.4.6 interpreter built from the official source.

## How to read the result

- **The headline** says whether the text is an integer, a double (floating point) or not a number, which base an integer was written in, and how Tcl prints it. `010` is the integer 8, written in octal.
- **Other notations** lists the same integer in decimal, hexadecimal, octal and binary, and how to write it in an iRule. Tcl 8.4 has no binary notation, so that row has no Tcl form.
- **Inside the double** shows what the 12 printed digits hide: Tcl 8.4 prints doubles with 12 significant digits (its `tcl_precision` defaults to 12), so `0.1` prints as `0.1` while the stored value is `0.1000000000000000055511151231257827021181583404541015625`.
- **Two places Tcl reads numbers** compares the value written directly in an expression (`expr {08}`, an error before anything runs) with the same text held in a variable (`set x 08; expr {$x + 0}`, an error only when arithmetic needs the number).
- **Comparing it with** runs `==`, `eq`, `<` and `>` against a second value you choose, with the reason for each result.

## Worth knowing

- A leading 0 means octal: `010 == 8` is true and `010 eq 8` is false, because `eq` compares text.
- `08` and `09` are not numbers at all. In arithmetic they fail with "can't use invalid octal number"; in a comparison they quietly become text, so `"08" == 8` is false.
- A double is never an integer to Tcl: `3.0 == 3` is true, but `3.0` prints with its decimal point and `%` refuses it.
- Values from 2 to the power 63 up to 2 to the power 64 minus 1 are accepted and wrap around to negative numbers; anything larger is refused.

## Limits

Integers are modelled as 64 bits wide. Tcl 8.4 uses the C `long` of the platform it was built for, so a 32-bit build would read large values differently; the tool says so when a value does not fit in 32 bits.

## Sources

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (read 2026-10-03)
- [Tcl 8.4 manual: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (read 2026-10-03)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (read 2026-10-02)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (the reference interpreter; `doc/tclvars.n` documents the default `tcl_precision` of 12)
