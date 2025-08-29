import { lazy, Suspense } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DashboardProvider } from "./context/DashboardContext";
import { SettingsProvider } from "./context/SettingsContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import Loading from "./components/Loading";
import PrivateRoute from "./components/PrivateRoute";

// Direct imports
import PlayerSearch from "./pages/PlayerSearch";
import Watchlist from "./pages/Watchlist";
import SquadBuilder from "./pages/SquadBuilder";

// Lazy-loaded pages
const Dashboard       = lazy(() => import("./pages/Dashboard"));
const AddTrade        = lazy(() => import("./pages/AddTrade"));
const Trades          = lazy(() => import("./pages/Trades"));
const Profile         = lazy(() => import("./pages/Profile"));
const Settings        = lazy(() => import("./pages/Settings"));
const ProfitGraph     = lazy(() => import("./pages/ProfitGraph"));
const PriceCheck      = lazy(() => import("./pages/PriceCheck"));
const Login           = lazy(() => import("./pages/Login"));
const AccessDenied    = lazy(() => import("./pages/AccessDenied"));
const NotFound        = lazy(() => import("./pages/NotFound"));
// NEW: Widgets settings page
const SettingsWidgets = lazy(() => import("./pages/SettingsWidgets"));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="bg-black min-h-screen text-white">
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/access-denied" element={<AccessDenied />} />

                {/* Protected (renders inside <Layout /> via <Outlet />) */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <SettingsProvider>
                        <DashboardProvider>
                          <Layout />
                        </DashboardProvider>
                      </SettingsProvider>
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="add-trade" element={<AddTrade />} />
                  <Route path="trades" element={<Trades />} />
                  <Route path="player-search" element={<PlayerSearch />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  {/* NEW nested widgets settings route */}
                  <Route path="settings/widgets" element={<SettingsWidgets />} />
                  <Route path="analytics" element={<ProfitGraph />} />
                  <Route path="pricecheck" element={<PriceCheck />} />
                  <Route path="watchlist" element={<Watchlist />} />
                  <Route path="squad" element={<SquadBuilder />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
