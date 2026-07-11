// ============================================================================
// src/components/MessageSlice.tsx
// ----------------------------------------------------------------------------
// NESTED MESSAGE PROVIDER (A1, ratified 2026-07-10).
//
// A server component that fetches the merged message pack, picks the requested
// top-level namespaces, and wraps its children in a nested
// NextIntlClientProvider carrying ONLY that slice. next-intl merges a nested
// provider's messages over the outer (global) provider, so a route's client
// components see {global chrome} + {this slice} and nothing else - keeping the
// inlined RSC payload small.
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
import { pickNamespaces } from "@/i18n/clientMessages";

export default async function MessageSlice({
  namespaces,
  children,
}: {
  /** Top-level message namespaces this subtree's client components need. */
  namespaces: readonly string[];
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const slice = pickNamespaces(messages, namespaces);
  return <NextIntlClientProvider messages={slice}>{children}</NextIntlClientProvider>;
}
