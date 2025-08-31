// src/context/DashboardContext.jsx
import { createContext, useContext, useReducer, useEffect } from "react";
import api from "../utils/axios";

const DashboardContext = createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_DASHBOARD_DATA":
      return { ...state, ...action.payload, isLoading: false, error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "ADD_TRADE":
      return {
        ...state,
        trades: [action.payload, ...state.trades.slice(0, 9)],
        netProfit: (state.netProfit || 0) + (action.payload.profit || 0),
        taxPaid: (state.taxPaid || 0) + (action.payload.ea_tax || 0),
        profile: {
          ...state.profile,
          totalProfit: (state.profile?.totalProfit || 0) + (action.payload.profit || 0),
          tradesLogged: (state.profile?.tradesLogged || 0) + 1,
        },
      };
    default:
      return state;
  }
};

const initialState = {
  isLoading: true,
  error: null,
  netProfit: 0,
  taxPaid: 0,
  startingBalance: 0,
  trades: [],
  profile: { totalProfit: 0, tradesLogged: 0, winRate: 0, mostUsedTag: "N/A", bestTrade: null },
};

export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchDashboardData = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await api.get("/api/dashboard");
      dispatch({ type: "SET_DASHBOARD_DATA", payload: res.data });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      dispatch({ type: "SET_ERROR", payload: err.userMessage || "Failed to load dashboard data" });
    }
  };

  // IMPORTANT: coerce numbers before POST (prevents 400s & bad math)
  const addTrade = async (tradeData) => {
    try {
      const payload = {
        ...tradeData,
        buy: Number(tradeData.buy || 0),
        sell: Number(tradeData.sell || 0),
        quantity: Number(tradeData.quantity || 1),
      };

      const res = await api.post("/api/trades", payload);

      const newTrade = {
        ...payload,
        profit: res.data.profit,
        ea_tax: res.data.ea_tax,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_TRADE", payload: newTrade });

      return { success: true, message: res.data.message };
    } catch (err) {
      console.error("Add trade error:", err);
      return { success: false, message: err.userMessage || "Failed to add trade" };
    }
  };

  const getAllTrades = async () => {
    try {
      const res = await api.get("/api/trades");
      return { success: true, trades: res.data.trades };
    } catch (err) {
      console.error("Get trades error:", err);
      return { success: false, message: err.userMessage || "Failed to load trades" };
    }
  };

  const deleteTrade = async (tradeId) => {
    try {
      await api.delete(`/api/trades/${tradeId}`);
      await fetchDashboardData();
      return { success: true, message: "Trade deleted successfully" };
    } catch (err) {
      console.error("Delete trade error:", err);
      return { success: false, message: err.userMessage || "Failed to delete trade" };
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  return (
    <DashboardContext.Provider
      value={{ ...state, addTrade, getAllTrades, deleteTrade, fetchDashboardData }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
};