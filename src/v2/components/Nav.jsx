// src/v2/components/Nav.jsx
import { Link } from "react-router-dom";

export default function Nav() {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--v2-border)]">
      <Link to="/v2" className="text-sm font-semibold tracking-tight text-[var(--v2-text)]">
        FutHub <span className="text-[var(--v2-accent)]">v2</span>
      </Link>
      <div className="flex items-center gap-4 text-xs text-[var(--v2-muted)]">
        <Link to="/v2" className="hover:text-[var(--v2-text)]">Home</Link>
        <Link to="/v2/sbc" className="hover:text-[var(--v2-text)]">SBCs</Link>
        <Link to="/" className="hover:text-[var(--v2-text)]">Back to v1</Link>
      </div>
    </div>
  );
}
