// ============================================================================
// src/app/not-found.tsx
// ----------------------------------------------------------------------------
// Root 404 — shown for routes that do not match any locale path. Kept minimal
// and dependency-free (it renders outside the locale provider). Intentionally
// simple English text since there is no locale context at this level.
// ============================================================================

export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          background: "#020617",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Page not found</h1>
          <p style={{ color: "#94a3b8" }}>
            That page does not exist. <a href="/" style={{ color: "#22d3ee" }}>Go to the home page</a>.
          </p>
        </div>
      </body>
    </html>
  );
}
