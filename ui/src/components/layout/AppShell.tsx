import { Outlet } from "react-router-dom";

import { useAppContext } from "../../App";
import { NavSidebar } from "./NavSidebar";

function formatVersion(v: string): string {
  if (/^v?\d+\.\d+\.\d+$/.test(v)) return v;
  if (v === "dev") return "dev";
  const pseudoMatch = v.match(/^v0\.0\.0-\d+-([0-9a-f]+)/);
  if (pseudoMatch) {
    const dirty = v.includes("+dirty") ? "*" : "";
    return `dev (${pseudoMatch[1].slice(0, 7)}${dirty})`;
  }
  return v.length > 20 ? v.slice(0, 20) + "…" : v;
}

export function AppShell() {
  const { clearToken, refresh, settings, user, metadata } = useAppContext();

  return (
    <div
      className="flex min-h-screen flex-col px-4 py-4 text-body md:px-6"
      style={{
        background: "#090c10",
        backgroundImage: [
          "radial-gradient(ellipse 100% 50% at 50% -5%, rgba(252,213,53,0.06) 0%, transparent 60%)",
          "radial-gradient(ellipse 60% 40% at 0% 100%, rgba(14,203,129,0.03) 0%, transparent 50%)",
        ].join(", "),
      }}
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-1 gap-4 lg:flex-row">
        {/* Sidebar — fixed width, full height */}
        <div className="shrink-0 lg:w-[260px]">
          <NavSidebar />
        </div>

        {/* Main panel — gradient border wrapper, stretches full height */}
        <div
          className="min-w-0 flex-1 rounded-panel p-px"
          style={{
            background: "linear-gradient(160deg, rgba(43,49,57,0.9) 0%, rgba(43,49,57,0.3) 50%, rgba(43,49,57,0.1) 100%)",
          }}
        >
          <div
            className="flex h-full min-h-full flex-col rounded-[11px]"
            style={{
              background: "linear-gradient(180deg, #0f1419 0%, #0b0e12 100%)",
            }}
          >
            <header
              className="flex flex-col gap-3 px-6 py-3.5 md:flex-row md:items-center md:justify-between"
              style={{
                borderBottom: "1px solid rgba(43,49,57,0.7)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
                  style={
                    settings.mode === "development"
                      ? {
                          background: "rgba(252,213,53,0.1)",
                          color: "#fcd535",
                          border: "1px solid rgba(252,213,53,0.2)",
                          boxShadow: "0 0 12px rgba(252,213,53,0.1)",
                        }
                      : {
                          background: "linear-gradient(135deg, #0d2b1a 0%, #1a5c35 40%, #2d7a4f 100%)",
                          color: "#4ade80",
                          border: "1px solid rgba(78,222,128,0.3)",
                          boxShadow: "0 0 12px rgba(78,222,128,0.12), inset 0 1px 0 rgba(78,222,128,0.08)",
                        }
                  }
                >
                  {settings.mode}
                </span>
                {user ? (
                  <span className="text-[13px] text-muted/80">
                    {user.username}
                    {user.role === "admin" ? (
                      <span
                        className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: "rgba(43,49,57,0.8)", color: "#707a8a" }}
                      >
                        admin
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="whitespace-nowrap rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #0d2b1a 0%, #1a5c35 40%, #2d7a4f 100%)",
                    color: "#4ade80",
                    border: "1px solid rgba(78,222,128,0.3)",
                    boxShadow: "0 0 10px rgba(78,222,128,0.12), inset 0 1px 0 rgba(78,222,128,0.08)",
                  }}
                  title={metadata.version}
                >
                  {formatVersion(metadata.version)}
                </span>
                <button
                  className="rounded-md px-3 py-1 text-[13px] text-body/60 transition-all duration-150 hover:text-body"
                  style={{ background: "rgba(43,49,57,0.5)", border: "1px solid rgba(43,49,57,0.8)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(43,49,57,0.9)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(107,114,128,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(43,49,57,0.5)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(43,49,57,0.8)";
                  }}
                  onClick={() => void refresh()}
                >
                  Refresh
                </button>
                {settings.mode !== "development" ? (
                  <button
                    className="rounded-md px-3 py-1 text-[13px] font-semibold text-ink transition-all duration-150"
                    style={{
                      background: "linear-gradient(135deg, #fcd535 0%, #f0b90b 100%)",
                      boxShadow: "0 2px 8px rgba(252,213,53,0.25)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(252,213,53,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(252,213,53,0.25)";
                    }}
                    onClick={clearToken}
                  >
                    Sign out
                  </button>
                ) : null}
              </div>
            </header>
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
