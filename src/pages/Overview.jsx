import React, { useEffect, useState } from "react";
import axios from "../axios";

const Overview = () => {
  const [summary, setSummary] = useState({ netProfit: 0, taxPaid: 0, startingBalance: 0 });
  const [loading, setLoading] = useState(true);

  const [nextEvent, setNextEvent] = useState(null);
  const [evtLoading, setEvtLoading] = useState(true);
  const [countdown, setCountdown] = useState("");

  // Trending
  const [trendType, setTrendType] = useState("risers");
  const [trendHours, setTrendHours] = useState("24");
  const [trending, setTrending] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);

  // Alerts
  const [alertsCount, setAlertsCount] = useState({ watch: 0, alerts: 0 });
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        console.error("❌ No user_id found in localStorage");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`/summary?user_id=${userId}`);
        setSummary(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Next Promo: fetch + countdown
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setEvtLoading(true);
        const res = await axios.get("/api/events/next");
        setNextEvent(res.data);
      } catch (e) {
        setNextEvent(null);
      } finally {
        setEvtLoading(false);
      }
    };
    loadEvent();
  }, []);

  useEffect(() => {
    if (!nextEvent?.start_at) return;
    const tick = () => {
      const t = new Date(nextEvent.start_at).getTime() - Date.now();
      if (t <= 0) { setCountdown("soon"); return; }
      const h = Math.floor(t / 3600000);
      const m = Math.floor((t % 3600000) / 60000);
      const s = Math.floor((t % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextEvent?.start_at]);

  // Trending load
  useEffect(() => {
    const loadTrend = async () => {
      try {
        setTrendLoading(true);
        const res = await axios.get("/api/trending", { params: { type: trendType, tf: trendHours } });
        setTrending(Array.isArray(res.data?.items) ? res.data.items.slice(0, 5) : []);
      } catch {
        setTrending([]);
      } finally {
        setTrendLoading(false);
      }
    };
    loadTrend();
  }, [trendType, trendHours]);

  // Alerts counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        setAlertsLoading(true);
        const [w, a] = await Promise.all([axios.get("/api/watchlist"), axios.get("/api/watchlist-alerts")]);
        setAlertsCount({
          watch: Array.isArray(w?.data?.items) ? w.data.items.length : 0,
          alerts: Array.isArray(a?.data?.items) ? a.data.items.length : 0,
        });
      } catch {
        setAlertsCount({ watch: 0, alerts: 0 });
      } finally {
        setAlertsLoading(false);
      }
    };
    loadCounts();
  }, []);

  const fmtUK = (iso) => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
        day: "2-digit",
        month: "short",
        timeZone: "Europe/London",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">💰 Net Profit</h2>
        <p className="text-3xl font-bold text-lime">
          {loading ? "Loading..." : summary.netProfit.toLocaleString()}
        </p>
      </div>
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">🧾 EA Tax Paid</h2>
        <p className="text-3xl font-bold text-lime">
          {loading ? "Loading..." : summary.taxPaid.toLocaleString()}
        </p>
      </div>
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">🏦 Starting Balance</h2>
        <p className="text-3xl font-bold text-lime">
          {loading ? "Loading..." : summary.startingBalance.toLocaleString()}
        </p>
      </div>

      {/* Next Promo */}
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">📅 Next Promo</h2>
        {evtLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : nextEvent ? (
          <>
            <div className="text-2xl font-bold text-lime">{nextEvent.name || "Daily Content"}</div>
            <p className="text-sm text-gray-400 mt-1">
              {countdown ? `Starts in ${countdown}` : "—"} • {fmtUK(nextEvent.start_at)} UK
            </p>
            <p className="text-xs text-gray-500 mt-1">Confidence: {nextEvent.confidence ?? "heuristic"}</p>
          </>
        ) : (
          <p className="text-sm text-red-400">Couldn’t load next event</p>
        )}
      </div>

      {/* Trending (Risers/Fallers) */}
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-md md:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">📈 Trending</h2>
          <div className="flex items-center gap-2">
            <div className="bg-zinc-800 rounded-lg p-1">
              {["risers","fallers"].map(t=>(
                <button
                  key={t}
                  onClick={()=>setTrendType(t)}
                  className={`text-xs px-2 py-1 rounded ${trendType===t ? "bg-zinc-700 text-white" : "text-gray-300"}`}
                >
                  {t[0].toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
            <div className="bg-zinc-800 rounded-lg p-1">
              {["6","12","24"].map(h=>(
                <button
                  key={h}
                  onClick={()=>setTrendHours(h)}
                  className={`text-xs px-2 py-1 rounded ${trendHours===h ? "bg-zinc-700 text-white" : "text-gray-300"}`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>
        {trendLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_,i)=>(
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-zinc-800 rounded" />
                <div className="h-4 w-40 bg-zinc-800 rounded" />
                <div className="h-4 w-12 bg-zinc-800 rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="text-sm text-gray-400">No data.</p>
        ) : (
          <div className="space-y-2">
            {trending.map((it, i) => {
              const pct = Number(it.percent ?? 0);
              const up = pct >= 0;
              return (
                <div key={`${it.pid}-${i}`} className="flex items-center gap-3">
                  {it.image ? (
                    <img src={it.image} alt={it.name} className="w-7 h-7 rounded object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-zinc-800" />
                  )}
                  <div className="truncate">
                    <div className="text-sm text-gray-200 truncate">
                      {it.name ?? `Card ${it.pid}`} {it.rating ? <span className="text-gray-400">({it.rating})</span> : null}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{it.version ?? it.league ?? ""}</div>
                  </div>
                  <div className={`ml-auto text-sm font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {pct > 0 ? "+" : ""}{pct.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Watchlist Alerts */}
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">🔔 Watchlist Alerts</h2>
        {alertsLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="flex items-end gap-6">
              <div>
                <div className="text-xs text-gray-400">Watchlist items</div>
                <div className="text-3xl font-bold text-gray-200">{alertsCount.watch}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Active alerts</div>
                <div className={`text-3xl font-bold ${alertsCount.alerts ? "text-emerald-400" : "text-gray-400"}`}>{alertsCount.alerts}</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Configure rules in Settings → Watchlist Alerts.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Overview;
