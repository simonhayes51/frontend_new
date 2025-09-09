- export const ALL_WIDGET_KEYS = [
-   "profit",
-   "tax",
-   "trades",
-   "profit_trend",
-   "winrate",
-   "avg_profit",
-   "best_trade",
-   "volume",
-   "latest_trade",
-   "top_earner",
-   "balance",
-   "promo",
-   "trending",
-   "alerts",
- ];
+ // Include ALL widgets the dashboard can render
+ export const ALL_WIDGET_KEYS = [
+   // engagement/utility
+   "performance",
+   "quick_actions",
+   "daily_target",
+   "streak",
+   // core stats
+   "profit",
+   "tax",
+   "trades",
+   "profit_trend",
+   "winrate",
+   "avg_profit",
+   "best_trade",
+   "volume",
+   "latest_trade",
+   "top_earner",
+   "balance",
+   // market & extras
+   "market_summary",   // ✅ this is the missing one
+   "promo",
+   "trending",
+   "alerts",
+ ];
 
- const DEFAULT_WIDGET_ORDER = [...ALL_WIDGET_KEYS];
- const DEFAULT_VISIBLE = [...ALL_WIDGET_KEYS];
+ const DEFAULT_WIDGET_ORDER = [...ALL_WIDGET_KEYS];
+ const DEFAULT_VISIBLE = [...ALL_WIDGET_KEYS];
