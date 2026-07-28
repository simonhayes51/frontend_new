// src/v2/App.v2.jsx
//
// Mounted at /v2/* from the main App.jsx (one lazy import, one route -
// see the v2 plan). Reuses the app-wide QueryClientProvider/
// EntitlementsProvider already set up in main.jsx - no separate
// providers needed here.
import { Routes, Route } from "react-router-dom";
import "./styles/tokens.css";
import Nav from "./components/Nav";
import HealthCheck from "./pages/HealthCheck";
import HomeDashboard from "./pages/HomeDashboard/HomeDashboard";
import PlayerPage from "./pages/PlayerPage/PlayerPage";
import SbcHub from "./pages/SbcHub/SbcHub";
import SbcEventDetail from "./pages/SbcEventDetail/SbcEventDetail";
import AdminSbcImports from "./pages/AdminSbcImports/AdminSbcImports";
import Admin from "./pages/Admin/Admin";

// HomeDashboard renders its own full-page terminal-shell (sidebar +
// topbar, see src/v2/styles/terminal.css) - a literal port of the
// user-supplied reference design - so it's mounted standalone, not
// nested inside the Sidebar/BottomNav shell every other v2 page still
// uses. That keeps this a Home-Dashboard-scoped visual change rather
// than a site-wide shell swap.
export default function V2App() {
  return (
    <Routes>
      <Route index element={<HomeDashboard />} />
      <Route path="health" element={<ShellLayout><HealthCheck /></ShellLayout>} />
      <Route path="players/:cardId" element={<ShellLayout><PlayerPage /></ShellLayout>} />
      <Route path="sbc" element={<ShellLayout><SbcHub /></ShellLayout>} />
      <Route path="sbc/:eventId" element={<ShellLayout><SbcEventDetail /></ShellLayout>} />
      <Route path="admin" element={<ShellLayout><Admin /></ShellLayout>} />
      <Route path="admin/sbc-imports" element={<ShellLayout><AdminSbcImports /></ShellLayout>} />
    </Routes>
  );
}

function ShellLayout({ children }) {
  return (
    <div className="v2-root">
      <Nav />
      <div className="lg:pl-56 pb-16 lg:pb-0">{children}</div>
    </div>
  );
}
