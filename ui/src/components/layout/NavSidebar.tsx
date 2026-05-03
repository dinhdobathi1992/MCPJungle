import clsx from "clsx";
import { NavLink } from "react-router-dom";

import { useAppContext } from "../../App";

type NavItem = { to: string; label: string; icon: React.ReactNode };

function Icon({ d, d2 }: { d: string; d2?: string }) {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
      {d2 ? <path d={d2} /> : null}
    </svg>
  );
}

const baseItems: NavItem[] = [
  {
    to: "/",
    label: "Overview",
    icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    to: "/servers",
    label: "Servers",
    icon: <Icon d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />,
  },
  {
    to: "/tools",
    label: "Tools",
    icon: <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" d2="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  },
];

const adminItems: NavItem[] = [
  {
    to: "/tool-groups",
    label: "Tool Groups",
    icon: <Icon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  },
  {
    to: "/clients",
    label: "Clients",
    icon: <Icon d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
  {
    to: "/users",
    label: "Users",
    icon: <Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  },
  {
    to: "/groups",
    label: "Groups",
    icon: <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  },
];

const systemItems: NavItem[] = [
  {
    to: "/settings",
    label: "Settings",
    icon: <Icon d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />,
  },
];

export function NavSidebar() {
  const { isAdminEquivalent, settings, user } = useAppContext();

  return (
    // Gradient border wrapper — h-full so sidebar fills panel height
    <div
      className="h-full rounded-panel p-px"
      style={{
        background: "linear-gradient(160deg, rgba(252,213,53,0.25) 0%, rgba(252,213,53,0.04) 30%, rgba(43,49,57,0.6) 100%)",
      }}
    >
      <aside
        className="flex min-h-full flex-col rounded-[11px] p-3"
        style={{
          background: "linear-gradient(180deg, #111620 0%, #0b0e11 60%, #090c10 100%)",
        }}
      >
        {/* Logo */}
        <div className="px-2 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(17,81,58,0.6) 0%, rgba(35,110,73,0.3) 100%)",
                boxShadow: "0 0 0 1px rgba(14,203,129,0.25), 0 4px 16px rgba(14,203,129,0.12)",
              }}
            >
              <img src="/ui/logo2.svg" alt="MCPJungle" className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-none tracking-tight text-body">MCPJungle</p>
              <p className="mt-1.5 text-[11px] leading-none text-muted/60">
                {settings.mode === "development" ? "dev mode" : (user?.username ?? "gateway")}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="mx-2 my-1 h-px"
          style={{ background: "linear-gradient(90deg, rgba(252,213,53,0.15) 0%, rgba(43,49,57,0.4) 60%, transparent 100%)" }}
        />

        <nav className="mt-2 flex flex-1 flex-col gap-px overflow-y-auto">
          {baseItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}

          {isAdminEquivalent ? (
            <>
              <SectionLabel>Admin</SectionLabel>
              {adminItems.map((item) => (
                <SidebarLink key={item.to} {...item} />
              ))}
            </>
          ) : null}

          <SectionLabel>System</SectionLabel>
          {systemItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>

        {/* Bottom user chip */}
        {user && settings.mode !== "development" && (
          <div className="mt-3">
            <div
              className="mx-1 h-px mb-3"
              style={{ background: "linear-gradient(90deg, transparent, rgba(43,49,57,0.6), transparent)" }}
            />
            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-ink"
                style={{ background: "linear-gradient(135deg, #fcd535, #f0b90b)" }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-body/80">{user.username}</p>
                {user.role === "admin" && (
                  <p className="text-[10px] text-muted/50">admin</p>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted/40">
      {children}
    </div>
  );
}

function SidebarLink({ to, label, icon }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        clsx(
          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
          isActive
            ? "text-accent"
            : "text-muted hover:text-body",
        )
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: "linear-gradient(90deg, rgba(252,213,53,0.12) 0%, rgba(252,213,53,0.03) 100%)",
              boxShadow: "inset 0 0 0 1px rgba(252,213,53,0.08)",
            }
          : {}
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
              style={{ background: "linear-gradient(180deg, #fcd535, #f0b90b)", boxShadow: "0 0 6px rgba(252,213,53,0.6)" }}
            />
          )}
          <span
            className={clsx("transition-colors duration-150", isActive ? "text-accent" : "text-muted/60 group-hover:text-body/70")}
            style={isActive ? { filter: "drop-shadow(0 0 4px rgba(252,213,53,0.4))" } : {}}
          >
            {icon}
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
