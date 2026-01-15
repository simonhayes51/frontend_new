import {
  Home,
  BarChart3,
  Users,
  Flame,
  Plus,
  History,
  Eye,
  TrendingUp,
  Search,
  GitCompare,
  Calculator,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";

export const navSections = [
  {
    id: "main",
    title: null,
    items: [
      { label: "Feed", path: "/", icon: Home, primary: true },
      { label: "Dashboard", path: "/dashboard", icon: BarChart3, primary: true },
      { label: "Traders", path: "/subscriptions", icon: Users, primary: true },
      { label: "Trader Dashboard", path: "/trader-dashboard", icon: BarChart3, primary: true },
      { label: "Become a Trader", path: "/become-trader", icon: TrendingUp, primary: true },
      { label: "Trending Traders", path: "/subscriptions", icon: Flame },
    ],
  },
  {
    id: "trading",
    title: "Trading Tools",
    items: [
      { label: "Add Trade", path: "/add-trade", icon: Plus },
      { label: "Trades", path: "/trades", icon: History, primary: true },
      { label: "Watchlist", path: "/watchlist", icon: Eye },
      { label: "Trending Cards", path: "/trending", icon: TrendingUp },
      { label: "Player Search", path: "/player-search", icon: Search },
      { label: "Compare", path: "/player-compare", icon: GitCompare },
      { label: "Profit Calc", path: "/profit-calculator", icon: Calculator },
    ],
  },
  {
    id: "bottom",
    title: null,
    items: [
      { label: "Notifications", path: "/notifications", icon: Bell },
      { label: "Settings", path: "/settings", icon: Settings, primary: true },
      { label: "Log Out", action: "logout", icon: LogOut },
    ],
  },
];

export const flatNavItems = navSections.flatMap((section) => section.items);

export const primaryNavItems = flatNavItems.filter((item) => item.primary && item.path);

export const getNavTitleForPath = (pathname) => {
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const match = flatNavItems.find((item) => {
    if (!item.path) return false;
    if (item.path === "/") return normalizedPath === "/";
    return normalizedPath.startsWith(item.path);
  });
  return match?.label ?? "Transfer Traders";
};

