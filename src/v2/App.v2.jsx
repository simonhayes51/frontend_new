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

export default function V2App() {
  return (
    <div className="v2-root">
      <Nav />
      <Routes>
        <Route index element={<HomeDashboard />} />
        <Route path="health" element={<HealthCheck />} />
        <Route path="players/:cardId" element={<PlayerPage />} />
        <Route path="sbc" element={<SbcHub />} />
        <Route path="sbc/:eventId" element={<SbcEventDetail />} />
        <Route path="admin/sbc-imports" element={<AdminSbcImports />} />
      </Routes>
    </div>
  );
}
