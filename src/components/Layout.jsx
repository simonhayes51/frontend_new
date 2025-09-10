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
    <div className="flex min-h-screen bg-black">
      {/* Sidebar Navigation */}
      <DesktopSidebar />
      
      {/* Main Content */}
      <main 
        className="flex-1 overflow-auto transition-all duration-200"
        style={{ marginLeft: "var(--sidebar-width, 16rem)" }}
      >
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
