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
import ClubRoute from "./pages/Club/ClubRoute";
import Players from "./pages/Players/Players";
import Market from "./pages/Market/Market";
import Watchlist from "./pages/Watchlist/Watchlist";

export default function V2App() {
  return (
    <Routes>
      <Route index element={<HomeDashboard />} />
      <Route path="opportunities" element={<HomeDashboard />} />
      <Route path="players" element={<ShellLayout><Players /></ShellLayout>} />
      <Route path="health" element={<ShellLayout><HealthCheck /></ShellLayout>} />
      <Route path="players/:cardId" element={<ShellLayout><PlayerPage /></ShellLayout>} />
      <Route path="market" element={<ShellLayout><Market /></ShellLayout>} />
      <Route path="watchlist" element={<ShellLayout><Watchlist /></ShellLayout>} />
      <Route path="portfolio" element={<ShellLayout><ClubRoute /></ShellLayout>} />
      <Route path="sbc" element={<ShellLayout><SbcHub /></ShellLayout>} />
      <Route path="sbc/:eventId" element={<ShellLayout><SbcEventDetail /></ShellLayout>} />
      <Route path="club" element={<ShellLayout><ClubRoute /></ShellLayout>} />
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
