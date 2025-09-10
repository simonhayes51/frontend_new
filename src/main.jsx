import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { EntitlementsProvider } from "./context/EntitlementsContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EntitlementsProvider>
      <App />
    </EntitlementsProvider>
  </React.StrictMode>
);
