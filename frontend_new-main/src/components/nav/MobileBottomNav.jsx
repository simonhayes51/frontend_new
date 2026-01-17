import { Link, useLocation } from "react-router-dom";
import { primaryNavItems } from "../../nav/navConfig";

const NAV_HEIGHT = 72;
const LIME = "#91db32";

export default function MobileBottomNav() {
  const { pathname } = useLocation();

  const isActive = (to) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/90 backdrop-blur-xl border-t border-white/10"
      style={{
        height: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Primary"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-px left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${LIME}, transparent)` }}
      />
      <div className="h-full flex items-center justify-around px-2 gap-1">
        {primaryNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? "page" : undefined}
              className="relative flex-1 h-full grid place-items-center text-xs active:scale-[0.98] transition"
            >
              <div
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${
                  active ? "bg-white/10 ring-1 ring-white/10" : "bg-transparent"
                }`}
                style={{ color: active ? LIME : "rgba(255,255,255,0.7)" }}
              >
                <item.icon className="w-5 h-5" />
                <span className="leading-none">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { NAV_HEIGHT };

