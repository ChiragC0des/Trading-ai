/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Terminal, 
  TrendingUp, 
  FlaskConical, 
  Activity, 
  Bell, 
  Settings, 
  Search, 
  Zap, 
  Menu, 
  X, 
  Wallet, 
  BookOpen, 
  HelpCircle,
  Plus,
  Layers
} from "lucide-react";

import { 
  MarketAsset, 
  SecuritySignal, 
  ExecutionLog, 
  TradingBotStrategy,
  TransactionItem,
  NewsFlashItem,
  PositionItem
} from "./types";

import { 
  INITIAL_ASSETS, 
  INITIAL_SIGNALS, 
  INITIAL_EXECUTION_FEED, 
  INITIAL_NEWS_FLASHES, 
  INITIAL_TRANSACTIONS 
} from "./data";

// Sub-components import
import CommandCenter from "./components/CommandCenter";
import MarketIntelligence from "./components/MarketIntelligence";
import StrategyLab from "./components/StrategyLab";
import Analytics from "./components/Analytics";
import LiveScanner from "./components/LiveScanner";

export default function App() {
  // Navigation tabs selection
  const [activeTab, setActiveTab] = useState<"command" | "intelligence" | "strategy" | "analytics" | "scanner">("command");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global State Stores
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [signals, setSignals] = useState<SecuritySignal[]>([]);
  const [executionFeed, setExecutionFeed] = useState<ExecutionLog[]>([]);
  const [newsFlashes, setNewsFlashes] = useState<NewsFlashItem[]>(INITIAL_NEWS_FLASHES);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [portfolioFinancials, setPortfolioFinancials] = useState<any>({ cash: 100000.0, equity: 100000.0, unrealized_pnl: 0.0 });
  
  // Custom generated strategy bots fleet
  const [deployedBots, setDeployedBots] = useState<TradingBotStrategy[]>([]);
  const [activeBotsCount, setActiveBotsCount] = useState(4);

  // Address wallet simulation
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const [currentSelectedAsset, setCurrentSelectedAsset] = useState("AAPL");

  // Global Search keyword filter for top level header
  const [globalSearch, setGlobalSearch] = useState("");

  // Live polling sync loop with Python FastAPI (every 2.8 seconds)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Scan results
        const scanRes = await fetch("/api/scan");
        const scanData = await scanRes.json();
        
        let currentAssetsList = assets;
        if (scanData && scanData.stocks) {
          // Map backend stocks to MarketAsset[]
          const mappedAssets: MarketAsset[] = scanData.stocks.map((stock: any) => {
            let aiSentiment: MarketAsset["aiSentiment"] = "Neutral";
            if (stock.rating === "Strong Buy") aiSentiment = "Strong Bullish";
            else if (stock.rating === "Buy") aiSentiment = "Bullish";
            else if (stock.rating === "Hold") aiSentiment = "Neutral";
            else if (stock.rating === "Sell / Avoid") aiSentiment = "Bearish";

            return {
              symbol: stock.ticker,
              name: stock.name,
              category: stock.is_fx ? "L2" : "Spot",
              price: stock.price,
              change24h: stock.change_percent,
              aiSentiment,
              sentimentScore: Math.round(stock.overall_score),
              volume24h: (stock.volume && stock.volume > 1e6) ? `${(stock.volume / 1e6).toFixed(1)}M` : (stock.volume ? stock.volume.toLocaleString() : "0"),
              activeBots: stock.is_fx ? 2 : 4,
              totalProfit: (stock.change && stock.change >= 0) ? `+$${(stock.change * 50).toFixed(0)}` : `-$${(stock.change ? Math.abs(stock.change) * 50 : 0).toFixed(0)}`,
              dailyYield: stock.change_percent,
              icon: stock.is_fx ? "currency_exchange" : stock.ticker === "AAPL" ? "layers" : "trending_up",
              market_mass: stock.market_mass,
              market_velocity: stock.market_velocity,
              rsi: stock.rsi
            };
          });
          setAssets(mappedAssets);
          currentAssetsList = mappedAssets;

          // Update upcoming signals based on top breakout items (overall_score > 75)
          const highConfidence = scanData.stocks
            .filter((s: any) => s.overall_score > 75)
            .slice(0, 5)
            .map((s: any, idx: number) => ({
              id: `sig_${s.ticker}_${idx}`,
              asset: s.ticker,
              type: s.alex_g_type || (s.rating.includes("Buy") ? "BUY" : "SELL"),
              probability: Math.round(s.overall_score),
              target: `$${s.target_price ? s.target_price.toLocaleString("en-US", { minimumFractionDigits: s.is_fx ? 5 : 2 }) : "0.00"}`,
              eta: `~${12 + idx * 4}m`
            }));
          
          if (highConfidence.length > 0) {
            setSignals(highConfidence);
          }
        }

        // Fetch Portfolio holdings & financials
        const portfolioRes = await fetch("/api/portfolio");
        const portfolioData = await portfolioRes.json();
        
        if (portfolioData) {
          if (portfolioData.positions) {
            setPositions(portfolioData.positions);
          }
          if (portfolioData.financials) {
            setPortfolioFinancials(portfolioData.financials);
          }
        }

        // Fetch Analytics ledger/transactions
        const analyticsRes = await fetch("/api/analytics");
        const analyticsData = await analyticsRes.json();
        if (analyticsData && analyticsData.transactions) {
          const mappedTxs: TransactionItem[] = analyticsData.transactions.slice(0, 10).map((t: any) => ({
            id: t.id || `tx_${Math.random()}`,
            asset: t.name || t.ticker,
            symbol: t.ticker,
            type: `${t.type} ${parseFloat(t.qty || 0).toFixed(t.ticker === "BTC" ? 3 : 1)} Qty`,
            amount: t.type.includes("BUY") ? `-$${parseFloat(t.cost || 0).toFixed(2)}` : `+$${(parseFloat(t.qty || 0) * parseFloat(t.price || 0)).toFixed(2)}`,
            status: t.status || "COMPLETED",
            time: t.buy_date || t.time || "Just now",
            iconName: "coins"
          }));
          setTransactions(mappedTxs);
        }

        // Sync Deployed Bots directly from the server engine
        const botsRes = await fetch("/api/bots");
        const botsData = await botsRes.json();
        if (botsData && botsData.bots) {
          setDeployedBots(botsData.bots);
          setActiveBotsCount(botsData.bots.length);
        }

        // Sync real-time executions trace from engine instead of random mockups
        const execsRes = await fetch("/api/executions");
        const execsData = await execsRes.json();
        if (execsData && execsData.executions) {
          setExecutionFeed(execsData.executions);
        }

      } catch (err) {
        console.error("Error fetching live backend sync data:", err);
      }
    };

    fetchData(); // Initial execution
    const interval = setInterval(fetchData, 2800); // 2.8-second live polling loop
    return () => clearInterval(interval);
  }, []);

  // Synchronize news flashes dynamically matching the currently selected active asset context
  useEffect(() => {
    let active = true;
    const fetchNews = async () => {
      try {
        let tickerQuery = currentSelectedAsset;
        if (tickerQuery.includes("/")) {
          tickerQuery = tickerQuery.split("/")[0]; // BTC/USDT -> BTC
        }
        if (tickerQuery.endsWith("=X")) {
          tickerQuery = tickerQuery.replace("=X", ""); // EURUSD=X -> EURUSD
          if (tickerQuery.length === 6) {
            tickerQuery = tickerQuery.slice(0, 3) + "," + tickerQuery.slice(3, 6); // EURUSD -> EUR,USD
          }
        }

        const res = await fetch(`/api/news?tickers=${encodeURIComponent(tickerQuery)}&limit=6`);
        const data = await res.json();
        if (!active) return;

        if (data && data.success && Array.isArray(data.feed)) {
          const mappedNews: NewsFlashItem[] = data.feed.map((item: any, idx: number) => {
            const category = item.source || "News Bulletin";
            
            let relativeTime = "Just now";
            if (item.time_published) {
              try {
                const y = item.time_published.substring(0, 4);
                const m = item.time_published.substring(4, 6);
                const d = item.time_published.substring(6, 8);
                const h = item.time_published.substring(9, 11);
                const min = item.time_published.substring(11, 13);
                const pubDate = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min)));
                const diffMs = Date.now() - pubDate.getTime();
                const diffMin = Math.round(diffMs / 60000);
                if (diffMin <= 0) relativeTime = "Just now";
                else if (diffMin < 60) relativeTime = `${diffMin}m ago`;
                else {
                  const diffHrs = Math.floor(diffMin / 60);
                  if (diffHrs < 24) relativeTime = `${diffHrs}h ago`;
                  else relativeTime = `${pubDate.toLocaleDateString([], { month: "short", day: "numeric" })}`;
                }
              } catch (e) {
                relativeTime = "Recently";
              }
            }

            const score = typeof item.overall_sentiment_score === "number" ? item.overall_sentiment_score : 0;
            const label = item.overall_sentiment_label || "Neutral";
            const sentimentText = `${label} (${score >= 0 ? "+" : ""}${score.toFixed(2)})`;

            let color: "primary" | "tertiary" | "secondary" = "primary";
            if (score > 0.15) color = "secondary";
            else if (score < -0.15) color = "tertiary";

            return {
              id: item.url || `news_${idx}_${Date.now()}`,
              category,
              title: item.title,
              time: relativeTime,
              sentiment: sentimentText,
              color,
              url: item.url || "#"
            };
          });
          setNewsFlashes(mappedNews);
        }
      } catch (err) {
        console.error("Error fetching breaking news sentiment:", err);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 60000); // 60-second cycle
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currentSelectedAsset]);

  // Connect wallet toggle simulation
  const handleConnectWallet = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress("");
    } else {
      setWalletConnected(true);
      setWalletAddress("0x7e...3d5f");
    }
  };

  // Navigates directly from CommandCenter items directly into active asset indicators
  const handleViewAssetDetails = (assetSymbol: string) => {
    setCurrentSelectedAsset(assetSymbol);
    setActiveTab("intelligence");
    setMobileMenuOpen(false);
  };

  // Deploys high-end compiled strategy bots to server-side memory
  const handleDeployNewBot = async (newBot: TradingBotStrategy) => {
    try {
      const response = await fetch("/api/bots/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot: newBot })
      });
      const data = await response.json();
      if (data.success) {
        setDeployedBots((prev) => [...prev, data.bot]);
        setActiveBotsCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error deploying bot to backend matching loop:", err);
      // Fallback locally
      setDeployedBots((prev) => [...prev, newBot]);
      setActiveBotsCount((prev) => prev + 1);
    }
  };

  const handleClosePosition = async (ticker: string) => {
    try {
      const res = await fetch("/api/position/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker })
      });
      const data = await res.json();
      if (data.success) {
        // Fast refresh portfolio layout
        const portfolioRes = await fetch("/api/portfolio");
        const portfolioData = await portfolioRes.json();
        if (portfolioData) {
          if (portfolioData.positions) setPositions(portfolioData.positions);
          if (portfolioData.financials) setPortfolioFinancials(portfolioData.financials);
        }
      }
    } catch (err) {
      console.error("Error executing dynamic close override:", err);
    }
  };

  // Safe search redirection logic
  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch) return;

    // Resolve if matching high level asset symbols
    const match = assets.find((a) => a.symbol.toLowerCase().includes(globalSearch.toLowerCase()));
    if (match) {
      handleViewAssetDetails(match.symbol);
    } else {
      // Directs to analytics for transaction filtering
      setActiveTab("analytics");
    }
  };

  return (
    <div className="flex min-h-screen text-on-surface bg-background select-none">
      
      {/* 1. Left SideNavBar layout (floating translucent sheet matching specs) */}
      <aside className={`w-64 h-screen fixed left-0 top-0 z-50 bg-white/85 backdrop-blur-2xl border-r border-slate-100/80 shadow-xl shadow-slate-150 flex flex-col justify-between py-6 transition-all duration-300 md:flex ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        
        <div>
          <div className="px-6 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-primary tracking-tight font-sans">
                Horizon OS
              </h1>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-widest mt-1">
                AI Trading Active
              </p>
            </div>
            
            {/* Mobile close toggle */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 bg-slate-150/50 rounded-lg hover:bg-slate-200"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Inner navigations list links mapped cleanly */}
          <nav className="flex-1 px-3 space-y-1 select-none">
            
            {/* CommandCenter View Selection */}
            <button
              onClick={() => { setActiveTab("command"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 text-xs ${
                activeTab === "command"
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-slate-100/50 hover:translate-x-0.5"
              }`}
            >
              <Terminal className="w-4.5 h-4.5" />
              <span>Command Center</span>
            </button>

            {/* MarketIntelligence View Selection */}
            <button
              onClick={() => { setActiveTab("intelligence"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 text-xs ${
                activeTab === "intelligence"
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-slate-100/50 hover:translate-x-0.5"
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5" />
              <span>Market Intelligence</span>
            </button>

            {/* Live Terminal View Selection */}
            <button
              onClick={() => { setActiveTab("scanner"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 text-xs ${
                activeTab === "scanner"
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-slate-100/50 hover:translate-x-0.5"
              }`}
            >
              <Layers className="w-4.5 h-4.5" />
              <span>Live Terminal</span>
            </button>

            {/* StrategyLab View Selection */}
            <button
              onClick={() => { setActiveTab("strategy"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 text-xs ${
                activeTab === "strategy"
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-slate-100/50 hover:translate-x-0.5"
              }`}
            >
              <FlaskConical className="w-4.5 h-4.5" />
              <span>Strategy Lab</span>
            </button>

            {/* Analytics View Selection */}
            <button
              onClick={() => { setActiveTab("analytics"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 text-xs ${
                activeTab === "analytics"
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-slate-100/50 hover:translate-x-0.5"
              }`}
            >
              <Activity className="w-4.5 h-4.5" />
              <span>Analytics</span>
            </button>

          </nav>
        </div>

        {/* Footer Sidebar Items: Status Pulsing, Help, Docs */}
        <div className="mt-auto px-4 space-y-4">
          <div className="py-2.5 px-3 rounded-xl bg-emerald-50/75 border border-emerald-100/80 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-secondary rounded-full status-pulse block" />
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
              Automation Status: Live
            </span>
          </div>

          <div className="flex flex-col gap-0.5 border-t border-slate-100 pt-3">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveTab("analytics"); }}
              className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant px-2.5 py-2 hover:text-primary transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Docs</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveTab("command"); }}
              className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant px-2.5 py-2 hover:text-primary transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Help Info</span>
            </a>
          </div>
        </div>

      </aside>

      {/* 2. Main Content Wrapper */}
      <main className="md:ml-64 flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* Top Header Application Bar */}
        <header className="w-full sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-slate-100 flex justify-between items-center h-16 px-6 select-none shadow-sm">
          
          <div className="flex items-center gap-4">
            {/* Mobile navigation draw triggers */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-on-surface-variant" />
            </button>

            {/* Quick Redirections indicator tab names */}
            <span className="hidden sm:block text-xs font-bold text-on-surface-variant">
              Horizon / <span className="text-on-surface font-black capitalize tracking-tight">{activeTab === "command" ? "Command Center" : activeTab === "intelligence" ? "Market Intelligence" : activeTab}</span>
            </span>

            {/* Top Search bar query filter form */}
            <form onSubmit={handleGlobalSearchSubmit} className="relative group pl-2">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search index BTC, ETH, SOL..."
                className="bg-slate-100/60 hover:bg-slate-150 border-none rounded-full py-1.5 pl-9 pr-4 w-52 md:w-64 text-xs font-medium focus:ring-1 focus:ring-primary/25 transition-all text-on-surface placeholder:text-slate-400"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Top action logs settings/notification overlays */}
            <div className="flex items-center gap-1.5 pr-4 border-r border-slate-100">
              <button 
                onClick={() => setActiveTab("command")}
                className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full transition-all relative"
              >
                <Bell className="w-4.5 h-4.5 bg-transparent" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full select-none" />
              </button>
              
              <button 
                onClick={() => setActiveTab("strategy")}
                className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full transition-all"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Smart Connect Wallet interactive trigger */}
            <button 
              onClick={handleConnectWallet}
              className={`px-4.5 py-2 text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                walletConnected
                  ? "bg-emerald-50 text-secondary border border-emerald-100/60"
                  : "bg-primary text-white"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{walletConnected ? walletAddress : "Connect Wallet"}</span>
            </button>

            {/* Simulated Modern Professional Avatar matching metadata spec */}
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-100 flex-shrink-0 select-none shadow-sm cursor-pointer">
              <img 
                alt="Architect Headshot"
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4RsG9_HsNm9BH0_XroibuYNQ4iidxMzuEtRnqQM76AbpsCrt2R2TRPOhpn3Y0BlcVRT-Ri1b1Ku2iOGzokZGjge-9WqHzMcHmO6KkxsMpYb5iAy8gm71kfliiuUheDGNm1y6jN0oZ6ogi1oqchFvG3f_8T-ZMe6pzwacMiP0FvkbQVZiqNH1swsQiijn2PaW9E4PAwtC0WTDDPovyCmgWOeWFK_JJ331bezIcQFjYREgbQ3NpO451dqFD61nwtL3eSvkyXQaMHZoS8"
                className="w-full h-full object-cover"
              />
            </div>

          </div>

        </header>

        {/* 3. Core Tab-Routed Content Area container with maximum desktop limits */}
        <div className="p-6 md:p-8 flex flex-col gap-8 max-w-[1500px] mx-auto w-full flex-1">
          {activeTab === "command" && (
            <CommandCenter 
              assets={assets}
              signals={signals}
              executionFeed={executionFeed}
              activeBotsCount={activeBotsCount}
              deployedBots={deployedBots}
              positions={positions}
              portfolioFinancials={portfolioFinancials}
              onClosePosition={handleClosePosition}
              onNavigateToIntelligence={handleViewAssetDetails}
              onNavigateToStrategy={() => setActiveTab("strategy")}
            />
          )}

          {activeTab === "intelligence" && (
            <MarketIntelligence 
              assets={assets}
              newsFlashes={newsFlashes}
              selectedAssetSymbol={currentSelectedAsset}
              onSelectAsset={setCurrentSelectedAsset}
            />
          )}

          {activeTab === "scanner" && (
            <LiveScanner 
              assets={assets}
              onNavigateToIntelligence={handleViewAssetDetails}
            />
          )}

          {activeTab === "strategy" && (
            <StrategyLab 
              onDeployBot={handleDeployNewBot}
              deployedBots={deployedBots}
            />
          )}

          {activeTab === "analytics" && (
            <Analytics 
              transactions={transactions}
            />
          )}
        </div>

        {/* Footer bottom bar */}
        <footer className="w-full h-12 bg-transparent text-center border-t border-slate-50 flex items-center justify-center p-3 select-none">
          <p className="text-[10px] text-slate-400 font-mono">
            Horizon OS AI Trading Terminal &middot; Powered by Antigravity Engines &middot; &copy; 2026 UTC
          </p>
        </footer>

      </main>

      {/* Floating global action button */}
      <button 
        type="button"
        onClick={() => { setActiveTab("strategy"); }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all z-50 flex items-center justify-center cursor-pointer shadow-primary/30"
      >
        <Plus className="w-6 h-6 animate-pulse" />
      </button>

      {/* Aesthetic glowing background ambient blur circles coordinates */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/3 blur-[120px] rounded-full pointer-events-none select-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-emerald-350/3 bg-emerald-500/2 blur-[100px] rounded-full pointer-events-none select-none" />

    </div>
  );
}
