import { Link, useLocation } from "react-router-dom";

const ICONS = {
  home: <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />,
  club: <><path d="M4 7h16v12H4z"/><path d="M8 7V5h8v2M4 11h16"/></>,
  sbc: <path d="M12 3l8 4v5c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V7l8-4z" />,
  exit: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
};
function NavIcon({ name }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">{ICONS[name]}</svg>; }
const ITEMS = [
  { to: "/v2", label: "Home", icon: "home", match: (p) => p === "/v2" },
  { to: "/v2/club", label: "Club", icon: "club", match: (p) => p.startsWith("/v2/club") },
  { to: "/v2/sbc", label: "SBCs", icon: "sbc", match: (p) => p.startsWith("/v2/sbc") },
  { to: "/", label: "v1", icon: "exit", match: () => false },
];
export default function BottomNav() { const { pathname } = useLocation(); return <nav aria-label="Main" className="flex lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-[var(--v2-border)] bg-[var(--v2-bg)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>{ITEMS.map((item) => { const active = item.match(pathname); return <Link key={item.to} to={item.to} aria-current={active ? "page" : undefined} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${active ? "text-[var(--v2-accent)]" : "text-[var(--v2-muted)]"}`}><NavIcon name={item.icon}/>{item.label}</Link>; })}</nav>; }
