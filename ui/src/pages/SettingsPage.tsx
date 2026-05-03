import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppContext } from "../App";
import { api } from "../lib/api";
import type { McpClient, McpClientWithToken } from "../lib/types";

function formatVersion(v: string): string {
  if (/^v?\d+\.\d+\.\d+$/.test(v)) return v;
  if (v === "dev") return "dev";
  const m = v.match(/^v0\.0\.0-\d+-([0-9a-f]+)/);
  if (m) return `dev (${m[1].slice(0, 7)}${v.includes("+dirty") ? "*" : ""})`;
  return v;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-body">{children}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted transition hover:border-accent/50 hover:text-accent"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "copied!" : "copy"}
    </button>
  );
}

const IDE_TARGETS = [
  { id: "claude",   label: "Claude" },
  { id: "cursor",   label: "Cursor" },
  { id: "codex",    label: "Codex" },
  { id: "copilot",  label: "Copilot" },
  { id: "opencode", label: "OpenCode" },
  { id: "zed",      label: "Zed" },
 ] as const;

type IDETargetId = (typeof IDE_TARGETS)[number]["id"];

type ConfigArtifact = {
  id: IDETargetId;
  label: string;
  fileName: string;
  pathHint: string;
  mergeHint: string;
  content: string;
};

function buildRemoteArgs(mcpUrl: string, token: string): string[] {
  const args = ["mcp-remote", mcpUrl];
  if (mcpUrl.startsWith("http://")) {
    args.push("--allow-http");
  }
  args.push("--header", `Authorization: Bearer ${token}`);
  return args;
}

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildConfigArtifact(id: IDETargetId, gatewayHost: string, token: string): ConfigArtifact {
  const mcpUrl = `${gatewayHost}/mcp`;
  const remoteArgs = buildRemoteArgs(mcpUrl, token);

  switch (id) {
    case "claude":
      return {
        id,
        label: "Claude",
        fileName: "mcpjungle-claude-mcp.json",
        pathHint: "~/.claude/mcp.json",
        mergeHint: "Merge under mcpServers.",
        content: JSON.stringify(
          {
            mcpServers: {
              mcpjungle: {
                command: "npx",
                args: remoteArgs,
              },
            },
          },
          null,
          2,
        ),
      };
    case "cursor":
      return {
        id,
        label: "Cursor",
        fileName: "mcpjungle-cursor-mcp.json",
        pathHint: "~/.cursor/mcp.json",
        mergeHint: "Merge under mcpServers.",
        content: JSON.stringify(
          {
            mcpServers: {
              mcpjungle: {
                url: mcpUrl,
                headers: { Authorization: `Bearer ${token}` },
              },
            },
          },
          null,
          2,
        ),
      };
    case "codex":
      return {
        id,
        label: "Codex",
        fileName: "mcpjungle-codex-config.toml",
        pathHint: "~/.codex/config.toml",
        mergeHint: "Append this block to existing file.",
        content:
          `[mcp_servers.mcpjungle]\n` +
          `command = "npx"\n` +
          `args = ${JSON.stringify(remoteArgs)}\n`,
      };
    case "copilot":
      return {
        id,
        label: "Copilot",
        fileName: "mcpjungle-copilot-mcp.json",
        pathHint: "VS Code mcp.json",
        mergeHint: "Merge under servers.",
        content: JSON.stringify(
          {
            servers: {
              mcpjungle: {
                url: mcpUrl,
                headers: { Authorization: `Bearer ${token}` },
              },
            },
          },
          null,
          2,
        ),
      };
    case "opencode":
      return {
        id,
        label: "OpenCode",
        fileName: "mcpjungle-opencode.json",
        pathHint: "~/.config/opencode/opencode.json",
        mergeHint: "Merge under mcp.",
        content: JSON.stringify(
          {
            mcp: {
              mcpjungle: {
                type: "remote",
                url: mcpUrl,
                enabled: true,
                headers: { Authorization: `Bearer ${token}` },
              },
            },
          },
          null,
          2,
        ),
      };
    case "zed":
      return {
        id,
        label: "Zed",
        fileName: "mcpjungle-zed-settings.json",
        pathHint: "~/.config/zed/settings.json",
        mergeHint: "Merge under context_servers.",
        content: JSON.stringify(
          {
            context_servers: {
              mcpjungle: {
                command: {
                  path: "npx",
                  args: remoteArgs,
                },
                settings: {},
              },
            },
          },
          null,
          2,
        ),
      };
  }
}

function DownloadConfigSection({
  mcpToken,
  gatewayHost,
}: {
  mcpToken: string;
  gatewayHost: string;
}) {
  const [selected, setSelected] = useState<IDETargetId[]>(["claude", "cursor"]);
  const artifacts = selected.map((id) => buildConfigArtifact(id, gatewayHost, mcpToken));

  function toggle(id: IDETargetId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="rounded-ui border border-line bg-shell p-4">
      <p className="text-sm font-medium text-body">Download local config snippets</p>
      <p className="mt-1 text-xs text-muted">
        Hosted gateways cannot edit files on your laptop. Download a snippet, merge it locally, then restart your IDE if needed.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {IDE_TARGETS.map((target) => (
          <button
            key={target.id}
            type="button"
            onClick={() => toggle(target.id)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              selected.includes(target.id)
                ? "border-accent bg-accent/10 text-accent"
                : "border-line bg-elevated text-muted hover:border-accent/40 hover:text-body"
            }`}
          >
            {target.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
          disabled={artifacts.length === 0}
          onClick={() => artifacts.forEach((artifact) => downloadTextFile(artifact.fileName, artifact.content))}
        >
          Download selected
        </button>
        <span className="self-center text-xs text-muted">
          Files are snippets. Merge into target config paths shown below.
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {artifacts.map((artifact) => (
          <div key={artifact.id} className="rounded-md border border-line bg-elevated/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-body">{artifact.label}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">{artifact.pathHint}</p>
                <p className="mt-1 text-xs text-muted">{artifact.mergeHint}</p>
              </div>
              <div className="flex gap-2">
                <CopyButton text={artifact.content} />
                <button
                  type="button"
                  className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted transition hover:border-accent/50 hover:text-accent"
                  onClick={() => downloadTextFile(artifact.fileName, artifact.content)}
                >
                  download
                </button>
              </div>
            </div>
            <pre className="mt-3 overflow-x-auto rounded bg-shell p-3 font-mono text-xs text-body">
              {artifact.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplyConfigSection({
  mcpToken,
  userToken,
  gatewayHost,
}: {
  mcpToken: string;
  userToken: string;
  gatewayHost: string;
}) {
  const [selected, setSelected] = useState<string[]>(["claude", "cursor"]);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const applyMutation = useMutation({
    mutationFn: () => api.applyClientConfig(mcpToken, selected, userToken),
    onSuccess: (res) => { setOutput(res.output); setError(""); },
    onError: (err: Error) => { setError(err.message); setOutput(""); },
  });

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="rounded-ui border border-line bg-shell p-4">
      <p className="text-sm font-medium text-body">Apply config on this machine</p>
      <p className="mt-1 text-xs text-muted">
        Only available when gateway runs on this same machine and local apply is explicitly enabled.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {IDE_TARGETS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              selected.includes(t.id)
                ? "border-accent bg-accent/10 text-accent"
                : "border-line bg-elevated text-muted hover:border-accent/40 hover:text-body"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
        disabled={selected.length === 0 || applyMutation.isPending}
        onClick={() => applyMutation.mutate()}
      >
        {applyMutation.isPending ? "Applying…" : "Apply config"}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-down">{error}</p>
      ) : null}
      {output ? (
        <pre className="mt-3 max-h-48 overflow-y-auto rounded bg-elevated p-3 font-mono text-[11px] text-body">
          {output}
        </pre>
      ) : null}
    </div>
  );
}

function ConnectSection({
  token,
  gatewayHost,
  userToken,
  canApplyLocally,
}: {
  token: string;
  gatewayHost: string;
  userToken: string;
  canApplyLocally: boolean;
}) {
  const mcpUrl = `${gatewayHost}/mcp`;
  const curlSnippet = `curl -s -H "Authorization: Bearer ${token}" ${mcpUrl}`;
  const claudeArgs = JSON.stringify(
    buildRemoteArgs(mcpUrl, token),
    null,
    2,
  );
  const cursorSnippet = JSON.stringify(
    { mcpServers: { mcpjungle: { url: mcpUrl, headers: { Authorization: `Bearer ${token}` } } } },
    null,
    2,
  );

  return (
    <div className="space-y-4">
      {/* Token display */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">MCP client token</p>
        <div className="flex items-center gap-2 rounded-ui border border-accent/30 bg-accent/5 px-3 py-2">
          <code className="flex-1 break-all font-mono text-xs text-body">{token}</code>
          <CopyButton text={token} />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Save this token — it will not be shown again. Use it in your IDE/agent config below.
        </p>
      </div>

      {/* Claude / Claude Code */}
      <details className="group rounded-ui border border-line bg-shell">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-body">
          Claude Desktop / Claude Code
          <span className="text-xs text-muted group-open:hidden">show config</span>
          <span className="hidden text-xs text-muted group-open:inline">hide</span>
        </summary>
        <div className="border-t border-line px-4 py-3">
          <p className="mb-2 text-xs text-muted">
            Add to <code className="text-body">~/.claude/mcp.json</code> under{" "}
            <code className="text-body">mcpServers</code>:
          </p>
          <div className="flex items-start justify-between gap-2">
            <pre className="flex-1 overflow-x-auto rounded bg-elevated p-3 font-mono text-xs text-body">
              {`"mcpjungle": {
  "command": "npx",
  "args": ${claudeArgs}
}`}
            </pre>
            <CopyButton
              text={`"mcpjungle": {\n  "command": "npx",\n  "args": ${claudeArgs}\n}`}
            />
          </div>
        </div>
      </details>

      {/* Cursor */}
      <details className="group rounded-ui border border-line bg-shell">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-body">
          Cursor
          <span className="text-xs text-muted group-open:hidden">show config</span>
          <span className="hidden text-xs text-muted group-open:inline">hide</span>
        </summary>
        <div className="border-t border-line px-4 py-3">
          <p className="mb-2 text-xs text-muted">
            Add to <code className="text-body">~/.cursor/mcp.json</code>:
          </p>
          <div className="flex items-start justify-between gap-2">
            <pre className="flex-1 overflow-x-auto rounded bg-elevated p-3 font-mono text-xs text-body">
              {cursorSnippet}
            </pre>
            <CopyButton text={cursorSnippet} />
          </div>
        </div>
      </details>

      {/* Verify */}
      <details className="group rounded-ui border border-line bg-shell">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-body">
          Verify with curl
          <span className="text-xs text-muted group-open:hidden">show command</span>
          <span className="hidden text-xs text-muted group-open:inline">hide</span>
        </summary>
        <div className="border-t border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <pre className="flex-1 overflow-x-auto rounded bg-elevated p-3 font-mono text-xs text-body">
              {curlSnippet}
            </pre>
            <CopyButton text={curlSnippet} />
          </div>
        </div>
      </details>

      <DownloadConfigSection mcpToken={token} gatewayHost={gatewayHost} />

      {canApplyLocally ? (
        <ApplyConfigSection mcpToken={token} userToken={userToken} gatewayHost={gatewayHost} />
      ) : (
        <p className="rounded-ui border border-line bg-shell px-4 py-3 text-xs text-muted">
          Local apply is disabled for this session. Hosted or remote gateways can only provide snippets for local paste/download.
        </p>
      )}
    </div>
  );
}

function AllowListPills({ list }: { list: string[] | undefined }) {
  if (!list) return <span className="text-xs text-muted italic">from group / default</span>;
  if (list.length === 0) return <span className="text-xs text-down">No access</span>;
  if (list.includes("*")) return <span className="rounded-full bg-up/10 px-2 py-0.5 text-xs font-medium text-up">All servers</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((s) => (
        <span key={s} className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent">{s}</span>
      ))}
    </div>
  );
}

function MyClientsSection({ token: userToken }: { token: string }) {
  const qc = useQueryClient();
  const { data: clients, isLoading } = useQuery({
    queryKey: ["selfClients", userToken],
    queryFn: () => api.selfClients(userToken),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => api.deleteSelfClient(name, userToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["selfClients"] }),
  });

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;

  const list: McpClient[] = clients ?? [];
  if (list.length === 0) {
    return <p className="text-sm text-muted">No MCP client tokens yet. Create one in the "Connect to IDE / Agent" section above.</p>;
  }

  return (
    <div className="space-y-2">
      {list.map((c) => (
        <div key={c.name} className="flex items-center gap-3 rounded-ui border border-line bg-shell px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-body truncate">{c.name}</p>
            <div className="mt-1">
              <AllowListPills list={c.allow_list} />
            </div>
          </div>
          <button
            className="shrink-0 rounded border border-down/30 px-2.5 py-1 text-xs text-down transition hover:bg-down/10 disabled:opacity-40"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(c.name)}
          >
            Revoke
          </button>
        </div>
      ))}
      <p className="text-xs text-muted">Access is managed by your admin. Contact them to change server permissions.</p>
    </div>
  );
}

export function SettingsPage() {
  const { settings, metadata, token, clearToken, user, isAdminEquivalent } = useAppContext();
  const isEnterprise = settings.mode !== "development";

  // Personal MCP client token state
  const [clientName, setClientName] = useState("");
  const [createdClient, setCreatedClient] = useState<McpClientWithToken | null>(null);
  const [createError, setCreateError] = useState("");

  // Derive gateway host from current page URL
  const gatewayHost = window.location.origin;

  const createClientMutation = useMutation({
    mutationFn: () =>
      api.createSelfClient(
        clientName.trim() || `${user?.username ?? "user"}-mcp`,
        token || undefined,
      ),
    onSuccess: (result) => {
      setCreatedClient(result);
      setCreateError("");
    },
    onError: (err: Error) => setCreateError(err.message),
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted">System</p>
        <h2 className="mt-2 text-3xl font-semibold text-body">Settings</h2>
      </div>

      {/* Gateway info */}
      <section className="rounded-panel border border-line bg-panel">
        <div className="border-b border-line px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Gateway</p>
        </div>
        <div className="divide-y divide-line px-5">
          <Row label="Mode">
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${
                settings.mode === "development" ? "bg-accent/15 text-accent" : "bg-up/15 text-up"
              }`}
            >
              {settings.mode}
            </span>
          </Row>
          <Row label="Initialized">
            <span className={settings.initialized ? "text-up" : "text-down"}>
              {settings.initialized ? "Yes" : "No"}
            </span>
          </Row>
          <Row label="Version">
            <span className="font-mono text-xs text-muted" title={metadata.version}>
              {formatVersion(metadata.version)}
            </span>
          </Row>
          <Row label="Endpoint">
            <span className="font-mono text-xs text-muted">{gatewayHost}/mcp</span>
          </Row>
        </div>
      </section>

      {/* Session / auth */}
      <section className="rounded-panel border border-line bg-panel">
        <div className="border-b border-line px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">Session</p>
        </div>
        <div className="divide-y divide-line px-5">
          <Row label="User">
            {user ? (
              <span className="flex items-center gap-2">
                {user.username}
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                    user.role === "admin" ? "bg-accent/15 text-accent" : "bg-elevated text-muted"
                  }`}
                >
                  {user.role}
                </span>
              </span>
            ) : (
              <span className="text-muted">—</span>
            )}
          </Row>
          <Row label="Token">
            {token ? (
              <span className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted">{token.slice(0, 8)}••••••••</span>
                <button
                  className="rounded border border-down/30 px-2.5 py-1 text-xs text-down transition hover:bg-down/10"
                  onClick={clearToken}
                >
                  Sign out
                </button>
              </span>
            ) : (
              <span className="text-muted">None (dev mode)</span>
            )}
          </Row>
        </div>
      </section>

      {/* Connect to IDE — enterprise only */}
      {isEnterprise ? (
        <section className="rounded-panel border border-line bg-panel">
          <div className="border-b border-line px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              Connect to IDE / Agent
            </p>
          </div>
          <div className="px-5 py-5">
            {createdClient ? (
              <ConnectSection
                token={createdClient.access_token}
                gatewayHost={gatewayHost}
                userToken={token ?? ""}
                canApplyLocally={settings.can_apply_local_config && isAdminEquivalent}
              />
            ) : (
              <div>
                <p className="text-sm text-muted">
                  Your <span className="text-body">user token</span> is for the dashboard only.
                  To connect an IDE or AI agent to the gateway, create a personal{" "}
                  <span className="text-body">MCP client token</span>.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <input
                    className="w-48 rounded-ui border border-line bg-shell px-3 py-2 text-sm text-body placeholder-muted focus:border-accent focus:outline-none"
                    placeholder={`${user?.username ?? "user"}-mcp`}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <button
                    className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
                    disabled={createClientMutation.isPending}
                    onClick={() => createClientMutation.mutate()}
                  >
                    {createClientMutation.isPending ? "Creating…" : "Create MCP token"}
                  </button>
                </div>
                {createError ? (
                  <p className="mt-2 text-sm text-down">{createError}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted">
                  Leave blank to use <code className="text-body">{user?.username ?? "user"}-mcp</code> as the name.
                  The token grants access to all tools (no allow-list restriction).
                </p>
              </div>
            )}

            {/* Reset — allow creating another */}
            {createdClient ? (
              <button
                className="mt-5 text-xs text-muted underline hover:text-body"
                onClick={() => {
                  setCreatedClient(null);
                  setClientName("");
                }}
              >
                Create another client
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="rounded-panel border border-line bg-panel">
          <div className="border-b border-line px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              Connect to IDE / Agent
            </p>
          </div>
          <div className="px-5 py-5">
            <p className="text-sm text-muted">
              Running in <span className="text-accent">development</span> mode — no auth required.
              Point your IDE at{" "}
              <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs text-body">
                {gatewayHost}/mcp
              </code>{" "}
              directly with no token.
            </p>
            <pre className="mt-4 overflow-x-auto rounded bg-elevated p-3 font-mono text-xs text-body">
              {JSON.stringify(
                { mcpServers: { mcpjungle: { url: `${gatewayHost}/mcp` } } },
                null,
                2,
              )}
            </pre>
          </div>
        </section>
      )}

      {/* My Clients — enterprise only */}
      {isEnterprise && token ? (
        <section className="rounded-panel border border-line bg-panel">
          <div className="border-b border-line px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">My MCP Clients</p>
          </div>
          <div className="px-5 py-5">
            <MyClientsSection token={token} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
