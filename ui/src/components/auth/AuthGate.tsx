import { FormEvent, useState } from "react";

import type { MetadataResponse } from "../../lib/types";

function formatVersion(v: string): string {
  if (/^v?\d+\.\d+\.\d+$/.test(v)) return v;
  if (v === "dev") return "dev";
  const m = v.match(/^v0\.0\.0-\d+-([0-9a-f]+)/);
  if (m) return `dev (${m[1].slice(0, 7)}${v.includes("+dirty") ? "*" : ""})`;
  return v.length > 20 ? v.slice(0, 20) + "…" : v;
}

type AuthGateProps = {
  metadata: MetadataResponse;
  message: string;
  currentToken: string;
  onSubmit: (token: string) => void;
  onClear: () => void;
};

export function AuthGate({ metadata, message, currentToken, onSubmit, onClear }: AuthGateProps) {
  const [token, setToken] = useState(currentToken);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(token.trim());
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-12 text-body"
      style={{
        background: "#090c10",
        backgroundImage: [
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(17,81,58,0.25) 0%, transparent 60%)",
          "radial-gradient(ellipse 50% 40% at 80% 100%, rgba(252,213,53,0.04) 0%, transparent 50%)",
          "radial-gradient(ellipse 40% 30% at 10% 80%, rgba(14,203,129,0.04) 0%, transparent 50%)",
        ].join(", "),
      }}
    >
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(17,81,58,0.6) 0%, rgba(35,110,73,0.3) 100%)",
              boxShadow: "0 0 0 1px rgba(14,203,129,0.15), 0 8px 32px rgba(14,203,129,0.1)",
            }}
          >
            <img src="/ui/logo2.svg" alt="MCPJungle" className="h-10 w-10" />
          </div>
          <div>
            <p className="text-[18px] font-semibold tracking-tight text-body">MCPJungle</p>
            <p className="mt-0.5 text-[13px] text-muted/60">Enterprise Gateway</p>
          </div>
        </div>

        {/* Card with gradient border */}
        <div
          className="rounded-2xl p-px"
          style={{
            background: "linear-gradient(160deg, rgba(14,203,129,0.2) 0%, rgba(43,49,57,0.5) 40%, rgba(43,49,57,0.2) 100%)",
          }}
        >
          <div
            className="rounded-[15px] p-8"
            style={{
              background: "linear-gradient(180deg, #111820 0%, #0d1117 100%)",
            }}
          >
            <h1 className="text-[20px] font-semibold tracking-tight text-body">Sign in</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted/70">
              {message || "Provide a valid enterprise token to unlock management UI."}
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted/50">
                  Access token
                </span>
                <textarea
                  className="min-h-[96px] w-full rounded-xl px-3.5 py-3 font-mono text-[13px] text-body/90 outline-none transition-all duration-150 placeholder:text-muted/30"
                  style={{
                    background: "rgba(9,12,16,0.8)",
                    border: "1px solid rgba(43,49,57,0.8)",
                    resize: "none",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(14,203,129,0.35)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,203,129,0.06)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(43,49,57,0.8)"; e.currentTarget.style.boxShadow = "none"; }}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your bearer token here"
                  autoFocus
                />
              </label>

              <div className="flex gap-2.5">
                <button
                  className="flex-1 rounded-xl py-2.5 text-[14px] font-semibold text-ink transition-all duration-150 disabled:opacity-30"
                  style={{
                    background: token.trim() ? "linear-gradient(135deg, #fcd535 0%, #f0b90b 100%)" : "#fcd535",
                    boxShadow: token.trim() ? "0 4px 16px rgba(252,213,53,0.25)" : "none",
                  }}
                  type="submit"
                  disabled={!token.trim()}
                >
                  Sign in
                </button>
                {token ? (
                  <button
                    className="rounded-xl px-4 py-2.5 text-[13px] text-muted/60 transition-all duration-150 hover:text-body"
                    style={{ background: "rgba(43,49,57,0.5)", border: "1px solid rgba(43,49,57,0.8)" }}
                    type="button"
                    onClick={() => { setToken(""); onClear(); }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center font-mono text-[11px] text-muted/30" title={metadata.version}>
          {formatVersion(metadata.version)}
        </p>
      </div>
    </div>
  );
}
