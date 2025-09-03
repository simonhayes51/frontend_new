import React from "react";
import { useLocation } from "react-router-dom";
import DesktopSidebar from "./DesktopSidebar";
import MobileHeader from "./MobileHeader";
import { useMediaQuery } from "../hooks/useMediaQuery";

const Layout = ({ children }) => {
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Routes that should not show navigation
  const noNavRoutes = ["/login", "/register", "/onboarding"];
  const showNavigation = !noNavRoutes.includes(location.pathname);

  if (!showNavigation) {
    return <>{children}</>;
  }

  return (
    <>
      {isMobile ? (
        <>
          <MobileHeader />
          <main className="min-h-screen bg-gray-950">
            <Outlet /> {/* ✅ Add this */}
            {children}
          </main>
        </>
      ) : (
        <>
          <DesktopSidebar />
          <main
            className="min-h-screen bg-gray-950 transition-all duration-200"
            style={{ marginLeft: "var(--sidebar-width, 16rem)" }}
          >
            <Outlet /> {/* ✅ Add this */}
            {children}
          </main>
        </>
      )}
    </>
  );
};

export default Layout;
