import { Link, useLocation } from "react-router-dom";

const ICONS = {
  home: <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />,
  sbc: <path d="M12 3l8 4v5c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V7l8-4z" />,
  club: <><path d="M4 7h16v12H4z"/><path d="M8 7V5h8v2M4 11h16"/></>,
};
function NavIcon({ name }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">{ICONS[name]}</svg>; }
const ITEMS = [
  { to: "/v2", label: "Home", icon: "home", match: (p) => p === "/v2" },
  { to: "/v2/club", label: "Club", icon: "club", match: (p) => p.startsWith("/v2/club") },
  { to: "/v2/sbc", label: "SBCs", icon: "sbc", match: (p) => p.startsWith("/v2/sbc") },
];
export default function Sidebar() { const { pathname } = useLocation(); return <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-56 border-r border-[var(--v2-border)] bg-[var(--v2-bg)] px-4 py-6 z-20"><Link to="/v2" className="text-sm font-semibold tracking-tight text-[var(--v2-text)] px-2 mb-8">FutHub <span className="text-[var(--v2-accent)]">v2</span></Link><nav aria-label="Main" className="flex flex-col gap-1">{ITEMS.map((item) => { const active = item.match(pathname); return <Link key={item.to} to={item.to} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${active ? "bg-[var(--v2-card)] text-[var(--v2-accent)]" : "text-[var(--v2-muted)] hover:text-[var(--v2-text)] hover:bg-[var(--v2-card)]"}`}><NavIcon name={item.icon}/>{item.label}</Link>; })}</nav><Link to="/" className="mt-auto px-2 py-2 text-xs text-[var(--v2-muted)] hover:text-[var(--v2-text)]">Back to v1</Link></aside>; }
