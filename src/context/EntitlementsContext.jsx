// src/context/EntitlementsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/axios";

const EntContext = createContext(null);

export function EntitlementsProvider({ children }) {
  const [me, setMe] = useState({ loading: true, is_premium: false, features: new Set() });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/api/auth/me");
        if (!alive) return;
        setMe({
          ...data,
          loading: false,
          features: new Set(data?.features || []),
        });
      } catch {
        if (!alive) return;
        setMe((m) => ({ ...m, loading: false }));
      }
    })();
    return () => { alive = false; };
  }, []);

  return <EntContext.Provider value={me}>{children}</EntContext.Provider>;
}

export const useEntitlements = () => useContext(EntContext);
