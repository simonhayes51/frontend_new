import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";              // ✅ brings in Tailwind/global CSS
import { EntitlementsProvider } from "./context/EntitlementsContext";
import { queryClient } from "./lib/queryClient";
import { registerSW } from "./utils/pwa";

const container = document.getElementById("root");
if (!container) throw new Error('Root element "#root" not found');

createRoot(container).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <EntitlementsProvider>
        <App />
      </EntitlementsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// PWA: the service worker + manifest were already in /public but never
// registered from the entry point - the install prompt and offline shell
// simply never activated.
registerSW();
