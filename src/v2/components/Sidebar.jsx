import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, Home, SlidersHorizontal, Star, User, Users } from "lucide-react";
import { useEntitlements } from "../../context/EntitlementsContext";

const ITEMS = [
  { to: "/v2", label: "Home", short: "Home", icon: Home, match: (p) => p === "/v2" },
  { to: "/v2/trade-finder", label: "Trade Finder", short: "Finder", icon: SlidersHorizontal, match: (p) => p.startsWith("/v2/trade-finder") || p.startsWith("/v2/opportunities") },
  { to: "/v2/players", label: "Players", short: "Players", icon: Users, match: (p) => p.startsWith("/v2/players") },
  { to: "/v2/watchlist", label: "Watchlist", short: "Watch", icon: Star, match: (p) => p.startsWith("/v2/watchlist") },
  { to: "/v2/portfolio", label: "Portfolio", short: "Portfolio", icon: Briefcase, match: (p) => p.startsWith("/v2/portfolio") || p.startsWith("/v2/club") },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isPremium, isAdmin, features } = useEntitlements();
  const tier = isAdmin || features.includes("opportunity_feed") ? "ELITE" : isPremium ? "PRO" : "FREE";

  return <aside className="fut-side v2-global-nav">
    <Link className="fut-brand" to="/v2"><span className="brand-mark">FT</span><strong>FUT <b>Hub</b></strong></Link>
    <nav aria-label="Main">
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return <Link key={item.to} to={item.to} aria-current={active ? "page" : undefined} className={`${active ? "active" : ""}${item.desktopOnly ? " desktop-only-nav" : ""}`}>
          <Icon/><span className="nav-full-label">{item.label}</span><span className="nav-short-label">{item.short}</span>
        </Link>;
      })}
    </nav>
    <button className={`account-chip ${pathname.startsWith("/v2/account") ? "active" : ""}`} onClick={() => navigate("/v2/account")}><User size={16}/><b>{tier}</b><span>Account</span></button>
  </aside>;
}
