import React, { useEffect, useMemo, useState } from "react";

/**
 * 🔧 How to use
 * 1) Drop this file into your React app, e.g. src/pages/SBCHub.jsx
 * 2) Add a route to it (React Router): <Route path="/sbc" element={<SBCHub/>} />
 * 3) Set API base in .env (optional): VITE_API_BASE=https://api.futhub.co.uk
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://api.futhub.co.uk";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatCoins(n) {
  if (n == null) return "-";
  try {
    return Number(n).toLocaleString();
  } catch (e) {
    return String(n);
  }
}

function DownloadCSVButton({ filename = "sbc-solution.csv", rows = [] }) {
  const csv = useMemo(() => {
    if (!rows?.length) return "";
    const header = ["slot","req_pos","card_id","name","rating","price","source"];
    const body = rows.map(r => [r.slot, r.req_pos, r.card_id, r.name, r.rating, r.price, r.source]);
    const all = [header, ...body].map(cols => cols.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    return all;
  }, [rows]);

  const onClick = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={onClick}
      disabled={!rows?.length}
      className={classNames(
        "px-3 py-2 rounded-xl text-sm shadow-sm",
        rows?.length ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
      )}
    >
      Export CSV
    </button>
  );
}

export default function SBCHub() {
  const [challengeCode, setChallengeCode] = useState("TEST_BASIC");
  const [useClubOnly, setUseClubOnly] = useState(false);
  const [preferUntradeable, setPreferUntradeable] = useState(true);
  const [maxCandidates, setMaxCandidates] = useState(100);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [solution, setSolution] = useState(null);

  const buyList = useMemo(() => {
    if (!solution?.picks?.length) return "";
    const lines = solution.picks.map(p => `${p.req_pos} – ${p.name} (${p.rating}) – ${formatCoins(p.price)}`);
    lines.push(`Total: ${formatCoins(solution.total_cost)}`);
    return lines.join("\n");
  }, [solution]);

  const copyBuyList = async () => {
    if (!buyList) return;
    try {
      await navigator.clipboard.writeText(buyList);
      alert("Buy list copied to clipboard");
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSolution = async () => {
    setLoading(true);
    setError("");
    setSolution(null);
    try {
      const res = await fetch(`${API_BASE}/api/sbc/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_code: challengeCode,
          account_id: null,
          use_club_only: useClubOnly,
          prefer_untradeable: preferUntradeable,
          max_candidates_per_slot: maxCandidates,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setError(data?.error || data?.detail || `HTTP ${res.status}`);
      } else {
        setSolution(data);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // auto-load first time
    fetchSolution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">SBC Hub</h1>

      <div className="grid md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm mb-1">Challenge code</label>
          <input
            value={challengeCode}
            onChange={e => setChallengeCode(e.target.value)}
            placeholder="TEST_BASIC"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring focus:ring-zinc-400"
          />
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useClubOnly} onChange={e => setUseClubOnly(e.target.checked)} />
            <span className="text-sm">Use club only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={preferUntradeable} onChange={e => setPreferUntradeable(e.target.checked)} />
            <span className="text-sm">Prefer untradeables</span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Max candidates / slot</label>
            <input
              type="number"
              min={20}
              max={300}
              value={maxCandidates}
              onChange={e => setMaxCandidates(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring focus:ring-zinc-400"
            />
          </div>
          <button
            onClick={fetchSolution}
            disabled={loading}
            className={classNames(
              "h-10 px-4 rounded-xl text-white shadow-sm",
              loading ? "bg-zinc-400" : "bg-black hover:bg-zinc-800"
            )}
          >
            {loading ? "Solving…" : "Solve"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
          Error: {error}
        </div>
      )}

      {solution && solution.ok && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="text-sm px-3 py-1 rounded-full bg-zinc-100 border">Avg rating: <b>{solution.summary?.avg_rating}</b></div>
            <div className="text-sm px-3 py-1 rounded-full bg-zinc-100 border">Chem (est): <b>{solution.summary?.chem_estimate}</b></div>
            <div className="text-sm px-3 py-1 rounded-full bg-zinc-100 border">Leagues: <b>{solution.summary?.leagues}</b></div>
            <div className="text-sm px-3 py-1 rounded-full bg-zinc-100 border">Nations: <b>{solution.summary?.nations}</b></div>
            <div className="ml-auto flex gap-2">
              <button onClick={copyBuyList} className="px-3 py-2 rounded-xl text-sm shadow-sm bg-zinc-800 hover:bg-zinc-700 text-white">Copy buy list</button>
              <DownloadCSVButton rows={solution.picks} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {solution.picks.map((p) => (
              <div key={`${p.slot}-${p.card_id}`} className="border rounded-2xl p-3 bg-white">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 border">{p.req_pos}</div>
                  <div className="text-xs text-zinc-500">Slot {p.slot}</div>
                </div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-zinc-600">Rating {p.rating}</div>
                <div className="text-sm mt-1">{formatCoins(p.price)} coins</div>
                <div className="text-xs text-zinc-500 mt-1">{p.source === "club" ? "From club" : "Market"}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-right text-lg">
            <span className="font-medium">Total:</span> {formatCoins(solution.total_cost)} coins
          </div>
        </div>
      )}

      {solution && !solution.ok && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          Could not build a full squad. {solution.error || "Try adjusting filters or ensure players have prices."}
        </div>
      )}
    </div>
  );
}
