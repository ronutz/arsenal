// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/useDesk.ts
// ----------------------------------------------------------------------------
// THE DESK IN A REACT COMPONENT. One hook over the store's external-store
// functions (src/lib/desk/store.ts): the server and the first render see an
// empty, not-ready desk (so the static HTML and the hydrated page agree), and
// from then on every change, in this tab or another, re-renders the component.
// ============================================================================

// React's hook for a store that lives outside React.
import { useSyncExternalStore } from "react";
// The store's three functions.
import { getDeskState, getServerDeskState, subscribeDesk, type DeskState } from "./store";

/**
 * The desk as it stands, kept up to date.
 *
 * @returns the desk's state (ready false until it has been read in the browser)
 */
export function useDesk(): DeskState {
  // Subscribed, with the server's empty state for the server render and hydration.
  return useSyncExternalStore(subscribeDesk, getDeskState, getServerDeskState);
}
