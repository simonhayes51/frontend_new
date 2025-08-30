// src/components/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useMediaQuery } from "../hooks/useMediaQuery";
import MobileNavigation from "./MobileNavigation";
import DesktopSidebar from "./DesktopSidebar";
import UserMenu from "./UserMenu"; // 👈 new component

function Layout() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Sidebar (Desktop only) */}
      {!isMobile && <DesktopSidebar />}

      {/* Main content area */}
      <main
        className={
          isMobile
            ? "pb-20"
            : "ml-[var(--sidebar-width)] transition-all duration-200"
        }
      >
        {/* Top bar with user menu */}
        <header className="flex items-center justify-end p-4 border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm sticky top-0 z-40">
          <UserMenu />
        </header>

        {/* Routed content */}
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      {/* Mobile nav */}
      {isMobile && <MobileNavigation />}
    </div>
  );
}

export default Layout;
