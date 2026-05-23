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
  const currentAsset = assets.find((a) => a.symbol === selectedAssetSymbol) || assets[0] || {
    symbol: selectedAssetSymbol || "AAPL",
    name: "Loading Stock Data...",
    category: "Spot",
    price: 0.0,
    change24h: 0.0,
    aiSentiment: "Neutral",
    sentimentScore: 50,
    volume24h: "0",
    activeBots: 0,
    totalProfit: "$0",
    dailyYield: 0.0,
    icon: "trending_up"
  };
  
  // Interactive Timeframe
  const [timeframe, setTimeframe] = useState<"1m" | "15m" | "1h" | "4h" | "1d">("4h");
  
  // Custom indicators activated tags
  const [indicators, setIndicators] = useState<string[]>(["MA", "RSI"]);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

  // Live Price feed state (fluctuates dynamically)
  const [livePrice, setLivePrice] = useState(currentAsset.price);
  const [priceFlashColor, setPriceFlashColor] = useState<"green" | "red" | "neutral">("neutral");

  // Historical data states
  const [stockDetails, setStockDetails] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<any>(null);
  
  // Order desk states
  const [tradeQty, setTradeQty] = useState(10);
  const [isOrdering, setIsOrdering] = useState(false);

  // Keep livePrice in sync when the user changes selected asset manually or when asset prices update
  useEffect(() => {
    if (currentAsset) {
      setLivePrice(currentAsset.price);
    }
  }, [selectedAssetSymbol, currentAsset]);

  useEffect(() => {
    const fetchStockDetails = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`/api/stock/${selectedAssetSymbol}`);
        if (res.ok) {
          const data = await res.json();
          setStockDetails(data);
        }
      } catch (err) {
        console.error("Error fetching stock history details:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchStockDetails();
  }, [selectedAssetSymbol]);

  const handleInitiateBuy = async () => {
    if (!stockDetails) return;
    setIsOrdering(true);
    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: selectedAssetSymbol,
          name: stockDetails.name,
          qty: tradeQty,
          price: livePrice,
          side: "BUY",
          initial_stop: stockDetails.initial_stop,
          trailing_stop: stockDetails.atr_trailing_stop,
          target_price: stockDetails.target_price
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Automated buy order successfully executed for ${selectedAssetSymbol}!`);
      } else {
        alert(data.detail || data.message || "Failed to execute order.");
      }
    } catch (err) {
      console.error("Error executing buy order:", err);
      alert("Error executing buy order. Check connection to FastAPI backend.");
    } finally {
      setIsOrdering(false);
    }
  };

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

  const lastCandle = stockDetails?.history && stockDetails.history.length > 0
    ? stockDetails.history[stockDetails.history.length - 1]
    : null;

  const vols = stockDetails?.history?.map((d: any) => d.volume || 0) || [];
  const maxVol = Math.max(...vols) || 1;

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
              {livePrice ? livePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
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
            <div className="flex-1 relative bg-white overflow-hidden p-4 h-96 flex flex-col justify-between">
              
              {/* Radial dynamic background grid point markers */}
              <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
                <div 
                  className="w-full h-full" 
                  style={{ 
                    backgroundImage: "radial-gradient(#0058be 1.2px, transparent 1.2px)", 
                    backgroundSize: "40px 40px" 
                  }}
                />
              </div>

              {isLoadingHistory ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-bold text-on-surface-variant">Loading real-time yfinance histories...</span>
                  </div>
                </div>
              ) : null}

              {/* Hovered / Real-time data panel */}
              <div className="flex justify-between items-center text-xs font-mono p-2 border-b border-slate-100 bg-slate-50/50 rounded-xl relative z-10">
                <div className="flex gap-4">
                  <span className="text-slate-400">DATE: <strong className="text-on-surface">{hoveredCandle ? hoveredCandle.date : (lastCandle?.date || "N/A")}</strong></span>
                  <span className="text-slate-400">O: <strong className="text-on-surface">${hoveredCandle ? hoveredCandle.open.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) : (lastCandle?.open?.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) || "0.00")}</strong></span>
                  <span className="text-slate-400">H: <strong className="text-emerald-500">${hoveredCandle ? hoveredCandle.high.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) : (lastCandle?.high?.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) || "0.00")}</strong></span>
                  <span className="text-slate-400">L: <strong className="text-rose-500">${hoveredCandle ? hoveredCandle.low.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) : (lastCandle?.low?.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) || "0.00")}</strong></span>
                  <span className="text-slate-400">C: <strong className="text-on-surface">${hoveredCandle ? hoveredCandle.close.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) : (lastCandle?.close?.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) || "0.00")}</strong></span>
                </div>
                {indicators.includes("MA") && (
                  <span className="text-blue-500 font-bold hidden sm:inline">SMA50: ${hoveredCandle ? hoveredCandle.sma50?.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) : (lastCandle?.sma50?.toFixed(selectedAssetSymbol.endsWith("=X") ? 5 : 2) || "0.00")}</span>
                )}
              </div>

              {/* Dynamic SVG chart drawing candles and 50 EMA Zone */}
              <div className="relative w-full h-[260px] select-none mt-2">
                {stockDetails?.history && stockDetails.history.length > 0 ? (
                  (() => {
                    const isFx = selectedAssetSymbol.endsWith("=X");
                    const hist = stockDetails.history;
                    const prices = hist.map((d: any) => [d.open, d.high, d.low, d.close]).flat();
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    const priceRange = maxPrice - minPrice || 1.0;
                    const yMin = minPrice - priceRange * 0.05;
                    const yMax = maxPrice + priceRange * 0.05;
                    const yRange = yMax - yMin;

                    const chartWidth = 780;
                    const chartHeight = 220;

                    const mapY = (price: number) => chartHeight - ((price - yMin) / yRange) * (chartHeight - 30) - 15;
                    const candleWidth = chartWidth / hist.length;

                    // Compute points for SMA50
                    const smaPoints = hist
                      .map((day: any, i: number) => {
                        if (day.sma50 === null || day.sma50 === undefined) return null;
                        const x = i * candleWidth + candleWidth / 2;
                        const y = mapY(day.sma50);
                        return `${x},${y}`;
                      })
                      .filter((p: any) => p !== null)
                      .join(" ");

                    return (
                      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                        {/* SMA line overlay */}
                        {indicators.includes("MA") && smaPoints && (
                          <polyline
                            points={smaPoints}
                            fill="none"
                            stroke="#0058be"
                            strokeWidth="2.5"
                            strokeDasharray="4 3"
                            className="drop-shadow-[0_2px_4px_rgba(0,88,190,0.3)]"
                          />
                        )}

                        {/* Candlesticks loop */}
                        {hist.map((day: any, i: number) => {
                          const x = i * candleWidth;
                          const yOpen = mapY(day.open);
                          const yClose = mapY(day.close);
                          const yHigh = mapY(day.high);
                          const yLow = mapY(day.low);

                          const isBullish = day.close >= day.open;
                          const candleColor = isBullish ? "#00c285" : "#ff4d6d";

                          return (
                            <g 
                              key={i} 
                              className="cursor-crosshair"
                              onMouseEnter={() => setHoveredCandle(day)}
                              onMouseLeave={() => setHoveredCandle(null)}
                            >
                              {/* Wick line */}
                              <line
                                x1={x + (candleWidth - 2) / 2}
                                y1={yHigh}
                                x2={x + (candleWidth - 2) / 2}
                                y2={yLow}
                                stroke={candleColor}
                                strokeWidth="1.5"
                              />
                              {/* Body rect */}
                              <rect
                                x={x}
                                y={Math.min(yOpen, yClose)}
                                width={Math.max(2, candleWidth - 3)}
                                height={Math.max(1.5, Math.abs(yOpen - yClose))}
                                fill={candleColor}
                                stroke={candleColor}
                                strokeWidth="0.5"
                                rx="1.5"
                                className="transition-all hover:brightness-110"
                              />
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs text-slate-400">Failed to render candles layout.</span>
                  </div>
                )}
              </div>

              {/* Dynamic volume bars at chart foot */}
              <div className="absolute bottom-2 left-4 right-4 h-8 flex items-end gap-[2px] opacity-10 pointer-events-none select-none">
                {stockDetails?.history?.map((day: any, idx: number) => {
                  const isBullish = day.close >= day.open;
                  const heightPct = Math.max(10, Math.round((day.volume / maxVol) * 100));
                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 rounded-t-sm ${isBullish ? "bg-secondary" : "bg-rose-500"}`} 
                      style={{ height: `${heightPct}%` }} 
                    />
                  );
                })}
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
                {livePrice ? livePrice.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                <ChevronUp className="w-4 h-4 status-pulse align-middle" />
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono">
                Last Price: ${currentAsset.price ? currentAsset.price.toLocaleString() : "0.00"}
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

          {/* Automated Node Execution Order Desk */}
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-white/70 border-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Automated Node Execution
                </h3>
                <p className="text-[10px] text-on-surface-variant">Setup targets & initiate broker trade</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Ticker / Price preview */}
              <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100 font-mono text-xs">
                <div>
                  <span className="text-slate-400">TICKER</span>
                  <span className="font-bold block text-on-surface">{selectedAssetSymbol}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">ENTRY PRICE</span>
                  <span className="font-bold block text-primary">${livePrice.toLocaleString("en-US", { minimumFractionDigits: selectedAssetSymbol.endsWith("=X") ? 5 : 2 })}</span>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5 pl-1">
                  Quantity
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    min="1"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full text-sm border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl px-3 py-2.5 bg-white font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">UNITS</span>
                </div>
              </div>

              {/* Stops & Targets info panel */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Initial Stop Loss:
                  </span>
                  <span className="font-bold text-rose-600">
                    ${stockDetails ? (stockDetails.initial_stop * tradeQty).toLocaleString("en-US", { minimumFractionDigits: selectedAssetSymbol.endsWith("=X") ? 5 : 2 }) : "0.00"}
                    <span className="text-[10px] text-slate-400 ml-1 font-medium">(${stockDetails ? stockDetails.initial_stop : "0.00"}/unit)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    Trailing Stop Loss (ATR):
                  </span>
                  <span className="font-bold text-amber-500">
                    ${stockDetails ? (stockDetails.atr_trailing_stop * tradeQty).toLocaleString("en-US", { minimumFractionDigits: selectedAssetSymbol.endsWith("=X") ? 5 : 2 }) : "0.00"}
                    <span className="text-[10px] text-slate-400 ml-1 font-medium">(${stockDetails ? stockDetails.atr_trailing_stop : "0.00"}/unit)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Target Sell Price (1:2 R:R):
                  </span>
                  <span className="font-bold text-emerald-600">
                    ${stockDetails ? (stockDetails.target_price * tradeQty).toLocaleString("en-US", { minimumFractionDigits: selectedAssetSymbol.endsWith("=X") ? 5 : 2 }) : "0.00"}
                    <span className="text-[10px] text-slate-400 ml-1 font-medium">(${stockDetails ? stockDetails.target_price : "0.00"}/unit)</span>
                  </span>
                </div>
              </div>

              {/* Initiate Order dispatcher */}
              <button 
                onClick={handleInitiateBuy}
                disabled={isOrdering || isLoadingHistory}
                className={`w-full py-3 bg-primary hover:bg-opacity-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/20 ${isOrdering ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {isOrdering ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                <span>INITIATE AUTOMATED BUY NODE</span>
              </button>
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
