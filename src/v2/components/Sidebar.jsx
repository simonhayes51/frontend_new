import { Link, useLocation } from "react-router-dom";

const ICONS = {
  home: <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />,
  opportunities: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8z" />,
  players: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
  market: <><path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/></>,
  watchlist: <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5z" />,
  portfolio: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
  sbc: <path d="M12 3l8 4v5c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V7l8-4z" />,
  club: <><path d="M4 7h16v12H4z"/><path d="M8 7V5h8v2M4 11h16"/></>,
};
function NavIcon({ name }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">{ICONS[name]}</svg>; }
const ITEMS = [
  { to: "/v2", label: "Home", icon: "home", match: (p) => p === "/v2" },
  { to: "/v2/opportunities", label: "Opportunities", icon: "opportunities", match: (p) => p.startsWith("/v2/opportunities") },
  { to: "/v2/players", label: "Players", icon: "players", match: (p) => p.startsWith("/v2/players") },
  { to: "/v2/market", label: "Market", icon: "market", match: (p) => p.startsWith("/v2/market") },
  { to: "/v2/watchlist", label: "Watchlist", icon: "watchlist", match: (p) => p.startsWith("/v2/watchlist") },
  { to: "/v2/portfolio", label: "Portfolio", icon: "portfolio", match: (p) => p.startsWith("/v2/portfolio") || p.startsWith("/v2/club") },
  { to: "/v2/sbc", label: "SBCs", icon: "sbc", match: (p) => p.startsWith("/v2/sbc") },
];
export default function Sidebar() { const { pathname } = useLocation(); return <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-56 border-r border-[var(--v2-border)] bg-[var(--v2-bg)] px-4 py-6 z-20"><Link to="/v2" className="text-sm font-semibold tracking-tight text-[var(--v2-text)] px-2 mb-8">FutHub <span className="text-[var(--v2-accent)]">v2</span></Link><nav aria-label="Main" className="flex flex-col gap-1">{ITEMS.map((item) => { const active = item.match(pathname); return <Link key={item.to} to={item.to} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${active ? "bg-[var(--v2-card)] text-[var(--v2-accent)]" : "text-[var(--v2-muted)] hover:text-[var(--v2-text)] hover:bg-[var(--v2-card)]"}`}><NavIcon name={item.icon}/>{item.label}</Link>; })}</nav><Link to="/" className="mt-auto px-2 py-2 text-xs text-[var(--v2-muted)] hover:text-[var(--v2-text)]">Back to v1</Link></aside>; }
