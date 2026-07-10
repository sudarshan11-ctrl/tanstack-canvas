import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Network,
  Trophy,
  Users,
  UserSquare2,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { mockPeople } from "@/data/mockPeople";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  params?: Record<string, string>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const PRACTICE_HEAD_LINKS: NavItem[] = mockPeople
  .filter((p) => p.role === "practice_head")
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((person) => ({
    label: person.name,
    to: "/ep/$epId",
    params: { epId: person.id },
    icon: Trophy,
  }));

const SECTIONS: NavSection[] = [
  {
    label: "Command",
    items: [
      { label: "Firm Landing", to: "/", icon: LayoutDashboard },
      { label: "Metrics Mind Map", to: "/mindmap", icon: Network },
    ],
  },
  {
    label: "Roster",
    items: [
      { label: "Practice Heads", to: "/cohort/$role", params: { role: "practice_head" }, icon: Trophy },
      { label: "Partners", to: "/cohort/$role", params: { role: "partner" }, icon: UserSquare2 },
      { label: "Associates", to: "/cohort/$role", params: { role: "associate" }, icon: Users },
    ],
  },
  { label: "Practice Heads", items: PRACTICE_HEAD_LINKS },
  {
    label: "Settings",
    items: [
      { label: "Performance Index weights", to: "/settings", icon: SettingsIcon },
    ],
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const subPractices = new Map(mockPeople.map((p) => [p.id, p.subPractice]));

  return (
    <aside
      className="fixed left-0 top-0 z-20 hidden h-screen flex-col px-3 py-5 md:flex"
      style={{
        width: "var(--sidebar-width)",
        backgroundColor: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
        transition: "background-color 150ms ease",
      }}
    >
      {/* Brand header */}
      <div
        className="mb-5 border-b pb-4"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div
          className="font-display text-[20px] leading-none"
          style={{ color: "var(--sidebar-primary)" }}
        >
          LKS
        </div>
        <div
          className="mt-1 text-[10px] uppercase tracking-wider"
          style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}
        >
          Performance Dashboard
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-0.5">
            <div
              className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const linkHref = item.params?.epId
                ? `/ep/${item.params.epId}`
                : item.params?.role
                  ? `/cohort/${item.params.role}`
                  : item.to;
              const active =
                pathname === linkHref ||
                pathname === item.to ||
                (item.params?.role != null && pathname === `/cohort/${item.params.role}`);
              const Icon = item.icon;
              const subtitle = item.params?.epId
                ? subPractices.get(item.params.epId)
                : null;

              return (
                <Link
                  key={linkHref}
                  to={item.to}
                  params={item.params as never}
                  className="flex items-start gap-3 rounded-md px-3 py-2 text-[13px] transition-colors"
                  style={{
                    backgroundColor: active
                      ? "var(--sidebar-accent)"
                      : "transparent",
                    color: active
                      ? "var(--sidebar-primary)"
                      : "var(--sidebar-foreground)",
                    opacity: active ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                        "var(--sidebar-accent)";
                      (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                        "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7";
                    }
                  }}
                >
                  <Icon
                    size={15}
                    className="mt-0.5 shrink-0"
                    style={{
                      color: active
                        ? "var(--sidebar-primary)"
                        : "var(--sidebar-foreground)",
                      opacity: active ? 1 : 0.6,
                    }}
                  />
                  <span className="flex flex-col leading-tight">
                    <span>{item.label}</span>
                    {subtitle ? (
                      <span
                        className="text-[10px]"
                        style={{ opacity: 0.55 }}
                      >
                        {subtitle}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
