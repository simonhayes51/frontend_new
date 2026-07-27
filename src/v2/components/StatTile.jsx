// src/v2/components/StatTile.jsx
export default function StatTile({ label, value, delta, deltaTone = "neutral" }) {
  const toneClass =
    deltaTone === "positive"
      ? "text-[var(--v2-positive)]"
      : deltaTone === "negative"
      ? "text-[var(--v2-negative)]"
      : "text-[var(--v2-muted)]";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[var(--v2-muted)]">{label}</span>
      <span className="text-xl font-semibold text-[var(--v2-text)]">{value}</span>
      {delta !== undefined && delta !== null && (
        <span className={`text-xs ${toneClass}`}>{delta}</span>
      )}
    </div>
  );
}
