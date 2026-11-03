// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/exit-the-editor/engine.ts
// ----------------------------------------------------------------------------
// EXIT THE EDITOR, the rules (PRIME 03/11/2026): an escape room in a fake
// terminal. Each level traps the player in a program, and the goal is to leave
// it cleanly: vim in insert mode, less, man, nano, Emacs, top, the Python REPL,
// a frozen ssh session, tail -f, telnet, tmux, git commit's editor, and a final
// boss that chains several.
//
// Each program here is a small, deterministic state machine: a state and a key
// in, a state out. Only what a level needs is modelled, but what is modelled
// follows the program's own documentation (vim :help, less(1), man(1), the GNU
// nano manual, the GNU Emacs manual, top(1), the Python tutorial and
// _sitebuiltins.py, ssh(1) and clientloop.c, telnet(1) and commands.c, tmux(1),
// git-commit(1)); the sources are listed in the game's SOURCES.md. What the
// terminal shows is the programs' own output, in the C locale, which is why
// those strings live here and not in the translation packs.
//
// A key is a string: one printable character ("q", ":", "~"), or a name
// ("Enter", "Esc", "Backspace", "Tab", "Up", "Down", "Left", "Right"), or a
// control combination ("C-c", "C-x", "C-]"). "Tick" is the clock, sent by the
// page about once a second so tail -f and a running job can print; it is not
// a keystroke.
//
// Par and medals (PRIME 03/11/2026, "Yes on all your suggested ideas"): each
// level's par is its shortest documented way out, in keystrokes; a level
// cleared in par keystrokes earns the Par medal, in fewer the Under par one
// (medalFor). Under par is possible: un-commenting a line of git's template is
// a commit message too, and the self-test proves it.
//
// The daily escape (same date): one trap a day, the same for everyone on a
// UTC day. dailyEscape(day) draws, with dailyRng, one of the twelve
// one-program levels (every program once in each block of twelve days) and a
// scene for it: which file is open, whether there are unsaved changes, which
// job is running, what was typed when ssh froze. A scene changes what is on
// the screen, never the way out: its exits are the program's documented ones
// (dailyExits), and the self-test plays 400 days of them.
// ============================================================================

// The self-test's report shape.
import type { SelfTestReport } from "../../registry";
// Seeded generators (the fuzz part of the self-test, the daily escape), a hash for fake commit ids, and day arithmetic.
import { addDays, dailyRng, epochDay, fnv1a, LAUNCH_DAY, makeRng, type Rng } from "../../daily";

/** The game's stable id. */
export const GAME_ID = "exit-the-editor";
/** Rows of the fake terminal. */
export const ROWS = 16;
/** Columns of the fake terminal (fits a 390 px phone). */
export const COLS = 46;

/** A key, as described in the header. */
export type Key = string;
/** Where a program stands: still running, left cleanly, or left the wrong way (the level restarts). */
export type Outcome = "run" | "exit" | "fail";
/** The programs modelled. */
export type Prog = "vim" | "less" | "nano" | "emacs" | "top" | "python" | "ssh" | "tail" | "telnet" | "tmux";

/** One program's state: one shape for all, each program uses the fields it needs. */
export interface Term {
  /** Which program. */
  prog: Prog;
  /** A variant: "plain" or "git" for vim, "file" or "man" for less, "job" or "shell" for tmux. */
  ctx: string;
  /** The buffer (an editor) or the scrollback (everything else). */
  buf: string[];
  /** Cursor row in the buffer. */
  row: number;
  /** Cursor column in the buffer. */
  col: number;
  /** The program's mode (vim: insert, normal, cmdline; less: view, help; nano: edit, save, fname). */
  mode: string;
  /** A line being typed at a prompt (vim's command line, the REPL, telnet>). */
  line: string;
  /** The message line (vim's, nano's status bar, Emacs's echo area). */
  msg: string;
  /** Whether the buffer differs from the file. */
  modified: boolean;
  /** The buffer as last written (vim's git commit level reads it at the end). */
  saved: string[];
  /** A prefix key waiting for its second key ("q" and "Z" in vim, "C-x" in Emacs, "C-b" in tmux, "~" in ssh). */
  pending: string;
  /** vim: the register being recorded into ("" when not recording). */
  rec: string;
  /** A counter: less's top line, top's toggles, the clock ticks. */
  n: number;
  /** Small per-program flags. */
  flags: Record<string, number>;
  /** Running, left, or left the wrong way. */
  outcome: Outcome;
  /** Why the level failed, a key into the game's strings ("" when not failed). */
  why: string;
  /** What the shell shows after the program has gone. */
  after: string[];
  /**
   * The names a daily escape's scene sets (file, job, session, window, branch, host, port); empty on a level, whose
   * program then shows its own. Set at the start, never changed by a key.
   */
  scene: Scene;
  /** Lines a program prints on its own (tail -f's log, a job in tmux) in a daily scene; empty for the level's own. */
  feed: string[];
}

/** A daily escape's scene: names and switches, all strings, which are also the arguments of the day's brief. */
export type Scene = Record<string, string>;

/** A screen to draw. */
export interface Screen {
  /** Exactly ROWS lines, none longer than COLS. */
  lines: string[];
  /** The cursor, or null when the program hides it. */
  cursor: { r: number; c: number } | null;
  /** Rows drawn in reverse video (status bars). */
  inverse: number[];
}

/** One level. */
export interface Level {
  /** Stable id, also the key of its strings (devFun.games.exit-the-editor.levels.<id>.*). */
  id: string;
  /** The program's name as shown on the level card. */
  prog: string;
  /** The stages: one for an ordinary level, several for the boss. */
  stages: string[];
  /** The fewest keystrokes of a documented exit (the par for the score). */
  par: number;
  /** Documented ways out: each must leave the level. */
  solutions: Key[][];
  /** Classic wrong attempts: none may leave the level. */
  wrong: Key[][];
}

/** A level being played: the stage reached, the program in front, what earlier stages left on screen. */
export interface LevelState {
  /** The level's id. */
  level: string;
  /** Index of the current stage. */
  stage: number;
  /** The program in front. */
  term: Term;
  /** Lines carried over from the previous stage (shown above the next program's first screen). */
  carry: string[];
  /** The level's result: running, cleared, or failed (and restarted by the page). */
  outcome: Outcome;
  /** A daily escape's scene, which also picks its ways out (absent on a level). */
  scene?: Scene;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/**
 * A fresh Term with every field at its default.
 *
 * @param prog the program
 * @param over the fields to set
 * @returns the state
 */
function term(prog: Prog, over: Partial<Term>): Term {
  // Defaults first, then the program's own fields.
  return { prog, ctx: "", buf: [], row: 0, col: 0, mode: "", line: "", msg: "", modified: false, saved: [], pending: "", rec: "", n: 0, flags: {}, outcome: "run", why: "", after: [], scene: {}, feed: [], ...over };
}

/**
 * A copy of a Term that can be changed without touching the original.
 *
 * @param t the state
 * @returns a copy with its arrays, flags and scene copied too
 */
function clone(t: Term): Term {
  // The arrays, the flags and the scene are the only nested parts.
  return { ...t, buf: t.buf.slice(), saved: t.saved.slice(), flags: { ...t.flags }, after: t.after.slice(), scene: { ...t.scene }, feed: t.feed.slice() };
}

/**
 * One of the names a daily scene sets, or the level's own when the scene leaves it out.
 *
 * @param t the state
 * @param key the name's key ("file", "job", "branch"...)
 * @param own the level's own value
 * @returns the scene's value, or own
 */
function named(t: Term, key: string, own: string): string {
  // Set by a daily scene, or the level's.
  return t.scene[key] ?? own;
}

/**
 * Whether a key is one printable character.
 *
 * @param k the key
 * @returns true for "a", ":", " ", and so on
 */
export function printable(k: Key): boolean {
  // Names and control combinations are longer than one character.
  return k.length === 1;
}

/**
 * The caret notation a terminal echoes for a control key ("C-c" as "^C", "Esc" as "^[").
 *
 * @param k the key
 * @returns the notation, or "" for a key that does not echo that way
 */
function caret(k: Key): string {
  // Escape is Ctrl-[.
  if (k === "Esc") return "^[";
  // A control combination: the caret and the upper-case character.
  if (k.startsWith("C-") && k.length === 3) return "^" + k.slice(2).toUpperCase();
  // Anything else.
  return "";
}

/**
 * Pad or cut a line to exactly COLS characters, for the bars drawn in reverse video.
 *
 * @param s the text
 * @returns s, padded with spaces or cut
 */
function bar(s: string): string {
  // Cut, then pad.
  return s.slice(0, COLS).padEnd(COLS, " ");
}

/**
 * Two texts on one line, the second flush right.
 *
 * @param left the left part
 * @param right the right part
 * @returns the line, COLS wide (the left part is cut when both do not fit)
 */
function spread(left: string, right: string): string {
  // Room for the left part.
  const room = Math.max(0, COLS - right.length - 1);
  // The left part cut to its room, padded, then the right part.
  return (left.slice(0, room).padEnd(room, " ") + " " + right).slice(0, COLS);
}

/**
 * The number of bytes a text takes in UTF-8 (for vim's "written" message).
 *
 * @param s the text
 * @returns its UTF-8 length
 */
function utf8Length(s: string): number {
  // The running count.
  let n = 0;
  // Each code point: 1 to 4 bytes.
  for (const ch of s) {
    // Its value.
    const cp = ch.codePointAt(0) ?? 0;
    // The UTF-8 length by range.
    n += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
  }
  // The total.
  return n;
}

/**
 * Wrap text lines to COLS, the way a terminal wraps long output.
 *
 * @param lines the logical lines
 * @returns the screen lines
 */
function wrap(lines: readonly string[]): string[] {
  // The screen lines.
  const out: string[] = [];
  // Each logical line, cut every COLS characters (an empty line stays one line).
  for (const l of lines) {
    // Empty: one empty row.
    if (l.length === 0) out.push("");
    // Otherwise one row per COLS characters.
    for (let i = 0; i < l.length; i += COLS) out.push(l.slice(i, i + COLS));
  }
  // All rows.
  return out;
}

/**
 * The last `n` rows of some lines, padded at the bottom to `n`.
 *
 * @param rows the rows
 * @param n how many to keep
 * @returns exactly n rows
 */
function tail(rows: readonly string[], n: number): string[] {
  // The last n.
  const out = rows.slice(Math.max(0, rows.length - n));
  // Padded.
  while (out.length < n) out.push("");
  // Exactly n.
  return out;
}

// ---------------------------------------------------------------------------
// vim (vim :help editing.txt "Writing and quitting", insert.txt, repeat.txt,
// message.txt E37 and E492, src/normal.c for CTRL-C in Normal mode)
// ---------------------------------------------------------------------------

/** The file of the vim level. */
const VIM_FILE = "notes.txt";
/** The lines of the vim level, being edited. */
const VIM_TEXT = ["# Release notes", "", "- faster start-up", "- fewer crashes", "- leaving vim is now possible"];
/** The files vim can have open in a daily escape, with their lines (the last one is the line being typed). */
const VIM_FILES: Record<string, readonly string[]> = {
  // The level's own file.
  [VIM_FILE]: VIM_TEXT,
  // A to-do list in Markdown.
  "todo.md": ["# Today", "", "- rotate the API keys", "- answer the auditors", "- find the way out of vim"],
  // A deployment file.
  "deploy.yaml": ["service: web", "replicas: 3", "image: web:2.4.1", "port: 8080", "# leave vim before the deploy"],
};

/**
 * git's commit message template (builtin/commit.c and wt-status), as git commit hands it to the editor.
 *
 * @param branch the branch the commit goes on
 * @param staged the one file staged for it
 * @returns the template's lines
 */
function gitTemplate(branch: string, staged: string): string[] {
  // The help text, the branch, and the staged change, each line a comment.
  return [
    "",
    "# Please enter the commit message for your changes. Lines starting",
    "# with '#' will be ignored, and an empty message aborts the commit.",
    "#",
    `# On branch ${branch}`,
    "# Changes to be committed:",
    `#       modified:   ${staged}`,
    "#",
  ];
}

/** The level's branch and staged file. */
const GIT_BRANCH = "main";
/** The level's staged file. */
const GIT_STAGED = "README.md";

/** Room for a message beside vim's ruler on the last line. */
const MSG_ROOM = COLS - 18;

/**
 * A file message cut at its start to fit beside the ruler, with "<" in the first column ('shortmess' t).
 *
 * @param m the message
 * @returns the message, shortened when needed
 */
function fileMsg(m: string): string {
  // Short enough: as it is.
  if (m.length <= MSG_ROOM) return m;
  // Otherwise the tail of it, after a "<".
  return "<" + m.slice(m.length - MSG_ROOM + 1);
}

/**
 * Show a message; one that does not fit beside the ruler brings up the hit-enter prompt (message.txt).
 *
 * @param t the state (changed in place)
 * @param m the message
 */
function vimMsg(t: Term, m: string): void {
  // The message.
  t.msg = m;
  // Too long for the last line: "Press ENTER or type command to continue".
  t.flags.more = m.length > MSG_ROOM ? 1 : 0;
}

/**
 * vim at the start of a level, or of a daily scene.
 *
 * @param ctx "plain": a file in Insert mode (the level: notes.txt, with unsaved changes); "git": git commit's template
 *            in Normal mode
 * @param scene a daily scene: for "plain", the file and whether it has unsaved changes ("changed": "yes" or "no");
 *              for "git", the branch and the staged file; empty for the level
 * @returns the state
 */
function vimInit(ctx: "plain" | "git", scene: Scene = {}): Term {
  // git commit opens the editor on the template, in Normal mode, unmodified.
  if (ctx === "git") {
    // The template for the scene's branch and staged file (the level's own without a scene).
    const tpl = gitTemplate(scene.branch ?? GIT_BRANCH, scene.staged ?? GIT_STAGED);
    // The file's size, for vim's opening message.
    const bytes = tpl.reduce((n, l) => n + utf8Length(l) + 1, 0);
    // Normal mode at the top, the file message shortened to fit ('shortmess' t).
    return term("vim", { ctx, buf: tpl.slice(), saved: tpl.slice(), mode: "normal", row: 0, col: 0, msg: fileMsg(`".git/COMMIT_EDITMSG" ${tpl.length}L, ${bytes}B`), scene: { ...scene } });
  }
  // The file's text: the scene's, or the level's notes.
  const text = VIM_FILES[scene.file ?? VIM_FILE] ?? VIM_TEXT;
  // Unsaved changes unless the scene says there are none (the level always has them).
  const changed = scene.changed !== "no";
  // The last line, where the typing is.
  const last = text.length - 1;
  // Insert mode, the cursor at the end of the last line; with changes, that line was typed and never written.
  return term("vim", { ctx, buf: text.slice(), saved: changed ? text.slice(0, last) : text.slice(), mode: "insert", row: last, col: text[last].length, modified: changed, msg: "-- INSERT --", scene: { ...scene } });
}

/**
 * The file name vim is editing.
 *
 * @param t the state
 * @returns the name as vim shows it
 */
function vimFile(t: Term): string {
  // git commit's file, or the scene's file (the level's notes without a scene).
  return t.ctx === "git" ? ".git/COMMIT_EDITMSG" : named(t, "file", VIM_FILE);
}

/**
 * Leave vim; for git commit, git then reads the file as last written.
 *
 * @param t the state (changed in place)
 */
function vimQuit(t: Term): void {
  // A plain file: back to the shell, nothing more to say.
  if (t.ctx !== "git") {
    // Left cleanly.
    t.outcome = "exit";
    // Done.
    return;
  }
  // git strips the comment lines and surrounding blank lines from what was written.
  const msg = t.saved.filter((l) => !l.startsWith("#")).map((l) => l.replace(/\s+$/, ""));
  // Leading blank lines dropped.
  while (msg.length && msg[0] === "") msg.shift();
  // Trailing blank lines dropped.
  while (msg.length && msg[msg.length - 1] === "") msg.pop();
  // Nothing left: git aborts the commit.
  if (msg.length === 0) {
    // The editor is closed, but there is no commit.
    t.outcome = "fail";
    // The reason, for the page.
    t.why = "emptyCommit";
    // git's own words.
    t.after = ["Aborting commit due to empty commit message."];
    // Done.
    return;
  }
  // A short, stable fake commit id from the message.
  const id = fnv1a(msg.join("\n")).toString(16).padStart(8, "0").slice(0, 7);
  // The commit is made.
  t.outcome = "exit";
  // git's summary, on the scene's branch (the level's main without a scene).
  t.after = [`[${named(t, "branch", GIT_BRANCH)} ${id}] ${msg[0]}`, " 1 file changed, 2 insertions(+)"];
}

/**
 * Write the buffer, as :w does.
 *
 * @param t the state (changed in place)
 */
function vimWrite(t: Term): void {
  // The file now holds the buffer.
  t.saved = t.buf.slice();
  // Nothing unsaved.
  t.modified = false;
  // Bytes: every line plus its newline.
  const bytes = t.buf.reduce((n, l) => n + utf8Length(l) + 1, 0);
  // vim's message.
  t.msg = fileMsg(`"${vimFile(t)}" ${t.buf.length}L, ${bytes}B written`);
}

/** :quit and its spellings, and :qall (which needs a ! with changes, like :quit). */
const VIM_QUIT = new Set(["q", "qu", "qui", "quit", "qa", "qal", "qall", "quita", "quital", "quitall"]);
/** :wq, :x, :xit, :exit and their all-windows forms: write (when needed) and quit. */
const VIM_WRITE_QUIT = new Set(["wq", "x", "xi", "xit", "exi", "exit", "wqa", "wqal", "wqall", "xa", "xal", "xall"]);
/** :edit and its spellings (:ex is :edit too): re-edit the file, refused with unsaved changes. */
const VIM_EDIT = new Set(["e", "ed", "edi", "edit", "ex"]);
/** :write and its spellings. */
const VIM_WRITE = new Set(["w", "wr", "wri", "writ", "write"]);

/**
 * Run an Ex command typed after ":".
 *
 * @param t the state (changed in place)
 * @param raw the command line
 */
function vimEx(t: Term, raw: string): void {
  // Back to Normal mode, whatever happens.
  t.mode = "normal";
  // Spaces around do not matter.
  const cmd = raw.trim();
  // A trailing ! forces.
  const bang = cmd.endsWith("!");
  // The name without it.
  const name = bang ? cmd.slice(0, -1) : cmd;
  // An empty line does nothing.
  if (cmd === "") {
    // Nothing to show.
    t.msg = "";
    // Done.
    return;
  }
  // :q and :qa.
  if (VIM_QUIT.has(name)) {
    // Refused while there are changes, unless forced (message.txt E37).
    if (t.modified && !bang) {
      // vim's message.
      vimMsg(t, "E37: No write since last change (add ! to override)");
      // Still in vim.
      return;
    }
    // Gone, without writing.
    vimQuit(t);
    // Done.
    return;
  }
  // :wq writes always; :x and :exit write only when there are changes.
  if (VIM_WRITE_QUIT.has(name)) {
    // Written when the command always writes or there is something to write.
    if (name.startsWith("wq") || t.modified) vimWrite(t);
    // Then gone.
    vimQuit(t);
    // Done.
    return;
  }
  // :e (and :ex): refused with changes unless forced; forced, the file is read again.
  if (VIM_EDIT.has(name)) {
    // Refused (E37 again).
    if (t.modified && !bang) {
      // vim's message.
      vimMsg(t, "E37: No write since last change (add ! to override)");
      // Done.
      return;
    }
    // The buffer as last written.
    t.buf = t.saved.slice();
    // Nothing unsaved.
    t.modified = false;
    // The cursor at the top.
    t.row = 0;
    t.col = 0;
    // vim's file message.
    t.msg = fileMsg(`"${vimFile(t)}" ${t.buf.length}L, ${t.buf.reduce((n, l) => n + utf8Length(l) + 1, 0)}B`);
    // Done.
    return;
  }
  // :w.
  if (VIM_WRITE.has(name)) {
    // Written, still in vim.
    vimWrite(t);
    // Done.
    return;
  }
  // Anything else (message.txt E492).
  vimMsg(t, `E492: Not an editor command: ${cmd}`);
}

/**
 * Move to the next word start, as `w` does within this small model.
 *
 * @param t the state (changed in place)
 * @param end true for `e` (end of word) instead of `w`
 */
function vimWord(t: Term, end: boolean): void {
  // The current line.
  const l = t.buf[t.row];
  // From the next character.
  let c = t.col + 1;
  // For `e`: skip spaces, then go to the last character of the word.
  if (end) {
    // Spaces first.
    while (c < l.length && l[c] === " ") c++;
    // Then the word.
    while (c + 1 < l.length && l[c + 1] !== " ") c++;
  } else {
    // For `w`: skip the rest of this word, then the spaces.
    while (c < l.length && l[c - 1] !== " " && l[c] !== " ") c++;
    // The spaces.
    while (c < l.length && l[c] === " ") c++;
  }
  // Past the end of the line: the next line's start, if any.
  if (c >= l.length) {
    // A next line exists.
    if (t.row + 1 < t.buf.length) {
      // Down.
      t.row++;
      // Its start.
      t.col = 0;
    } else {
      // Stay on the last character.
      t.col = Math.max(0, l.length - 1);
    }
    // Done.
    return;
  }
  // Within the line.
  t.col = c;
}

/**
 * Keep the cursor inside the line (Normal mode cannot sit past the last character).
 *
 * @param t the state (changed in place)
 * @param insert true in Insert mode, where the cursor may sit after the last character
 */
function vimClamp(t: Term, insert: boolean): void {
  // The row inside the buffer.
  t.row = Math.max(0, Math.min(t.buf.length - 1, t.row));
  // The line's length.
  const len = t.buf[t.row].length;
  // The column inside the line.
  t.col = Math.max(0, Math.min(insert ? len : Math.max(0, len - 1), t.col));
}

/**
 * The message vim shows in its last line when nothing else is there.
 *
 * @param t the state
 * @returns "-- INSERT --", "recording @q", both, or ""
 */
function vimMode(t: Term): string {
  // The mode shown by 'showmode'.
  const mode = t.mode === "insert" ? "-- INSERT --" : "";
  // The recording note follows it.
  return mode + (t.rec ? `recording @${t.rec}` : "");
}

/**
 * Suspend the program with Ctrl-Z: it is stopped, not gone, so the level fails.
 *
 * @param t the state (changed in place)
 * @param cmd the command line the shell reports as stopped
 */
function suspend(t: Term, cmd: string): void {
  // Not a clean exit: the program is still there, stopped.
  t.outcome = "fail";
  // The reason.
  t.why = "suspended";
  // bash's job report.
  t.after = ["", `[1]+  Stopped                 ${cmd}`];
}

/**
 * One key in vim.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function vimStep(s: Term, k: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // Ctrl-Z suspends in any mode.
  if (k === "C-z") {
    // Stopped.
    suspend(t, t.ctx === "git" ? "git commit" : `vim ${vimFile(t)}`);
    // Done.
    return t;
  }
  // Insert mode (insert.txt).
  if (t.mode === "insert") {
    // <Esc>, CTRL-[ and CTRL-C end Insert mode.
    if (k === "Esc" || k === "C-[" || k === "C-c") {
      // Normal mode.
      t.mode = "normal";
      // The cursor steps back one, as it does when leaving Insert mode.
      t.col = Math.max(0, t.col - 1);
      // The message line keeps only the recording note.
      t.msg = vimMode(t);
      // Done.
      return t;
    }
    // A character is inserted.
    if (printable(k) || k === "Tab") {
      // Tab inserts spaces to the next stop of eight in this model.
      const text = k === "Tab" ? " ".repeat(8 - (t.col % 8)) : k;
      // The line with the text in.
      t.buf[t.row] = t.buf[t.row].slice(0, t.col) + text + t.buf[t.row].slice(t.col);
      // The cursor after it.
      t.col += text.length;
      // A change.
      t.modified = true;
    } else if (k === "Enter") {
      // The line splits at the cursor.
      const l = t.buf[t.row];
      // The first part stays.
      t.buf[t.row] = l.slice(0, t.col);
      // The rest goes below.
      t.buf.splice(t.row + 1, 0, l.slice(t.col));
      // The cursor at its start.
      t.row++;
      t.col = 0;
      // A change.
      t.modified = true;
    } else if (k === "Backspace") {
      // Inside a line: the character before the cursor goes.
      if (t.col > 0) {
        // Removed.
        t.buf[t.row] = t.buf[t.row].slice(0, t.col - 1) + t.buf[t.row].slice(t.col);
        // Cursor back.
        t.col--;
        // A change.
        t.modified = true;
      } else if (t.row > 0) {
        // At a line start: joined with the line above.
        const above = t.buf[t.row - 1];
        // The two lines as one.
        t.buf.splice(t.row - 1, 2, above + t.buf[t.row]);
        // The cursor where they met.
        t.row--;
        t.col = above.length;
        // A change.
        t.modified = true;
      }
    } else if (k === "Left" || k === "Right" || k === "Up" || k === "Down") {
      // Arrow keys move.
      if (k === "Left") t.col--;
      if (k === "Right") t.col++;
      if (k === "Up") t.row--;
      if (k === "Down") t.row++;
      // Kept inside.
      vimClamp(t, true);
    }
    // The message line shows the mode.
    t.msg = vimMode(t);
    // Done.
    return t;
  }
  // The command line, after ":".
  if (t.mode === "cmdline") {
    // Enter runs it.
    if (k === "Enter") vimEx(t, t.line);
    // Esc or Ctrl-C abandons it.
    else if (k === "Esc" || k === "C-c") {
      // Back to Normal mode.
      t.mode = "normal";
      // The line is cleared.
      t.msg = vimMode(t);
    } else if (k === "Backspace") {
      // On an empty line, Backspace leaves the command line.
      if (t.line === "") {
        // Normal mode.
        t.mode = "normal";
        // Message line restored.
        t.msg = vimMode(t);
      } else t.line = t.line.slice(0, -1);
    } else if (printable(k)) t.line += k;
    // Done.
    return t;
  }
  // The hit-enter prompt: any key clears it; Enter and Space are used up, other keys then act as usual.
  if (t.flags.more) {
    // Cleared.
    t.flags.more = 0;
    t.msg = vimMode(t);
    // Enter or Space only redraw.
    if (k === "Enter" || k === " ") return t;
  }
  // Normal mode: first, a pending q (start recording into a register).
  if (t.pending === "q") {
    // Consumed.
    t.pending = "";
    // A register name starts recording (repeat.txt: q{0-9a-zA-Z"}).
    if (/^[0-9a-zA-Z"]$/.test(k)) {
      // Recording.
      t.rec = k;
      // Shown in the message line.
      t.msg = vimMode(t);
    }
    // Done.
    return t;
  }
  // A pending Z: ZZ writes (if modified) and quits, ZQ quits without checking.
  if (t.pending === "Z") {
    // Consumed.
    t.pending = "";
    // ZZ: like :x.
    if (k === "Z") vimEx(t, "x");
    // ZQ: like :q!.
    else if (k === "Q") vimEx(t, "q!");
    // Done.
    return t;
  }
  // The Normal-mode commands this model knows.
  switch (k) {
    // The command line.
    case ":":
      // Command-line mode, empty.
      t.mode = "cmdline";
      t.line = "";
      t.msg = "";
      break;
    // Insert before the cursor.
    case "i":
      // Insert mode.
      t.mode = "insert";
      break;
    // Insert at the first character of the line.
    case "I":
      // Line start.
      t.col = 0;
      t.mode = "insert";
      break;
    // Append after the cursor.
    case "a":
      // One to the right (allowed past the end in Insert mode).
      t.col = Math.min(t.buf[t.row].length, t.col + 1);
      t.mode = "insert";
      break;
    // Append at the end of the line.
    case "A":
      // Line end.
      t.col = t.buf[t.row].length;
      t.mode = "insert";
      break;
    // Open a line below.
    case "o":
      // The new empty line.
      t.buf.splice(t.row + 1, 0, "");
      t.row++;
      t.col = 0;
      t.mode = "insert";
      t.modified = true;
      break;
    // Open a line above.
    case "O":
      // The new empty line.
      t.buf.splice(t.row, 0, "");
      t.col = 0;
      t.mode = "insert";
      t.modified = true;
      break;
    // Delete the character under the cursor.
    case "x":
      // Only when the line has one.
      if (t.buf[t.row].length > 0) {
        // Removed.
        t.buf[t.row] = t.buf[t.row].slice(0, t.col) + t.buf[t.row].slice(t.col + 1);
        // A change.
        t.modified = true;
      }
      break;
    // Cursor movement.
    case "h":
    case "Left":
    case "Backspace":
      t.col--;
      break;
    case "l":
    case "Right":
    case " ":
      t.col++;
      break;
    case "j":
    case "Down":
    case "Enter":
      t.row++;
      break;
    case "k":
    case "Up":
      t.row--;
      break;
    case "0":
      t.col = 0;
      break;
    case "$":
      t.col = t.buf[t.row].length;
      break;
    // Word motions.
    case "w":
      vimWord(t, false);
      break;
    case "e":
      vimWord(t, true);
      break;
    // q: stops a recording, or waits for a register to record into.
    case "q":
      // Recording: stop.
      if (t.rec) t.rec = "";
      // Otherwise wait for the register.
      else t.pending = "q";
      // The message line follows.
      t.msg = vimMode(t);
      break;
    // Z waits for its second key.
    case "Z":
      t.pending = "Z";
      break;
    // CTRL-C in Normal mode only explains how to quit (src/normal.c).
    case "C-c":
      vimMsg(t, t.modified ? "Type  :qa!  and press <Enter> to abandon all changes and exit Vim" : "Type  :qa  and press <Enter> to exit Vim");
      break;
    // Anything else: not modelled, nothing happens (Esc in Normal mode only beeps).
    default:
      break;
  }
  // Kept inside the buffer.
  vimClamp(t, t.mode === "insert");
  // When the mode changed to Insert, the message line shows it.
  if (t.mode === "insert") t.msg = vimMode(t);
  // Done.
  return t;
}

/**
 * vim's screen: the buffer, tildes past its end, and the last line.
 *
 * @param t the state
 * @returns the screen
 */
function vimView(t: Term): Screen {
  // Text rows: every row but the last.
  const rows: string[] = [];
  // Where each buffer line starts on screen (for the cursor), with wrapping.
  let cursor: { r: number; c: number } | null = null;
  // Each buffer line, wrapped.
  for (let i = 0; i < t.buf.length && rows.length < ROWS - 1; i++) {
    // The cursor's screen position, when it is on this line.
    if (i === t.row) cursor = { r: rows.length + Math.floor(t.col / COLS), c: t.col % COLS };
    // The line's rows.
    for (const r of wrap([t.buf[i]])) if (rows.length < ROWS - 1) rows.push(r);
  }
  // Past the end of the buffer, vim draws tildes.
  while (rows.length < ROWS - 1) rows.push("~");
  // The ruler: line,column (1-based; an empty line shows 0-1) and the position in the file.
  const ruler = `${t.row + 1},${t.buf[t.row].length === 0 ? "0-1" : t.col + 1}`.padEnd(14, " ") + "All";
  // The hit-enter prompt: the message wrapped at the bottom, the prompt under it, the text scrolled up.
  if (t.flags.more) {
    // The message's rows and the prompt.
    const tailRows = [...wrap([t.msg]), "Press ENTER or type command to continue"];
    // The text above them.
    const above = rows.slice(tailRows.length - 1);
    // The cursor after the prompt.
    return { lines: [...above, ...tailRows].slice(0, ROWS), cursor: { r: ROWS - 1, c: Math.min(COLS - 1, tailRows[tailRows.length - 1].length) }, inverse: [] };
  }
  // The last line: the command being typed, or the message with the ruler.
  const last = t.mode === "cmdline" ? ":" + t.line : spread(t.msg, ruler);
  // In command-line mode the cursor is on the last line.
  if (t.mode === "cmdline") cursor = { r: ROWS - 1, c: Math.min(COLS - 1, t.line.length + 1) };
  // The screen.
  return { lines: [...rows, last.slice(0, COLS)], cursor, inverse: [] };
}

// ---------------------------------------------------------------------------
// less, and man through it (less(1), less.hlp, prompt.c; man-db man(1))
// ---------------------------------------------------------------------------

/** The log file of the less level (invented addresses from RFC 5737). */
const LESS_FILE = [
  "Nov  3 08:00:01 app[812]: started, pid 812",
  "Nov  3 08:00:02 app[812]: bound 192.0.2.10:80",
  "Nov  3 08:01:13 app[812]: GET /health 200",
  "Nov  3 08:02:40 app[812]: 198.51.100.7 GET /",
  "Nov  3 08:02:41 app[812]: GET /login 200",
  "Nov  3 08:03:05 app[812]: POST /login 302",
  "Nov  3 08:04:59 app[812]: cache: 1204 keys",
  "Nov  3 08:05:00 cron[901]: (root) CMD (backup)",
  "Nov  3 08:06:12 app[812]: GET /api/items 200",
  "Nov  3 08:07:30 app[812]: slow query: 812 ms",
  "Nov  3 08:08:44 app[812]: GET /api/items 200",
  "Nov  3 08:09:01 app[812]: GET /health 200",
  "Nov  3 08:10:17 app[812]: 203.0.113.9 rate limited",
  "Nov  3 08:11:02 app[812]: GET / 200",
  "Nov  3 08:12:30 app[812]: config reloaded",
  "Nov  3 08:13:45 app[812]: GET /api/items 200",
  "Nov  3 08:14:00 app[812]: GET /health 200",
  "Nov  3 08:15:21 app[812]: POST /logout 302",
  "Nov  3 08:16:09 app[812]: GET / 304",
  "Nov  3 08:17:55 app[812]: GET /health 200",
  "Nov  3 08:18:30 app[812]: worker 3 recycled",
  "Nov  3 08:19:44 app[812]: GET /api/items 200",
  "Nov  3 08:20:00 app[812]: shutting down? no.",
];
/** The path of the less level's log, as typed after less. */
const LESS_PATH = "/var/log/app.log";
/**
 * The files less can show in a daily escape (invented text), by the path typed after less. Each is longer than one
 * screen, so the prompt shows the path first and a colon or (END) after, as on the level.
 */
const LESS_FILES: Record<string, readonly string[]> = {
  // The level's own log.
  [LESS_PATH]: LESS_FILE,
  // A queue worker's log.
  "/var/log/worker.log": [
    "08:00:00 worker[431]: starting 4 threads",
    "08:00:01 worker[431]: queue: 12 jobs",
    "08:00:03 worker[431]: job 4401 resize ok",
    "08:00:04 worker[431]: job 4402 resize ok",
    "08:00:09 worker[431]: job 4403 thumbnail ok",
    "08:00:15 worker[431]: job 4404 retry 1/3",
    "08:00:21 worker[431]: job 4404 ok",
    "08:01:02 worker[431]: queue: 7 jobs",
    "08:01:40 worker[431]: job 4405 export ok",
    "08:02:11 worker[431]: job 4406 export ok",
    "08:02:12 worker[431]: job 4407 slow: 4.1 s",
    "08:03:30 worker[431]: queue: 2 jobs",
    "08:04:02 worker[431]: job 4408 resize ok",
    "08:04:05 worker[431]: job 4409 resize ok",
    "08:05:00 worker[431]: queue empty, idle",
    "08:10:00 worker[431]: heartbeat",
    "08:15:00 worker[431]: heartbeat",
    "08:20:01 worker[431]: still not a pager",
  ],
  // The notes of a stand-up meeting.
  "notes/standup.txt": [
    "Stand-up, Tuesday 3 November",
    "",
    "Yesterday",
    "- fixed the flaky health check",
    "- reviewed the cache change",
    "- read the less manual, briefly",
    "",
    "Today",
    "- rotate the TLS certificate",
    "- pair on the queue worker",
    "- tidy the runbook",
    "",
    "Blockers",
    "- none",
    "",
    "Actions",
    "- Sam: book the post-mortem",
    "- everyone: close your pagers",
  ],
};
/** The line length man-db formats a page to: the terminal's width less one column (man-db src/man.c, get_roff_line_length). */
export const MAN_WIDTH = COLS - 1;
/**
 * The invented manual page of the man level: QUIT(1), whose advice is sound. Laid out as man-db would format it
 * for this terminal: MAN_WIDTH columns, the header and footer centred by groff, the body indented by seven
 * (review R3-05, 03/11/2026: three lines used to run past the 46th column and wrap).
 */
const MAN_PAGE = [
  "QUIT(1)         User Commands         QUIT(1)",
  "",
  "NAME",
  "       quit - leave a program cleanly",
  "",
  "SYNOPSIS",
  "       quit [--really]",
  "",
  "DESCRIPTION",
  "       There is no quit command. Each program",
  "       has its own way out, written in its",
  "       manual. This page is shown by a pager;",
  "       the pager's own key leaves it.",
  "",
  "SEE ALSO",
  "       less(1), man(1)",
  "",
  "GNU              2026-11-03           QUIT(1)",
];
/** The first lines of less's own help screen (less.hlp), shown by h. */
const LESS_HELP = [
  "",
  "                   SUMMARY OF LESS COMMANDS",
  "",
  "      Commands marked with * may be preceded by a number, N.",
  "      Notes in parentheses indicate the behavior if N is given.",
  "      A key preceded by a caret indicates the Ctrl key; thus ^K is ctrl-K.",
  "",
  "  h  H                 Display this help.",
  "  q  :q  Q  :Q  ZZ     Exit.",
  " ---------------------------------------------------------------------------",
  "",
  "                           MOVING",
  "",
  "  e  ^E  j  ^N  CR  *  Forward  one line   (or N lines).",
  "  y  ^Y  k  ^K  ^P  *  Backward one line   (or N lines).",
  "  f  ^F  ^V  SPACE  *  Forward  one window (or N lines).",
  "  b  ^B  ESC-v      *  Backward one window (or N lines).",
];

/**
 * less at the start of a level, or of a daily scene.
 *
 * @param ctx "file" for less on a file, "man" for man showing a page
 * @param scene a daily scene: for "file", the path ("file"); for "man", where the page was left ("where": "top" or
 *              "end"); empty for the level (the app log, or the page's first line)
 * @returns the state
 */
function lessInit(ctx: "file" | "man", scene: Scene = {}): Term {
  // The text: the manual page, or the scene's file (the level's log without a scene).
  const text = ctx === "man" ? MAN_PAGE : (LESS_FILES[scene.file ?? LESS_PATH] ?? LESS_FILE);
  // The top line: the page's last screen when the scene left it at its end, the first line otherwise.
  const top = scene.where === "end" ? Math.max(0, wrap(text).length - (ROWS - 1)) : 0;
  // The text, the top line, the first prompt not yet shown.
  return term("less", { ctx, buf: text.slice(), mode: "view", n: top, flags: { first: 1, helpTop: 0 }, scene: { ...scene } });
}

/**
 * One key in less.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function lessStep(s: Term, k: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // Rows of text on a screen (all but the prompt).
  const page = ROWS - 1;
  // The text being shown: the help, or the file.
  const text = t.mode === "help" ? LESS_HELP : t.buf;
  // The last useful top line.
  const maxTop = Math.max(0, wrap(text).length - page);
  // The current top line.
  let top = t.mode === "help" ? t.flags.helpTop : t.n;
  // Ctrl-Z suspends.
  if (k === "C-z") {
    // Stopped.
    suspend(t, t.ctx === "man" ? "man quit" : `less ${named(t, "file", LESS_PATH)}`);
    // Done.
    return t;
  }
  // After ":" (a two-key command): :q and :Q exit.
  if (t.pending === ":") {
    // Consumed.
    t.pending = "";
    // Exit, or leave the help.
    if (k === "q" || k === "Q") {
      // In the help: back to the file.
      if (t.mode === "help") t.mode = "view";
      // Otherwise gone.
      else t.outcome = "exit";
    }
    // Done.
    return t;
  }
  // After Z: ZZ exits.
  if (t.pending === "Z") {
    // Consumed.
    t.pending = "";
    // ZZ.
    if (k === "Z") {
      // In the help: back to the file.
      if (t.mode === "help") t.mode = "view";
      // Otherwise gone.
      else t.outcome = "exit";
    }
    // Done.
    return t;
  }
  // After ESC: the next key completes an ESC command; none of them exits.
  if (t.pending === "Esc") {
    // Consumed, nothing else happens in this model.
    t.pending = "";
    // Done.
    return t;
  }
  // A key typed now is no longer the first prompt.
  t.flags.first = 0;
  // The single-key commands.
  switch (k) {
    // q and Q exit (in the help, they end the help).
    case "q":
    case "Q":
      if (t.mode === "help") t.mode = "view";
      else t.outcome = "exit";
      return t;
    // Two-key commands wait.
    case ":":
    case "Z":
    case "Esc":
      t.pending = k;
      return t;
    // Help.
    case "h":
    case "H":
      t.mode = "help";
      t.flags.helpTop = 0;
      return t;
    // Forward one line.
    case "e":
    case "j":
    case "Enter":
    case "Down":
    case "C-e":
    case "C-n":
      top++;
      break;
    // Backward one line.
    case "y":
    case "k":
    case "Up":
    case "C-y":
    case "C-k":
    case "C-p":
      top--;
      break;
    // Forward one window.
    case "f":
    case " ":
    case "C-f":
    case "C-v":
      top += page;
      break;
    // Backward one window.
    case "b":
    case "C-b":
      top -= page;
      break;
    // The start and the end.
    case "g":
    case "<":
      top = 0;
      break;
    case "G":
    case ">":
      top = maxTop;
      break;
    // Ctrl-C only interrupts what less is doing; without -K it does not exit (less(1) -K).
    default:
      break;
  }
  // Kept between the first and the last screen.
  top = Math.max(0, Math.min(maxTop, top));
  // Stored where it belongs.
  if (t.mode === "help") t.flags.helpTop = top;
  else t.n = top;
  // Done.
  return t;
}

/**
 * less's screen: a window of the text and the prompt line.
 *
 * @param t the state
 * @returns the screen
 */
function lessView(t: Term): Screen {
  // The text being shown.
  const rows = wrap(t.mode === "help" ? LESS_HELP : t.buf);
  // The top line.
  const top = t.mode === "help" ? t.flags.helpTop : t.n;
  // The window.
  const win = rows.slice(top, top + ROWS - 1);
  // At the end of the text?
  const atEnd = top + ROWS - 1 >= rows.length;
  // Short text: tildes fill the rest, as less does past the end of a file.
  while (win.length < ROWS - 1) win.push("~");
  // The prompt: the help's own, man-db's, or less's default one.
  let prompt: string;
  // In the help (prompt.c h_proto).
  if (t.mode === "help") prompt = atEnd ? "HELP -- END -- Press g to see it again, or q when done" : "HELP -- Press RETURN for more, or q when done";
  // man-db's prompt: "Manual page quit(1) line N", (END) at the end.
  else if (t.ctx === "man") prompt = ` Manual page quit(1) line ${top + 1}${atEnd ? " (END)" : ""} (press h for help or q to quit)`;
  // less's default prompt: the file name at first, (END) at the end, a colon otherwise.
  else prompt = t.flags.first ? named(t, "file", LESS_PATH) : atEnd ? "(END)" : ":";
  // A pending two-key command shows its first key instead of a prompt.
  if (t.pending === ":") prompt = ":";
  // The prompt is drawn in reverse video, except less's plain colon.
  const plain = t.mode !== "help" && t.ctx !== "man" && prompt === ":";
  // A prompt longer than the screen keeps its end: less drops characters from its start until it fits, one column
  // kept for the cursor (line.c, load_line). man-db's prompt is wider than this terminal, so it shows its tail,
  // "(press h for help or q to quit)" included (review R3-05, 03/11/2026: it used to be cut at its end instead).
  const shown = prompt.length > COLS - 1 ? prompt.slice(prompt.length - (COLS - 1)) : prompt;
  // The screen.
  return { lines: [...win.map((l) => l.slice(0, COLS)), shown], cursor: { r: ROWS - 1, c: Math.min(COLS - 1, plain ? 1 : shown.length) }, inverse: plain ? [] : [ROWS - 1] };
}

// ---------------------------------------------------------------------------
// nano (the GNU nano manual, its cheat sheet, src/nano.c "Save modified buffer?")
// ---------------------------------------------------------------------------

/** The file of the nano level. */
const NANO_FILE = "todo.txt";
/** Its lines. */
const NANO_TEXT = ["Buy milk", "Renew the TLS certificate", "Learn how to leave nano"];
/** The files nano can have open in a daily escape, with their lines. */
const NANO_FILES: Record<string, readonly string[]> = {
  // The level's own list.
  [NANO_FILE]: NANO_TEXT,
  // A shopping list.
  "shopping.txt": ["Coffee", "A spare HDMI cable", "A book on nano, just in case"],
  // A server's message of the day.
  motd: ["Welcome to web01.", "Maintenance on Friday, 22:00 UTC.", "Please log out when you are done."],
};
/** The line typed into nano and never saved, in a daily scene with changes. */
const NANO_TYPED = "Remember to save this";

/**
 * nano at the start of a level, or of a daily scene.
 *
 * @param scene a daily scene: the file ("file") and whether a line was typed and never saved ("changed": "yes" or
 *              "no"); empty for the level (todo.txt, unmodified)
 * @returns the state
 */
function nanoInit(scene: Scene = {}): Term {
  // The file's text: the scene's, or the level's list.
  const text = NANO_FILES[scene.file ?? NANO_FILE] ?? NANO_TEXT;
  // With changes: a line typed at the end and never written, the cursor after it, the title bar saying Modified.
  if (scene.changed === "yes") return term("nano", { buf: [...text, NANO_TYPED], saved: text.slice(), modified: true, row: text.length, col: NANO_TYPED.length, mode: "edit", flags: { esc: 0 }, scene: { ...scene } });
  // Editing, unmodified, cursor at the top.
  return term("nano", { buf: text.slice(), mode: "edit", flags: { esc: 0 }, scene: { ...scene } });
}

/**
 * Leave nano.
 *
 * @param t the state (changed in place)
 */
function nanoExit(t: Term): void {
  // Gone, cleanly.
  t.outcome = "exit";
}

/**
 * One key in nano.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function nanoStep(s: Term, k0: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // The key, possibly turned into a control key by Esc Esc (manual, Commands).
  let k = k0;
  // Esc pressed twice, then a key: that key as a control key.
  if (t.flags.esc === 2 && printable(k)) {
    // The control combination.
    k = "C-" + k.toLowerCase();
    // Consumed.
    t.flags.esc = 0;
  } else if (t.flags.esc === 1 && printable(k)) {
    // Esc once, then a key: a Meta combination; none of them exits, and this model does not act on them.
    t.flags.esc = 0;
    // Done.
    return t;
  }
  // Esc counts towards the Meta and Control fallbacks.
  if (k === "Esc") {
    // One more Esc (a third starts over).
    t.flags.esc = t.flags.esc >= 2 ? 1 : t.flags.esc + 1;
    // Done.
    return t;
  }
  // Any other key clears the Esc count.
  t.flags.esc = 0;
  // The "Save modified buffer?" question.
  if (t.mode === "save") {
    // Yes: ask for the file name.
    if (k === "y" || k === "Y") {
      // The prompt, with the current name filled in (the scene's file, or the level's).
      t.mode = "fname";
      t.line = named(t, "file", NANO_FILE);
    } else if (k === "n" || k === "N") {
      // No: leave without saving (still a clean exit).
      nanoExit(t);
    } else if (k === "C-c") {
      // Cancel: back to editing.
      t.mode = "edit";
      t.msg = "Cancelled";
    }
    // Other keys are ignored at the question.
    return t;
  }
  // The file-name prompt.
  if (t.mode === "fname") {
    // Enter writes and leaves.
    if (k === "Enter") {
      // Written.
      t.saved = t.buf.slice();
      t.modified = false;
      // Gone.
      nanoExit(t);
    } else if (k === "C-c") {
      // Cancelled.
      t.mode = "edit";
      t.msg = "Cancelled";
    } else if (k === "Backspace") t.line = t.line.slice(0, -1);
    else if (printable(k)) t.line += k;
    // Done.
    return t;
  }
  // Editing: a message lasts until the next key.
  t.msg = "";
  // Ctrl-X: close the buffer and exit (asking first when it is modified).
  if (k === "C-x") {
    // Modified: the question.
    if (t.modified) t.mode = "save";
    // Unmodified: gone.
    else nanoExit(t);
    // Done.
    return t;
  }
  // Ctrl-C reports the cursor position (cheat sheet: "Report cursor position").
  if (k === "C-c") {
    // Characters before the cursor, counting the newlines.
    const before = t.buf.slice(0, t.row).reduce((n, l) => n + l.length + 1, 0) + t.col;
    // All characters, with a newline after every line.
    const total = t.buf.reduce((n, l) => n + l.length + 1, 0);
    // Percentages, rounded down.
    const pct = (a: number, b: number) => Math.floor((a * 100) / Math.max(1, b));
    // nano's report.
    t.msg = `[ line ${t.row + 1}/${t.buf.length} (${pct(t.row + 1, t.buf.length)}%), col ${t.col + 1}/${t.buf[t.row].length + 1} (${pct(t.col + 1, t.buf[t.row].length + 1)}%), char ${before}/${total} (${pct(before, total)}%) ]`;
    // Done.
    return t;
  }
  // Typing goes into the file.
  if (printable(k) || k === "Tab") {
    // The text (Tab as spaces to the next stop of eight in this model).
    const text = k === "Tab" ? " ".repeat(8 - (t.col % 8)) : k;
    // Inserted.
    t.buf[t.row] = t.buf[t.row].slice(0, t.col) + text + t.buf[t.row].slice(t.col);
    t.col += text.length;
    // Modified.
    t.modified = true;
  } else if (k === "Enter") {
    // The line splits.
    const l = t.buf[t.row];
    t.buf[t.row] = l.slice(0, t.col);
    t.buf.splice(t.row + 1, 0, l.slice(t.col));
    t.row++;
    t.col = 0;
    t.modified = true;
  } else if (k === "Backspace") {
    // The character before the cursor.
    if (t.col > 0) {
      t.buf[t.row] = t.buf[t.row].slice(0, t.col - 1) + t.buf[t.row].slice(t.col);
      t.col--;
      t.modified = true;
    } else if (t.row > 0) {
      // Joined with the line above.
      const above = t.buf[t.row - 1];
      t.buf.splice(t.row - 1, 2, above + t.buf[t.row]);
      t.row--;
      t.col = above.length;
      t.modified = true;
    }
  } else if (k === "Left") t.col = Math.max(0, t.col - 1);
  else if (k === "Right") t.col = Math.min(t.buf[t.row].length, t.col + 1);
  else if (k === "Up" || k === "Down") {
    // Up or down a line, the column kept inside it.
    t.row = Math.max(0, Math.min(t.buf.length - 1, t.row + (k === "Up" ? -1 : 1)));
    t.col = Math.min(t.col, t.buf[t.row].length);
  }
  // Done (other control keys are not modelled).
  return t;
}

/**
 * nano's screen: title bar, the text, the status line and two lines of shortcuts.
 *
 * @param t the state
 * @returns the screen
 */
function nanoView(t: Term): Screen {
  // The title bar: version, file name, "Modified" on the right when changed (manual, "The title bar").
  const title = spread("  GNU nano 9.3", t.modified ? "Modified  " : "").split("");
  // The file name, centred (the scene's file, or the level's).
  const name = named(t, "file", NANO_FILE);
  // Its start column.
  const at = Math.floor((COLS - name.length) / 2);
  // Written into the bar.
  for (let i = 0; i < name.length; i++) title[at + i] = name[i];
  // The text rows (ROWS minus the title, the status line and two shortcut lines).
  const rows = wrap(t.buf).slice(0, ROWS - 4);
  // Padded.
  while (rows.length < ROWS - 4) rows.push("");
  // The status line: a prompt, or a message.
  let status = t.msg ? `[ ${t.msg} ]`.replace("[ [", "[").replace("] ]", "]") : "";
  // The question and the file-name prompt replace it.
  if (t.mode === "save") status = "Save modified buffer? ";
  if (t.mode === "fname") status = "File Name to Write: " + t.line;
  // The shortcut lines: the answers at the question, the main ones otherwise.
  const keys1 = t.mode === "save" ? " Y Yes" : t.mode === "fname" ? "^G Help          M-D DOS Format" : "^G Help      ^O Write Out ^F Where Is";
  const keys2 = t.mode === "save" ? " N No           ^C Cancel" : t.mode === "fname" ? "^C Cancel        M-M Mac Format" : "^X Exit       ^R Read File ^C Location";
  // The cursor: in the text, or at the end of the prompt.
  const cursor = t.mode === "edit" ? { r: 1 + t.row, c: Math.min(COLS - 1, t.col) } : { r: ROWS - 3, c: Math.min(COLS - 1, status.length) };
  // The screen; the title and a prompt are drawn in reverse video.
  return { lines: [title.join(""), ...rows, status.slice(0, COLS), keys1.slice(0, COLS), keys2.slice(0, COLS)], cursor, inverse: t.mode === "edit" && !t.msg ? [0] : [0, ROWS - 3] };
}

// ---------------------------------------------------------------------------
// Emacs (GNU Emacs manual, "Exiting Emacs"; lisp/startup.el's scratch message)
// ---------------------------------------------------------------------------

/** The *scratch* buffer's opening text (startup.el, initial-scratch-message). */
const SCRATCH = [";; This buffer is for text that is not saved, and for Lisp evaluation.", ";; To create a file, visit it with C-x C-f and enter text in its buffer.", ""];
/** The commands that kill Emacs from M-x. */
const EMACS_KILL = new Set(["kill-emacs", "save-buffers-kill-terminal", "save-buffers-kill-emacs"]);

/** What was typed into *scratch* in a daily scene with text in it (the level's exits already type there first). */
const SCRATCH_TYPED = "(+ 2 2)";

/**
 * Emacs at the start of a level, or of a daily scene: started with no file, so *scratch* is in front.
 *
 * @param scene a daily scene: whether something was typed into *scratch* ("typed": "yes" or "no"); empty for the level
 * @returns the state
 */
function emacsInit(scene: Scene = {}): Term {
  // Text typed on the last line: the buffer is modified, the cursor after the text.
  if (scene.typed === "yes") return term("emacs", { buf: [...SCRATCH.slice(0, 2), SCRATCH_TYPED], row: 2, col: SCRATCH_TYPED.length, mode: "edit", modified: true, scene: { ...scene } });
  // The scratch buffer, cursor on its empty last line.
  return term("emacs", { buf: SCRATCH.slice(), row: 2, col: 0, mode: "edit", scene: { ...scene } });
}

/**
 * The name Emacs uses for a key in its messages ("C-c", "q", "RET").
 *
 * @param k the key
 * @returns the description
 */
function emacsKeyName(k: Key): string {
  // The names Emacs uses for the named keys.
  const names: Record<string, string> = { Enter: "RET", Esc: "ESC", Backspace: "DEL", Tab: "TAB", Up: "<up>", Down: "<down>", Left: "<left>", Right: "<right>", " ": "SPC" };
  // The name, or the key itself.
  return names[k] ?? k;
}

/**
 * One key in Emacs.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function emacsStep(s: Term, k: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // C-g quits whatever is in progress, everywhere ("Quit" in the echo area).
  if (k === "C-g") {
    // Prefix and minibuffer abandoned.
    t.pending = "";
    t.mode = "edit";
    t.line = "";
    // The echo area.
    t.msg = "Quit";
    // Done.
    return t;
  }
  // The minibuffer, after M-x.
  if (t.mode === "mx") {
    // Enter runs the command.
    if (k === "Enter") {
      // A command that kills Emacs.
      if (EMACS_KILL.has(t.line.trim())) t.outcome = "exit";
      // Anything else: no such command in this model.
      else t.msg = "[No match]";
      // Done.
      return t;
    }
    // Editing the command name.
    if (k === "Backspace") t.line = t.line.slice(0, -1);
    else if (printable(k)) t.line += k;
    // The message goes as soon as the player types again.
    t.msg = "";
    // Done.
    return t;
  }
  // After C-x.
  if (t.pending === "C-x") {
    // Consumed.
    t.pending = "";
    // The echo area clears.
    t.msg = "";
    // C-x C-c: save-buffers-kill-terminal; *scratch* visits no file, so nothing is offered for saving.
    if (k === "C-c") t.outcome = "exit";
    // Other C-x keys are not modelled here.
    return t;
  }
  // After C-c: a letter after C-c is reserved for users and unbound by default.
  if (t.pending === "C-c") {
    // Consumed.
    t.pending = "";
    // Emacs reports the undefined sequence.
    t.msg = printable(k) ? `C-c ${emacsKeyName(k)} is undefined` : "";
    // Done.
    return t;
  }
  // After ESC (Meta): ESC x is M-x; ESC ESC ESC is keyboard-escape-quit, which leaves nothing on screen.
  if (t.pending === "Esc" || t.pending === "EscEsc") {
    // ESC x: the minibuffer.
    if (t.pending === "Esc" && k === "x") {
      // Open it.
      t.pending = "";
      t.mode = "mx";
      t.line = "";
      t.msg = "";
      // Done.
      return t;
    }
    // A second and a third ESC.
    if (k === "Esc") {
      // Second: wait for the third; third: everything cancelled.
      t.pending = t.pending === "Esc" ? "EscEsc" : "";
      // Done.
      return t;
    }
    // Any other key after ESC: not modelled, cancelled.
    t.pending = "";
    // Done.
    return t;
  }
  // The echo area clears on the next key.
  t.msg = "";
  // The prefix keys.
  if (k === "C-x" || k === "C-c") {
    // Waiting for the next key; Emacs echoes the prefix.
    t.pending = k;
    t.msg = `${k}-`;
    // Done.
    return t;
  }
  // ESC starts a Meta key.
  if (k === "Esc") {
    // Waiting.
    t.pending = "Esc";
    // Done.
    return t;
  }
  // C-z suspends Emacs on a text terminal ("Exiting Emacs").
  if (k === "C-z") {
    // Stopped, not gone.
    suspend(t, "emacs");
    // Done.
    return t;
  }
  // Typing goes into *scratch* (which is never saved).
  if (printable(k)) {
    // Inserted.
    t.buf[t.row] = t.buf[t.row].slice(0, t.col) + k + t.buf[t.row].slice(t.col);
    t.col++;
    t.modified = true;
  } else if (k === "Enter") {
    // A new line.
    const l = t.buf[t.row];
    t.buf[t.row] = l.slice(0, t.col);
    t.buf.splice(t.row + 1, 0, l.slice(t.col));
    t.row++;
    t.col = 0;
    t.modified = true;
  } else if (k === "Backspace" && t.col > 0) {
    // The character before the cursor.
    t.buf[t.row] = t.buf[t.row].slice(0, t.col - 1) + t.buf[t.row].slice(t.col);
    t.col--;
    t.modified = true;
  } else if (k === "Left") t.col = Math.max(0, t.col - 1);
  else if (k === "Right") t.col = Math.min(t.buf[t.row].length, t.col + 1);
  else if (k === "Up" || k === "Down") {
    // A line up or down.
    t.row = Math.max(0, Math.min(t.buf.length - 1, t.row + (k === "Up" ? -1 : 1)));
    t.col = Math.min(t.col, t.buf[t.row].length);
  }
  // Done.
  return t;
}

/**
 * Emacs's screen: the buffer, the mode line, the echo area.
 *
 * @param t the state
 * @returns the screen
 */
function emacsView(t: Term): Screen {
  // The buffer's rows, wrapped.
  const rows: string[] = [];
  // The cursor's screen position.
  let cursor: { r: number; c: number } | null = null;
  // Each line.
  for (let i = 0; i < t.buf.length && rows.length < ROWS - 2; i++) {
    // The cursor, when on this line (continued rows hold COLS - 1 characters).
    if (i === t.row) cursor = { r: rows.length + Math.floor(t.col / (COLS - 1)), c: t.col % (COLS - 1) };
    // The rows: a long line continues on the next row, with a backslash in the last column.
    const l = t.buf[i];
    // Each piece of COLS - 1 characters (an empty line is one empty row).
    for (let c = 0; c === 0 || c < l.length; c += COLS - 1) if (rows.length < ROWS - 2) rows.push(l.slice(c, c + COLS - 1) + (c + COLS - 1 < l.length ? "\\" : ""));
  }
  // Padded.
  while (rows.length < ROWS - 2) rows.push("");
  // The mode line: coding systems, modified flag, buffer, position, line, major mode.
  const mode = bar(`-UUU:${t.modified ? "**" : "--"}--F1  *scratch*   All L${t.row + 1}   (Lisp Interaction)`);
  // The echo area, or the minibuffer.
  const echo = t.mode === "mx" ? "M-x " + t.line : t.msg;
  // In the minibuffer, the cursor is there.
  if (t.mode === "mx") cursor = { r: ROWS - 1, c: Math.min(COLS - 1, echo.length) };
  // The screen; the mode line is in reverse video.
  return { lines: [...rows, mode, echo.slice(0, COLS)], cursor, inverse: [ROWS - 2] };
}

// ---------------------------------------------------------------------------
// top (procps-ng top(1): q quits, ^C also ends it; e, i, t are display toggles)
// ---------------------------------------------------------------------------

/** The processes top lists (invented): pid, user, state, %CPU, resident memory in KiB, command. */
const TOP_TASKS: [number, string, string, number, number, string][] = [
  [812, "app", "R", 12.3, 412_880, "app"],
  [1, "root", "S", 0.0, 13_212, "systemd"],
  [455, "root", "S", 0.3, 22_016, "sshd"],
  [901, "root", "S", 0.0, 3_892, "cron"],
  [1290, "postgres", "S", 1.7, 188_420, "postgres"],
  [1302, "www-data", "S", 0.7, 9_984, "nginx"],
  [2001, "you", "S", 0.0, 5_312, "bash"],
  [2044, "you", "R", 0.3, 4_220, "top"],
];

/**
 * A whole number from a scene's switch, kept inside a range.
 *
 * @param v the switch's text, or undefined
 * @param own the value without it
 * @param max the largest allowed value
 * @returns the number
 */
function sceneInt(v: string | undefined, own: number, max: number): number {
  // Parsed, or the default.
  const n = v === undefined ? own : Number.parseInt(v, 10);
  // Inside 0..max, the default when it is not a number.
  return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : own;
}

/**
 * top at the start of a level, or of a daily scene (the display left with some toggles already pressed).
 *
 * @param scene a daily scene: the memory scale ("scale", 0 to 2), idle tasks shown ("idle", 1) or hidden (0), and the
 *              CPU line's look ("cpu", 0 to 3); empty for the level
 * @returns the state
 */
function topInit(scene: Scene = {}): Term {
  // The toggles: the scene's, or none yet (memory in KiB, idle tasks shown, CPU line detailed).
  return term("top", { flags: { scale: sceneInt(scene.scale, 0, 2), idle: sceneInt(scene.idle, 1, 1), cpu: sceneInt(scene.cpu, 0, 3) }, scene: { ...scene } });
}

/**
 * One key in top.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function topStep(s: Term, k: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // q quits; the interrupt key ends it too (top(1), Operation).
  if (k === "q" || k === "C-c") t.outcome = "exit";
  // Ctrl-Z stops it.
  else if (k === "C-z") suspend(t, "top");
  // e: Enforce-Task-Memory-Scale, cycling KiB, MiB, GiB, TiB, PiB, EiB.
  else if (k === "e") t.flags.scale = (t.flags.scale + 1) % 6;
  // i: Idle-Process toggle.
  else if (k === "i") t.flags.idle = t.flags.idle ? 0 : 1;
  // t: Task/Cpu-States toggle, four ways (detailed, bars, blocks, off).
  else if (k === "t") t.flags.cpu = (t.flags.cpu + 1) % 4;
  // Everything else (Esc, Enter, x's highlighting) changes nothing this model draws.
  return t;
}

/**
 * A memory amount in top's task area at a scale.
 *
 * @param kib the amount in KiB
 * @param scale 0 (KiB) to 5 (EiB)
 * @returns the text, with a scale letter after KiB
 */
function topMem(kib: number, scale: number): string {
  // KiB: the plain number.
  if (scale === 0) return String(kib);
  // Scaled down by 1024 per step, with the scale letter.
  const v = kib / Math.pow(1024, scale);
  // Small values keep more decimals, as top does.
  return (v < 10 ? v.toFixed(3) : v < 100 ? v.toFixed(2) : v.toFixed(1)).replace(/0+$/, "").replace(/\.$/, "") + "mgtpe"[scale - 1];
}

/**
 * top's screen: the summary area and the task list, cut at the terminal's width.
 *
 * @param t the state
 * @returns the screen
 */
function topView(t: Term): Screen {
  // The summary lines.
  const lines: string[] = ["top - 08:42:07 up 12 days,  3:14,  1 user,  load average: 0.31, 0.24, 0.19"];
  // The task and CPU lines, unless toggled off.
  if (t.flags.cpu !== 3) {
    // Tasks.
    lines.push("Tasks:  96 total,   2 running,  94 sleeping,   0 stopped,   0 zombie");
    // The CPU line: detailed, or an abbreviated graph.
    if (t.flags.cpu === 0) lines.push("%Cpu(s):  2.3 us,  0.7 sy,  0.0 ni, 96.8 id,  0.1 wa,  0.0 hi,  0.1 si,  0.0 st");
    else lines.push(`%Cpu(s):   2.3/0.7     3[${(t.flags.cpu === 1 ? "|" : "#").repeat(2)}${" ".repeat(18)}]`);
  }
  // Memory.
  lines.push("MiB Mem :   7951.2 total,   1032.4 free,   2310.8 used,   4608.0 buff/cache");
  lines.push("MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   5320.6 avail Mem");
  // The gap and the column headings.
  lines.push("", "    PID USER      PR  NI     RES S  %CPU COMMAND");
  // The tasks: idle ones hidden by the toggle.
  for (const [pid, user, st, cpu, res, cmd] of TOP_TASKS) {
    // Hidden when idle tasks are off and this one is not running.
    if (!t.flags.idle && st !== "R") continue;
    // One row.
    lines.push(`${String(pid).padStart(7)} ${user.padEnd(8).slice(0, 8)}  20   0 ${topMem(res, t.flags.scale).padStart(7)} ${st}  ${cpu.toFixed(1).padStart(4)} ${cmd}`);
  }
  // Exactly ROWS, each cut at the width (top truncates rather than wraps).
  const out = lines.slice(0, ROWS).map((l) => l.slice(0, COLS));
  // Padded.
  while (out.length < ROWS) out.push("");
  // The screen; the heading row is in reverse video.
  return { lines: out, cursor: null, inverse: [out.findIndex((l) => l.startsWith("    PID"))] };
}

// ---------------------------------------------------------------------------
// The Python REPL (Python tutorial, "Invoking the Interpreter"; Lib/_sitebuiltins.py, 3.12)
// ---------------------------------------------------------------------------

/** The REPL's banner (the version this level plays). */
const PY_BANNER = ["Python 3.12.3 (main, Apr 10 2024, 05:33:47) [GCC 13.2.0] on linux", 'Type "help", "copyright", "credits" or "license" for more information.'];

/** What a daily scene had typed at the prompt before the trap closed, by its "history" switch. */
const PY_HISTORY: Record<string, string> = {
  // exit without brackets: 3.12 only says how to leave.
  exit: "exit",
  // sys imported, which makes sys.exit() a way out too.
  sys: "import sys",
  // A sum, answered.
  math: "6 * 7",
};

/**
 * The REPL at the start of a level, or of a daily scene.
 *
 * @param scene a daily scene: what had been typed already ("history": "none", "exit", "sys" or "math"), run through
 *              the model as if typed; empty for the level (the banner alone)
 * @returns the state
 */
function pyInit(scene: Scene = {}): Term {
  // The banner as scrollback, an empty input line.
  const t = term("python", { buf: PY_BANNER.slice(), flags: { sys: 0 }, scene: { ...scene } });
  // A line typed before, with its answer, exactly as the REPL model gives it.
  const typed = PY_HISTORY[scene.history ?? "none"];
  // Run, when there is one.
  if (typed) pyRun(t, typed);
  // The state.
  return t;
}

/**
 * Evaluate a tiny arithmetic expression (integers, + - * / and brackets), as the REPL would echo it.
 *
 * @param src the expression
 * @returns the result's repr, or null when it is not such an expression
 */
function pyArith(src: string): string | null {
  // Only digits, operators, brackets and spaces.
  if (!/^[\d\s+\-*/().]+$/.test(src) || !/\d/.test(src)) return null;
  // The tokens.
  const toks = src.match(/\d+|[+\-*/()]/g) ?? [];
  // The read position.
  let i = 0;
  // Whether a true division happened (the result is then a float).
  let float = false;
  // expr := term (("+" | "-") term)*
  const expr = (): number => {
    // The first term.
    let v = termP();
    // Further terms.
    while (toks[i] === "+" || toks[i] === "-") v = toks[i++] === "+" ? v + termP() : v - termP();
    // The value.
    return v;
  };
  // term := factor (("*" | "/") factor)*
  const termP = (): number => {
    // The first factor.
    let v = factor();
    // Further factors.
    while (toks[i] === "*" || toks[i] === "/") {
      // The operator.
      const op = toks[i++];
      // The next factor.
      const r = factor();
      // Division is true division in Python 3.
      if (op === "/") {
        // Division by zero is an error, not a number.
        if (r === 0) throw new Error("zero");
        // A float result.
        float = true;
        v = v / r;
      } else v = v * r;
    }
    // The value.
    return v;
  };
  // factor := number | "(" expr ")" | "-" factor
  const factor = (): number => {
    // The token.
    const tok = toks[i++];
    // A bracketed expression.
    if (tok === "(") {
      // Inside.
      const v = expr();
      // The closing bracket must follow.
      if (toks[i++] !== ")") throw new Error("syntax");
      // The value.
      return v;
    }
    // Unary minus.
    if (tok === "-") return -factor();
    // A number.
    if (tok !== undefined && /^\d+$/.test(tok)) return Number(tok);
    // Anything else is a syntax error.
    throw new Error("syntax");
  };
  // Evaluate, all tokens consumed.
  try {
    // The value.
    const v = expr();
    // Leftover tokens: not a valid expression.
    if (i !== toks.length) return null;
    // Floats print with a decimal point.
    if (float) return Number.isInteger(v) ? v.toFixed(1) : String(v);
    // Integers as they are.
    return String(v);
  } catch (e) {
    // Division by zero has its own traceback.
    if ((e as Error).message === "zero") return "ZeroDivisionError";
    // Otherwise not something this model evaluates.
    return null;
  }
}

/**
 * Run one line typed at the >>> prompt.
 *
 * @param t the state (changed in place)
 * @param line the line
 */
function pyRun(t: Term, line: string): void {
  // The line goes into the scrollback after the prompt.
  t.buf.push(">>> " + line);
  // Spaces around do not matter here.
  const src = line.trim();
  // An empty line: a new prompt.
  if (src === "") return;
  // The documented ways out: exit(), quit() (with or without a status), raise SystemExit, and sys.exit() once sys is imported.
  if (/^(exit|quit)\((\d*)\)$/.test(src) || /^raise SystemExit(\(\d*\))?$/.test(src) || (t.flags.sys && /^sys\.exit\((\d*)\)$/.test(src))) {
    // Gone.
    t.outcome = "exit";
    // Done.
    return;
  }
  // The bare names print their repr (Quitter.__repr__ in _sitebuiltins.py, 3.12).
  if (src === "exit" || src === "quit") {
    // "Use exit() or Ctrl-D (i.e. EOF) to exit".
    t.buf.push(`Use ${src}() or Ctrl-D (i.e. EOF) to exit`);
    // Done.
    return;
  }
  // help's repr.
  if (src === "help") {
    // _Helper.__repr__.
    t.buf.push("Type help() for interactive help, or help(object) for help about object.");
    // Done.
    return;
  }
  // import of a module name: silent; sys is remembered.
  const imp = /^import ([A-Za-z_][A-Za-z0-9_]*)$/.exec(src);
  // An import.
  if (imp) {
    // sys becomes available.
    if (imp[1] === "sys") t.flags.sys = 1;
    // Done.
    return;
  }
  // The traceback header used by the errors below.
  const tb = ["Traceback (most recent call last):", '  File "<stdin>", line 1, in <module>'];
  // sys.exit() before importing sys (3.12 suggests the import).
  if (/^sys\./.test(src) && !t.flags.sys) {
    // The NameError with the suggestion (What's New in Python 3.12).
    t.buf.push(...tb, "NameError: name 'sys' is not defined. Did you forget to import 'sys'?");
    // Done.
    return;
  }
  // print of a string literal prints it.
  const pr = /^print\((['"])(.*)\1\)$/.exec(src);
  // A print.
  if (pr) {
    // The text.
    t.buf.push(pr[2]);
    // Done.
    return;
  }
  // A call of a name that is not defined.
  const call = /^([A-Za-z_][A-Za-z0-9_]*)\(.*\)$/.exec(src);
  // NameError for the name.
  if (call) {
    // The traceback.
    t.buf.push(...tb, `NameError: name '${call[1]}' is not defined`);
    // Done.
    return;
  }
  // A bare name that is not defined.
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(src)) {
    // NameError.
    t.buf.push(...tb, `NameError: name '${src}' is not defined`);
    // Done.
    return;
  }
  // Arithmetic is evaluated and echoed.
  const v = pyArith(src);
  // Division by zero.
  if (v === "ZeroDivisionError") {
    // Its traceback.
    t.buf.push(...tb, "ZeroDivisionError: division by zero");
    // Done.
    return;
  }
  // A value.
  if (v !== null) {
    // Echoed.
    t.buf.push(v);
    // Done.
    return;
  }
  // Anything else this model treats as a syntax error, with the caret under the first character.
  t.buf.push('  File "<stdin>", line 1', "    " + line.trimStart(), "    ^", "SyntaxError: invalid syntax");
}

/**
 * One key at the REPL.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function pyStep(s: Term, k: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // Ctrl-D (end of file) at the primary prompt, on an empty line, exits (the tutorial).
  if (k === "C-d") {
    // Only on an empty line.
    if (t.line === "") t.outcome = "exit";
    // Done.
    return t;
  }
  // Ctrl-C: KeyboardInterrupt, a fresh prompt.
  if (k === "C-c") {
    // The abandoned line.
    t.buf.push(">>> " + t.line, "KeyboardInterrupt");
    // Cleared.
    t.line = "";
    // Done.
    return t;
  }
  // Ctrl-Z on Unix stops the interpreter (it is not the end-of-file key there).
  if (k === "C-z") {
    // Stopped.
    suspend(t, "python3");
    // Done.
    return t;
  }
  // Enter runs the line.
  if (k === "Enter") {
    // Run.
    pyRun(t, t.line);
    // A fresh line.
    t.line = "";
  } else if (k === "Backspace") t.line = t.line.slice(0, -1);
  else if (printable(k)) t.line += k;
  // Done (Esc and the arrows do nothing visible here).
  return t;
}

/**
 * The REPL's screen: the scrollback and the prompt.
 *
 * @param t the state
 * @returns the screen
 */
function shellLikeView(t: Term, prompt: string): Screen {
  // Scrollback plus the prompt line, wrapped.
  const rows = wrap([...t.buf, prompt + t.line]);
  // The last ROWS rows (padded at the bottom when short).
  const shown = rows.length >= ROWS ? rows.slice(rows.length - ROWS) : rows.concat(new Array<string>(ROWS - rows.length).fill(""));
  // The cursor at the end of the prompt line.
  const last = Math.min(rows.length, ROWS) - 1;
  // Its column.
  const col = (prompt + t.line).length % COLS;
  // The screen.
  return { lines: shown, cursor: { r: last, c: col }, inverse: [] };
}

// ---------------------------------------------------------------------------
// A frozen ssh session (ssh(1) ESCAPE CHARACTERS; clientloop.c)
// ---------------------------------------------------------------------------

/** The server of the ssh levels (RFC 5737). */
const SSH_HOST = "203.0.113.10";
/** ssh's ~? list, as clientloop.c prints it for a session that is not multiplexed. */
const SSH_HELP = [
  "~?",
  "Supported escape sequences:",
  " ~.   - terminate connection (and any multiplexed sessions)",
  " ~B   - send a BREAK to the remote system",
  " ~I   - show connection information",
  " ~R   - request rekey",
  " ~V/v - decrease/increase verbosity (LogLevel)",
  " ~^Z  - suspend ssh",
  " ~#   - list forwarded connections",
  " ~&   - background ssh (when waiting for connections to terminate)",
  " ~?   - this message",
  " ~~   - send the escape character by typing it twice",
  "(Note that escapes are only recognized immediately after newline.)",
];

/**
 * ssh with the connection frozen: nothing reaches the server, only ssh's own escapes act.
 *
 * @param intro the lines already on screen
 * @param typed what the player had typed on the last line when it froze
 * @param afterNewline whether the last key sent was a newline (ssh's last_was_cr)
 * @returns the state
 */
function sshInit(intro: string[], typed: string, afterNewline: boolean): Term {
  // The scrollback, the frozen line, and ssh's newline flag.
  return term("ssh", { buf: intro.slice(), line: typed, flags: { cr: afterNewline ? 1 : 0 } });
}

/**
 * One key in a frozen ssh session.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function sshStep(s: Term, k: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // The clock changes nothing: the server is not answering.
  if (k === "Tick") return t;
  // The character ssh sees (Enter is a carriage return).
  const ch = k === "Enter" ? "\r" : k;
  // After an accepted ~.
  if (t.pending === "~") {
    // Consumed.
    t.pending = "";
    // ~. disconnects.
    if (ch === ".") {
      // ssh prints the escape, then the closing message.
      t.after = [t.line + "~.", `Connection to ${SSH_HOST} closed.`];
      // Gone.
      t.outcome = "exit";
      // Done.
      return t;
    }
    // ~? lists the escapes (and the newline state does not change).
    if (ch === "?") {
      // The frozen line, then the list.
      t.buf.push(t.line + SSH_HELP[0], ...SSH_HELP.slice(1));
      // The frozen line starts again, empty.
      t.line = "";
      // Done.
      return t;
    }
    // ~^Z suspends ssh.
    if (k === "C-z") {
      // Stopped.
      suspend(t, `ssh you@${SSH_HOST}`);
      // ssh's note first.
      t.after.unshift(t.line + "~^Z [suspend ssh]");
      // Done.
      return t;
    }
    // Anything else: the tilde and the key go to the frozen server; only a newline arms the escape again.
    t.flags.cr = ch === "\r" ? 1 : 0;
    // Done.
    return t;
  }
  // A tilde right after a newline is held as a possible escape.
  if (ch === "~" && t.flags.cr) {
    // Held.
    t.pending = "~";
    // Done.
    return t;
  }
  // Every other key goes to the frozen server and shows nothing; only a newline arms the escape.
  t.flags.cr = ch === "\r" ? 1 : 0;
  // Done.
  return t;
}

// ---------------------------------------------------------------------------
// tail -f (GNU coreutils tail; the terminal's INTR character, termios(3) VINTR, ECHOCTL)
// ---------------------------------------------------------------------------

/** The log lines tail -f follows, in a loop. */
const TAIL_LINES = [
  "08:20:01 GET /health 200 2ms",
  "08:20:02 GET /api/items 200 41ms",
  "08:20:04 GET / 200 12ms",
  "08:20:05 POST /api/cart 201 63ms",
  "08:20:07 GET /health 200 1ms",
  "08:20:08 GET /api/items 200 38ms",
];
/** The shell's prompt on the player's machine. */
const LOCAL_PROMPT = "you@laptop:~$ ";
/** The files tail -f can follow in a daily escape (invented lines), by path. */
const TAIL_FILES: Record<string, readonly string[]> = {
  // The level's own log.
  [LESS_PATH]: TAIL_LINES,
  // The queue worker's log.
  "/var/log/worker.log": [
    "08:20:01 job 4410 resize ok",
    "08:20:02 job 4411 thumbnail ok",
    "08:20:04 queue: 3 jobs",
    "08:20:05 job 4412 export ok",
    "08:20:07 heartbeat",
    "08:20:08 job 4413 resize ok",
  ],
  // A deploy's log.
  "/var/log/deploy.log": [
    "08:20:01 pulling web:2.4.2",
    "08:20:02 web-1 healthy",
    "08:20:04 web-2 draining",
    "08:20:05 web-2 healthy",
    "08:20:07 web-3 draining",
    "08:20:08 waiting for web-3",
  ],
};

/**
 * The lines tail -f follows: the scene's, or the level's.
 *
 * @param t the state
 * @returns the lines, in their loop order
 */
function tailFeed(t: Term): readonly string[] {
  // A daily scene's lines, or the level's log.
  return t.feed.length > 0 ? t.feed : TAIL_LINES;
}

/**
 * tail -f at the start of a level, or of a daily scene.
 *
 * @param scene a daily scene: the file followed ("file"); empty for the level (the app log)
 * @returns the state
 */
function tailInit(scene: Scene = {}): Term {
  // The path, and the lines it prints.
  const path = scene.file ?? LESS_PATH;
  // The scene's lines (none of its own on the level, which then uses TAIL_LINES).
  const feed = scene.file ? (TAIL_FILES[path] ?? TAIL_LINES).slice() : [];
  // The command and the last lines already printed.
  return term("tail", { buf: [LOCAL_PROMPT + `tail -f ${path}`, ...(feed.length ? feed : TAIL_LINES).slice(0, 4)], n: 4, scene: { ...scene }, feed });
}

/**
 * One key while tail -f runs: the terminal echoes it; Ctrl-C interrupts tail.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function tailStep(s: Term, k: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // The clock: tail prints the next line after whatever was echoed.
  if (k === "Tick") {
    // The lines followed (the scene's, or the level's).
    const feed = tailFeed(t);
    // The next line (the log loops).
    t.buf.push(t.line + feed[t.n % feed.length]);
    // Counted.
    t.n++;
    // The echoed text is now part of that line.
    t.line = "";
    // Done.
    return t;
  }
  // Ctrl-C: INTR sends SIGINT and tail ends; the terminal echoes ^C, the shell prompts again.
  if (k === "C-c") {
    // The echo.
    t.after = [t.line + "^C"];
    // Gone.
    t.outcome = "exit";
    // Done.
    return t;
  }
  // Ctrl-Z: SUSP stops tail; it is still there, stopped.
  if (k === "C-z") {
    // Stopped (the job's command line names the file followed).
    suspend(t, `tail -f ${named(t, "file", LESS_PATH)}`);
    // The echo first.
    t.after[0] = t.line + "^Z";
    // Done.
    return t;
  }
  // Ctrl-D is the end-of-file character for programs reading the terminal; tail is not reading it.
  if (k === "C-d") return t;
  // Enter: the terminal echoes a newline.
  if (k === "Enter") {
    // The line is finished.
    t.buf.push(t.line);
    // A new one.
    t.line = "";
    // Done.
    return t;
  }
  // Backspace erases an echoed character.
  if (k === "Backspace") {
    // Erased.
    t.line = t.line.slice(0, -1);
    // Done.
    return t;
  }
  // Printable keys are echoed; control keys are echoed in caret notation.
  t.line += printable(k) ? k : caret(k);
  // Done.
  return t;
}

// ---------------------------------------------------------------------------
// telnet (telnet(1); FreeBSD's commands.c for the messages)
// ---------------------------------------------------------------------------

/** The host of the telnet level (RFC 5737). */
const TELNET_HOST = "192.0.2.25";
/** The port of the telnet level. */
const TELNET_PORT = "2323";
/** The hosts a daily escape's telnet can be connected to: one from each RFC 5737 documentation block. */
const TELNET_HOSTS: readonly string[] = [TELNET_HOST, "198.51.100.23", "203.0.113.42"];
/** The ports it can be connected to (none of them a well-known service, so a silent one is believable). */
const TELNET_PORTS: readonly string[] = [TELNET_PORT, "4000", "7777"];

/**
 * telnet connected to a service that does not answer.
 *
 * @param scene a daily scene: the host ("host") and port ("port"); empty for the level
 * @returns the state
 */
function telnetInit(scene: Scene = {}): Term {
  // The host and port: the scene's, or the level's.
  const host = scene.host ?? TELNET_HOST;
  // The port.
  const port = scene.port ?? TELNET_PORT;
  // telnet's opening lines; connected, in the session.
  return term("telnet", { buf: [LOCAL_PROMPT + `telnet ${host} ${port}`, `Trying ${host}...`, `Connected to ${host}.`, "Escape character is '^]'."], mode: "conn", flags: { connected: 1 }, scene: { ...scene } });
}

/**
 * Whether a word is a prefix of a telnet command, at least `min` characters long.
 *
 * @param w the word typed
 * @param cmd the command
 * @param min the shortest unambiguous prefix
 * @returns true when w names cmd
 */
function abbrev(w: string, cmd: string, min: number): boolean {
  // Long enough, and a prefix.
  return w.length >= min && cmd.startsWith(w);
}

/**
 * One key in telnet.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function telnetStep(s: Term, k: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // The clock: the service says nothing.
  if (k === "Tick") return t;
  // In the session (old line-by-line mode, local echo).
  if (t.mode === "conn") {
    // The escape character enters command mode.
    if (k === "C-]") {
      // The typed line, then telnet's prompt on a new line.
      t.buf.push(t.line + "^]");
      t.line = "";
      t.mode = "cmd";
    } else if (k === "Enter") {
      // The line is sent; the service does not answer.
      t.buf.push(t.line);
      t.line = "";
    } else if (k === "Backspace") t.line = t.line.slice(0, -1);
    // Other keys are echoed locally (control keys in caret notation) and sent; nothing comes back.
    else t.line += printable(k) ? k : caret(k);
    // Done.
    return t;
  }
  // Command mode, at telnet>: an end of file quits (telnet(1), quit).
  if (k === "C-d" && t.line === "") {
    // A connection is closed first.
    if (t.flags.connected) t.after = ["Connection closed."];
    // Gone.
    t.outcome = "exit";
    // Done.
    return t;
  }
  // Editing the command.
  if (k === "Backspace") {
    // One character less.
    t.line = t.line.slice(0, -1);
    // Done.
    return t;
  }
  // Printable characters build the command.
  if (printable(k)) {
    // Appended.
    t.line += k;
    // Done.
    return t;
  }
  // Only Enter runs it.
  if (k !== "Enter") return t;
  // The command line goes into the scrollback.
  t.buf.push("telnet> " + t.line);
  // Its first word.
  const w = t.line.trim().split(/\s+/)[0] ?? "";
  // Cleared.
  t.line = "";
  // An empty line returns to the session, when there is one.
  if (w === "") {
    // Back to the connection.
    if (t.flags.connected) t.mode = "conn";
    // Done.
    return t;
  }
  // quit, or any unambiguous prefix of it.
  if (abbrev(w, "quit", 1)) {
    // An open session is closed first.
    if (t.flags.connected) t.after = ["Connection closed."];
    // Gone.
    t.outcome = "exit";
    // Done.
    return t;
  }
  // close: the session closes, telnet stays at its prompt.
  if (abbrev(w, "close", 2)) {
    // The message, when there was a session.
    if (t.flags.connected) t.buf.push("Connection closed.");
    // No session now.
    t.flags.connected = 0;
    // Done.
    return t;
  }
  // "c" alone could be close or crmod.
  if (w === "c") {
    // Ambiguous.
    t.buf.push("?Ambiguous command");
    // Done.
    return t;
  }
  // Anything else this model does not know is reported as invalid (exit is not a telnet command).
  t.buf.push("?Invalid command");
  // Done.
  return t;
}

// ---------------------------------------------------------------------------
// tmux (tmux(1): prefix C-b, then d detaches; client.c for the message;
// termios(3) VINTR for a Ctrl-C that reaches the job in the pane)
// ---------------------------------------------------------------------------

/** The job the tmux level is running. */
const JOB_LINES = ["copying part-0041 ... ok", "copying part-0042 ... ok", "copying part-0043 ... ok", "copying part-0044 ... ok"];
/** The prompt inside the server's shell. */
const REMOTE_PROMPT = "you@web01:~$ ";
/** The tmux level's job, as typed. */
const JOB_CMD = "./backup.sh";
/**
 * The backups a daily escape's tmux can be running, by command line: the window's name (tmux names it after the
 * running program), the session's name, and the lines the job prints. Every one is a backup, so the level's hints
 * and its messages about "the backup" stay true.
 */
const TMUX_JOBS: Record<string, { window: string; session: string; feed: readonly string[] }> = {
  // The level's own job.
  [JOB_CMD]: { window: "backup.sh", session: "backup", feed: JOB_LINES },
  // A database dump (a short session name, so the status line keeps the whole window name).
  "./backup-db.sh": { window: "backup-db.sh", session: "db", feed:["dumping orders ... ok", "dumping users ... ok", "dumping invoices ... ok", "dumping audit_log ... ok"] },
  // A copy of the web root (the session's name kept short, so the status line keeps the whole window name).
  "./backup-www.sh": { window: "backup-www.sh", session: "www", feed: ["archiving /srv/www/static ... ok", "archiving /srv/www/uploads ... ok", "archiving /srv/www/config ... ok", "archiving /srv/www/logs ... ok"] },
};

/**
 * tmux attached to a session.
 *
 * @param ctx "job": a backup job runs in the pane; "shell": a shell prompt
 * @param session the session's name
 * @param lines what the pane shows
 * @returns the state
 */
function tmuxInit(ctx: "job" | "shell", session: string, lines: string[]): Term {
  // The pane's contents and the session name (kept in the flags as an index into a small table).
  return term("tmux", { ctx, buf: lines.slice(), flags: { session: session === "backup" ? 0 : 1 }, n: 2 });
}

/**
 * tmux with a daily scene's backup running in the pane.
 *
 * @param scene the scene: the job's command line ("job"), with its session ("session") and window ("window")
 * @returns the state
 */
function tmuxDaily(scene: Scene): Term {
  // The job (the level's when the scene names none it knows).
  const job = TMUX_JOBS[scene.job ?? JOB_CMD] ?? TMUX_JOBS[JOB_CMD];
  // Its command, as typed at the prompt.
  const cmd = scene.job && TMUX_JOBS[scene.job] ? scene.job : JOB_CMD;
  // The command and the first two lines it printed, the job's own lines to come.
  return term("tmux", { ctx: "job", buf: [REMOTE_PROMPT + cmd, ...job.feed.slice(0, 2)], flags: { session: 1 }, n: 2, scene: { ...scene, job: cmd }, feed: job.feed.slice() });
}

/**
 * The session's name.
 *
 * @param t the state
 * @returns its name
 */
function tmuxSession(t: Term): string {
  // A daily scene's own, or one of the two the levels use.
  return t.scene.session ?? (t.flags.session === 0 ? "backup" : "main");
}

/**
 * One key in tmux.
 *
 * @param s the state
 * @param k the key
 * @returns the new state
 */
function tmuxStep(s: Term, k: Key): Term {
  // Work on a copy.
  const t = clone(s);
  // The clock: the job prints a line.
  if (k === "Tick") {
    // Only while the job runs.
    if (t.ctx === "job") {
      // The job's lines: a daily scene's, or the level's backup.
      const feed = t.feed.length > 0 ? t.feed : JOB_LINES;
      // The next line, after anything echoed.
      t.buf.push(t.line + feed[t.n % feed.length]);
      // Counted.
      t.n++;
      // The echo is part of that line now.
      t.line = "";
    }
    // Done.
    return t;
  }
  // After the prefix.
  if (t.pending === "C-b") {
    // Consumed.
    t.pending = "";
    // x: kill the pane, after a confirmation.
    if (k === "x") {
      // The confirmation prompt in the status line.
      t.mode = "confirm";
      // Done.
      return t;
    }
    // d: detach the current client; tmux prints the reason and the session.
    if (k === "d") {
      // The message (client.c).
      t.after = [`[detached (from session ${tmuxSession(t)})]`];
      // Left, with the session still running.
      t.outcome = "exit";
    }
    // Other keys after the prefix are not modelled here.
    return t;
  }
  // The kill-pane confirmation.
  if (t.mode === "confirm") {
    // Back to normal whatever the answer.
    t.mode = "";
    // y: the only pane is killed, and with it the session.
    if (k === "y") {
      // tmux reports that the session ended.
      t.after = ["[exited]"];
      // Failed: whatever ran there is gone.
      t.outcome = "fail";
      t.why = t.ctx === "job" ? "killedJob" : "closedSession";
    }
    // Done.
    return t;
  }
  // The prefix key.
  if (k === "C-b") {
    // Waiting for the command key.
    t.pending = "C-b";
    // Done.
    return t;
  }
  // A running job.
  if (t.ctx === "job") {
    // Ctrl-C is not a tmux key: it goes to the pane's terminal, whose interrupt character sends the job SIGINT
    // (termios(3), VINTR). The job dies; the pane, the shell in it and tmux all carry on, so the player is still
    // inside tmux, at the shell's prompt (review R3-04, 03/11/2026: this used to say the pane had died).
    if (k === "C-c") {
      // The echo; the shell's prompt follows in the pane.
      t.buf.push(t.line + "^C");
      // Nothing half typed is left.
      t.line = "";
      // The pane now shows the shell.
      t.ctx = "shell";
      // tmux stays on screen after the failure.
      t.flags.inFront = 1;
      // Failed: the level's point was to leave the job running.
      t.outcome = "fail";
      t.why = "interruptedJob";
      // Done.
      return t;
    }
    // Ctrl-Z stops the job; the shell in the pane takes over, still inside tmux.
    if (k === "C-z") {
      // The echo and the shell's job message.
      t.buf.push(t.line + "^Z", `[1]+  Stopped                 ${named(t, "job", JOB_CMD)}`);
      // Nothing half typed is left.
      t.line = "";
      // The pane now shows the shell.
      t.ctx = "shell";
      // tmux stays on screen after the failure.
      t.flags.inFront = 1;
      // Failed.
      t.outcome = "fail";
      t.why = "stoppedJob";
      // Done.
      return t;
    }
    // Enter: the terminal echoes a newline.
    if (k === "Enter") {
      // Line finished.
      t.buf.push(t.line);
      t.line = "";
    } else if (k === "Backspace") t.line = t.line.slice(0, -1);
    // Other keys are echoed by the pane's terminal (Ctrl-D: nothing, the job is not reading).
    else if (k !== "C-d") t.line += printable(k) ? k : caret(k);
    // Done.
    return t;
  }
  // A shell prompt: exit, logout or Ctrl-D on an empty line end the shell, and with it the session.
  if ((k === "C-d" && t.line === "") || (k === "Enter" && /^(exit|logout)$/.test(t.line.trim()))) {
    // The command echoed.
    t.buf.push(REMOTE_PROMPT + t.line);
    // tmux reports that the session ended.
    t.after = ["[exited]"];
    // Failed: the session (and whatever ran in it) is gone.
    t.outcome = "fail";
    t.why = "closedSession";
    // Done.
    return t;
  }
  // Ctrl-C at a prompt: a fresh prompt.
  if (k === "C-c") {
    // The abandoned line.
    t.buf.push(REMOTE_PROMPT + t.line + "^C");
    t.line = "";
    // Done.
    return t;
  }
  // Enter runs a command; this shell knows very few.
  if (k === "Enter") {
    // The command line.
    const cmd = t.line.trim();
    // Echoed.
    t.buf.push(REMOTE_PROMPT + t.line);
    // Cleared.
    t.line = "";
    // A couple of familiar answers, and bash's message for anything else.
    if (cmd === "ls") t.buf.push("app  backup.sh  notes.txt");
    else if (cmd === "pwd") t.buf.push("/home/you");
    else if (cmd === "clear") t.buf = [];
    else if (cmd !== "") t.buf.push(`bash: ${cmd.split(/\s+/)[0]}: command not found`);
    // Done.
    return t;
  }
  // Editing the line.
  if (k === "Backspace") t.line = t.line.slice(0, -1);
  else if (printable(k)) t.line += k;
  // Done.
  return t;
}

/**
 * tmux's screen: the pane and the status line.
 *
 * @param t the state
 * @returns the screen
 */
function tmuxView(t: Term): Screen {
  // The pane's last rows (the shell's prompt line when at a prompt).
  const pane = wrap(t.ctx === "shell" ? [...t.buf, REMOTE_PROMPT + t.line] : [...t.buf, t.line]);
  // ROWS - 1 rows of pane.
  const rows = tail(pane, ROWS - 1);
  // The status line: [session] window list, and the default status-right (pane title, time, date).
  const status = t.mode === "confirm" ? "kill-pane 0? (y/n)" : spread(`[${tmuxSession(t)}] 0:${t.ctx === "job" ? named(t, "window", "backup.sh") : "bash"}*`, '"web01" 08:42 03-Nov-26');
  // The cursor at the end of the last pane row.
  const last = Math.min(pane.length, ROWS - 1) - 1;
  // The screen; the status line is in reverse video.
  return { lines: [...rows, bar(status)], cursor: { r: Math.max(0, last), c: (rows[Math.max(0, last)] ?? "").length % COLS }, inverse: [ROWS - 1] };
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

/**
 * One key in whichever program is in front.
 *
 * @param t the state
 * @param k the key
 * @returns the new state
 */
export function stepTerm(t: Term, k: Key): Term {
  // A program that has finished takes no more keys.
  if (t.outcome !== "run") return t;
  // The clock only matters to the programs that print on their own.
  if (k === "Tick" && t.prog !== "tail" && t.prog !== "tmux") return t;
  // The program's own step.
  switch (t.prog) {
    case "vim":
      return vimStep(t, k);
    case "less":
      return lessStep(t, k);
    case "nano":
      return nanoStep(t, k);
    case "emacs":
      return emacsStep(t, k);
    case "top":
      return topStep(t, k);
    case "python":
      return pyStep(t, k);
    case "ssh":
      return sshStep(t, k);
    case "tail":
      return tailStep(t, k);
    case "telnet":
      return telnetStep(t, k);
    case "tmux":
      return tmuxStep(t, k);
  }
}

/**
 * The screen of whichever program is in front, with lines carried from a previous stage above it.
 *
 * @param t the state
 * @param carry lines left on screen by the previous stage
 * @returns the screen
 */
export function viewTerm(t: Term, carry: readonly string[] = []): Screen {
  // The full-screen programs draw the whole terminal.
  switch (t.prog) {
    case "vim":
      return vimView(t);
    case "less":
      return lessView(t);
    case "nano":
      return nanoView(t);
    case "emacs":
      return emacsView(t);
    case "top":
      return topView(t);
    case "tmux":
      return tmuxView({ ...t, buf: [...carry, ...t.buf] });
    default:
      break;
  }
  // The line-based ones scroll: carried lines, the scrollback, the current line.
  const withCarry: Term = { ...t, buf: [...carry, ...t.buf] };
  // The REPL's prompt.
  if (t.prog === "python") return shellLikeView(withCarry, ">>> ");
  // telnet in command mode shows its prompt.
  if (t.prog === "telnet") return shellLikeView(withCarry, t.mode === "cmd" ? "telnet> " : "");
  // ssh and tail show the line being typed or echoed.
  return shellLikeView(withCarry, "");
}

// ---------------------------------------------------------------------------
// The levels
// ---------------------------------------------------------------------------

/** The ssh session's opening lines (invented host from RFC 5737). */
const SSH_INTRO = [LOCAL_PROMPT + `ssh you@${SSH_HOST}`, "Last login: Mon Nov  2 18:04:11 2026", REMOTE_PROMPT + "uptime", " 08:41:52 up 12 days,  3:14,  1 user", ""];

/**
 * A stage's starting state.
 *
 * @param id the stage id
 * @returns the program in its starting state
 */
export function initStage(id: string): Term {
  // Each stage id names a program and its setting.
  switch (id) {
    case "vim":
      return vimInit("plain");
    case "less":
      return lessInit("file");
    case "man":
      return lessInit("man");
    case "nano":
      return nanoInit();
    case "emacs":
      return emacsInit();
    case "top":
      return topInit();
    case "python":
      return pyInit();
    case "ssh":
      return sshInit(SSH_INTRO.slice(0, 4), REMOTE_PROMPT + "sudo systemctl status app", false);
    case "tail":
      return tailInit();
    case "telnet":
      return telnetInit();
    case "tmux":
      return tmuxInit("job", "backup", [REMOTE_PROMPT + "./backup.sh", ...JOB_LINES.slice(0, 2)]);
    case "git":
      return vimInit("git");
    // The boss's stages.
    case "boss-shell":
      return tmuxInit("shell", "main", []);
    case "boss-ssh":
      return sshInit([], REMOTE_PROMPT, false);
    default:
      return vimInit("plain");
  }
}

/** The thirteen levels, in the order they unlock. */
export const LEVELS: readonly Level[] = [
  {
    id: "vim",
    prog: "vim",
    stages: ["vim"],
    // Esc, then ZZ (review R3-I3, 03/11/2026: the par was 5, two more than the shortest way out).
    par: 3,
    solutions: [["Esc", ":", "q", "!", "Enter"], ["Esc", ":", "w", "q", "Enter"], ["Esc", ":", "x", "Enter"], ["Esc", "Z", "Z"], ["Esc", "Z", "Q"], ["C-c", ":", "w", "q", "Enter"], ["Esc", ":", "e", "x", "i", "t", "Enter"]],
    wrong: [["q", "u", "i", "t", "Enter"], ["Esc", "q", "u", "i", "t", "Enter"], ["Esc", "e", "x", "i", "t", "Enter"], ["Esc", ":", "q", "Enter"], ["Esc", "C-c"], ["Esc", "Esc", "Esc"], ["Esc", ":", "q", "u", "i", "t", "Enter"], ["Esc", ":", "e", "x", "Enter"]],
  },
  {
    id: "less",
    prog: "less",
    stages: ["less"],
    par: 1,
    solutions: [["q"], ["Q"], [":", "q"], ["Z", "Z"], [" ", " ", "q"], ["h", "q", "q"]],
    wrong: [["C-c"], ["Esc"], ["e", "x", "i", "t", "Enter"], ["C-d"], ["h", "q"]],
  },
  {
    id: "man",
    prog: "man",
    stages: ["man"],
    par: 1,
    solutions: [["q"], [":", "Q"], ["h", "q", "q"]],
    wrong: [["C-c"], ["Esc"], ["h", "q"], ["x"], [":", "w", "Enter"]],
  },
  {
    id: "nano",
    prog: "nano",
    stages: ["nano"],
    par: 1,
    solutions: [["C-x"], ["Esc", "Esc", "x"], ["!", "C-x", "n"], ["!", "C-x", "y", "Enter"], ["!", "C-x", "C-c", "C-x", "N"]],
    wrong: [["Esc", ":", "q", "!", "Enter"], ["C-c"], ["C-q"], ["q", "u", "i", "t", "Enter"], ["Esc"], ["!", "C-x", "C-c"]],
  },
  {
    id: "emacs",
    prog: "Emacs",
    stages: ["emacs"],
    par: 2,
    solutions: [["C-x", "C-c"], ["Esc", "x", "k", "i", "l", "l", "-", "e", "m", "a", "c", "s", "Enter"], ["e", "x", "i", "t", "C-x", "C-c"], ["C-g", "C-x", "C-c"]],
    wrong: [["C-c"], ["C-g"], ["Esc", "Esc", "Esc"], [":", "q", "Enter"], ["e", "x", "i", "t", "Enter"], ["C-c", "q"]],
  },
  {
    id: "top",
    prog: "top",
    stages: ["top"],
    par: 1,
    solutions: [["q"], ["C-c"], ["e", "x", "i", "t", "q"]],
    wrong: [["Esc"], ["e", "x", "i", "t", "Enter"], ["C-d"], ["Enter"]],
  },
  {
    id: "python",
    prog: "python3",
    stages: ["python"],
    par: 1,
    solutions: [["C-d"], ["e", "x", "i", "t", "(", ")", "Enter"], ["q", "u", "i", "t", "(", ")", "Enter"], ["i", "m", "p", "o", "r", "t", " ", "s", "y", "s", "Enter", "s", "y", "s", ".", "e", "x", "i", "t", "(", ")", "Enter"]],
    wrong: [["e", "x", "i", "t", "Enter"], ["q", "u", "i", "t", "Enter"], ["C-c"], [":", "q", "Enter"], ["s", "y", "s", ".", "e", "x", "i", "t", "(", ")", "Enter"], ["Esc"], ["x", "C-d", "Enter"]],
  },
  {
    id: "ssh",
    prog: "ssh",
    stages: ["ssh"],
    par: 3,
    solutions: [["Enter", "~", "."], ["Enter", "~", "?", "~", "."], ["C-c", "Enter", "~", "."]],
    wrong: [["~", "."], ["C-c"], ["e", "x", "i", "t", "Enter"], ["C-d"], ["Enter", "~", "~", "."], ["Esc", "~", "."]],
  },
  {
    id: "tail",
    prog: "tail -f",
    stages: ["tail"],
    par: 1,
    solutions: [["C-c"], ["q", "Enter", "C-c"], ["Tick", "C-c"]],
    wrong: [["q"], ["Esc"], [":", "q", "Enter"], ["C-d"], ["e", "x", "i", "t", "Enter"]],
  },
  {
    id: "telnet",
    prog: "telnet",
    stages: ["telnet"],
    // Ctrl-], then Ctrl-D at the telnet> prompt (it was 3).
    par: 2,
    solutions: [["C-]", "q", "Enter"], ["C-]", "q", "u", "i", "t", "Enter"], ["C-]", "C-d"], ["C-]", "c", "l", "o", "s", "e", "Enter", "q", "u", "i", "t", "Enter"]],
    wrong: [["q", "u", "i", "t", "Enter"], ["C-c"], ["Esc"], ["C-]", "e", "x", "i", "t", "Enter"], ["C-]", "Enter"], ["C-]", "c", "Enter"]],
  },
  {
    id: "tmux",
    prog: "tmux",
    stages: ["tmux"],
    par: 2,
    solutions: [["C-b", "d"], ["Tick", "C-b", "d"], ["e", "x", "i", "t", "C-b", "d"]],
    wrong: [["d"], ["e", "x", "i", "t", "Enter"], ["C-d"], ["C-b", "x", "n"], ["C-b", "x", "y"], ["q"], ["C-c"]],
  },
  {
    id: "git",
    prog: "git commit",
    stages: ["git"],
    // i, a one-letter message, Esc, ZZ (it was 12).
    par: 5,
    solutions: [["i", "F", "i", "x", " ", "t", "y", "p", "o", "Esc", ":", "w", "q", "Enter"], ["i", "D", "o", "c", "s", "Esc", "Z", "Z"], ["O", "x", "Esc", ":", "x", "Enter"], ["i", "x", "Esc", "Z", "Z"]],
    wrong: [[":", "q", "Enter"], ["i", "x", "Esc", ":", "q", "Enter"], ["C-c"], ["Esc"], ["q", "u", "i", "t", "Enter"]],
  },
  {
    id: "boss",
    prog: "man + git + tmux + ssh",
    stages: ["man", "git", "boss-shell", "boss-ssh"],
    // q; i, x, Esc, ZZ; Ctrl-B d; Enter ~ . (it was 18).
    par: 11,
    solutions: [["q", "i", "x", "Esc", "Z", "Z", "C-b", "d", "Enter", "~", "."], ["q", "i", "F", "i", "x", "Esc", ":", "w", "q", "Enter", "C-b", "d", "Enter", "~", "."], ["Q", "O", "S", "h", "i", "p", "Esc", "Z", "Z", "C-b", "d", "Enter", "~", "?", "~", "."]],
    wrong: [["q", "i", "F", "i", "x", "Esc", ":", "w", "q", "Enter", "C-b", "d", "~", "."], ["q", "i", "F", "i", "x", "Esc", ":", "w", "q", "Enter", "C-b", "d", "C-c"], ["q", ":", "q", "Enter"], ["C-c", "C-c"]],
  },
];

/** The boss's first stage is the less of the log level, opened by git log in the story; its stages share these titles. */
export const LEVEL_IDS: readonly string[] = LEVELS.map((l) => l.id);

/**
 * A level at its start.
 *
 * @param id the level's id
 * @returns its state
 */
export function startLevel(id: string): LevelState {
  // The level (the first one when the id is unknown).
  const lv = LEVELS.find((l) => l.id === id) ?? LEVELS[0];
  // Its first stage.
  return { level: lv.id, stage: 0, term: initStage(lv.stages[0]), carry: [], outcome: "run" };
}

/**
 * One key in a level: the program in front takes it; when it exits, the next stage comes up.
 *
 * @param st the level's state
 * @param k the key
 * @returns the new state
 */
export function press(st: LevelState, k: Key): LevelState {
  // A finished level takes no keys.
  if (st.outcome !== "run") return st;
  // The level.
  const lv = LEVELS.find((l) => l.id === st.level) ?? LEVELS[0];
  // The program's step.
  const term2 = stepTerm(st.term, k);
  // Left the wrong way: the level has failed.
  if (term2.outcome === "fail") return { ...st, term: term2, outcome: "fail" };
  // Still running.
  if (term2.outcome === "run") return { ...st, term: term2 };
  // Left cleanly: the last stage clears the level.
  if (st.stage + 1 >= lv.stages.length) return { ...st, term: term2, outcome: "exit" };
  // Otherwise the next stage, with what the last one printed carried above it.
  return { level: st.level, stage: st.stage + 1, term: initStage(lv.stages[st.stage + 1]), carry: term2.after, outcome: "run" };
}

/**
 * The screen of a level being played.
 *
 * @param st the level's state
 * @returns the screen
 */
export function view(st: LevelState): Screen {
  // The program's screen, with the previous stage's last words above line-based programs.
  return viewTerm(st.term, st.carry);
}

/**
 * The screen once a level is over: the shell the program left behind, with its last words above the prompt; or,
 * when the failure left the program on screen (a Ctrl-C or Ctrl-Z that reached the job inside tmux), the program.
 *
 * @param st the level's state
 * @returns the screen
 */
export function finalView(st: LevelState): Screen {
  // Still running, or a failure that leaves the program in front: its own screen.
  if (st.outcome === "run" || st.term.flags.inFront === 1) return view(st);
  // The shell on web01 for the tmux level and the boss's stages inside tmux; the laptop's otherwise.
  const prompt = st.level === "tmux" || (st.level === "boss" && st.stage < 3) ? REMOTE_PROMPT : LOCAL_PROMPT;
  // The last words, wrapped like any output (a long commit subject included), then the prompt.
  const rows = [...wrap(st.term.after), prompt];
  // The last ROWS rows, padded at the bottom.
  const shownRows = tail(rows, ROWS);
  // The row of the prompt among them.
  const promptRow = Math.min(rows.length, ROWS) - 1;
  // No reverse video; the cursor after the prompt.
  return { lines: shownRows, cursor: { r: promptRow, c: prompt.length }, inverse: [] };
}

/**
 * Whether a key is one of those a person reaches for when trying to get out, for the hints' "wrong tries".
 *
 * @param k the key
 * @returns true for Enter, Esc and the control keys
 */
export function isTry(k: Key): boolean {
  // The keys that end commands or try to interrupt.
  return k === "Enter" || k === "Esc" || k.startsWith("C-");
}

/**
 * How close a level is to a clean exit: the fewest keys, taken from the end of a documented way out, that leave the
 * level from this state (0 once left, Infinity when no documented ending works from here).
 *
 * @param st the level's state
 * @returns the number of keys
 */
export function keysToExit(st: LevelState): number {
  // Already out.
  if (st.outcome === "exit") return 0;
  // Failed: no way out from here.
  if (st.outcome === "fail") return Infinity;
  // The level.
  const lv = LEVELS.find((l) => l.id === st.level) ?? LEVELS[0];
  // Its documented ways out, or a daily scene's (the same program's, those that apply to the scene).
  const ways = st.scene ? dailyExits(st.level, st.scene) : lv.solutions;
  // The best so far.
  let best = Infinity;
  // Each documented way out.
  for (const sol of ways) {
    // Its keystrokes (the clock is not one).
    const keys = sol.filter((k) => k !== "Tick");
    // Its endings, the shortest first; none longer than the best already found is worth trying.
    for (let n = 1; n <= keys.length && n < best; n++) {
      // From this state.
      let x = st;
      // The last n keys.
      for (const k of keys.slice(keys.length - n)) {
        // One key.
        x = press(x, k);
        // Over (left or failed): no more keys.
        if (x.outcome !== "run") break;
      }
      // This ending leaves: the best for this way out.
      if (x.outcome === "exit") {
        // Kept.
        best = n;
        // The next way out.
        break;
      }
    }
  }
  // The fewest keys found.
  return best;
}

/** The count of wrong tries in an attempt, carried from key to key. */
export interface TryCount {
  /** The stage it is measured in. */
  stage: number;
  /** The fewest keys to a clean exit reached so far in this stage (at its start or after a try). */
  best: number;
  /** Wrong tries so far. */
  wrong: number;
}

/**
 * The count at the start of a level.
 *
 * @param st the level's state at its start
 * @returns no wrong tries yet, measured from the start
 */
export function startTries(st: LevelState): TryCount {
  // How far the start is from a way out.
  return { stage: st.stage, best: keysToExit(st), wrong: 0 };
}

/**
 * Count one key. A wrong try is a key someone presses to get out (Enter, Esc, a control key) that leaves the level
 * no closer to a clean exit than it has already been: "quit" and Enter in vim's Insert mode, :q refused, Ctrl-C in
 * less, Esc pressed twice. A key that brings the way out closer (Esc out of Insert mode, Ctrl-] to telnet's prompt,
 * tmux's prefix) is a step, not a try; reaching the next stage is progress; a failed level is one wrong try. Before
 * review R3-06 (03/11/2026) every Enter, Esc and Ctrl counted, so correct steps brought the hints up.
 *
 * @param c the count so far
 * @param k the key just pressed
 * @param after the level's state after it
 * @returns the new count
 */
export function countTry(c: TryCount, k: Key, after: LevelState): TryCount {
  // Left the wrong way: one wrong try.
  if (after.outcome === "fail") return { ...c, wrong: c.wrong + 1 };
  // Left cleanly: nothing to count.
  if (after.outcome === "exit") return c;
  // The next stage: progress, measured again from the new program.
  if (after.stage !== c.stage) return { stage: after.stage, best: keysToExit(after), wrong: c.wrong };
  // Only the keys reached for to get out can be tries.
  if (!isTry(k)) return c;
  // How close the way out is now.
  const d = keysToExit(after);
  // Closer than ever in this stage: a step on the way out.
  if (d < c.best) return { ...c, best: d };
  // Otherwise a wrong try.
  return { ...c, wrong: c.wrong + 1 };
}

/** A level's top score. */
export const SCORE_MAX = 1000;
/** Points off for each keystroke beyond the par. */
export const SCORE_PER_KEY = 20;
/** Points off for each hint asked for with the button (hints that appear on their own are free). */
export const SCORE_PER_HINT = 150;
/** Points off for each second after the free ones. */
export const SCORE_PER_SECOND = 2;
/** Seconds that cost nothing (the clock starts at the first key). */
export const SCORE_FREE_SECONDS = 30;
/** The lowest score of a cleared level. */
export const SCORE_FLOOR = 100;

/**
 * A level's score: 1,000, less 20 a keystroke over par, 150 a hint asked for, and 2 a second after the first 30;
 * at least 100.
 *
 * @param keys keystrokes used
 * @param par the level's par
 * @param ms time taken, in milliseconds
 * @param hints hints asked for with the button (not those that appeared on their own)
 * @returns the score
 */
export function levelScore(keys: number, par: number, ms: number, hints: number): number {
  // Each penalty.
  const overKeys = Math.max(0, keys - par) * SCORE_PER_KEY;
  const overTime = Math.max(0, Math.floor(ms / 1000) - SCORE_FREE_SECONDS) * SCORE_PER_SECOND;
  const forHints = hints * SCORE_PER_HINT;
  // The score, floored.
  return Math.max(SCORE_FLOOR, Math.round(SCORE_MAX - overKeys - overTime - forHints));
}

/** A clear's medal: "under" in fewer keystrokes than par, "par" in exactly par, "" (none) in more. */
export type Medal = "under" | "par" | "";

/**
 * The medal a clear earns: keystrokes only count (the par is in keystrokes; time and hints have their own price in
 * the score).
 *
 * @param keys keystrokes used
 * @param par the par
 * @returns "under", "par" or ""
 */
export function medalFor(keys: number, par: number): Medal {
  // Fewer than par: a way out shorter than any documented one.
  if (keys < par) return "under";
  // Exactly par.
  if (keys === par) return "par";
  // Over par: no medal.
  return "";
}

/**
 * Run keys through a level from its start.
 *
 * @param id the level
 * @param keys the keys
 * @returns the final state and the index of the key that ended the level (-1 if none did)
 */
export function run(id: string, keys: readonly Key[]): { st: LevelState; endedAt: number } {
  // From the start.
  let st = startLevel(id);
  // Where it ended.
  let endedAt = -1;
  // Each key.
  for (let i = 0; i < keys.length; i++) {
    // The step.
    st = press(st, keys[i]);
    // The first key that ended it.
    if (st.outcome !== "run" && endedAt < 0) endedAt = i;
  }
  // The result.
  return { st, endedAt };
}

/**
 * The wrong tries a sequence of keys counts from a level's start, as the page counts them.
 *
 * @param id the level
 * @param keys the keys (the clock's ticks are passed to the level but never counted)
 * @returns the wrong tries
 */
export function countKeys(id: string, keys: readonly Key[]): number {
  // From the start.
  let st = startLevel(id);
  // Nothing counted yet.
  let c = startTries(st);
  // Each key.
  for (const k of keys) {
    // The step.
    const next = press(st, k);
    // Counted, unless it is the clock.
    if (k !== "Tick") c = countTry(c, k, next);
    // Moved on.
    st = next;
  }
  // The total.
  return c.wrong;
}

// ---------------------------------------------------------------------------
// The daily escape
// ---------------------------------------------------------------------------

/** The levels a daily escape can come from: every one-program level (the boss chains four, so it stays a level). */
export const DAILY_LEVELS: readonly string[] = LEVELS.filter((l) => l.stages.length === 1).map((l) => l.id);

/** What had been sent to the server when ssh froze, in a daily scene (the level's command first). */
const SSH_CMDS: readonly string[] = ["sudo systemctl status app", "journalctl -fu app", "df -h"];
/** The branches a daily escape's commit can go on. */
const GIT_BRANCHES: readonly string[] = [GIT_BRANCH, "develop", "fix/login-timeout"];
/** The files that can be staged for it. */
const GIT_FILES: readonly string[] = [GIT_STAGED, "src/app.ts", "docs/setup.md"];
/** nano's ways out when a line was typed and never saved: the question Ctrl-X asks has to be answered. */
const NANO_CHANGED_EXITS: readonly Key[][] = [["C-x", "n"], ["C-x", "y", "Enter"], ["Esc", "Esc", "x", "n"], ["C-x", "C-c", "C-x", "N"], ["!", "C-x", "n"], ["!", "C-x", "y", "Enter"]];
/** sys.exit() and Enter: a way out once sys is imported (the level imports it first; a scene can have done so). */
const SYS_EXIT: readonly Key[] = ["s", "y", "s", ".", "e", "x", "i", "t", "(", ")", "Enter"];

/** One day's trap. */
export interface DailyEscape {
  /** The UTC day, YYYY-MM-DD. */
  day: string;
  /** The level whose program traps the player (its hints are the day's hints). */
  level: string;
  /** The program's name, as on the level card. */
  prog: string;
  /** The scene: what is open or running, as names and switches (also the brief's arguments). */
  scene: Scene;
  /** The documented ways out that apply to the scene. */
  solutions: Key[][];
  /** The fewest keystrokes of those: the day's par. */
  par: number;
}

/**
 * Draw a scene for a program: only what the program's model can show differently, never a different way out.
 *
 * @param level the level whose program it is
 * @param rng the day's generator for the scene
 * @returns the scene
 */
function pickScene(level: string, rng: Rng): Scene {
  // A yes-or-no switch, as the word the brief selects on.
  const yesNo = (): string => (rng.chance(0.5) ? "yes" : "no");
  // Each program's own variations (the arguments are drawn left to right, always in the same order).
  switch (level) {
    case "vim":
      // Which file, and whether it has unsaved changes.
      return { file: rng.pick(Object.keys(VIM_FILES)), changed: yesNo() };
    case "less":
      // Which file is shown.
      return { file: rng.pick(Object.keys(LESS_FILES)) };
    case "man":
      // The page at its first line, or scrolled to its end.
      return { where: rng.chance(0.5) ? "end" : "top" };
    case "nano":
      // Which file, and whether a line was typed and never saved.
      return { file: rng.pick(Object.keys(NANO_FILES)), changed: yesNo() };
    case "emacs":
      // Whether something was typed into *scratch*.
      return { typed: yesNo() };
    case "top":
      // The memory scale, the idle tasks, the CPU line's look.
      return { scale: String(rng.int(3)), idle: String(rng.int(2)), cpu: String(rng.int(4)) };
    case "python":
      // What had been typed at the prompt already.
      return { history: rng.pick(["none", ...Object.keys(PY_HISTORY)]) };
    case "ssh":
      // The server, the command sent, and whether it froze right after Enter or while typing.
      return { host: SSH_HOST, cmd: rng.pick(SSH_CMDS), when: rng.chance(0.5) ? "after" : "typing" };
    case "tail":
      // Which log is followed.
      return { file: rng.pick(Object.keys(TAIL_FILES)) };
    case "telnet":
      // The host and port of the silent service.
      return { host: rng.pick(TELNET_HOSTS), port: rng.pick(TELNET_PORTS) };
    case "tmux": {
      // Which backup runs, with its session and window.
      const job = rng.pick(Object.keys(TMUX_JOBS));
      // The scene.
      return { job, session: TMUX_JOBS[job].session, window: TMUX_JOBS[job].window };
    }
    case "git":
      // The branch, and the file staged.
      return { branch: rng.pick(GIT_BRANCHES), staged: rng.pick(GIT_FILES) };
    default:
      // No variation.
      return {};
  }
}

/**
 * A daily scene's program at its start.
 *
 * @param level the level whose program it is
 * @param scene the scene
 * @returns the program's state
 */
export function dailyTerm(level: string, scene: Scene): Term {
  // Each program, set up as the scene says.
  switch (level) {
    case "vim":
      return vimInit("plain", scene);
    case "less":
      return lessInit("file", scene);
    case "man":
      return lessInit("man", scene);
    case "nano":
      return nanoInit(scene);
    case "emacs":
      return emacsInit(scene);
    case "top":
      return topInit(scene);
    case "python":
      return pyInit(scene);
    case "ssh": {
      // The connection's first lines, as on the level.
      const intro = SSH_INTRO.slice(0, 4);
      // The command line that was being typed, or that was sent.
      const typed = REMOTE_PROMPT + (scene.cmd ?? SSH_CMDS[0]);
      // Frozen right after Enter (the line sent, a new empty one, a newline last), or while typing (no newline yet).
      const t = scene.when === "after" ? sshInit([...intro, typed], "", true) : sshInit(intro, typed, false);
      // With the scene.
      return { ...t, scene: { ...scene } };
    }
    case "tail":
      return tailInit(scene);
    case "telnet":
      return telnetInit(scene);
    case "tmux":
      return tmuxDaily(scene);
    case "git":
      return vimInit("git", scene);
    default:
      // A level without a scene of its own: its first stage.
      return initStage(level);
  }
}

/**
 * The documented ways out of a daily scene: the level's own, less those the scene rules out, plus those the scene
 * opens (:q with nothing changed, ~. right after a newline, sys.exit() once sys is imported). Every one is in the
 * program's documentation, as the level's are.
 *
 * @param level the level whose program it is
 * @param scene the scene
 * @returns the ways out, each a list of keys
 */
export function dailyExits(level: string, scene: Scene): Key[][] {
  // The level and its own ways out, copied.
  const lv = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
  // Copied, so a caller cannot change the level's.
  const own = lv.solutions.map((s) => s.slice());
  // The scene's differences.
  switch (level) {
    case "vim":
      // Nothing to lose: :q is enough (E37 only refuses with changes).
      return scene.changed === "no" ? [...own, ["Esc", ":", "q", "Enter"]] : own;
    case "nano":
      // A modified buffer: Ctrl-X asks first, and the answer is part of the way out.
      return scene.changed === "yes" ? NANO_CHANGED_EXITS.map((s) => s.slice()) : own;
    case "python":
      // sys already imported: sys.exit() works as typed.
      return scene.history === "sys" ? [...own, SYS_EXIT.slice()] : own;
    case "ssh":
      // A newline was the last key: the escape is recognised at once.
      return scene.when === "after" ? [["~", "."], ["~", "?", "~", "."], ...own] : own;
    default:
      // The level's ways out apply as they are.
      return own;
  }
}

/**
 * The daily escape of a UTC day, the same for everyone. Every block of twelve days from launch brings each of the
 * twelve programs once, in an order drawn with the block's first day; the scene is drawn with the day itself.
 *
 * @param day the date, YYYY-MM-DD
 * @returns the day's trap
 */
export function dailyEscape(day: string): DailyEscape {
  // Twelve programs.
  const n = DAILY_LEVELS.length;
  // Days since launch (negative before it, which still works).
  const k = epochDay(day) - epochDay(LAUNCH_DAY);
  // The block of twelve the day falls in.
  const block = Math.floor(k / n);
  // The block's order of programs, drawn with its first day.
  const order = dailyRng(GAME_ID, addDays(LAUNCH_DAY, block * n), "order").shuffle(DAILY_LEVELS);
  // The day's program.
  const level = order[k - block * n];
  // Its level.
  const lv = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
  // The day's scene.
  const scene = pickScene(level, dailyRng(GAME_ID, day, "scene"));
  // Its ways out.
  const solutions = dailyExits(level, scene);
  // The par: the fewest keystrokes of those (the clock's ticks are not keystrokes).
  const par = Math.min(...solutions.map((s) => s.filter((x) => x !== "Tick").length));
  // The trap.
  return { day, level, prog: lv.prog, scene, solutions, par };
}

/**
 * A daily escape at its start.
 *
 * @param d the day's trap
 * @returns its state, carrying the scene (which also picks the ways out the hints measure)
 */
export function startDaily(d: DailyEscape): LevelState {
  // One stage: the scene's program.
  return { level: d.level, stage: 0, term: dailyTerm(d.level, d.scene), carry: [], outcome: "run", scene: { ...d.scene } };
}

/**
 * Run keys through a daily escape from its start.
 *
 * @param d the day's trap
 * @param keys the keys
 * @returns the final state and the index of the key that ended it (-1 if none did)
 */
export function runDaily(d: DailyEscape, keys: readonly Key[]): { st: LevelState; endedAt: number } {
  // From the start.
  let st = startDaily(d);
  // Where it ended.
  let endedAt = -1;
  // Each key.
  for (let i = 0; i < keys.length; i++) {
    // The step.
    st = press(st, keys[i]);
    // The first key that ended it.
    if (st.outcome !== "run" && endedAt < 0) endedAt = i;
  }
  // The result.
  return { st, endedAt };
}

/** The mark a saved daily attempt keeps where the trap was started again after a wrong way out. */
export const RETRY: Key = "Retry";

/**
 * Replay a saved daily attempt, as the page played it: the keys in order, the trap started again at each RETRY
 * (keystrokes and wrong tries carry on), keys after the end ignored. A reload rebuilds the attempt this way, so it
 * resumes instead of starting afresh.
 *
 * @param d the day's trap
 * @param keys the saved keys, with RETRY marks
 * @returns the state, the wrong-try count, the keystrokes and the wrong ways out so far
 */
export function replayDaily(d: DailyEscape, keys: readonly Key[]): { st: LevelState; tries: TryCount; keys: number; fails: number } {
  // From the start.
  let st = startDaily(d);
  // Nothing counted yet.
  let tries = startTries(st);
  // Keystrokes and failures.
  let n = 0;
  // Wrong ways out.
  let fails = 0;
  // Each saved key.
  for (const k of keys) {
    // The trap started again: a fresh program, the counts carried on.
    if (k === RETRY) {
      // Started again.
      st = startDaily(d);
      // Measured from the new start, the wrong tries kept.
      tries = { ...startTries(st), wrong: tries.wrong };
      // Next.
      continue;
    }
    // Nothing more once it is over (left, or failed until the next RETRY).
    if (st.outcome !== "run") continue;
    // The step.
    const next = press(st, k);
    // The clock is not a keystroke and never a try.
    if (k !== "Tick") {
      // One keystroke more.
      n++;
      // Counted as the page counts it.
      tries = countTry(tries, k, next);
    }
    // A wrong way out.
    if (next.outcome === "fail") fails++;
    // Moved on.
    st = next;
  }
  // The attempt so far.
  return { st, tries, keys: n, fails };
}

/** The ways out each program's third hint spells out: in every daily scene one of them leaves and none fails. */
const HINT_WAYS: Record<string, Key[][]> = {
  // "Esc, then :wq and Enter to save and quit, or :q! and Enter to quit without saving."
  vim: [["Esc", ":", "w", "q", "Enter"], ["Esc", ":", "q", "!", "Enter"]],
  // "Press q."
  less: [["q"]],
  // "Press q."
  man: [["q"]],
  // "Ctrl-X. If it asks whether to save the modified buffer, answer Y (then Enter) or N."
  nano: [["C-x"], ["C-x", "y", "Enter"], ["C-x", "n"]],
  // "Ctrl-X, then Ctrl-C."
  emacs: [["C-x", "C-c"]],
  // "Press q (or Ctrl-C)."
  top: [["q"], ["C-c"]],
  // "Type exit() and Enter, or press Ctrl-D on an empty line."
  python: [["e", "x", "i", "t", "(", ")", "Enter"], ["C-d"]],
  // "Enter, then ~, then ."
  ssh: [["Enter", "~", "."]],
  // "Ctrl-C."
  tail: [["C-c"]],
  // "Ctrl-] for the telnet> prompt, then quit (q is enough) and Enter."
  telnet: [["C-]", "q", "Enter"], ["C-]", "q", "u", "i", "t", "Enter"]],
  // "Ctrl-B, then d to detach."
  tmux: [["C-b", "d"]],
  // "i, a message, Esc, then :wq and Enter."
  git: [["i", "x", "Esc", ":", "w", "q", "Enter"]],
};

/** A wrong way out of each program, where its model has one (nano and telnet have none), for the retry check. */
const FAIL_WAYS: Record<string, Key[]> = {
  vim: ["C-z"],
  less: ["C-z"],
  man: ["C-z"],
  emacs: ["C-z"],
  top: ["C-z"],
  python: ["C-z"],
  ssh: ["Enter", "~", "C-z"],
  tail: ["C-z"],
  tmux: ["C-c"],
  git: [":", "q", "Enter"],
};

/** Classic mistakes and the wrong tries each must count: [level, keys, wrong tries]. */
const CLASSIC_MISTAKES: readonly [string, Key[], number][] = [
  // quit typed into the file, Enter a new line.
  ["vim", ["q", "u", "i", "t", "Enter"], 1],
  // Esc once is a step; the second and third change nothing.
  ["vim", ["Esc", "Esc", "Esc"], 2],
  // :q refused with unsaved changes.
  ["vim", ["Esc", ":", "q", "Enter"], 1],
  // Ctrl-C does not end less.
  ["less", ["C-c"], 1],
  // exit on its own only prints how to exit.
  ["python", ["e", "x", "i", "t", "Enter"], 1],
  // quit is sent to the remote end.
  ["telnet", ["q", "u", "i", "t", "Enter"], 1],
  // Ctrl-G cancels; it does not exit.
  ["emacs", ["C-g"], 1],
  // Ctrl-C reaches the backup: the level fails.
  ["tmux", ["C-c"], 1],
];

/** Every key the fuzz part of the self-test draws from. */
const FUZZ_KEYS: readonly Key[] = ["a", "q", "x", "i", ":", "!", "~", ".", " ", "Z", "e", "h", "y", "n", "d", "Enter", "Esc", "Backspace", "Tab", "Up", "Down", "Left", "Right", "C-c", "C-d", "C-x", "C-b", "C-]", "C-g", "Tick"];

/**
 * Check a screen's shape: ROWS lines, none wider than COLS, the cursor inside.
 *
 * @param s the screen
 * @returns a problem, or "" when well formed
 */
function badScreen(s: Screen): string {
  // The row count.
  if (s.lines.length !== ROWS) return `${s.lines.length} rows`;
  // The width.
  const wide = s.lines.find((l) => l.length > COLS);
  if (wide !== undefined) return `a row of ${wide.length} columns`;
  // The cursor.
  if (s.cursor && (s.cursor.r < 0 || s.cursor.r >= ROWS || s.cursor.c < 0 || s.cursor.c >= COLS)) return `cursor at ${s.cursor.r},${s.cursor.c}`;
  // Well formed.
  return "";
}

/**
 * The self-test: for every level, each documented exit leaves it on its last key and not before; the par is the
 * shortest documented exit, and that exit counts no wrong try; each listed wrong attempt does not leave it; a wrong
 * attempt that leaves the program running can be followed by a documented exit; the classic mistakes count as
 * wrong tries; the man page fits the width man-db formats it to and its prompt shows how to quit; Ctrl-C inside
 * tmux fails the level with tmux still on screen; every run is deterministic; and 300 random key sequences per
 * level never throw, never produce a malformed screen (while running or once over), and replay identically.
 *
 * Then the medals and the daily escape (PRIME 03/11/2026): the Under par medal can really be won (git's template,
 * un-commented, is a message); and 400 daily escapes from launch are each deterministic, drawn from the one-program
 * levels (all twelve in every block of twelve days), well formed on their first and last screens, and escapable by
 * every documented way out of their scene, on its last key, the par being the shortest and counting no wrong try;
 * the third hint the day shows leads out and never into a failure; a wrong way out, a retry and the par's way still
 * leave, with the keystrokes carried on; and ten random key sequences per day behave as on the levels.
 *
 * @returns the report
 */
export function selfTest(): SelfTestReport {
  // Problems.
  const failures: string[] = [];
  // Cases checked.
  let checked = 0;
  // The fuzz generator, fixed.
  const rng = makeRng(0x5eed);
  // Each level.
  for (const lv of LEVELS) {
    // Each documented exit.
    for (const sol of lv.solutions) {
      // Played.
      const a = run(lv.id, sol);
      // Leaves the level, exactly on the last key.
      if (a.st.outcome !== "exit" || a.endedAt !== sol.length - 1) failures.push(`${lv.id}: ${JSON.stringify(sol)} does not leave cleanly (outcome ${a.st.outcome}, at ${a.endedAt})`);
      // Deterministic: played again, the same state.
      if (JSON.stringify(run(lv.id, sol).st) !== JSON.stringify(a.st)) failures.push(`${lv.id}: ${JSON.stringify(sol)} is not deterministic`);
      // Counted.
      checked++;
    }
    // The par is the shortest documented exit, exactly (review R3-I3, 03/11/2026: three pars were longer).
    const shortest = Math.min(...lv.solutions.map((s) => s.filter((k) => k !== "Tick").length));
    if (shortest !== lv.par) failures.push(`${lv.id}: par ${lv.par}, but the shortest documented exit takes ${shortest}`);
    // The shortest ways out count no wrong try: the right keys never bring up a hint.
    for (const sol of lv.solutions.filter((s) => s.filter((k) => k !== "Tick").length === shortest)) {
      // Counted key by key, as the page counts.
      const wrong = countKeys(lv.id, sol);
      // None.
      if (wrong !== 0) failures.push(`${lv.id}: the shortest exit ${JSON.stringify(sol)} counts ${wrong} wrong tries`);
      // Counted.
      checked++;
    }
    // Each classic wrong attempt.
    for (const w of lv.wrong) {
      // Played.
      const a = run(lv.id, w);
      // It must not leave cleanly.
      if (a.st.outcome === "exit") failures.push(`${lv.id}: wrong attempt ${JSON.stringify(w)} leaves the level`);
      // Still running: some documented exit still works after it.
      if (a.st.outcome === "run" && !lv.solutions.some((sol) => run(lv.id, [...w, ...sol]).st.outcome === "exit")) failures.push(`${lv.id}: after ${JSON.stringify(w)}, no documented exit leaves`);
      // Counted.
      checked++;
    }
    // Random key sequences.
    for (let f = 0; f < 300; f++) {
      // A sequence of 1 to 40 keys.
      const keys: Key[] = [];
      const n = rng.range(1, 40);
      for (let i = 0; i < n; i++) keys.push(rng.pick(FUZZ_KEYS));
      // Played, step by step, with every screen checked.
      try {
        // From the start.
        let st = startLevel(lv.id);
        // Each key.
        for (const k of keys) {
          // The step.
          st = press(st, k);
          // The screen.
          const bad = badScreen(view(st));
          // Reported once per sequence.
          if (bad) {
            failures.push(`${lv.id}: screen ${bad} after ${JSON.stringify(keys)}`);
            break;
          }
        }
        // The screen once the level is over is well formed too.
        const badEnd = st.outcome === "run" ? "" : badScreen(finalView(st));
        if (badEnd) failures.push(`${lv.id}: final screen ${badEnd} after ${JSON.stringify(keys)}`);
        // Replayed: the same state.
        if (JSON.stringify(run(lv.id, keys).st) !== JSON.stringify(st)) failures.push(`${lv.id}: ${JSON.stringify(keys)} is not deterministic`);
      } catch (err) {
        // A throw is a failure.
        failures.push(`${lv.id}: ${JSON.stringify(keys)} threw ${(err as Error).message}`);
      }
      // Counted.
      checked++;
    }
  }
  // The classic mistakes count as wrong tries (review R3-06, 03/11/2026).
  for (const [id, keys, want] of CLASSIC_MISTAKES) {
    // Counted.
    const got = countKeys(id, keys);
    // As expected.
    if (got !== want) failures.push(`${id}: ${JSON.stringify(keys)} counts ${got} wrong tries, not ${want}`);
    // Counted.
    checked++;
  }
  // The man page fits the line length man-db formats it to, and its first screen shows how to quit (review R3-05).
  const manScreen = view(startLevel("man"));
  // Every line of the page.
  const manWide = MAN_PAGE.find((l) => l.length > MAN_WIDTH);
  if (manWide !== undefined) failures.push(`man: a page line of ${manWide.length} columns (man-db formats to ${MAN_WIDTH})`);
  // The prompt's end.
  if (!manScreen.lines[ROWS - 1].endsWith("(press h for help or q to quit)")) failures.push(`man: the prompt reads "${manScreen.lines[ROWS - 1]}"`);
  checked++;
  // Ctrl-C inside tmux: the job dies, the level fails, and tmux (its status line) and the shell in the pane stay on screen (review R3-04).
  const interrupted = run("tmux", ["C-c"]).st;
  // The screen once it is over.
  const afterC = finalView(interrupted);
  if (interrupted.outcome !== "fail" || interrupted.term.why !== "interruptedJob") failures.push(`tmux: Ctrl-C gives ${interrupted.outcome}/${interrupted.term.why}`);
  if (!afterC.lines[ROWS - 1].startsWith("[backup]") || !afterC.lines.some((l) => l === REMOTE_PROMPT)) failures.push("tmux: after Ctrl-C the pane or tmux is gone from the screen");
  checked++;

  // The medals. medalFor: under, at and over par.
  if (medalFor(2, 3) !== "under" || medalFor(3, 3) !== "par" || medalFor(4, 3) !== "") failures.push("medalFor: wrong medal for 2, 3 or 4 keystrokes on par 3");
  // The Under par medal can be won: deleting the # of the template's second line makes it a message, so j, x and ZZ
  // commit in 4 keystrokes on git's par of 5 (and the boss, which contains git, in 10 on 11).
  const gitPar = (LEVELS.find((l) => l.id === "git") ?? LEVELS[0]).par;
  // Played.
  const trick = run("git", ["j", "x", "Z", "Z"]);
  // Left cleanly on the fourth key, under par.
  if (trick.st.outcome !== "exit" || trick.endedAt !== 3 || medalFor(4, gitPar) !== "under") failures.push(`git: j x ZZ gives ${trick.st.outcome} at ${trick.endedAt} on par ${gitPar}, so Under par cannot be won`);
  checked++;

  // The daily escape: 400 days from launch.
  const programs = new Set<string>();
  // Its own fuzz generator, fixed.
  const drng = makeRng(0xda11);
  // Each day.
  for (let i = 0; i < 400; i++) {
    // The day and its trap.
    const day = addDays(LAUNCH_DAY, i);
    const d = dailyEscape(day);
    // A label for the failures.
    const tag = `daily ${day} (${d.level} ${JSON.stringify(d.scene)})`;
    // The same day, the same trap.
    if (JSON.stringify(d) !== JSON.stringify(dailyEscape(day))) failures.push(`${tag}: not deterministic`);
    // One of the one-program levels.
    if (!DAILY_LEVELS.includes(d.level)) {
      // Reported; nothing else can be checked.
      failures.push(`${tag}: not a one-program level`);
      continue;
    }
    // Seen.
    programs.add(d.level);
    // The start: well formed, and the same every time.
    const s0 = startDaily(d);
    // Its screen.
    const bad0 = badScreen(view(s0));
    if (bad0) failures.push(`${tag}: first screen ${bad0}`);
    if (JSON.stringify(s0) !== JSON.stringify(startDaily(d))) failures.push(`${tag}: the start is not deterministic`);
    // At least one way out.
    if (d.solutions.length === 0) failures.push(`${tag}: no way out`);
    // Every documented way out of the scene leaves on its last key, the screen after it well formed, the same twice.
    for (const sol of d.solutions) {
      // Played.
      const a = runDaily(d, sol);
      // Left on the last key.
      if (a.st.outcome !== "exit" || a.endedAt !== sol.length - 1) failures.push(`${tag}: ${JSON.stringify(sol)} does not leave cleanly (outcome ${a.st.outcome}, at ${a.endedAt})`);
      // The shell after it.
      const badEnd = a.st.outcome === "run" ? "" : badScreen(finalView(a.st));
      if (badEnd) failures.push(`${tag}: final screen ${badEnd} after ${JSON.stringify(sol)}`);
      // Deterministic.
      if (JSON.stringify(runDaily(d, sol).st) !== JSON.stringify(a.st)) failures.push(`${tag}: ${JSON.stringify(sol)} is not deterministic`);
      // Counted.
      checked++;
    }
    // The par is the shortest of them; the par's ways count no wrong try, as the page counts.
    const shortest = Math.min(...d.solutions.map((s) => s.filter((k) => k !== "Tick").length));
    if (shortest !== d.par) failures.push(`${tag}: par ${d.par}, but the shortest way out takes ${shortest}`);
    // The par's ways.
    const parWays = d.solutions.filter((s) => !s.includes("Tick") && s.length === shortest);
    // Each counts none.
    for (const sol of parWays) {
      // Replayed as the page replays an attempt.
      const r = replayDaily(d, sol);
      // Out, in par keystrokes, no wrong try.
      if (r.st.outcome !== "exit" || r.keys !== d.par || r.tries.wrong !== 0) failures.push(`${tag}: the par's way ${JSON.stringify(sol)} replays as ${r.st.outcome}, ${r.keys} keys, ${r.tries.wrong} wrong tries`);
    }
    // The program's third hint, which the day shows, leads out in this scene and never into a failure.
    const hinted = (HINT_WAYS[d.level] ?? []).map((w) => runDaily(d, w).st.outcome);
    if (!hinted.includes("exit") || hinted.includes("fail")) failures.push(`${tag}: the third hint's ways end as ${hinted.join(", ")}`);
    // A wrong way out, then a retry, then the par's way: the attempt leaves, its keystrokes carried on, one failure.
    const wrongWay = FAIL_WAYS[d.level];
    // Where the program has one, and with a par's way to follow it.
    if (wrongWay && parWays[0]) {
      // Replayed.
      const r = replayDaily(d, [...wrongWay, RETRY, ...parWays[0]]);
      // Out, every keystroke counted, one wrong way out.
      if (r.st.outcome !== "exit" || r.keys !== wrongWay.length + d.par || r.fails !== 1) failures.push(`${tag}: fail, retry and the par's way give ${r.st.outcome}, ${r.keys} keys, ${r.fails} failures`);
    }
    // Ten random key sequences from the start: no throw, every screen well formed, the same on a replay.
    for (let f = 0; f < 10; f++) {
      // 1 to 30 keys.
      const keys: Key[] = [];
      const n = drng.range(1, 30);
      for (let k = 0; k < n; k++) keys.push(drng.pick(FUZZ_KEYS));
      // Played, step by step.
      try {
        // From the start.
        let st = startDaily(d);
        // Each key.
        for (const k of keys) {
          // The step.
          st = press(st, k);
          // The screen.
          const bad = badScreen(view(st));
          // Reported once per sequence.
          if (bad) {
            failures.push(`${tag}: screen ${bad} after ${JSON.stringify(keys)}`);
            break;
          }
        }
        // The screen once over.
        const badEnd = st.outcome === "run" ? "" : badScreen(finalView(st));
        if (badEnd) failures.push(`${tag}: final screen ${badEnd} after ${JSON.stringify(keys)}`);
        // Replayed: the same state.
        if (JSON.stringify(runDaily(d, keys).st) !== JSON.stringify(st)) failures.push(`${tag}: ${JSON.stringify(keys)} is not deterministic`);
      } catch (err) {
        // A throw is a failure.
        failures.push(`${tag}: ${JSON.stringify(keys)} threw ${(err as Error).message}`);
      }
    }
    // One day checked.
    checked++;
  }
  // Every program comes up.
  if (programs.size !== DAILY_LEVELS.length) failures.push(`daily: only ${programs.size} of ${DAILY_LEVELS.length} programs came up in 400 days`);
  // Each full block of twelve days brings each program once.
  for (let b = 0; b < Math.floor(400 / DAILY_LEVELS.length); b++) {
    // The block's programs.
    const inBlock = new Set(DAILY_LEVELS.map((_, j) => dailyEscape(addDays(LAUNCH_DAY, b * DAILY_LEVELS.length + j)).level));
    // All of them.
    if (inBlock.size !== DAILY_LEVELS.length) failures.push(`daily: block ${b} brings ${inBlock.size} programs, not ${DAILY_LEVELS.length}`);
  }
  checked++;
  // The report (capped, so a broken build prints a readable list).
  return { checked, failures: failures.slice(0, 40) };
}
