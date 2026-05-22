/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Sparkles, 
  Lightbulb, 
  Send, 
  TrendingUp, 
  Cpu, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Clock
} from "lucide-react";
import { 
  MarketAsset, 
  SecuritySignal, 
  ExecutionLog, 
  TradingBotStrategy 
} from "../types";

interface CommandCenterProps {
  assets: MarketAsset[];
  signals: SecuritySignal[];
  executionFeed: ExecutionLog[];
  activeBotsCount: number;
  deployedBots: TradingBotStrategy[];
  onNavigateToIntelligence: (assetSymbol: string) => void;
  onNavigateToStrategy: () => void;
}

export default function CommandCenter({
  assets,
  signals,
  executionFeed,
  activeBotsCount,
  deployedBots,
  onNavigateToIntelligence,
  onNavigateToStrategy,
}: CommandCenterProps) {
  // AI insight module interactive states
  const [userQuery, setUserQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState(
    "Multiple AlphaBot signals are converging on L2 assets. Liquidations on shorts are accelerating. Recommending +10% exposure to ARB/OP."
  );
  const [errorText, setErrorText] = useState("");
  const [isKeyAvailable, setIsKeyAvailable] = useState(true);

  // Check backend capability on mount
  useEffect(() => {
    fetch("/api/ai-status")
      .then((res) => res.json())
      .then((data) => setIsKeyAvailable(data.isAvailable))
      .catch(() => setIsKeyAvailable(false));
  }, []);

  // Handle Dynamic AI inquiry
  const handleInquireAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    setIsGenerating(true);
    setErrorText("");

    try {
      const btc = assets.find((a) => a.symbol === "BTC/USDT");
      const sol = assets.find((a) => a.symbol === "SOL/USDT");

      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          activeTab: "Command Center",
          marketContext: {
            activeBotsCount,
            btcPrice: btc?.price,
            solPrice: sol?.price,
            signalsCount: signals.length,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiInsight(data.insight);
      } else {
        setErrorText(data.error || "Failed to contact Horizon AI.");
      }
    } catch (err: any) {
      setErrorText("Could not reach the Horizon Server. Please ensure the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bento Hero Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Span 8: Main Chart & KPI Glass Card */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          
          <div className="flex justify-between items-start mb-6 z-10">
            <div>
              <h2 className="text-2xl font-bold font-sans tracking-tight text-on-surface">
                Portfolio Velocity
              </h2>
              <p className="text-sm text-on-surface-variant mt-1 font-sans">
                Real-time composite growth analysis
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-2xl md:text-3xl font-black font-sans text-primary select-all">
                +$12,482.50
              </span>
              <div className="flex items-center justify-end gap-1 text-secondary mt-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold tracking-wide">14.2% (24h)</span>
              </div>
            </div>
          </div>

          {/* Futuristic Simulated Chart */}
          <div className="h-64 w-full relative mt-4">
            <svg 
              className="w-full h-full chart-glow" 
              preserveAspectRatio="none" 
              viewBox="0 0 1000 300"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0058be" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0058be" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Shaded Area */}
              <path 
                d="M 0 250 Q 150 220 250 180 T 450 120 T 650 160 T 850 80 T 1000 40 L 1000 300 L 0 300 Z" 
                fill="url(#chartGradient)"
              />
              
              {/* Dynamic Stroke line */}
              <path 
                d="M 0 250 Q 150 220 250 180 T 450 120 T 650 160 T 850 80 T 1000 40" 
                fill="none" 
                stroke="#0058be" 
                strokeWidth="3.5" 
                strokeLinecap="round"
              />
              
              {/* End Point Dot */}
              <circle cx="1000" cy="40" r="5" fill="#005ac2" className="status-pulse" />
              <circle cx="1000" cy="40" r="1.5" fill="#ffffff" />
            </svg>

            {/* Faded Background Grid Indicators */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none opacity-10">
              <div className="h-full w-px bg-outline" />
              <div className="h-full w-px bg-outline" />
              <div className="h-full w-px bg-outline" />
              <div className="h-full w-px bg-outline" />
            </div>
          </div>

          {/* Micro KPIs Footer row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Active Bots
              </p>
              <p className="text-xl md:text-2xl font-bold text-on-surface">
                {activeBotsCount}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Total Profit
              </p>
              <p className="text-xl md:text-2xl font-bold text-on-surface font-mono">
                $142.8k
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Daily Yield
              </p>
              <p className="text-xl md:text-2xl font-bold text-secondary font-mono">
                2.8%
              </p>
            </div>
          </div>
        </div>

        {/* Right Span 4: AI Execution Status Feed */}
        <div className="lg:col-span-4 flex flex-col h-full justify-between">
          <div className="glass-card rounded-2xl p-6 flex-1 flex flex-col justify-between h-[450px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                AI Execution Feed
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-primary rounded-full status-pulse" />
                <span className="text-[10px] text-primary font-bold uppercase tracking-wide">Live Stream</span>
              </div>
            </div>

            {/* Scrolling elements container */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {executionFeed.map((log) => {
                const isExit = log.status === "Exit";
                const isModified = log.status === "Modified";
                const isUnderperforming = log.changeDirection === "negative";
                
                return (
                  <div 
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-white/50 hover:bg-slate-50 hover:translate-x-1 duration-200 transition-all cursor-pointer"
                    onClick={() => onNavigateToIntelligence(log.asset)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-primary font-mono select-none">
                        {log.asset} {log.type === "Long" ? "Long" : "Short"}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {log.time}
                      </div>
                    </div>
                    
                    <p className="text-sm text-on-surface mt-1">
                      {log.status === "Entered" && (
                        <span>Entered at <strong className="font-semibold text-on-surface font-mono">{log.price}</strong></span>
                      )}
                      {log.status === "Exit" && (
                        <span>
                          Exit at <strong className="font-semibold text-on-surface font-mono">{log.price}</strong>
                          <span className="ml-1.5 inline-flex items-center text-xs font-bold text-secondary">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {log.changeValue}
                          </span>
                        </span>
                      )}
                      {log.status === "Modified" && (
                        <span>Re-leveraged at <strong className="font-semibold text-on-surface font-mono">{log.price}</strong></span>
                      )}
                      {log.status === "Triggered" && (
                        <span>Automated claim at <strong className="font-semibold text-on-surface font-mono">{log.price}</strong></span>
                      )}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-1 opacity-70 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      Managed by {log.agentName}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick deployment nudge footer */}
            <button 
              onClick={onNavigateToStrategy}
              className="mt-4 w-full py-2 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-primary/20 shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5" />
              Build a custom trading bot
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section: Signals & Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col 2: Upcoming Signals table */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">Upcoming Signals</h3>
              <p className="text-xs text-on-surface-variant">Predicted machine liquidity breakouts</p>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-3 pl-2">Asset</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Confidence Index</th>
                  <th className="pb-3">Target Price</th>
                  <th className="pb-3 text-right pr-2">ETA</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {signals.map((sig) => {
                  const isBuy = sig.type === "BUY";
                  return (
                    <tr 
                      key={sig.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      onClick={() => onNavigateToIntelligence(sig.asset)}
                    >
                      <td className="py-4 pl-2 font-semibold text-on-surface flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-slate-600 group-hover:scale-105 transition-transform">
                          {sig.asset.split("/")[0]}
                        </div>
                        <span className="font-semibold">{sig.asset}</span>
                      </td>
                      <td className="py-4 font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isBuy 
                            ? "bg-secondary-container/20 text-on-secondary-container text-secondary" 
                            : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}>
                          {sig.type}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${isBuy ? "bg-secondary" : "bg-tertiary-container"}`}
                              style={{ width: `${sig.probability}%` }}
                            />
                          </div>
                          <span className="font-mono font-semibold text-on-surface-variant">
                            {sig.probability}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 font-mono font-bold text-on-surface">
                        {sig.target}
                      </td>
                      <td className="py-4 text-right pr-2 text-on-surface-variant font-mono">
                        {sig.eta}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col 1: Market Intelligence & Sentiment Hub */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-white/70 border-primary/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Sentiment Hub
                </h3>
                <p className="text-xs text-on-surface-variant">Extreme Greed overlay</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Fear & Greed Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-on-surface-variant">Fear / Greed Index</span>
                  <span className="text-secondary font-bold font-mono">78 - Extreme Greed</span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 via-yellow-400 to-emerald-500 rounded-full" 
                    style={{ width: "78%" }}
                  />
                  <div className="absolute top-0 bottom-0 left-[78%] w-1 bg-white shadow-xl" />
                </div>
              </div>

              {/* AI insight summary text */}
              <div className="p-4 rounded-xl border border-slate-100 bg-white/60">
                <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Horizon AI Prompt Analysis
                </p>
                <div className="text-xs text-on-surface leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto custom-scrollbar">
                  {aiInsight}
                </div>
              </div>
            </div>
          </div>

          {/* User query form built with Gemini */}
          <form onSubmit={handleInquireAI} className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex gap-2">
              <input 
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder={isKeyAvailable ? "Ask Horizon AI anything..." : "API Key configuration needed in metadata"}
                className="flex-1 text-xs border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl px-3 py-2 bg-white/80"
                disabled={isGenerating}
              />
              <button
                type="submit"
                className={`p-2 bg-primary hover:bg-opacity-90 active:scale-95 text-white rounded-xl transition-all ${
                  isGenerating ? "opacity-60 cursor-not-allowed" : ""
                }`}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {errorText && (
              <p className="text-[10px] text-rose-500 font-semibold mt-1.5 pl-1">
                {errorText}
              </p>
            )}
            {!isKeyAvailable && (
              <p className="text-[9px] text-slate-400 mt-1 pl-1">
                Please configure process.env.GEMINI_API_KEY in the setup secrets.
              </p>
            )}
          </form>

        </div>

      </div>
    </div>
  );
}
