import React, { useEffect, useState } from "react";
import axios from "../axios";

const Overview = () => {
  const [summary, setSummary] = useState({ netProfit: 0, taxPaid: 0, startingBalance: 0 });
  const [loading, setLoading] = useState(true);

  const [nextEvent, setNextEvent] = useState(null);
  const [evtLoading, setEvtLoading] = useState(true);
  const [countdown, setCountdown] = useState("");

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
        // Use the same axios instance; backend route is /api/events/next
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

      {/* New: Next Promo */}
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
    </div>
  );
};

export default Overview;
