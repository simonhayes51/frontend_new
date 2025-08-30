// src/components/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useMediaQuery } from "../hooks/useMediaQuery";
import MobileNavigation from "./MobileNavigation";
import DesktopSidebar from "./DesktopSidebar";

function Layout() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {!isMobile && <DesktopSidebar />}

      <main className={isMobile ? "pb-20" : "ml-[var(--sidebar-width)] transition-all duration-200"}>
        {/* No top bar/header here */}
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      {isMobile && <MobileNavigation />}
    </div>
  );
}

export default Layout;
