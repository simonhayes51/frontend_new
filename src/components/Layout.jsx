// src/components/Layout.jsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import DesktopSidebar from "./DesktopSidebar";

export default function Layout() {
  // Listen for premium blocking events from axios interceptor
  useEffect(() => {
    const handlePremiumBlocked = (event) => {
      console.log("Premium feature blocked:", event.detail);
      // You could show a toast notification here instead of the full page
      // toast.warning(`${event.detail.feature} requires premium access`);
    };

    window.addEventListener("premium:blocked", handlePremiumBlocked);
    return () => window.removeEventListener("premium:blocked", handlePremiumBlocked);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <DesktopSidebar />
      
      {/* Main Content with PlayerCompare-style background */}
      <main 
        className="flex-1 overflow-auto transition-all duration-200 relative"
        style={{ marginLeft: "var(--sidebar-width, 16rem)" }}
      >
        {/* Background gradient (same as PlayerCompare.jsx) */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-black" />
        
        {/* Content layer */}
        <div className="relative z-10 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
