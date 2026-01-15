// src/main.jsx
import "./bootstrap"; // <-- must be FIRST import

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { EntitlementsProvider } from "./context/EntitlementsContext";

const globalScope = typeof globalThis !== "undefined" ? globalThis : null;

if (globalScope && !globalScope.openEditModal) {
  globalScope.openEditModal = () => {};
}
if (globalScope && !globalScope.toggleComments) {
  globalScope.toggleComments = () => {};
}

const container = document.getElementById("root");
if (!container) throw new Error('Root element "#root" not found');

createRoot(container).render(
  <React.StrictMode>
    <EntitlementsProvider>
      <App />
    </EntitlementsProvider>
  </React.StrictMode>
);
