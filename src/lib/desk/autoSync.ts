// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/autoSync.ts
// ----------------------------------------------------------------------------
// LOADING THE SYNC ONLY WHEN IT IS NEEDED. The sync client (src/lib/desk/
// sync.ts, with its encryption) is not part of every page: a reader who never
// made a sync code never downloads it. The desk's controls call this hook; it
// listens for the reader's own changes and, only when this browser syncs with
// "sync after changes" on, loads the sync client and schedules a sync. Once
// loaded, the client follows later changes itself.
// ============================================================================

// React's effect.
import { useEffect } from "react";
// The store's state and its change events.
import { getDeskState, subscribeDesk } from "./store";

/**
 * Follow the reader's changes and sync them when this browser syncs automatically.
 */
export function useAutoSync(): void {
  // Listening while the component is on the page.
  useEffect(
    () =>
      subscribeDesk((origin) => {
        // Only the reader's own changes.
        if (origin !== "user") return;
        // Only when syncing automatically.
        if (!getDeskState().data.sync?.auto) return;
        // The client, loaded on demand; then it follows changes itself, and this one is scheduled now.
        void import("./sync").then((m) => { m.startAutoSync(); m.scheduleAutoSync(); }).catch(() => undefined);
      }),
    [],
  );
}
