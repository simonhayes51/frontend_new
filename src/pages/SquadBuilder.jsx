/* Ensure no outer box on cards */
.squad-card,
.squad-card * {
  border: none !important;
  background: transparent !important;
}

/* Keep the nice price pill + chem dot visuals */
.price {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 9999px;
  background: rgba(0,0,0,0.7);
  border: 1px solid rgba(255,255,255,0.08);
  color: #fef08a;
  font-weight: 800;
  font-size: 11px;
}
.price .coin {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

/* chem dot styles already exist in your file; leaving as-is */