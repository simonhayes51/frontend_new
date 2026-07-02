// src/pages/Watchlist.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { getWatchlist, addWatch, deleteWatch, refreshWatch } from "../api/watchlist";
import { Link } from "react-router-dom";
import api from "../axios";
import { apiFetch } from "../api/http"; // ✅ use the same fetch wrapper as the rest of the app

// Tiny inline icons to keep deps minimal
const Icon = {
  Plus: (props) => (
    <svg className={`w-4 h-4 ${props.className||""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  ),
  Refresh: (props) => (
    <svg className={`w-4 h-4 ${props.className||""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 8a8 8 0 10-1.78 5.091" />
    </svg>
  ),
  Trash: (props) => (
    <svg className={`w-4 h-4 ${props.className||""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0l1-3h6l1 3" />
    </svg>
  ),
  Sort: (props) => (
    <svg className={`w-4 h-4 ${props.className||""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h13M3 12h9M3 17h5" />
    </svg>
  ),
};

function Price({ value }) {
  if (value === null || value === undefined) return <span className="text-gray-400">N/A</span>;
  return <span className="font-semibold">{Number(value).toLocaleString()}</span>;
}

function Change({ change, pct }) {
  if (change === null || change === undefined || pct === null || pct === undefined)
    return <span className="text-gray-400">—</span>;
  const up = change > 0;
  return (
    <span className={up ? "text-emerald-400 font-semibold" : change < 0 ? "text-red-400 font-semibold" : "text-gray-300"}>
      {up ? "↑" : change < 0 ? "↓" : "•"} {Number(change).toLocaleString()} ({pct}%)
    </span>
  );
}

const SORTS = {
  SMART: "smart",
  CHANGE_DESC: "change_desc",
  PRICE_ASC: "price_asc",
  PRICE_DESC: "price_desc",
  ADDED_NEWEST: "added_newest",
  NAME_ASC: "name_asc",
};

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ player_name: "", card_id: "", version: "", platform: "ps", notes: "" });
  const [busyAdd, setBusyAdd] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [sort, setSort] = useState(SORTS.SMART);

  // autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [sugOpen, setSugOpen] = useState(false);
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getWatchlist();
      // ✅ accept either {items: [...]} or a plain array
      const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // sort
  const sorted = useMemo(() => {
    const list = [...items];
    switch (sort) {
      case SORTS.CHANGE_DESC:
        list.sort((a, b) => (b.change_pct ?? -Infinity) - (a.change_pct ?? -Infinity));
        break;
      case SORTS.PRICE_ASC:
        list.sort((a, b) => (a.current_price ?? Infinity) - (b.current_price ?? Infinity));
        break;
      case SORTS.PRICE_DESC:
        list.sort((a, b) => (b.current_price ?? -Infinity) - (a.current_price ?? -Infinity));
        break;
      case SORTS.ADDED_NEWEST:
        list.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        break;
      case SORTS.NAME_ASC:
        list.sort((a, b) => (a.player_name || "").localeCompare(b.player_name || ""));
        break;
      case SORTS.SMART:
      default:
        list.sort((a, b) => {
          if (a.is_extinct !== b.is_extinct) return a.is_extinct ? 1 : -1;
          const ap = a.change_pct ?? -Infinity, bp = b.change_pct ?? -Infinity;
          if (bp !== ap) return bp - ap;
          const aa = Math.abs(a.change ?? -Infinity), ba = Math.abs(b.change ?? -Infinity);
          if (ba !== aa) return ba - aa;
          return new Date(b.started_at) - new Date(a.started_at);
        });
        break;
    }
    return list;
  }, [items, sort]);

  // autocomplete fetch — use apiFetch so it shares credentials/base URL
  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      setSugLoading(true);
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      // ✅ switch to apiFetch to avoid HTML responses / credential mismatches
      const res = await apiFetch("/api/search-players", {
        query: { q },
        signal: abortRef.current.signal,
      });

      setSuggestions(Array.isArray(res?.players) ? res.players : []);
      setSugOpen(true);
    } catch (e) {
      console.error("Search error:", e);
      if (e.name !== "AbortError") {
        setSuggestions([]);
        setSugOpen(true);
      }
    } finally {
      setSugLoading(false);
    }
  }, []);

  // debounce input
  useEffect(() => {
    const q = form.player_name.trim();
    const t = setTimeout(() => fetchSuggestions(q), 250);
    return () => clearTimeout(t);
  }, [form.player_name, fetchSuggestions]);

  const applySuggestion = (p) => {
    setForm((f) => ({
      ...f,
      player_name: p.name,
      card_id: String(p.card_id || ""),
      version: p.version || f.version,
    }));
    setSugOpen(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.player_name || !form.card_id) return;
    setBusyAdd(true);
    try {
      await addWatch({
        player_name: form.player_name.trim(),
        card_id: Number(form.card_id),
        version: form.version || null,
        platform: form.platform.toUpperCase(), // 'PS' | 'XBOX' (API-safe)
        notes: form.notes || null,
      });
      setShowAdd(false);
      setForm({ player_name: "", card_id: "", version: "", platform: form.platform, notes: "" });
      await load();
    } finally {
      setBusyAdd(false);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteWatch(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleRefreshRow = async (id) => {
    setBusyId(id);
    try {
      await refreshWatch(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  // close suggestions on click outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!inputRef.current) return;
      if (!inputRef.current.parentElement?.contains(e.target)) setSugOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Player Watchlist</h1>
          <p className="text-gray-400 text-sm">
            Track starting price vs current price.{" "}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sort picker */}
          <div className="flex items-center gap-1 bg-gray-900/70 border border-[#2A2F36] rounded-md px-2 py-1 text-gray-300">
            <Icon.Sort />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-sm outline-none"
              title="Sort"
            >
              <option value={SORTS.SMART}>Smart</option>
              <option value={SORTS.CHANGE_DESC}>% Change ↓</option>
              <option value={SORTS.PRICE_DESC}>Current Price ↓</option>
              <option value={SORTS.PRICE_ASC}>Current Price ↑</option>
              <option value={SORTS.ADDED_NEWEST}>Recently Added</option>
              <option value={SORTS.NAME_ASC}>Name A–Z</option>
            </select>
          </div>

          {/* Refresh all */}
          <button
            onClick={load}
            className="px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-2"
            title="Refresh all"
          >
            <Icon.Refresh className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Add */}
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-2 rounded-md bg-lime-500/90 hover:bg-lime-500 text-black font-semibold flex items-center gap-2"
          >
            <Icon.Plus />
            Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111318]/70 rounded-xl border border-[#2A2F36] overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 text-xs uppercase tracking-wider text-gray-400 bg-black/30">
          <div className="col-span-4">Player</div>
          <div className="col-span-2">Started</div>
          <div className="col-span-2">Current</div>
          <div className="col-span-2">Change</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-6 text-gray-400">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="p-6 text-gray-400">
            No players yet. Click <span className="text-white">Add</span> to start a watch.
          </div>
        ) : (
          <ul className="divide-y divide-[#1c1f26]">
            {sorted.map((it) => (
              <li key={it.id} className="grid grid-cols-12 px-4 py-3 items-center text-sm">
                <div className="col-span-4">
                  <div className="text-white font-semibold">{it.player_name}</div>
                  <div className="text-xs text-gray-400">
                    ID {it.card_id} • {it.version || "Base"} • {it.platform?.toUpperCase()}
                  </div>
                </div>

                <div className="col-span-2 text-gray-200">
                  <Price value={it.started_price} />
                  <div className="text-[10px] text-gray-500">Added {new Date(it.started_at).toLocaleString()}</div>
                </div>

                <div className="col-span-2 text-gray-200">
                  {it.is_extinct ? (
                    <span className="text-yellow-400 font-semibold">Extinct</span>
                  ) : (
                    <Price value={it.current_price} />
                  )}
                  {it.updated_at && (
                    <div className="text-[10px] text-gray-500">Updated {new Date(it.updated_at).toLocaleString()}</div>
                  )}
                </div>

                <div className="col-span-2">
                  <Change change={it.change} pct={it.change_pct} />
                </div>

                <div className="col-span-2 text-right flex justify-end gap-2">
                  <button
                    onClick={() => handleRefreshRow(it.id)}
                    disabled={busyId === it.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs"
                    title="Refresh price"
                  >
                    <Icon.Refresh className={busyId === it.id ? "animate-spin" : ""} />
                    Refresh
                  </button>
                  <button
                    onClick={() => handleDelete(it.id)}
                    disabled={busyId === it.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-xs"
                  >
                    <Icon.Trash />
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-[#111318] border border-[#2A2F36] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add to Watchlist</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800/60"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="relative">
                <label className="block text-sm text-gray-300 mb-1">Player</label>
                <input
                  ref={inputRef}
                  className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#2A2F36] text-white"
                  value={form.player_name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, player_name: e.target.value }));
                    setSugOpen(true);
                  }}
                  placeholder="e.g., Cristiano Ronaldo"
                  required
                  autoComplete="off"
                />

                {/* suggestions dropdown */}
                {sugOpen && (
                  <div className="absolute left-0 right-0 mt-1 rounded-md overflow-hidden border border-[#2A2F36] bg-[#0c0f14] z-10">
                    {sugLoading ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Searching…</div>
                    ) : form.player_name.trim().length < 1 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Type 1+ characters</div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto">
                        {suggestions.map((p) => (
                          <li
                            key={`${p.card_id}-${p.name}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySuggestion(p)}
                            className="px-3 py-2 text-sm hover:bg-gray-800 cursor-pointer flex items-center gap-2"
                          >
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="w-6 h-6 rounded-sm object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-sm bg-gray-700" />
                            )}
                            <div className="flex-1">
                              <div className="text-white">
                                {p.name} {p.rating ? <span className="text-gray-400">({p.rating})</span> : null}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                ID {p.card_id} • {p.version || "Base"} • {p.position || "—"}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Card ID (EA/FUT.GG)</label>
                <input
                  className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#2A2F36] text-white"
                  value={form.card_id}
                  onChange={(e) => setForm((f) => ({ ...f, card_id: e.target.value.replace(/\D/g, "") }))}
                  placeholder="e.g., 100664475"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Version</label>
                  <input
                    className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#2A2F36] text-white"
                    value={form.version}
                    onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                    placeholder="Base / IF / RTTK …"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Platform</label>
                  <select
                    className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#2A2F36] text-white"
                    value={form.platform}
                    onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                  >
                    <option value="ps">PS</option>
                    <option value="xbox">Xbox</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Notes (optional)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#2A2F36] text-white"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Target buy/sell, reasons, etc."
                />
              </div>

              <button
                disabled={busyAdd}
                className="w-full py-2 rounded-md bg-lime-500/90 hover:bg-lime-500 text-black font-bold"
              >
                {busyAdd ? "Adding…" : "Add to Watchlist"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}