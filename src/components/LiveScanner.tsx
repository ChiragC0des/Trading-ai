import React, { useState } from "react";
import { 
  Search, 
  Layers, 
  Activity, 
  TrendingUp, 
  Cpu, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  ChevronRight,
  Gauge
} from "lucide-react";
import { MarketAsset } from "../types";

interface LiveScannerProps {
  assets: MarketAsset[];
  onNavigateToIntelligence: (assetSymbol: string) => void;
}

export default function LiveScanner({ assets, onNavigateToIntelligence }: LiveScannerProps) {
  // Search & Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "EQUITIES" | "FOREX">("ALL");
  const [selectedRating, setSelectedRating] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"score" | "ticker" | "price" | "change" | "mass" | "velocity">("score");

  // Format Helper for prices
  const formatPrice = (price: number, isFx: boolean) => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: isFx ? 5 : 2,
      maximumFractionDigits: isFx ? 5 : 2,
    });
  };

  // Filter & Sort Logic
  const filteredAssets = assets
    .filter((asset) => {
      // 1. Search term filter
      const matchesSearch = 
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Category filter
      const isFx = asset.symbol.endsWith("=X");
      const matchesCategory = 
        selectedCategory === "ALL" ||
        (selectedCategory === "EQUITIES" && !isFx) ||
        (selectedCategory === "FOREX" && isFx);

      // 3. Rating filter
      const ratingClass = 
        asset.sentimentScore >= 75 ? "Strong Buy" :
        asset.sentimentScore >= 60 ? "Buy" :
        asset.sentimentScore >= 40 ? "Hold" : "Sell";
      
      const matchesRating = 
        selectedRating === "ALL" ||
        (selectedRating === "STRONG_BUY" && ratingClass === "Strong Buy") ||
        (selectedRating === "BUY" && ratingClass === "Buy") ||
        (selectedRating === "HOLD" && ratingClass === "Hold") ||
        (selectedRating === "SELL" && ratingClass === "Sell");

      return matchesSearch && matchesCategory && matchesRating;
    })
    .sort((a, b) => {
      // Sort Logic
      const isFxA = a.symbol.endsWith("=X");
      const isFxB = b.symbol.endsWith("=X");
      
      // Extract dynamic metrics safely from raw or custom attributes
      const massA = (a as any).market_mass || 1.0;
      const massB = (b as any).market_mass || 1.0;
      const velocityA = (a as any).market_velocity || 0.0;
      const velocityB = (b as any).market_velocity || 0.0;

      if (sortBy === "ticker") return a.symbol.localeCompare(b.symbol);
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "change") return b.dailyYield - a.dailyYield;
      if (sortBy === "mass") return massB - massA;
      if (sortBy === "velocity") return Math.abs(velocityB) - Math.abs(velocityA); // absolute speed magnitude
      return b.sentimentScore - a.sentimentScore; // Default Overall Score
    });

  return (
    <div className="space-y-6">
      
      {/* Title & Banner Sheet */}
      <div className="relative overflow-hidden glass-card rounded-3xl p-6 bg-gradient-to-r from-primary/5 via-white/50 to-emerald-500/5">
        <div className="absolute top-0 right-0 -z-10 w-[200px] h-[200px] bg-primary/10 blur-[50px] rounded-full" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">Real-Time Market Terminal</h2>
            <p className="text-xs text-on-surface-variant mt-1 font-sans">
              Dynamic, yfinance concurrent data stream overlayed with Project Anti-Gravity ML telemetry
            </p>
          </div>
          
          <div className="flex items-center gap-3.5 bg-white/60 backdrop-blur-xl border border-slate-100 rounded-2xl px-4 py-2.5 self-start md:self-auto">
            <Gauge className="w-5 h-5 text-primary" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Scanned Nodes</span>
              <span className="text-sm font-bold text-on-surface font-mono">{assets.length} Active Feeds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Toolbar & Controls */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Search bar */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticker or company name..."
              className="w-full text-xs border border-slate-100 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl pl-10 pr-4 py-2.5 bg-white/50 hover:bg-white transition-all font-sans"
            />
          </div>

          {/* Category Selector */}
          <div className="lg:col-span-3 flex bg-slate-50 p-1 rounded-xl">
            {(["ALL", "EQUITIES", "FOREX"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
                  selectedCategory === cat 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Rating filter */}
          <div className="lg:col-span-2 relative">
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full text-[11px] font-semibold border border-slate-100 focus:border-primary rounded-xl px-3 py-2 bg-white/50 hover:bg-white transition-all cursor-pointer font-sans"
            >
              <option value="ALL">All Ratings</option>
              <option value="STRONG_BUY">Strong Buy</option>
              <option value="BUY">Buy</option>
              <option value="HOLD">Hold</option>
              <option value="SELL">Sell / Avoid</option>
            </select>
          </div>

          {/* Sorting filter */}
          <div className="lg:col-span-3 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-[11px] font-semibold border border-slate-100 focus:border-primary rounded-xl px-3 py-2 bg-white/50 hover:bg-white transition-all cursor-pointer font-sans"
            >
              <option value="score">Sort by Overall Score (Desc)</option>
              <option value="ticker">Sort by Ticker Symbol (A-Z)</option>
              <option value="price">Sort by Spot Price (Desc)</option>
              <option value="change">Sort by 24h Change % (Desc)</option>
              <option value="mass">Sort by Market Mass (Desc)</option>
              <option value="velocity">Sort by Market Velocity (Desc)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Scanned Nodes Grid Layout */}
      {filteredAssets.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <Activity className="w-10 h-10 text-slate-400 mx-auto mb-2 animate-pulse" />
          <p className="text-sm font-bold text-on-surface-variant font-sans">No matching feeds found.</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search parameters or filters to load scanned assets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const isFx = asset.symbol.endsWith("=X");
            const isProfit = asset.dailyYield >= 0;
            
            // Extract dynamic Project Anti-Gravity properties
            const mass = (asset as any).market_mass || 1.0;
            const velocity = (asset as any).market_velocity || 0.0;
            const isDownward = velocity < 0;

            const ratingClass = 
              asset.sentimentScore >= 75 ? "Strong Buy" :
              asset.sentimentScore >= 60 ? "Buy" :
              asset.sentimentScore >= 40 ? "Hold" : "Sell";

            return (
              <div 
                key={asset.symbol} 
                className="glass-card rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-xl duration-350 transition-all flex flex-col justify-between border-slate-100/60"
              >
                <div>
                  
                  {/* Card Header Ticker & Sentiment Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-mono font-black text-xs text-primary shadow-inner">
                        {asset.symbol.split("=")[0].slice(0, 3)}
                      </div>
                      <div>
                        <span className="font-black text-sm block text-on-surface font-mono">{asset.symbol}</span>
                        <span className="text-[10px] text-on-surface-variant block truncate max-w-[130px] font-sans">{asset.name}</span>
                      </div>
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      ratingClass === "Strong Buy" ? "bg-emerald-50 text-secondary border border-emerald-100" :
                      ratingClass === "Buy" ? "bg-primary/5 text-primary border border-primary/10" :
                      ratingClass === "Hold" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      "bg-rose-50 text-rose-600 border border-rose-100"
                    }`}>
                      {ratingClass}
                    </span>
                  </div>

                  {/* Spot price & wiggles section */}
                  <div className="flex items-baseline justify-between mb-4.5 pb-3 border-b border-slate-50">
                    <span className="text-xl font-black font-mono tracking-tight text-on-surface scale-pulse select-all">
                      ${formatPrice(asset.price, isFx)}
                    </span>
                    <span className={`flex items-center gap-0.5 text-xs font-bold font-mono ${
                      isProfit ? "text-secondary" : "text-rose-600"
                    }`}>
                      {isProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{isProfit ? "+" : ""}{asset.dailyYield.toFixed(2)}%</span>
                    </span>
                  </div>

                  {/* Anti-Gravity ML Telemetry Panel */}
                  <div className="space-y-3.5 mb-5">
                    
                    {/* 1. Market Mass Visualizer */}
                    <div>
                      <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                        <span>Market Mass (Inertia)</span>
                        <span className="font-mono text-on-surface">{mass.toFixed(4)} M</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, (mass / 25) * 100)}%` }} // scale base mass
                        />
                      </div>
                    </div>

                    {/* 2. Market Velocity Visualizer */}
                    <div>
                      <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                        <span>Market Velocity (Force)</span>
                        <span className={`font-mono font-bold flex items-center gap-0.5 ${
                          isDownward ? "text-rose-600" : "text-secondary"
                        }`}>
                          {isDownward ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {velocity.toFixed(6)} V
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isDownward ? "bg-rose-500" : "bg-emerald-400"
                          }`} 
                          style={{ width: `${Math.min(100, Math.abs(velocity) * 800)}%` }} // scale speed intensity
                        />
                      </div>
                    </div>

                  </div>

                </div>

                {/* Footer Micro indicators preview */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-3 text-[10px] font-mono text-on-surface-variant font-semibold">
                    <div>
                      <span className="text-slate-400">RSI:</span> <span className="text-on-surface">{asset.rsi || "50"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Score:</span> <span className="text-primary font-bold">{asset.sentimentScore}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToIntelligence(asset.symbol)}
                    className="p-1.5 bg-slate-50 border border-slate-100 hover:bg-primary/5 hover:text-primary hover:border-primary/20 text-slate-500 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 font-semibold cursor-pointer shadow-sm text-[10px] uppercase font-bold tracking-wider"
                  >
                    <span>Analyze</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
