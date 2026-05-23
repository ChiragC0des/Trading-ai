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

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
}

const generateInitialCandles = (basePrice: number, timeframe: string): CandleData[] => {
  const result: CandleData[] = [];
  let currentPrice = basePrice * 0.96; // start slightly lower for a beautiful trend up
  const count = 16;
  const now = Date.now();
  
  // Set timeframe interval in ms
  let intervalMs = 60000; // 1m
  if (timeframe === "15m") intervalMs = 15 * 60000;
  else if (timeframe === "1h") intervalMs = 60 * 60000;
  else if (timeframe === "4h") intervalMs = 4 * 60 * 60000;
  else if (timeframe === "1d") intervalMs = 24 * 60 * 60000;

  for (let i = 0; i < count; i++) {
    const timeVal = new Date(now - (count - i) * intervalMs);
    let timeStr = "";
    if (timeframe === "1d") {
      timeStr = timeVal.toLocaleDateString([], { month: "short", day: "numeric" });
    } else if (timeframe === "4h") {
      timeStr = timeVal.toLocaleDateString([], { month: "numeric", day: "numeric" }) + " " + timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      timeStr = timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Create realistic random walk steps
    const changePercent = (Math.random() - 0.44) * (basePrice < 5 ? 0.003 : 0.016); // narrower ranges for fx ratios
    const openValue = currentPrice;
    const closeValue = currentPrice * (1 + changePercent);
    const highValue = Math.max(openValue, closeValue) * (1 + Math.random() * (basePrice < 5 ? 0.001 : 0.006));
    const lowValue = Math.min(openValue, closeValue) * (1 - Math.random() * (basePrice < 5 ? 0.001 : 0.006));
    
    result.push({
      open: parseFloat(openValue.toFixed(basePrice < 10 ? 5 : 2)),
      high: parseFloat(highValue.toFixed(basePrice < 10 ? 5 : 2)),
      low: parseFloat(lowValue.toFixed(basePrice < 10 ? 5 : 2)),
      close: parseFloat(closeValue.toFixed(basePrice < 10 ? 5 : 2)),
      time: timeStr
    });
    
    currentPrice = closeValue;
  }
  
  // Align closing price of the very last candle to current basePrice exactly
  const last = result[result.length - 1];
  last.close = basePrice;
  last.high = parseFloat((Math.max(last.open, basePrice) * (basePrice < 5 ? 1.0005 : 1.003)).toFixed(basePrice < 10 ? 5 : 2));
  last.low = parseFloat((Math.min(last.open, basePrice) * (basePrice < 5 ? 0.9995 : 0.997)).toFixed(basePrice < 10 ? 5 : 2));
  
  return result;
};

const splinePath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return "";
  return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
};

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

  // Live Candlestick series
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const tickCountRef = useRef(0);

  // Re-generate candles on timeframe or asset updates
  useEffect(() => {
    const initialCandles = generateInitialCandles(currentAsset.price, timeframe);
    setCandles(initialCandles);
    tickCountRef.current = 0;
  }, [selectedAssetSymbol, timeframe]);

  // Keep live candle in absolute sync when livePrice ticks
  useEffect(() => {
    if (candles.length === 0) return;

    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const nextCandles = [...prev];
      const lastIdx = nextCandles.length - 1;
      const lastCandle = { ...nextCandles[lastIdx] };

      lastCandle.close = parseFloat(livePrice.toFixed(currentAsset.price < 10 ? 5 : 2));
      if (livePrice > lastCandle.high) {
        lastCandle.high = parseFloat(livePrice.toFixed(currentAsset.price < 10 ? 5 : 2));
      }
      if (livePrice < lastCandle.low) {
        lastCandle.low = parseFloat(livePrice.toFixed(currentAsset.price < 10 ? 5 : 2));
      }

      nextCandles[lastIdx] = lastCandle;
      return nextCandles;
    });

    // Cycle update to roll to next candle block after 6 ticks (ticks happen every 2.8 seconds, so ~17 seconds per candle)
    tickCountRef.current += 1;
    if (tickCountRef.current >= 6) {
      tickCountRef.current = 0;
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const now = new Date();
        let timeStr = "";
        if (timeframe === "1d") {
          timeStr = now.toLocaleDateString([], { month: "short", day: "numeric" });
        } else if (timeframe === "4h") {
          timeStr = now.toLocaleDateString([], { month: "numeric", day: "numeric" }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
          timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        const nextOpen = prev[prev.length - 1].close;
        const newCandle: CandleData = {
          open: nextOpen,
          high: nextOpen,
          low: nextOpen,
          close: nextOpen,
          time: timeStr
        };

        const next = [...prev.slice(1), newCandle];
        return next;
      });
    }
  }, [livePrice]);

  // Keep livePrice in sync when the user changes selected asset manually or market price updates
  const livePriceRef = useRef(livePrice);
  useEffect(() => {
    livePriceRef.current = livePrice;
  }, [livePrice]);

  useEffect(() => {
    setLivePrice(currentAsset.price);

    // Initialize bids, asks, and recent trades scaled dynamically around currentAsset's actual price
    const base = currentAsset.price;
    const isFx = currentAsset.symbol.includes("=X") || currentAsset.price < 5;
    const offset1 = isFx ? 0.0001 : 0.0005 * base;
    const offset2 = isFx ? 0.0002 : 0.001 * base;
    const offset3 = isFx ? 0.0003 : 0.0015 * base;

    setAsks([
      { price: parseFloat((base + offset3).toFixed(isFx ? 5 : 2)), amount: isFx ? 50000 : 0.8, total: `${((base + offset3) * (isFx ? 50000 : 0.8) / 1000).toFixed(1)}k`, barPercent: 32 },
      { price: parseFloat((base + offset2).toFixed(isFx ? 5 : 2)), amount: isFx ? 120000 : 1.8, total: `${((base + offset2) * (isFx ? 120000 : 1.8) / 1000).toFixed(1)}k`, barPercent: 65 },
      { price: parseFloat((base + offset1).toFixed(isFx ? 5 : 2)), amount: isFx ? 40000 : 0.4, total: `${((base + offset1) * (isFx ? 40000 : 0.4) / 1000).toFixed(1)}k`, barPercent: 15 }
    ]);

    setBids([
      { price: parseFloat((base - offset1).toFixed(isFx ? 5 : 2)), amount: isFx ? 85000 : 1.2, total: `${((base - offset1) * (isFx ? 85000 : 1.2) / 1000).toFixed(1)}k`, barPercent: 45 },
      { price: parseFloat((base - offset2).toFixed(isFx ? 5 : 2)), amount: isFx ? 160000 : 2.4, total: `${((base - offset2) * (isFx ? 160000 : 2.4) / 1000).toFixed(1)}k`, barPercent: 82 },
      { price: parseFloat((base - offset3).toFixed(isFx ? 5 : 2)), amount: isFx ? 35000 : 0.5, total: `${((base - offset3) * (isFx ? 35000 : 0.5) / 1000).toFixed(1)}k`, barPercent: 25 }
    ]);

    const staticTradeTimes = ["12:04:15", "12:04:14", "12:04:12", "12:04:09", "12:04:05", "12:04:02"];
    setRecentTrades(staticTradeTimes.map((time, idx) => {
      const wiggle = (Math.random() - 0.5) * (isFx ? 0.0002 : 0.001 * base);
      return {
        id: `it-${idx}-${Date.now()}`,
        price: parseFloat((base + wiggle).toFixed(isFx ? 5 : 2)),
        amount: isFx ? Math.floor(20000 + Math.random() * 80000) : parseFloat((0.01 + Math.random() * 1.5).toFixed(4)),
        time,
        type: Math.random() > 0.4 ? "buy" : "sell"
      };
    }));
  }, [selectedAssetSymbol, currentAsset.price]);

  // Handle Dynamic price tick interval
  useEffect(() => {
    const handleTick = setInterval(() => {
      const activePriceVal = livePriceRef.current;
      const isFx = selectedAssetSymbol.includes("=X") || activePriceVal < 5;
      
      // Small random swing e.g. -0.15% to +0.20%
      const percentageChange = (Math.random() - 0.44) * (isFx ? 0.00015 : 0.00075);
      const delta = activePriceVal * percentageChange;
      const newPrice = activePriceVal + delta;

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
        price: +newPrice.toFixed(isFx ? 5 : 2),
        amount: randomAmount,
        time: timeStr,
        type: delta > 0 ? "buy" : "sell"
      };

      setRecentTrades((prev) => [newMTrade, ...prev.slice(0, 7)]);

      // Mutates Bids and Asks matching the tick color to fluctuate spreads
      setAsks((prev) => 
        prev.map((ask, i) => {
          const spreadFactor = 1 + (Math.random() - 0.5) * 0.0003;
          const priceOffset = newPrice + (i + 1) * (newPrice * (isFx ? 0.00005 : 0.00015)) * spreadFactor;
          const freshAmount = +(ask.amount * (1 + (Math.random() - 0.5) * 0.1)).toFixed(4);
          return {
            price: +priceOffset.toFixed(isFx ? 5 : 2),
            amount: freshAmount,
            total: `${(priceOffset * freshAmount / 1000).toFixed(1)}k`,
            barPercent: Math.min(100, Math.floor(freshAmount * (selectedAssetSymbol.startsWith("BTC") ? 50 : 2)))
          };
        })
      );

      setBids((prev) => 
        prev.map((bid, i) => {
          const spreadFactor = 1 + (Math.random() - 0.5) * 0.0003;
          const priceOffset = newPrice - (i + 1) * (newPrice * (isFx ? 0.00004 : 0.0001)) * spreadFactor;
          const freshAmount = +(bid.amount * (1 + (Math.random() - 0.5) * 0.1)).toFixed(4);
          return {
            price: +priceOffset.toFixed(isFx ? 5 : 2),
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
  }, [selectedAssetSymbol]);

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

  // SVG coordinate systems and overlay lines calculation
  const getMinMaxPrice = () => {
    if (candles.length === 0) return { min: 0, max: 100 };
    let min = Infinity;
    let max = -Infinity;
    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });
    const range = max - min;
    const padding = range > 0 ? range * 0.08 : currentAsset.price * 0.01;
    return {
      min: min - padding,
      max: max + padding
    };
  };

  const { min: minPrice, max: maxPrice } = getMinMaxPrice();

  const svgHeight = 280;
  const svgWidth = 800;
  const chartHeight = 220;
  const chartBottom = 250;

  const scaleY = (val: number) => {
    if (maxPrice === minPrice) return chartBottom - chartHeight / 2;
    const ratio = (val - minPrice) / (maxPrice - minPrice);
    return chartBottom - ratio * chartHeight;
  };

  const count = candles.length;
  const leftPadding = 30;
  const rightPadding = 100;
  const colWidth = count > 0 ? (svgWidth - leftPadding - rightPadding) / count : 40;

  // Horizontal dynamic grid lines
  const gridLinesCount = 4;
  const gridLines = Array.from({ length: gridLinesCount }).map((_, idx) => {
    const ratio = idx / (gridLinesCount - 1);
    const priceVal = maxPrice - ratio * (maxPrice - minPrice);
    const yVal = scaleY(priceVal);
    return {
      price: priceVal,
      y: yVal
    };
  });

  // Calculate indicator overlays
  const maPoints: { x: number; y: number }[] = [];
  const emaPoints: { x: number; y: number }[] = [];
  const upperBandsPoints: { x: number; y: number }[] = [];
  const lowerBandsPoints: { x: number; y: number }[] = [];

  if (count > 0) {
    // MA 4
    for (let i = 0; i < count; i++) {
      const windowSize = 4;
      const start = Math.max(0, i - windowSize + 1);
      let sum = 0;
      for (let j = start; j <= i; j++) {
        sum += candles[j].close;
      }
      const avg = sum / (i - start + 1);
      maPoints.push({
        x: leftPadding + i * colWidth + colWidth / 2,
        y: scaleY(avg)
      });
    }

    // EMA
    let prevEma = candles[0].close;
    const alpha = 0.45;
    for (let i = 0; i < count; i++) {
      const emaVal = candles[i].close * alpha + prevEma * (1 - alpha);
      emaPoints.push({
        x: leftPadding + i * colWidth + colWidth / 2,
        y: scaleY(emaVal)
      });
      prevEma = emaVal;
    }

    // Bollinger style bands
    for (let i = 0; i < count; i++) {
      const mid = candles[i].close;
      const dev = mid * (currentAsset.price < 5 ? 0.0012 : 0.012);
      const xVal = leftPadding + i * colWidth + colWidth / 2;
      upperBandsPoints.push({ x: xVal, y: scaleY(mid + dev) });
      lowerBandsPoints.push({ x: xVal, y: scaleY(mid - dev) });
    }
  }

  const maD = splinePath(maPoints);
  const emaD = splinePath(emaPoints);
  const upperD = splinePath(upperBandsPoints);
  const lowerD = splinePath(lowerBandsPoints);

  const activeCandle = hoveredIdx !== null ? candles[hoveredIdx] : (candles.length > 0 ? candles[candles.length - 1] : null);

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
            <div className="flex-1 relative bg-white overflow-hidden p-4 h-96 flex flex-col justify-end">
              
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

              {/* Candles container layout representation using scale-independent vector lines */}
              <div className="relative w-full h-[280px] select-none z-10">
                <svg 
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                  className="w-full h-full select-none"
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Grid lines */}
                  {gridLines.map((grid, index) => (
                    <g key={index} className="opacity-40">
                      <line 
                        x1={leftPadding} 
                        y1={grid.y} 
                        x2={svgWidth - rightPadding} 
                        y2={grid.y} 
                        stroke="#cbd5e1" 
                        strokeDasharray="4 4" 
                        strokeWidth="1" 
                      />
                      <text 
                        x={svgWidth - rightPadding + 8} 
                        y={grid.y + 3} 
                        className="fill-slate-400 font-mono text-[9px]"
                        textAnchor="start"
                      >
                        {grid.price.toLocaleString(undefined, {
                          minimumFractionDigits: selectedAssetSymbol.includes("X") ? 4 : 2,
                          maximumFractionDigits: selectedAssetSymbol.includes("X") ? 4 : 2
                        })}
                      </text>
                    </g>
                  ))}

                  {/* RSI Bollinger Envelopes */}
                  {indicators.includes("RSI") && upperBandsPoints.length > 0 && (
                    <>
                      <path 
                        d={`${upperD} L ${lowerBandsPoints.slice().reverse().map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} Z`}
                        fill="#0058be" 
                        fillOpacity="0.04" 
                      />
                      <path 
                        d={upperD} 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="1.2" 
                        strokeOpacity="0.5"
                        strokeDasharray="2 2"
                      />
                      <path 
                        d={lowerD} 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="1.2" 
                        strokeOpacity="0.5"
                        strokeDasharray="2 2"
                      />
                    </>
                  )}

                  {/* DMA Moving Average */}
                  {indicators.includes("MA") && maPoints.length > 0 && (
                    <path 
                      d={maD} 
                      fill="none" 
                      stroke="#0058be" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* EMA Zone line */}
                  {indicators.includes("EMA") && emaPoints.length > 0 && (
                    <path 
                      d={emaD} 
                      fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* Time indicator bottom labels */}
                  {candles.map((candle, idx) => {
                    if (idx % 3 !== 0 && idx !== candles.length - 1) return null;
                    const x = leftPadding + idx * colWidth + colWidth / 2;
                    return (
                      <text 
                        key={`time-${idx}`}
                        x={x}
                        y={svgHeight - 4}
                        className="fill-slate-400 font-mono text-[9px]"
                        textAnchor="middle"
                      >
                        {candle.time}
                      </text>
                    );
                  })}

                  {/* Crosshair vertical line */}
                  {hoveredIdx !== null && (
                    <line 
                      x1={leftPadding + hoveredIdx * colWidth + colWidth / 2}
                      y1={10}
                      x2={leftPadding + hoveredIdx * colWidth + colWidth / 2}
                      y2={svgHeight - 20}
                      stroke="#475569"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      strokeOpacity="0.5"
                    />
                  )}

                  {/* Candlesticks & Volumes */}
                  {candles.map((candle, idx) => {
                    const xCenter = leftPadding + idx * colWidth + colWidth / 2;
                    const candleWidth = Math.min(16, colWidth * 0.6);
                    const openY = scaleY(candle.open);
                    const closeY = scaleY(candle.close);
                    const highY = scaleY(candle.high);
                    const lowY = scaleY(candle.low);

                    const isBullish = candle.close >= candle.open;
                    const fillHex = isBullish ? "#10b981" : "#ef4444";
                    const strokeHex = fillHex;

                    // Simulated volume values
                    const volHeight = Math.min(28, 5 + (idx % 4) * 6 + ((candle.high - candle.low) / (maxPrice - minPrice || 1)) * 30);

                    return (
                      <g key={idx}>
                        {/* Volume bar at bottom */}
                        <rect 
                          x={xCenter - candleWidth / 2} 
                          y={svgHeight - 20 - volHeight}
                          width={candleWidth} 
                          height={volHeight}
                          fill={fillHex} 
                          fillOpacity="0.12" 
                          rx="1"
                        />
                        {/* Shadow wick line */}
                        <line 
                          x1={xCenter} 
                          y1={highY} 
                          x2={xCenter} 
                          y2={lowY} 
                          stroke={strokeHex} 
                          strokeWidth="1.5" 
                        />
                        {/* Candlestick body rect */}
                        <rect 
                          x={xCenter - candleWidth / 2} 
                          y={Math.min(openY, closeY)} 
                          width={candleWidth} 
                          height={Math.max(2, Math.abs(closeY - openY))}
                          fill={fillHex} 
                          stroke={strokeHex}
                          strokeWidth="1"
                          rx="1.5"
                        />
                      </g>
                    );
                  })}

                  {/* Transparent hover boxes for interactive precision crosshair tracking */}
                  {candles.map((_, idx) => (
                    <rect 
                      key={`hit-${idx}`}
                      x={leftPadding + idx * colWidth}
                      y={0}
                      width={colWidth}
                      height={svgHeight - 20}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseMove={() => setHoveredIdx(idx)}
                    />
                  ))}
                </svg>
              </div>

              {/* Dynamic responsive Cursor Info Panel showing OHLC */}
              <div className="absolute top-4 left-4 glass-card rounded-xl p-3 border-slate-100 bg-white/95 backdrop-blur-md select-none w-44 shadow-lg text-[10px] z-20">
                <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2 border-b border-slate-150 pb-1 flex justify-between">
                  <span>Cursor Info</span>
                  <span className="text-primary">{activeCandle ? activeCandle.time : ""}</span>
                </div>
                {activeCandle ? (
                  <div className="space-y-1 font-mono">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Open:</span> 
                      <span className="font-bold">{activeCandle.open.toLocaleString(undefined, { minimumFractionDigits: selectedAssetSymbol.includes("X") ? 4 : 2 })}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">High:</span> 
                      <span className="font-bold text-secondary">{activeCandle.high.toLocaleString(undefined, { minimumFractionDigits: selectedAssetSymbol.includes("X") ? 4 : 2 })}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Low:</span> 
                      <span className="font-bold text-rose-500">{activeCandle.low.toLocaleString(undefined, { minimumFractionDigits: selectedAssetSymbol.includes("X") ? 4 : 2 })}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Close:</span> 
                      <span className={`font-bold ${activeCandle.close >= activeCandle.open ? "text-secondary" : "text-rose-500"}`}>
                        {activeCandle.close.toLocaleString(undefined, { minimumFractionDigits: selectedAssetSymbol.includes("X") ? 4 : 2 })}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400">Initializing chart...</p>
                )}
                <div className="border-t border-slate-100 mt-2 pt-1.5 text-[10px] text-on-surface-variant flex justify-between">
                  <span>24h Vol:</span>
                  <span className="font-bold text-slate-800">{currentAsset.volume24h}</span>
                </div>
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
            <a 
              key={item.id}
              href={item.url || "#"}
              target={item.url && item.url !== "#" ? "_blank" : undefined}
              rel={item.url && item.url !== "#" ? "noopener noreferrer" : undefined}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:border-primary/30 transition-all duration-350 cursor-pointer group block"
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
            </a>
          );
        })}
      </section>

    </div>
  );
}
