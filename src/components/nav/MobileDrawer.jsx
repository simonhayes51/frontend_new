import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { navSections } from "../../nav/navConfig";
import { useAuth } from "../../context/AuthContext";

export default function MobileDrawer({ open, onClose }) {
  const location = useLocation();
  const { logout } = useAuth();
  const drawerRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement;
    const drawerEl = drawerRef.current;
    if (!drawerEl) return;
    const focusables = drawerEl.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex="0"]'
    );
    const first = focusables[0];
    first?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const list = Array.from(focusables);
      if (!list.length) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    lastFocusedRef.current?.focus?.();
  }, [open]);

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={drawerRef}
        className={`fixed top-0 left-0 z-50 h-full w-[85vw] max-w-xs bg-gray-950 border-r border-white/10 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400/80 to-blue-500/80 p-[2px]">
                <img
                  src="/server-logo.png"
                  alt="Transfer Traders"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Transfer Traders</p>
                <p className="text-xs text-white/60">Mobile Menu</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {displaySections.map((section) => (
              <div key={section.id} className="space-y-2">
                {section.title && (
                  <p className="text-xs uppercase tracking-wider text-white/50 px-2">
                    {section.title}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    if (item.action === "logout") {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            logout();
                            onClose();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/10 transition"
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </button>
                      );
                    }
                    const active = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleNavClick}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition ${
                          active
                            ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-white"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

