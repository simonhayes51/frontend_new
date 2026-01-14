import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import TopAppBar from "../nav/TopAppBar";
import MobileBottomNav, { NAV_HEIGHT } from "../nav/MobileBottomNav";
import MobileDrawer from "../nav/MobileDrawer";
import { getNavTitleForPath } from "../../nav/navConfig";

const TOP_BAR_HEIGHT = 56;

export default function MobileLayout() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = getNavTitleForPath(pathname);

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-x-hidden">
      <TopAppBar title={title} onMenuClick={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main
        className="h-[100dvh] overflow-y-auto overflow-x-hidden"
        style={{
          paddingTop: `calc(${TOP_BAR_HEIGHT}px + env(safe-area-inset-top))`,
          paddingBottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="px-4 py-4">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
