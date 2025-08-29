import React, { useEffect, useState } from "react";
import { useDashboard } from "../context/DashboardContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

const Trades = () => {
  const { getAllTrades } = useDashboard();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // edit modal state
  const [editing, setEditing] = useState(null); // trade being edited or null
  const [saving, setSaving] = useState(false);

  // deletion state
  const [deletingId, setDeletingId] = useState(null); // trade_id being deleted

  // Helpers
  const safeNumber = (value) => Number(value || 0).toLocaleString();

  const safeDate = (date) => {
    try {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  async function refreshTrades() {
    try {
      const result = await getAllTrades();
      if (result?.success) {
        setTrades(result.trades || []);
      } else if (Array.isArray(result?.trades)) {
        setTrades(result.trades);
      } else {
        console.error("Failed to fetch trades:", result?.message || result);
      }
    } catch (err) {
      console.error("Failed to fetch trades:", err);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshTrades();
      setLoading(false);
    })();
  }, [getAllTrades]);

  // -------- Delete --------
  const handleDelete = async (trade) => {
    const tid = trade?.trade_id;
    if (!tid) {
      alert("This row has no trade_id. Cannot delete.");
      return;
    }
    const ok = window.confirm(
      `Delete trade for ${trade.player ?? "Unknown"} (${safeDate(trade.timestamp)})?`
    );
    if (!ok) return;

    setDeletingId(tid);

    // optimistic UI: remove immediately
    const prev = trades;
    setTrades((t) => t.filter((row) => row.trade_id !== tid));

    try {
      const r = await fetch(`${API_BASE}/api/trades/${tid}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        // revert if server rejected
        setTrades(prev);
        const txt = await r.text().catch(() => "");
        throw new Error(`Delete failed (${r.status}). ${txt || "Please try again."}`);
      }
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to delete trade.");
    } finally {
      setDeletingId(null);
    }
  };

  // -------- Edit --------
  const openEdit = (trade) => setEditing({ ...trade }); // clone
  const closeEdit = () => setEditing(null);

  const handleEditChange = (field, value) => {
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!editing?.trade_id) {
      alert("Missing trade_id");
      return;
    }
    setSaving(true);
    try {
      // Patch of fields you allow to change
      const patch = {
        player: editing.player,
        version: editing.version,
        quantity: Number(editing.quantity) || 0,
        buy: Number(editing.buy) || 0,
        sell: Number(editing.sell) || 0,
        platform: editing.platform,
        tag: editing.tag,
        notes: editing.notes ?? "",
        // timestamp: include if you want to allow manual date edits
      };

      const r = await fetch(`${API_BASE}/api/trades/${editing.trade_id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`Save failed (${r.status}). ${txt || "Please try again."}`);
      }

      await refreshTrades(); // get recomputed tax/profit from server
      closeEdit();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-400">Loading trades...</p>;

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Trade History</h1>

      {trades.length === 0 ? (
        <p className="text-gray-400">No trades logged yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="py-2">Player</th>
                <th>Version</th>
                <th>Qty</th>
                <th>Buy</th>
                <th>Sell</th>
                <th>Profit</th>
                <th>Date</th>
                <th className="text-right pr-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr
                  key={trade.trade_id ?? `${trade.player}-${trade.timestamp}`}
                  className="border-b border-gray-800"
                >
                  <td className="py-2">{trade.player || "N/A"}</td>
                  <td>{trade.version || "N/A"}</td>
                  <td>{trade.quantity || 0}</td>
                  <td>{safeNumber(trade.buy)}</td>
                  <td>{safeNumber(trade.sell)}</td>
                  <td
                    className={(trade.profit || 0) >= 0 ? "text-green-400" : "text-red-400"}
                  >
                    {safeNumber(trade.profit)}
                  </td>
                  <td>{safeDate(trade.timestamp)}</td>
                  <td className="py-2">
                    <div className="flex gap-2 justify-end">
                      {/* Edit (Pencil) */}
                      <button
                        onClick={() => openEdit(trade)}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                        title="Edit trade"
                        aria-label="Edit trade"
                      >
                        {/* Heroicons Pencil Square */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path d="M16.862 2.487a1.5 1.5 0 0 1 2.122 0l2.529 2.53a1.5 1.5 0 0 1 0 2.121l-9.9 9.9a1.5 1.5 0 0 1-.67.39l-4.41 1.176a.75.75 0 0 1-.92-.92l1.175-4.41a1.5 1.5 0 0 1 .39-.67l9.904-9.904Z" />
                          <path d="M21 15.75a.75.75 0 0 1 .75.75v3A3.75 3.75 0 0 1 18 23.25H6A3.75 3.75 0 0 1 2.25 19.5v-12A3.75 3.75 0 0 1 6 3.75h3a.75.75 0 0 1 0 1.5H6A2.25 2.25 0 0 0 3.75 7.5v12A2.25 2.25 0 0 0 6 21.75h12A2.25 2.25 0 0 0 20.25 19.5v-3a.75.75 0 0 1 .75-.75Z" />
                        </svg>
                      </button>

                      {/* Delete (Trash) */}
                      <button
                        onClick={() => handleDelete(trade)}
                        disabled={deletingId === trade.trade_id}
                        className={`p-2 rounded-lg border ${
                          deletingId === trade.trade_id
                            ? "bg-red-900/40 text-red-300 border-red-800 cursor-not-allowed"
                            : "bg-red-900/30 text-red-300 hover:bg-red-900/50 border-red-800"
                        }`}
                        title="Delete trade"
                        aria-label="Delete trade"
                      >
                        {/* Heroicons Trash */}
                        {deletingId === trade.trade_id ? (
                          <span className="text-xs">…</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path d="M9 2.25a1.5 1.5 0 0 0-1.5 1.5V4.5H4.5a.75.75 0 0 0 0 1.5h.563l.84 12.266A3.75 3.75 0 0 0 9.64 21.75h4.72a3.75 3.75 0 0 0 3.736-3.484L18.936 6h.564a.75.75 0 0 0 0-1.5H16.5V3.75a1.5 1.5 0 0 0-1.5-1.5H9Zm2.25 6a.75.75 0 0 1 .75.75v8.25a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm3 0a.75.75 0 0 1 .75.75v8.25a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75ZM9 3.75h6V4.5H9V3.75Z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Edit Trade</h2>
              <button
                onClick={closeEdit}
                className="text-zinc-400 hover:text-zinc-200"
                title="Close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-sm">
                <span className="block mb-1">Player</span>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  value={editing.player || ""}
                  onChange={(e) => handleEditChange("player", e.target.value)}
                />
              </label>

              <label className="text-sm">
                <span className="block mb-1">Version</span>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  value={editing.version || ""}
                  onChange={(e) => handleEditChange("version", e.target.value)}
                />
              </label>

              <label className="text-sm">
                <span className="block mb-1">Quantity</span>
                <input
                  type="number"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  value={editing.quantity ?? 0}
                  onChange={(e) => handleEditChange("quantity", Number(e.target.value))}
                  min={1}
                />
              </label>

              <label className="text-sm">
                <span className="block mb-1">Buy</span>
                <input
                  type="number"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  value={editing.buy ?? 0}
                  onChange={(e) => handleEditChange("buy", Number(e.target.value))}
                  min={0}
                />
              </label>

              <label className="text-sm">
                <span className="block mb-1">Sell</span>
                <input
                  type="number"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  value={editing.sell ?? 0}
                  onChange={(e) => handleEditChange("sell", Number(e.target.value))}
                  min={0}
                />
              </label>

              <label className="text-sm">
                <span className="block mb-1">Platform</span>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  value={editing.platform || ""}
                  onChange={(e) => handleEditChange("platform", e.target.value)}
                />
              </label>

              <label className="text-sm">
                <span className="block mb-1">Tag</span>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  value={editing.tag || ""}
                  onChange={(e) => handleEditChange("tag", e.target.value)}
                />
              </label>

              <label className="col-span-2 text-sm">
                <span className="block mb-1">Notes</span>
                <textarea
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  value={editing.notes || ""}
                  onChange={(e) => handleEditChange("notes", e.target.value)}
                />
              </label>

              <div className="col-span-2 flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-3 py-2 rounded-lg border ${
                    saving
                      ? "bg-blue-900/40 text-blue-200 border-blue-800 cursor-not-allowed"
                      : "bg-blue-900/30 text-blue-200 hover:bg-blue-900/50 border-blue-800"
                  }`}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>

            <p className="text-xs text-zinc-500 mt-3">Trade ID: {editing.trade_id ?? "N/A"}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trades;
