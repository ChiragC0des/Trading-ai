/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Clock, 
  ChevronUp, 
  ChevronDown, 
  Sliders, 
  Maximize2,
  Bell, 
  Info,
  Layers,
  Sparkles,
  BookOpen
} from "lucide-react";
import { 
  MarketAsset, 
  OrderBookItem, 
  TradeItem, 
  TechnicalIndicatorSet, 
  NewsFlashItem
} from "../types";
import { INDICATORS_DATA } from "../data";

interface MarketIntelligenceProps {
  assets: MarketAsset[];
  newsFlashes: NewsFlashItem[];
  selectedAssetSymbol: string;
  onSelectAsset: (symbol: string) => void;
}

export default function MarketIntelligence({
  assets,
  newsFlashes,
  selectedAssetSymbol,
  onSelectAsset
}: MarketIntelligenceProps) {
  const currentAsset = assets.find((a) => a.symbol === selectedAssetSymbol) || assets[0];
  
  // Interactive Timeframe
  const [timeframe, setTimeframe] = useState<"1m" | "15m" | "1h" | "4h" | "1d">("4h");
  
  // Custom indicators activated tags
  const [indicators, setIndicators] = useState<string[]>(["MA", "RSI"]);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

  // Live Price feed state (fluctuates dynamically)
  const [livePrice, setLivePrice] = useState(currentAsset.price);
  const [priceFlashColor, setPriceFlashColor] = useState<"green" | "red" | "neutral">("neutral");

  // Keep livePrice in sync when the user changes selected asset manually
  useEffect(() => {
    setLivePrice(currentAsset.price);
  }, [selectedAssetSymbol]);

  // Handle Dynamic price tick interval
  useEffect(() => {
    const handleTick = setInterval(() => {
      // Small random swing e.g. -0.15% to +0.20%
      const percentageChange = (Math.random() - 0.42) * 0.0012; // slightly biased upwards
      const delta = livePrice * percentageChange;
      const newPrice = livePrice + delta;

      setLivePrice(newPrice);
      setPriceFlashColor(delta > 0 ? "green" : "red");

      // Flash highlight color cleanup
      const timeout = setTimeout(() => {
        setPriceFlashColor("neutral");
      }, 600);

      // Mutate historical trade simulations
      const randomAmount = +(Math.random() * (selectedAssetSymbol.startsWith("BTC") ? 0.8 : 45)).toFixed(4);
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const newMTrade: TradeItem = {
        id: Math.random().toString(),
        price: +newPrice.toFixed(2),
        amount: randomAmount,
        time: timeStr,
        type: delta > 0 ? "buy" : "sell"
      };

      setRecentTrades((prev) => [newMTrade, ...prev.slice(0, 7)]);

      // Mutates Bids and Asks matching the tick color to fluctuate spreads
      setAsks((prev) => 
        prev.map((ask, i) => {
          const spreadFactor = 1 + (Math.random() - 0.5) * 0.0003;
          const priceOffset = newPrice + (i + 1) * (newPrice * 0.00015) * spreadFactor;
          const freshAmount = +(ask.amount * (1 + (Math.random() - 0.5) * 0.1)).toFixed(4);
          return {
            price: +priceOffset.toFixed(2),
            amount: freshAmount,
            total: `${(priceOffset * freshAmount / 1000).toFixed(1)}k`,
            barPercent: Math.min(100, Math.floor(freshAmount * (selectedAssetSymbol.startsWith("BTC") ? 50 : 2)))
          };
        })
      );

      setBids((prev) => 
        prev.map((bid, i) => {
          const spreadFactor = 1 + (Math.random() - 0.5) * 0.0003;
          const priceOffset = newPrice - (i + 1) * (newPrice * 0.0001) * spreadFactor;
          const freshAmount = +(bid.amount * (1 + (Math.random() - 0.5) * 0.1)).toFixed(4);
          return {
            price: +priceOffset.toFixed(2),
            amount: freshAmount,
            total: `${(priceOffset * freshAmount / 1000).toFixed(1)}k`,
            barPercent: Math.min(100, Math.floor(freshAmount * (selectedAssetSymbol.startsWith("BTC") ? 50 : 2)))
          };
        })
      );

      return () => {
        clearTimeout(timeout);
      };
    }, 2800);

    return () => {
      clearInterval(handleTick);
    };
  }, [livePrice, selectedAssetSymbol]);

  // Order Book Mock State Lists
  const [asks, setAsks] = useState<OrderBookItem[]>([
    { price: 64292.10, amount: 0.4281, total: "27.5k", barPercent: 15 },
    { price: 64291.50, amount: 1.8290, total: "117.6k", barPercent: 65 },
    { price: 64290.00, amount: 0.9122, total: "58.6k", barPercent: 32 }
  ]);

  const [bids, setBids] = useState<OrderBookItem[]>([
    { price: 64278.30, amount: 1.2844, total: "82.5k", barPercent: 45 },
    { price: 64275.00, amount: 2.4101, total: "154.9k", barPercent: 82 },
    { price: 64272.15, amount: 0.5502, total: "35.4k", barPercent: 25 }
  ]);

  // Recent Trades lists
  const [recentTrades, setRecentTrades] = useState<TradeItem[]>([
    { id: "t1", price: 64281.42, amount: 0.0528, time: "12:04:15", type: "buy" },
    { id: "t2", price: 64281.42, amount: 1.2000, time: "12:04:14", type: "buy" },
    { id: "t3", price: 64280.95, amount: 0.0031, time: "12:04:12", type: "sell" },
    { id: "t4", price: 64280.90, amount: 0.4500, time: "12:04:09", type: "sell" },
    { id: "t5", price: 64281.10, amount: 0.1293, time: "12:04:05", type: "buy" },
    { id: "t6", price: 64281.00, amount: 0.0244, time: "12:04:02", type: "buy" }
  ]);

  // Technical Indicators setup maps
  const activeIndicators: TechnicalIndicatorSet = INDICATORS_DATA[currentAsset.symbol] || {
    rsiValue: 50.0,
    rsiStatus: "Neutral",
    macdValue: "Null",
    macdStatus: "None",
    emaCross: "Overhead",
    emaStatus: "Neutral"
  };

  const handleToggleIndicator = (indicator: string) => {
    if (indicators.includes(indicator)) {
      setIndicators(indicators.filter((ind) => ind !== indicator));
    } else {
      setIndicators([...indicators, indicator]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Asset Configuration and Tick bar */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Dynamic selector to let users choose assets */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedAssetSymbol}
                onChange={(e) => onSelectAsset(e.target.value)}
                className="text-xl font-bold font-sans bg-transparent border-none focus:ring-0 cursor-pointer pr-1 py-0 pl-0 text-on-surface"
              >
                {assets.map((asset) => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.symbol}
                  </option>
                ))}
              </select>
              <span className="px-2 py-0.5 bg-emerald-50 text-secondary border border-emerald-100 text-[10px] font-semibold rounded uppercase tracking-wider select-none">
                SPOT
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-sans">
              Horizon Multi-Agent Automation Market · {currentAsset.name}
            </p>
          </div>
        </div>

        {/* Dynamic numerical stats aligned horizontally */}
        <div className="flex flex-wrap items-center gap-8 md:gap-12 w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Price
            </span>
            <span className={`text-xl font-bold font-mono transition-colors duration-300 ${
              priceFlashColor === "green" 
                ? "text-secondary font-black" 
                : priceFlashColor === "red" 
                ? "text-rose-500 font-black" 
                : "text-on-surface"
            }`}>
              {livePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              24h Change
            </span>
            <span className={`text-xl font-bold font-mono flex items-center gap-1 ${
              currentAsset.change24h >= 0 ? "text-secondary" : "text-rose-500"
            }`}>
              {currentAsset.change24h >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {currentAsset.change24h >= 0 ? "+" : ""}
              {currentAsset.change24h}%
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              AI Sentiment Overlay
            </span>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="text-sm font-bold text-primary font-sans">
                {currentAsset.aiSentiment}
              </span>
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${currentAsset.sentimentScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 2. Main Content Bento grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Candlestick Chart and Tech indicators (8 columns on large screen) */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          <div className="glass-card rounded-2xl overflow-hidden min-h-[580px] flex flex-col relative group">
            
            {/* Chart Toolbar / Controls */}
            <div className="px-6 py-4 flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 select-none bg-white/40">
              <div className="flex items-center gap-1 bg-slate-100/60 p-0.5 rounded-lg border border-slate-100">
                {(["1m", "15m", "1h", "4h", "1d"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      timeframe === tf
                        ? "bg-white text-primary shadow-sm font-bold scale-[1.02]"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Toggle indicators overlay dropdown */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    Indicators ({indicators.length})
                  </button>
                  
                  {/* Absolute menu selection */}
                  {showIndicatorMenu && (
                    <div className="absolute left-0 mt-2 w-40 glass-card rounded-xl p-2 z-30 shadow-xl border border-slate-100 text-xs">
                      <p className="font-bold text-slate-400 p-1 select-none">Technical Overlays</p>
                      <label className="flex items-center gap-2 p-1.5 hover:bg-slate-100/50 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={indicators.includes("MA")} 
                          onChange={() => handleToggleIndicator("MA")}
                          className="rounded text-primary focus:ring-primary/20"
                        />
                        <span>DMA Lines</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 hover:bg-slate-100/50 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={indicators.includes("RSI")} 
                          onChange={() => handleToggleIndicator("RSI")}
                          className="rounded text-primary focus:ring-primary/20"
                        />
                        <span>RSI Envelopes</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 hover:bg-slate-100/50 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={indicators.includes("EMA")} 
                          onChange={() => handleToggleIndicator("EMA")}
                          className="rounded text-primary focus:ring-primary/20"
                        />
                        <span>EMA Support Zone</span>
                      </label>
                    </div>
                  )}
                </div>

                <span className="hidden md:flex items-center gap-1.5 text-xs text-primary font-semibold select-none">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  AI Strategy: Trend Following
                </span>

                <button className="text-slate-400 hover:text-slate-700">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulated interactive High Fidelity Candlestick visual grid */}
            <div className="flex-1 relative bg-white overflow-hidden p-8 h-96 flex flex-col justify-end">
              
              {/* Radial dynamic background grid point markers */}
              <div className="absolute inset-0 opacity-15 pointer-events-none select-none">
                <div 
                  className="w-full h-full" 
                  style={{ 
                    backgroundImage: "radial-gradient(#0058be 1.2px, transparent 1.2px)", 
                    backgroundSize: "40px 40px" 
                  }}
                />
              </div>

              {/* Candles container layout representation */}
              <div className="relative w-full h-[320px] flex items-end gap-3 pb-8 select-none">
                
                {/* Simulated candlesticks reflecting the asset direction */}
                {/* 1 */}
                <div className="flex-1 flex flex-col items-center justify-end group/candle mt-10">
                  <div className="w-0.5 h-12 bg-secondary/35" />
                  <div className="w-full max-w-[24px] h-24 bg-secondary/90 hover:bg-secondary rounded-sm transition-transform cursor-pointer shadow-md select-none" />
                  <div className="w-0.5 h-8 bg-secondary/35" />
                </div>

                {/* 2 */}
                <div className="flex-1 flex flex-col items-center justify-end">
                  <div className="w-0.5 h-16 bg-rose-450 opacity-40 bg-rose-400" />
                  <div className="w-full max-w-[24px] h-16 bg-rose-600/90 hover:bg-rose-500 rounded-sm cursor-pointer shadow-sm" />
                  <div className="w-0.5 h-12 bg-rose-400" />
                </div>

                {/* 3 AI BUY ZONE highlight */}
                <div className="flex-1 flex flex-col items-center justify-end relative">
                  <div className="absolute -inset-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl z-0 status-pulse" />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-secondary text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase select-none z-10">
                    AI BUY ZONE
                  </div>
                  <div className="w-0.5 h-8 bg-secondary/40 z-10" />
                  <div className="w-full max-w-[24px] h-44 bg-secondary hover:scale-x-105 duration-150 rounded-sm cursor-pointer shadow-lg z-10 relative" />
                  <div className="w-0.5 h-10 bg-secondary/35 z-10" />
                </div>

                {/* 4 */}
                <div className="flex-1 flex flex-col items-center justify-end">
                  <div className="w-0.5 h-20 bg-secondary/35" />
                  <div className="w-full max-w-[24px] h-36 bg-secondary/90 hover:bg-secondary rounded-sm cursor-pointer shadow-md" />
                  <div className="w-0.5 h-12 bg-secondary/35" />
                </div>

                {/* 5 */}
                <div className="flex-1 flex flex-col items-center justify-end">
                  <div className="w-0.5 h-32 bg-rose-400" />
                  <div className="w-full max-w-[24px] h-10 bg-rose-600/90 hover:bg-rose-500 rounded-sm cursor-pointer shadow-sm" />
                  <div className="w-0.5 h-24 bg-rose-400" />
                </div>

                {/* 6 */}
                <div className="flex-1 flex flex-col items-center justify-end">
                  <div className="w-0.5 h-12 bg-secondary/35" />
                  <div className="w-full max-w-[24px] h-28 bg-secondary/90 hover:bg-secondary rounded-sm cursor-pointer shadow-md" />
                  <div className="w-0.5 h-16 bg-secondary/35" />
                </div>

                {/* 7 AI SELL ZONE highlights */}
                <div className="flex-1 flex flex-col items-center justify-end relative">
                  <div className="absolute -inset-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl z-0" />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase select-none z-10">
                    AI SELL SIGNAL
                  </div>
                  <div className="w-0.5 h-16 bg-rose-400 z-10" />
                  <div className="w-full max-w-[24px] h-48 bg-rose-600 hover:scale-x-105 duration-150 rounded-sm cursor-pointer shadow-lg z-10" />
                  <div className="w-0.5 h-8 bg-rose-400 z-10" />
                </div>
              </div>

              {/* Float Cursor Info Panel overlay */}
              <div className="absolute top-1/2 right-24 transform -translate-y-1/2 glass-card rounded-xl p-3.5 border-primary/20 pointer-events-none select-none select-all">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">
                  Cursor Info
                </p>
                <p className="font-mono text-sm font-bold text-primary">
                  {livePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT
                </p>
                <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                  Vol: {currentAsset.volume24h} BTC
                </p>
              </div>

              {/* Dynamic volume bars at chart foot */}
              <div className="absolute bottom-4 left-6 right-6 h-10 flex items-end gap-1 opacity-15 pointer-events-none select-none">
                <div className="flex-1 bg-primary rounded-t-sm" style={{ height: "45%" }} />
                <div className="flex-1 bg-primary rounded-t-sm" style={{ height: "65%" }} />
                <div className="flex-1 bg-primary rounded-t-sm" style={{ height: "85%" }} />
                <div className="flex-1 bg-primary rounded-t-sm" style={{ height: "55%" }} />
                <div className="flex-1 bg-primary rounded-t-sm" style={{ height: "35%" }} />
                <div className="flex-1 bg-primary rounded-t-sm" style={{ height: "92%" }} />
                <div className="flex-1 bg-primary rounded-t-sm" style={{ height: "72%" }} />
              </div>

            </div>

            {/* AI Technical Analysis Insight splits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-t border-slate-100 bg-slate-50/50">
              
              {/* Technical breakdown indicator indexes */}
              <div className="glass-card rounded-xl p-4.5 bg-white">
                <div className="flex items-center gap-2 mb-3.5">
                  <Sliders className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    AI Technical Analysis
                  </h3>
                </div>
                <div className="space-y-3 test-info text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-on-surface-variant">RSI (14)</span>
                    <span className="font-bold text-on-surface">
                      {activeIndicators.rsiValue} <span className="text-secondary">({activeIndicators.rsiStatus})</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-on-surface-variant">MACD Histogram</span>
                    <span className="font-bold text-secondary">{activeIndicators.macdStatus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">EMA 200 Cross</span>
                    <span className="font-bold text-primary">{activeIndicators.emaStatus}</span>
                  </div>
                </div>
              </div>

              {/* Social Sentiment indexes */}
              <div className="glass-card rounded-xl p-4.5 bg-white">
                <div className="flex items-center gap-2 mb-3.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Social Sentiment
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-bold text-primary">{currentAsset.aiSentiment}</p>
                      <p className="text-[10px] text-on-surface-variant">Based on L2 media feed filters</p>
                    </div>
                    <span className="text-sm font-bold font-mono text-primary">
                      {currentAsset.sentimentScore}/100
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${currentAsset.sentimentScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">
                    <span>Fear</span>
                    <span>Greed</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Right Side: Order Book & Recent Trades (4 columns on large screen) */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          
          {/* Order Book Panel */}
          <div className="glass-card rounded-2xl flex flex-col h-[520px] justify-between">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Order Book
              </h3>
              <div className="flex gap-1.5 text-slate-400">
                <button className="p-1 hover:bg-slate-100 rounded text-secondary hover:text-secondary-600 transition-colors">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-slate-100 rounded text-rose-500 hover:text-rose-600 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Asks (Sell Orders - descending grid) */}
            <div className="flex-1 flex flex-col-reverse px-4 py-2 overflow-hidden bg-rose-50/5">
              <div className="grid grid-cols-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 select-none">
                <span>Price (USDT)</span>
                <span className="text-right">Amount</span>
                <span className="text-right font-semibold">Total</span>
              </div>
              <div className="space-y-1 overflow-y-auto pr-1">
                {asks.map((ask, i) => (
                  <div 
                    key={i} 
                    className="grid grid-cols-3 py-1 text-xs relative group cursor-pointer hover:bg-rose-50/20 transition-all font-mono"
                  >
                    <div 
                      className="absolute inset-y-0 right-0 bg-rose-500/5 transition-all z-0" 
                      style={{ width: `${ask.barPercent}%` }}
                    />
                    <span className="text-rose-600 font-bold z-10">{ask.price.toLocaleString()}</span>
                    <span className="text-right text-on-surface z-10">{ask.amount}</span>
                    <span className="text-right text-on-surface-variant z-10">{ask.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mid Market Price Divider */}
            <div className="px-5 py-3.5 bg-slate-50 border-y border-slate-100 flex items-center justify-between">
              <span className={`text-lg font-black font-mono tracking-tight flex items-center gap-1 ${
                priceFlashColor === "green" ? "text-secondary" : priceFlashColor === "red" ? "text-rose-500" : "text-secondary"
              }`}>
                {livePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                <ChevronUp className="w-4 h-4 status-pulse align-middle" />
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono">
                Last Price: ${currentAsset.price.toLocaleString()}
              </span>
            </div>

            {/* Bids (Buy Orders - ascending grid) */}
            <div className="flex-1 flex flex-col px-4 py-2 overflow-hidden bg-emerald-50/5">
              <div className="space-y-1 overflow-y-auto pr-1">
                {bids.map((bid, i) => (
                  <div 
                    key={i} 
                    className="grid grid-cols-3 py-1 text-xs relative group cursor-pointer hover:bg-emerald-50/20 transition-all font-mono"
                  >
                    <div 
                      className="absolute inset-y-0 right-0 bg-secondary/5 transition-all z-0" 
                      style={{ width: `${bid.barPercent}%` }}
                    />
                    <span className="text-secondary font-bold z-10">{bid.price.toLocaleString()}</span>
                    <span className="text-right text-on-surface z-10">{bid.amount}</span>
                    <span className="text-right text-on-surface-variant z-10">{bid.total}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Recent Trades dynamic list append */}
          <div className="glass-card rounded-2xl flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Recent Trades
              </h3>
            </div>
            
            <div className="flex-1 px-4 py-3 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Time</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {recentTrades.map((trade) => (
                  <div 
                    key={trade.id} 
                    className="grid grid-cols-3 items-center hover:bg-slate-50 transition-colors py-0.5 rounded px-1"
                  >
                    <span className={`font-bold ${trade.type === "buy" ? "text-secondary" : "text-rose-500"}`}>
                      {trade.price.toLocaleString()}
                    </span>
                    <span className="text-right text-on-surface">{trade.amount}</span>
                    <span className="text-right text-on-surface-variant opacity-70">{trade.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Footer News Signals */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {newsFlashes.map((item) => {
          return (
            <div 
              key={item.id}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:border-primary/30 transition-all duration-350 cursor-pointer group"
            >
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mb-3.5 inline-block ${
                  item.color === "primary"
                    ? "bg-primary/10 text-primary border border-primary/15"
                    : item.color === "tertiary"
                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                    : "bg-emerald-50 text-secondary border border-emerald-100"
                }`}>
                  {item.category}
                </span>
                <h4 className="text-sm font-bold text-on-surface mb-2 group-hover:text-primary transition-colors cursor-all-scroll leading-snug">
                  {item.title}
                </h4>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 bg-transparent text-slate-400" />
                {item.time} &middot; <span className="text-primary font-bold">{item.sentiment}</span>
              </p>
            </div>
          );
        })}
      </section>

    </div>
  );
}
