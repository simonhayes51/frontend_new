import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { navSections } from "../../nav/navConfig";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  const isTrader = user?.account_type === 'trader' || user?.is_trader;

  // Inject trader-specific items into the navigation
  const displaySections = navSections.map(section => {
    if (section.id === 'main') {
      const newItems = [...section.items];
      // Add Trader Dashboard or Become Trader link
      if (isTrader) {
        // Check if already exists to avoid duplication if re-rendering
        if (!newItems.find(i => i.path === '/trader-dashboard')) {
          newItems.splice(1, 0, { // Insert after Feed
            label: "Trader Dashboard",
            path: "/trader-dashboard",
            icon: BarChart3,
            primary: true
          });
        }
      } else {
        if (!newItems.find(i => i.path === '/become-trader')) {
          newItems.push({
            label: "Become a Trader",
            path: "/become-trader",
            icon: TrendingUp,
            primary: true
          });
        }
      }
      return { ...section, items: newItems };
    }
    return section;
  });

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <NavLink
        to={item.path}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
          isActive
            ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-r-full" />
        )}
        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
        {!collapsed && (
          <span className="font-medium text-sm">{item.label}</span>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={`h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm gradient-text">TRANSFER</span>
              <span className="font-display font-bold text-xs text-muted-foreground">TRADERS</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navSections
          .filter((section) => section.id !== "bottom")
          .map((section) => (
            <div key={section.id} className={section.id === "trading" ? "pt-4 mt-4 border-t border-sidebar-border space-y-1" : "space-y-1"}>
              {section.title && !collapsed && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => (
                <NavItem key={item.path || item.label} item={item} />
              ))}
            </div>
          ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {navSections
          .find((section) => section.id === "bottom")
          ?.items.map((item) => {
            if (item.action === "logout") {
              return (
                <button
                  key={item.label}
                  onClick={logout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
                >
                  <item.icon className="w-5 h-5" />
                  {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                </button>
              );
            }

            return <NavItem key={item.path} item={item} />;
          })}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
