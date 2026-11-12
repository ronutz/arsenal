// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/GameErrorBoundary.tsx
// ----------------------------------------------------------------------------
// A GAME THAT FAILS SAYS SO, IN THE GAME'S PLACE (PRIME 11/11/2026 23:53: Phish
// or Legit, on Chrome for iPhone, ended in Next's bare "Application error: a
// client-side exception has occurred", which blanks the whole page).
//
// Every game page wraps its game in MorePuzzlesProvider, which puts this
// boundary around it, so all of them get it from one place. When the game's
// code throws while drawing:
//   - a piece of code that could not be loaded (a newer version of the site
//     was published while the page was open) reloads the page once, by itself,
//     with one line saying so (src/lib/crashRecovery.ts);
//   - anything else shows, where the board was, that the game stopped, what
//     failed in one line (so a screenshot of it names the bug), "Try again"
//     (the game starts afresh; a daily puzzle comes back from what was saved
//     after each move) and "Reload the page".
// The header, the footer and the rest of the page stay. Errors inside event
// handlers never reach a boundary (React reports them and carries on), so this
// only ever shows for a failure while the game is drawn or brought up to date.
// ============================================================================

"use client";

// React's class component (error boundaries are classes), the keyed fragment, the node type and the error info.
import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
// The game frame's strings.
import { useTranslations } from "next-intl";
// The reload-once rule and the one-line description.
import { describeError, isChunkError, reloadOnce } from "@/lib/crashRecovery";

/** What the boundary remembers. */
interface BoundaryState {
  /** The error caught, or null while the game runs. */
  error: unknown;
  /** Whether a reload was started for a load failure. */
  reloading: boolean;
  /** Bumped by "Try again", so the game is mounted afresh. */
  attempt: number;
}

/**
 * The boundary around one game.
 */
export default class GameErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  /** Nothing caught yet. */
  state: BoundaryState = { error: null, reloading: false, attempt: 0 };

  /**
   * Keep the error, so the next render shows the message instead of the game.
   *
   * @param error what the game threw
   * @returns the state change
   */
  static getDerivedStateFromError(error: unknown): Partial<BoundaryState> {
    // Caught.
    return { error };
  }

  /**
   * After the catch: logged for the console, and a load failure reloads the page once.
   *
   * @param error what the game threw
   * @param info where in the tree it was thrown
   */
  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // In the console, with the components it passed through (what "see the browser console" would have shown).
    console.error("[game] stopped with an error", error, info.componentStack);
    // A file of an older version that is gone: one reload fetches the new version.
    if (isChunkError(error) && reloadOnce()) this.setState({ reloading: true });
  }

  /** "Try again": the game is mounted afresh. */
  private retry = (): void => {
    // Cleared, with a new key for the game.
    this.setState((s) => ({ error: null, reloading: false, attempt: s.attempt + 1 }));
  };

  /**
   * The game, or the message in its place.
   *
   * @returns the subtree
   */
  render(): ReactNode {
    // Running: the game, keyed so "Try again" mounts it afresh.
    if (this.state.error === null) return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
    // Stopped: the message.
    return <GameCrash error={this.state.error} reloading={this.state.reloading} onRetry={this.retry} />;
  }
}

/**
 * The message shown where the game was.
 *
 * @param props the error, whether a reload is under way, and "Try again"
 * @returns the panel
 */
function GameCrash(props: { error: unknown; reloading: boolean; onRetry: () => void }) {
  // The frame's strings.
  const t = useTranslations("devFun.games.common.crash");
  // Reloading for a newer version: one line.
  if (props.reloading) {
    // Said politely.
    return (
      <div className="fg-result fg-result-lost" role="status">
        <p className="fg-result-detail">{t("updating")}</p>
      </div>
    );
  }
  // The message, what failed, and the two ways on.
  return (
    <div className="fg-result fg-result-lost" role="alert">
      <p className="fg-result-headline">{t("title")}</p>
      <p className="fg-result-detail">{t("body")}</p>
      <div className="fg-result-actions">
        <button type="button" className="fg-button fg-button-primary" onClick={props.onRetry}>
          {t("retry")}
        </button>
        <button type="button" className="fg-button" onClick={() => window.location.reload()}>
          {t("reload")}
        </button>
      </div>
      {/* What failed, in the browser's words, for a screenshot or a report. */}
      <details className="fg-crash-details">
        <summary className="fg-small fg-muted">{t("details")}</summary>
        <p className="fg-small mono fg-crash-text">{describeError(props.error)}</p>
      </details>
    </div>
  );
}
