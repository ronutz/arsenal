"use client";

// ============================================================================
// src/components/CsrDecoderTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE PKCS#10 CERTIFICATE SIGNING REQUEST DECODER.
//
// PRIVACY/SECURITY (the architecture IS the control):
//   Decoding runs ENTIRELY IN THE BROWSER via the local csr-decoder module -
//   no fetch, no API, no server, so the CSR never leaves the device (D-49).
//   All output is rendered as escaped text through React (no
//   dangerouslySetInnerHTML), so even a hostile CSR cannot inject markup.
//
// The decode core (run) is deterministic and time-independent: a CSR has no
// validity window, no serial, and no issuer, so there is nothing clock-relative
// to compute here. The component is purely a presenter over the decoded struct.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { run, CsrDecodeError, type DecodedCsr } from "@/lib/tools/csr-decoder";

// A worked example: an RSA-2048 CSR with SAN, keyUsage and EKU (the same CSR
// used as a golden vector, so the example exercises the full decode path).
const EXAMPLE_CSR = `-----BEGIN CERTIFICATE REQUEST-----
MIIC6jCCAdICAQAwOTELMAkGA1UEBhMCQlIxFDASBgNVBAoMC0V4YW1wbGUgT3Jn
MRQwEgYDVQQDDAtleGFtcGxlLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCC
AQoCggEBANI2h6EE7lREjFqCOubcy5lI6hRXWXRcaOoh/wi6CMxPs7zyPNOG0Qby
h5xqbrZLWJHB5nKqnslN0o2mZJkXE7NG5HL2rYe40uIIS2Htz9MxEQoQN45mXGvK
7Dx0MwIOpO7O0k3Il3qCeW+pklaPksWTiw3IZAA0cjfvFqB2db5coPNNN03JxoAD
D8SHDMg9YKe8ZzW+wOWw8Xsliwbq7lqqVEGp0yxhQ5jLzTywu3QSI0Aq3CemNbof
pYWk3dGLiydxrKcoc8xVrnRkaTsc7lBjQUcJv+j88jrOg4q8yf+lNxF07fV51se0
h0LRM2hqO+UW7HU8FbZiqHH9eRpVzesCAwEAAaBsMGoGCSqGSIb3DQEJDjFdMFsw
LQYDVR0RBCYwJIILZXhhbXBsZS5jb22CD3d3dy5leGFtcGxlLmNvbYcEwAACCjAL
BgNVHQ8EBAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMA0GCSqG
SIb3DQEBCwUAA4IBAQBiWE1zEfWdwfrqPDu6o5O+dXowrF839rDTl6wBTVKuiUbp
DAbdaxl1x/GvyU25DP0NkGcwEBMXCymRTv0+prBzoKz7zpLVUUdbFErU3jd7uqCb
MpgeuOMWWUg8mh5W/J/o6edWbtxK7bNMwEbLD0Y2iriG4dWlh2KUlGSdpb64eBED
+xTyCwt0tWfltRKfF1SOH1HbUeCZgLE+CVM0elMTuLPM1bk6dPIB04tRAQFfD5NX
I6/nCpf6ZA713IYaUzgI0s65pCF/Yi/P+qKbwX2Dtv1EKGvCxP+fj2l2Vb/VCaGG
2Pv9GFJb5zxpSrE/4iU4IyzVgKOUvMI18USW9PWJ
-----END CERTIFICATE REQUEST-----`;

export default function CsrDecoderTool() {
  const t = useTranslations("tools.csr-decoder");

  const [value, setValue] = useState("");
  const [decoded, setDecoded] = useState<DecodedCsr | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Decode on every change. Empty input clears both result and error.
  const decode = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setDecoded(null);
        setError(null);
        return;
      }
      try {
        setDecoded(run({ input: trimmed }));
        setError(null);
      } catch (e) {
        const code = e instanceof CsrDecodeError ? e.code : "format";
        setDecoded(null);
        setError(t(`err_${code}`));
      }
    },
    [t],
  );

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    decode(e.target.value);
  };

  const loadExample = () => {
    setValue(EXAMPLE_CSR);
    decode(EXAMPLE_CSR);
  };

  const req = decoded?.requested;
  const hasRequested =
    req &&
    ((req.subjectAltName && req.subjectAltName.length > 0) ||
      (req.keyUsage && req.keyUsage.length > 0) ||
      (req.extendedKeyUsage && req.extendedKeyUsage.length > 0) ||
      req.basicConstraints !== undefined ||
      req.other.length > 0);
  const hasAttributes =
    decoded &&
    (decoded.challengePassword !== undefined ||
      decoded.unstructuredName !== undefined ||
      decoded.otherAttributes.length > 0);

  return (
    <div className="cidr-tool jwt-tool x509-tool csr-tool">
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="csr-input">
          {t("inputLabel")}
        </label>
        <textarea
          id="csr-input"
          className="cidr-input jwt-input mono"
          rows={8}
          spellCheck={false}
          autoComplete="off"
          placeholder={t("inputPlaceholder")}
          value={value}
          onChange={onChange}
          aria-describedby="csr-privacy"
        />
        <div className="csr-actions">
          <button type="button" className="cidr-example-btn" onClick={loadExample}>
            {t("exampleLabel")}
          </button>
        </div>
        <p id="csr-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {decoded && (
        <div className="jwt-results x509-results csr-results">
          {/* A CSR is a request, not a certificate: no validity, serial, or issuer. */}
          <p className="csr-note">{t("notCertNote")}</p>

          {/* Subject ----------------------------------------------------- */}
          <section className="csr-card">
            <h3 className="csr-card-title">{t("subjectHeading")}</h3>
            {decoded.subject.attributes.length > 0 ? (
              <>
                <table className="csr-table">
                  <thead>
                    <tr>
                      <th>{t("colAttr")}</th>
                      <th>{t("colValue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decoded.subject.attributes
                      .slice()
                      .reverse()
                      .map((a, i) => (
                        <tr key={i}>
                          <td className="csr-attr-type mono">{a.type}</td>
                          <td className="csr-attr-value mono">{a.value}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <p className="csr-dn-text mono">{decoded.subject.text}</p>
              </>
            ) : (
              <p className="csr-muted">{t("noSubject")}</p>
            )}
          </section>

          {/* Public key -------------------------------------------------- */}
          <section className="csr-card">
            <h3 className="csr-card-title">{t("keyHeading")}</h3>
            <dl className="csr-rows">
              <div className="csr-row">
                <dt>{t("keyAlgorithmLabel")}</dt>
                <dd className="mono">{decoded.publicKey.algorithm}</dd>
              </div>
              {decoded.publicKey.keySizeBits !== undefined && (
                <div className="csr-row">
                  <dt>{t("keySizeLabel")}</dt>
                  <dd className="mono">{t("keySizeValue", { bits: decoded.publicKey.keySizeBits })}</dd>
                </div>
              )}
              {decoded.publicKey.curve !== undefined && (
                <div className="csr-row">
                  <dt>{t("keyCurveLabel")}</dt>
                  <dd className="mono">{decoded.publicKey.curve}</dd>
                </div>
              )}
              {decoded.publicKey.exponent !== undefined && (
                <div className="csr-row">
                  <dt>{t("keyExponentLabel")}</dt>
                  <dd className="mono">{t("keyExponentValue", { exp: decoded.publicKey.exponent })}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Requested extensions --------------------------------------- */}
          <section className="csr-card">
            <h3 className="csr-card-title">{t("requestedHeading")}</h3>
            {hasRequested ? (
              <dl className="csr-rows">
                {req?.subjectAltName && req.subjectAltName.length > 0 && (
                  <div className="csr-row">
                    <dt>{t("sanLabel")}</dt>
                    <dd>
                      <ul className="csr-san-list">
                        {req.subjectAltName.map((s, i) => (
                          <li key={i} className="mono">
                            <span className="csr-san-type">{s.type}</span> {s.value}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                {req?.keyUsage && req.keyUsage.length > 0 && (
                  <div className="csr-row">
                    <dt>{t("keyUsageLabel")}</dt>
                    <dd className="mono">{req.keyUsage.join(", ")}</dd>
                  </div>
                )}
                {req?.extendedKeyUsage && req.extendedKeyUsage.length > 0 && (
                  <div className="csr-row">
                    <dt>{t("ekuLabel")}</dt>
                    <dd className="mono">{req.extendedKeyUsage.join(", ")}</dd>
                  </div>
                )}
                {req?.basicConstraints !== undefined && (
                  <div className="csr-row">
                    <dt>{t("basicConstraintsLabel")}</dt>
                    <dd className="mono">
                      {req.basicConstraints.ca ? t("caYes") : t("caNo")}
                      {req.basicConstraints.pathLen !== undefined
                        ? `, ${t("pathLenValue", { n: req.basicConstraints.pathLen })}`
                        : ""}
                    </dd>
                  </div>
                )}
                {req?.other.map((o, i) => (
                  <div className="csr-row" key={`o-${i}`}>
                    <dt className="mono">{o.name}</dt>
                    <dd className="mono">{o.oid}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="csr-muted">{t("noRequested")}</p>
            )}
          </section>

          {/* Attributes -------------------------------------------------- */}
          {hasAttributes && (
            <section className="csr-card">
              <h3 className="csr-card-title">{t("attributesHeading")}</h3>
              <dl className="csr-rows">
                {decoded.challengePassword !== undefined && (
                  <div className="csr-row">
                    <dt>{t("challengePasswordLabel")}</dt>
                    <dd className="mono">{decoded.challengePassword}</dd>
                  </div>
                )}
                {decoded.unstructuredName !== undefined && (
                  <div className="csr-row">
                    <dt>{t("unstructuredNameLabel")}</dt>
                    <dd className="mono">{decoded.unstructuredName}</dd>
                  </div>
                )}
                {decoded.otherAttributes.map((a, i) => (
                  <div className="csr-row" key={i}>
                    <dt className="mono">{a.name}</dt>
                    <dd className="mono">{a.valueSummary}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Signature --------------------------------------------------- */}
          <section className="csr-card">
            <h3 className="csr-card-title">{t("signatureHeading")}</h3>
            <dl className="csr-rows">
              <div className="csr-row">
                <dt>{t("signatureAlgLabel")}</dt>
                <dd className="mono">{decoded.signatureAlgorithm}</dd>
              </div>
              <div className="csr-row">
                <dt>{t("signatureBitsLabel")}</dt>
                <dd className="mono">{t("signatureBitsValue", { bits: decoded.signatureBits })}</dd>
              </div>
            </dl>
            <pre className="csr-sig mono">{decoded.signatureHex}</pre>
          </section>

          {/* Meta -------------------------------------------------------- */}
          <section className="csr-card csr-meta">
            <span className="mono">{t("versionValue", { v: decoded.version })}</span>
            <span className="mono">{t("derLengthValue", { bytes: decoded.derLength })}</span>
          </section>
        </div>
      )}
    </div>
  );
}
