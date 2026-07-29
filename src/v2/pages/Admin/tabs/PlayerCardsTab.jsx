// src/v2/pages/Admin/tabs/PlayerCardsTab.jsx
//
// Manual per-player generation control for the PNG export pipeline
// (backend: app/services/player_card_generation.py). Deliberately small -
// one card_id lookup, generate/regenerate, status, thumbnail, copy URL -
// not a redesign of the Admin page. Bulk backfill is a separate,
// explicitly-run script (scripts/generate_player_cards.py), not exposed
// here, since an unattended button that can launch N Chromium instances
// against the whole catalog is exactly the kind of thing this page should
// not make one click away.
import { useState } from "react";
import SectionCard from "../../../components/SectionCard";
import { api } from "../../../lib/api";

const STATUS_TONE = {
  ready: "text-[var(--v2-positive)]",
  generating: "text-[var(--v2-accent)]",
  error: "text-[var(--v2-negative)]",
};

export default function PlayerCardsTab() {
  const [cardId, setCardId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function loadStatus(id) {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/admin/player-cards/${id}/status`);
      setStatus(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.userMessage || "Couldn't load status");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function generate(force) {
    if (!cardId) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await api.post(`/api/admin/player-cards/${cardId}/generate`, { force });
      setStatus(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.userMessage || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function copyUrl() {
    if (!status?.imageUrl) return;
    navigator.clipboard?.writeText(status.imageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <SectionCard title="Player Card PNGs" subtitle="Generate or regenerate the flattened export PNG for one card">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Card ID"
          value={cardId}
          onChange={(e) => setCardId(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && loadStatus(cardId)}
          className="px-2 py-1.5 rounded-md bg-black/30 border border-[var(--v2-border)] text-xs w-32"
        />
        <button
          type="button"
          onClick={() => loadStatus(cardId)}
          disabled={!cardId || loading}
          className="px-3 py-1.5 rounded-md border border-[var(--v2-border)] text-xs hover:bg-white/5 disabled:opacity-50"
        >
          Check status
        </button>
        <button
          type="button"
          onClick={() => generate(false)}
          disabled={!cardId || loading}
          className="px-3 py-1.5 rounded-md bg-[var(--v2-accent)] text-black font-medium text-xs disabled:opacity-50"
        >
          {loading ? "Working..." : "Generate"}
        </button>
        <button
          type="button"
          onClick={() => generate(true)}
          disabled={!cardId || loading}
          className="px-3 py-1.5 rounded-md border border-[var(--v2-border)] text-xs hover:bg-white/5 disabled:opacity-50"
        >
          Force regenerate
        </button>
      </div>

      {error && <p role="alert" className="text-xs text-[var(--v2-negative)] mb-3">{error}</p>}

      {status && (
        <div className="flex items-start gap-4">
          {status.imageUrl && (
            <img
              src={status.imageUrl}
              alt={`Generated card ${status.cardId ?? cardId}`}
              className="w-20 rounded border border-[var(--v2-border)] bg-black/20"
            />
          )}
          <div className="text-xs flex flex-col gap-1">
            <p>
              Status:{" "}
              <span className={`font-medium ${STATUS_TONE[status.status] || "text-[var(--v2-muted)]"}`}>
                {status.status || "never generated"}
              </span>
            </p>
            {status.generatedAt && (
              <p className="text-[var(--v2-muted)]">Generated: {new Date(status.generatedAt).toLocaleString()}</p>
            )}
            {status.width && status.height && (
              <p className="text-[var(--v2-muted)]">{status.width}×{status.height}px</p>
            )}
            {status.error && <p className="text-[var(--v2-negative)]">{status.error}</p>}
            {status.imageUrl && (
              <button
                type="button"
                onClick={copyUrl}
                className="self-start mt-1 px-2 py-1 rounded border border-[var(--v2-border)] hover:bg-white/5"
              >
                {copied ? "Copied!" : "Copy URL"}
              </button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
