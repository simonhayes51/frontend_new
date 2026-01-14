import { Menu, Bell, MessageCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TOP_BAR_HEIGHT = 56;

export default function TopAppBar({ title, onMenuClick }) {
  const navigate = useNavigate();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/10"
      style={{
        height: `calc(${TOP_BAR_HEIGHT}px + env(safe-area-inset-top))`,
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="h-full flex items-center justify-between px-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="h-11 w-11 rounded-full grid place-items-center text-white/80 hover:text-white hover:bg-white/10 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 text-center px-4">
          <span className="text-sm font-semibold tracking-wide text-white">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/player-search")}
            className="h-11 w-11 rounded-full grid place-items-center text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="h-11 w-11 rounded-full grid place-items-center text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Messages"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="h-11 w-11 rounded-full grid place-items-center text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
