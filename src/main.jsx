import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { EntitlementsProvider } from "./context/EntitlementsContext";

const API_HOST = "api.futhub.co.uk";
const toHttps = (u) =>
  typeof u === "string"
    ? u.replace(
        new RegExp("^http://" + API_HOST.replace(/\./g, "\\."), "i"),
        `https://${API_HOST}`
      )
    : u;

if (typeof window !== "undefined") {
  const _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (typeof url === "string" && url.startsWith(`http://${API_HOST}`)) {
      console.log("🚨 Rewriting XHR:", url);
      console.trace("XHR stack");
      url = toHttps(url);
    }
    return _open.call(this, method, url, ...rest);
  };

  const _fetch = window.fetch;
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input?.url;
    if (typeof url === "string" && url.startsWith(`http://${API_HOST}`)) {
      console.log("🚨 Rewriting fetch:", url);
      console.trace("fetch stack");
      input =
        typeof input === "string" ? toHttps(input) : new Request(toHttps(url), input);
    }
    return _fetch(input, init);
  };
}

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
