import React from "react";
import { useCompare } from "../../context/CompareContext";

export default function CompareButton({ cardId }) {
  const { selected, toggle, openModal } = useCompare();
  const active = selected.includes(String(cardId));
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => toggle(cardId)}
        className={`px-2 py-1 rounded-xl text-xs border transition ${active ? "border-lime-400 bg-lime-400/10 text-lime-300" : "border-neutral-700 hover:bg-neutral-800"}`}
      >
        {active ? "Selected" : "Compare"}
      </button>
      {selected.length >= 1 && (
        <button
          onClick={openModal}
          className="px-2 py-1 rounded-xl text-xs border border-neutral-700 hover:bg-neutral-800"
        >
          View
        </button>
      )}
    </div>
  );
}
