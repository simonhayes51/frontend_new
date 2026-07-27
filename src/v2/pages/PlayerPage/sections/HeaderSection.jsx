// src/v2/pages/PlayerPage/sections/HeaderSection.jsx
export default function HeaderSection({ meta }) {
  if (!meta) return null;
  return (
    <div className="flex items-center gap-4">
      {meta.image_url && (
        <img src={meta.image_url} alt={meta.name} className="w-16 h-16 object-contain" />
      )}
      <div>
        <h1 className="text-xl font-semibold text-[var(--v2-text)]">{meta.name}</h1>
        <p className="text-sm text-[var(--v2-muted)]">
          {meta.rating} OVR · {meta.version} · {meta.position}
          {meta.club ? ` · ${meta.club}` : ""}
        </p>
      </div>
    </div>
  );
}
