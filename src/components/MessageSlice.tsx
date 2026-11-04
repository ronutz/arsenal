// ============================================================================
// src/components/MessageSlice.tsx
// ----------------------------------------------------------------------------
// NESTED MESSAGE PROVIDER (A1, ratified 2026-07-10).
//
// A server component that fetches the merged message pack, picks the requested
// top-level namespaces, and wraps its children in a nested
// NextIntlClientProvider carrying ONLY that slice. A nested provider REPLACES
// the outer one's messages (use-intl 3.26.5 does not merge them; found on
// 2026-11-03), so a route's client components inside a slice see {this slice}
// plus SLICE_CARRIED_NAMESPACES (the shared controls' strings, such as the
// numeric arrows' "stepper") and nothing else - keeping the inlined RSC
// payload small. The global chrome lives outside every slice.
//
// USAGE (in a server page/layout):
//   <MessageSlice namespaces={["tools." + slug]}>
//     <SomeClientTool />
//   </MessageSlice>
//
// The namespaces passed here MUST cover every useTranslations("ns") of the
// client components inside (beyond the global set). scripts/check-client-
// messages.mjs verifies this statically, so an omission fails the build rather
// than surfacing as a runtime MISSING_MESSAGE.
// ============================================================================

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { pickNamespaces, SLICE_CARRIED_NAMESPACES } from "@/i18n/clientMessages";

export default async function MessageSlice({
  namespaces,
  children,
}: {
  /** Top-level message namespaces this subtree's client components need. */
  namespaces: readonly string[];
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  // The slice asked for, plus the namespaces every slice carries (a nested provider replaces the outer messages).
  const slice = pickNamespaces(messages, [...SLICE_CARRIED_NAMESPACES, ...namespaces]);
  return <NextIntlClientProvider messages={slice}>{children}</NextIntlClientProvider>;
}
