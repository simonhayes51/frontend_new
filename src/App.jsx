// src/App.jsx

import { lazy, Suspense } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DashboardProvider } from "./context/DashboardContext";
import { SettingsProvider } from "./context/SettingsContext";
import { EntitlementsProvider } from "./context/EntitlementsContext"; // Make sure this is imported
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import Loading from "./components/Loading";
import PrivateRoute from "./components/PrivateRoute";
import PremiumRoute from "./components/PremiumRoute";

// Eager pages
import Landing from "./pages/Landing";
import Watchlist from "./pages/Watchlist";
import SquadBuilder from "./pages/SquadBuilder";
import PlayerSearch from "./pages/PlayerSearch";
import TradeFinder from "./pages/TradeFinder";

// Lazy pages
const Dashboard     = lazy(() => import("./pages/Dashboard"));
const AddTrade      = lazy(() => import("./pages/AddTrade"));
const Trades        = lazy(() => import("./pages/Trades"));
const Profile       = lazy(() => import("./pages/Profile"));
const Settings      = lazy(() => import("./pages/Settings"));
const ProfitGraph   = lazy(() => import("./pages/ProfitGraph"));
const PriceCheck    = lazy(() => import("./pages/PriceCheck"));
const Trending      = lazy(() => import("./pages/Trending"));
const SmartBuy      = lazy(() => import("./pages/SmartBuy"));
const Login         = lazy(() => import("./pages/Login"));
const AccessDenied  = lazy(() => import("./pages/AccessDenied"));
const NotFound      = lazy(() => import("./pages/NotFound"));
const PlayerCompare = lazy(() => import("./pages/PlayerCompare"));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <EntitlementsProvider>
          <Router>
            <div className="bg-black min-h-screen text-white">
              <Suspense fallback={<Loading />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/access-denied" element={<AccessDenied />} />
                  <Route path="/landing" element={<Landing />} />

                  {/* Protected shell */}
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
                    {/* Free tier pages */}
                    <Route index element={<Dashboard />} />
                    <Route path="add-trade" element={<AddTrade />} />
                    <Route path="trades" element={<Trades />} />
                    <Route path="player-search" element={<PlayerSearch />} />
                    <Route path="player-compare" element={<PlayerCompare />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="analytics" element={<ProfitGraph />} />
                    <Route path="pricecheck" element={<PriceCheck />} />
                    <Route path="watchlist" element={<Watchlist />} />
                    <Route path="squad" element={<SquadBuilder />} />

                    {/* Basic trending (free tier gets limited access) */}
                    <Route path="trending" element={<Trending />} />

                    {/* Premium-only routes with full page protection */}
                    <Route
                      path="smart-buy"
                      element={
                        <PremiumRoute 
                          feature="smart_buy"
                          featureName="Smart Buy AI"
                        >
                          <SmartBuy />
                        </PremiumRoute>
                      }
                    />

                    <Route
                      path="trade-finder"
                      element={
                        <PremiumRoute 
                          feature="trade_finder"
                          featureName="Advanced Trade Finder"
                        >
                          <TradeFinder />
                        </PremiumRoute>
                      }
                    />

                    {/* You can add more premium routes here */}
                    <Route
                      path="advanced-analytics"
                      element={
                        <PremiumRoute 
                          feature="advanced_analytics"
                          featureName="Advanced Analytics"
                        >
                          <ProfitGraph />
                        </PremiumRoute>
                      }
                    />
                  </Route>

                  {/* 404 fallback */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </Router>
        </EntitlementsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
