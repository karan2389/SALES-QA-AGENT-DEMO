import { BarChart3, FileText, LayoutDashboard, PhoneCall, Settings, ShieldCheck, Users, type LucideIcon } from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean }
export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, match: (p) => p.startsWith("/dashboard") },
  { href: "/calls", label: "Call Explorer", icon: PhoneCall, match: (p) => p.startsWith("/calls") },
  { href: "/team", label: "Sales Team", icon: Users, match: (p) => p.startsWith("/team") },
  { href: "/analytics", label: "Team Analytics", icon: BarChart3, match: (p) => p.startsWith("/analytics") },
  { href: "/reviews", label: "Human Review", icon: ShieldCheck, match: (p) => p.startsWith("/reviews") },
];
export const SECONDARY_NAV: NavItem[] = [
  { href: "/reports", label: "Reports", icon: FileText, match: (p) => p.startsWith("/reports") },
  { href: "/settings", label: "Settings", icon: Settings, match: (p) => p.startsWith("/settings") },
];
export const ROUTE_LABEL: Record<string, string> = { dashboard: "Overview", calls: "Call Explorer", team: "Sales Team", analytics: "Team Analytics", reviews: "Human Review", reports: "Reports", settings: "Settings" };
