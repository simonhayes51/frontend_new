// src/pages/Watchlist.jsx
import React, { useEffect, useState, useCallback } from "react";
import { PlusCircle, X, RefreshCcw } from "lucide-react";
import { getWatchlist, addWatch, deleteWatch, refreshWatch } from "../api/watchlist";

const Field = (props) => (
  <label className="flex flex-col text-sm gap-1">
    <span className="text-gray-300">{props.label}</span>
    <input
      {...props}
      className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-gray-100"
    />
  </label>
);

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const list = await getWatchlist();
      setItems(list);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onQuickAdd = async () => {
    const cardId = Number(document.getElementById("qid").value || 0);
    const name = document.getElementById("qname").value || "Unknown";
    const version = document.getElementById("qver").value || "";
    const plat = document.getElementById("qplat").value;

    try {
      await addWatch({
        card_id: cardId,
        player_name: name,
        version,
        platform: plat,
        notes: "Quick add",
      });
      await load();
    } catch {
      alert("Add failed");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-100">Watchlist</h1>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {/* Quick Add */}
      <div className="grid md:grid-cols-5 gap-3 bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
        <Field label="Card ID" placeholder="84113351" id="qid" />
        <Field label="Name" placeholder="KDB" id="qname" />
        <Field label="Version" placeholder="FUTTIES" id="qver" />
        <label className="flex flex-col text-sm gap-1">
          <span className="text-gray-300">Platform</span>
          <select
            id="qplat"
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-gray-100"
          >
            <option value="ps">PS</option>
            <option value="xbox">Xbox</option>
            <option value="pc">PC</option>
          </select>
        </label>
        <button
          className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-lime-600 bg-lime-600/10 hover:bg-lime-600/20 text-sm text-lime-400"
          onClick={onQuickAdd}
        >
          <PlusCircle size={16} /> Quick Add
        </button>
      </div>

      {err && <div className="text-amber-400 text-sm">{err}</div>}
      {loading && <div className="text-gray-400">Loading…</div>}
      {!loading && items.length === 0 && (
        <div className="text-gray-400">No watch items yet.</div>
      )}

      <div className="grid gap-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 flex items-center gap-4"
          >
            <div className="flex-1">
              <div className="text-gray-100 font-semibold">
                {it.player_name}{" "}
                <span className="text-gray-400">{it.version}</span>
              </div>
              <div className="text-xs text-gray-400">
                {it.platform?.toUpperCase()} • Card {it.card_id}
              </div>
              {typeof it.current_price === "number" && (
                <div className="text-sm text-gray-200 mt-1">
                  Now {it.current_price.toLocaleString()}c
                  {typeof it.change_pct === "number" && (
                    <> • {it.change_pct >= 0 ? "▲" : "▼"} {Math.abs(it.change_pct).toFixed(2)}%</>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                await refreshWatch(it.id);
                await load();
              }}
              className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm"
            >
              Refresh
            </button>
            <button
              onClick={async () => {
                await deleteWatch(it.id);
                await load();
              }}
              className="px-3 py-2 rounded-xl border border-red-600/30 bg-red-600/10 hover:bg-red-600/20 text-sm text-red-300 inline-flex items-center gap-2"
            >
              <X size={16} /> Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}