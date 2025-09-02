import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch } from "../api/http";

const SettingsContext = createContext(null);

const DEFAULT_GENERAL = {
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  timezone: "Europe/London",
  coinFormat: "short_m",
  compactThreshold: 100000,
  compactDecimals: 1,
};

export const ALL_WIDGET_KEYS = [
  "profit","tax","trades","profit_trend","winrate","avg_profit","best_trade","volume",
  "latest_trade","top_earner","balance","promo","trending","alerts"
];
const DEFAULT_WIDGET_ORDER = [...ALL_WIDGET_KEYS];
const DEFAULT_VISIBLE = [...ALL_WIDGET_KEYS];
const DEFAULT_RECENT_TRADES_LIMIT = 5;
const DEFAULT_ALERTS = { enabled:false, thresholdPct:5, cooldownMin:30, delivery:"inapp" };
const EA_TAX_RATE = 0.05;

export const SettingsProvider = ({ children }) => {
  const [general, setGeneral] = useState(DEFAULT_GENERAL);
  const [portfolio, setPortfolio] = useState({ startingCoins: 0 });
  const [include_tax_in_profit, setIncludeTaxInProfit] = useState(true);

  const [visible_widgets, setVisibleWidgets] = useState(DEFAULT_VISIBLE);
  const [widget_order, setWidgetOrder] = useState(DEFAULT_WIDGET_ORDER);
  const [recent_trades_limit, setRecentTradesLimit] = useState(DEFAULT_RECENT_TRADES_LIMIT);
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = useCallback((n) => (Number(n)||0).toLocaleString("en-GB"),[]);
  const formatDate = useCallback((d)=>{ 
    const dt = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat("en-GB", {
      year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",
      hour12:(general.timeFormat??"24h")==="12h",timeZone:general.timezone||"Europe/London"
    }).format(dt);
  },[general]);
  const formatCoins = useCallback((n,g=general)=>{
    const num = Number(n)||0;
    if(g.coinFormat==="short_m" && num>=g.compactThreshold){
      if(num>=1_000_000) return (num/1_000_000).toFixed(g.compactDecimals).replace(/\.0+$/,"")+"M";
      if(num>=1_000) return (num/1_000).toFixed(g.compactDecimals).replace(/\.0+$/,"")+"k";
    }
    return (num||0).toLocaleString("en-GB");
  },[general]);

  const calcTax = React.useCallback((s)=>Math.floor((Number(s)||0)*EA_TAX_RATE),[]);
  const calcProfit = React.useCallback((b,s,inc)=>{
    const fee=calcTax(s); return inc ? (s-fee-b) : (s-b);
  },[calcTax]);

  useEffect(()=>{(async()=>{
    try{
      // local
      try{
        const raw=localStorage.getItem("user_settings");
        if(raw){
          const ls=JSON.parse(raw);
          if(Array.isArray(ls.visible_widgets)) setVisibleWidgets(ls.visible_widgets);
          if(Array.isArray(ls.widget_order)) setWidgetOrder(ls.widget_order);
          if(Number.isFinite(ls.recent_trades_limit)) setRecentTradesLimit(ls.recent_trades_limit);
          if(typeof ls.include_tax_in_profit==="boolean") setIncludeTaxInProfit(ls.include_tax_in_profit);
        }
        const a=localStorage.getItem("alerts_settings");
        if(a) setAlerts({...DEFAULT_ALERTS,...JSON.parse(a)});
      }catch{}

      // server
      const [s,p]=await Promise.all([apiFetch("/api/settings"),apiFetch("/api/profile")]);
      setGeneral(g=>({...g,timezone:s.timezone||g.timezone,
        dateFormat:s.date_format==="US"?"MM/DD/YYYY":s.date_format==="ISO"?"YYYY-MM-DD":g.dateFormat}));
      setIncludeTaxInProfit(typeof s.include_tax_in_profit==="boolean"?s.include_tax_in_profit:true);
      setPortfolio({startingCoins:p?.startingBalance??0});
      const serverVis=Array.isArray(s.visible_widgets)?s.visible_widgets:[];
      const mergedVis=Array.from(new Set([...serverVis,...DEFAULT_VISIBLE])).filter(k=>ALL_WIDGET_KEYS.includes(k));
      setVisibleWidgets(mergedVis);
      if(!Array.isArray(s.widget_order)||!s.widget_order?.length) setWidgetOrder(DEFAULT_WIDGET_ORDER);
      localStorage.setItem("user_settings",JSON.stringify({
        visible_widgets:mergedVis,widget_order:DEFAULT_WIDGET_ORDER,
        recent_trades_limit:DEFAULT_RECENT_TRADES_LIMIT,
        include_tax_in_profit:typeof s.include_tax_in_profit==="boolean"?s.include_tax_in_profit:true,
      }));
      if(!localStorage.getItem("alerts_settings")){
        localStorage.setItem("alerts_settings",JSON.stringify(DEFAULT_ALERTS));
      }
    }catch(e){console.error("Settings load failed:",e);setError(e);}finally{setIsLoading(false);}
  })()},[]);

  const saveSettings = async (partial)=>{
    if(partial.general) setGeneral(g=>({...g,...partial.general}));
    if(partial.portfolio) setPortfolio(p=>({...p,...partial.portfolio}));
    if(partial.visible_widgets) setVisibleWidgets(partial.visible_widgets.filter(k=>ALL_WIDGET_KEYS.includes(k)));
    if(partial.widget_order) setWidgetOrder(partial.widget_order.filter(k=>ALL_WIDGET_KEYS.includes(k)));
    if(partial.recent_trades_limit!==undefined) setRecentTradesLimit(partial.recent_trades_limit);
    if(typeof partial.include_tax_in_profit==="boolean") setIncludeTaxInProfit(partial.include_tax_in_profit);
    if(partial.alerts){
      setAlerts(a=>{const next={...a,...partial.alerts};
        localStorage.setItem("alerts_settings",JSON.stringify(next));return next;});
    }
    // persist to server
    if(partial.portfolio?.startingCoins!==undefined){
      try{await apiFetch("/api/portfolio/balance",{method:"POST",body:JSON.stringify({starting_balance:partial.portfolio.startingCoins})});}
      catch(e){setError(e);}
    }
    if(partial.general||partial.visible_widgets||typeof partial.include_tax_in_profit==="boolean"){
      const g={...general,...(partial.general||{})};
      const mapped={timezone:g.timezone,
        date_format:g.dateFormat==="MM/DD/YYYY"?"US":g.dateFormat==="YYYY-MM-DD"?"ISO":"EU",
        default_platform:"Console",custom_tags:[],currency_format:"coins",theme:"dark",
        include_tax_in_profit:typeof partial.include_tax_in_profit==="boolean"?partial.include_tax_in_profit:include_tax_in_profit,
        default_chart_range:"30d",visible_widgets:partial.visible_widgets||visible_widgets};
      try{await apiFetch("/api/settings",{method:"POST",body:JSON.stringify(mapped)});}
      catch(e){setError(e);}
    }
  };

  const toggleWidget = (key,show)=>{
    if(!ALL_WIDGET_KEYS.includes(key)) return;
    const set=new Set(visible_widgets); show?set.add(key):set.delete(key);
    saveSettings({visible_widgets:Array.from(set)});
  };

  const settings={general,portfolio,visible_widgets,widget_order,recent_trades_limit,alerts};
  return(
    <SettingsContext.Provider value={{
      settings,general,portfolio,visible_widgets,widget_order,
      recent_trades_limit,alerts,include_tax_in_profit,
      includeTaxInProfit:include_tax_in_profit,
      taxRate:EA_TAX_RATE,calcTax,calcProfit,
      isLoading,error,saveSettings,toggleWidget,
      formatCurrency,formatDate,formatCoins,
      default_platform:"Console",default_quantity:1,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
export default SettingsContext;