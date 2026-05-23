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
  const [newsFlashes, setNewsFlashes] = useState<NewsFlashItem[]>([]);
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

  // Live polling sync loop with Python FastAPI (every 5 seconds)
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
              icon: stock.is_fx ? "currency_exchange" : stock.ticker === "AAPL" ? "layers" : "trending_up"
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
            type: `${t.type} ${t.qty} Qty`,
            amount: t.type === "BUY" ? `- $${t.cost.toFixed(2)}` : `+ $${(t.qty * t.price).toFixed(2)}`,
            status: t.status || "COMPLETED",
            time: t.buy_date || t.time || "Just now",
            iconName: "coins"
          }));
          setTransactions(mappedTxs);
        }

        // Generate dynamic live execution feed notifications based on active portfolio and scanned items
        if (currentAssetsList.length > 0) {
          const randomAssetObj = currentAssetsList[Math.floor(Math.random() * currentAssetsList.length)];
          const botNames = ["AlphaBot v2.4", "ScalperCore", "MomentumEngine", "GridMaster v1", ...deployedBots.map(b => b.botName)];
          const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
          const operations: ExecutionLog["type"][] = ["Long", "Short", "Re-leveraged", "Take Profit", "Stop Loss"];
          const randomOp = operations[Math.floor(Math.random() * operations.length)];
          const statuses: ExecutionLog["status"][] = ["Entered", "Exit", "Modified", "Triggered"];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          const now = new Date();
          const timeStr = now.toTimeString().split(" ")[0];
          const priceStr = `$${(randomAssetObj.price * (1 + (Math.random() - 0.5) * 0.005)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

          const newLog: ExecutionLog = {
            id: Math.random().toString(),
            asset: randomAssetObj.symbol,
            type: randomOp,
            time: timeStr,
            price: priceStr,
            agentName: randomBot,
            status: randomStatus,
            changeDirection: Math.random() > 0.4 ? "positive" : "negative",
            changeValue: `+${(Math.random() * 2).toFixed(2)}%`
          };

          setExecutionFeed((prev) => [newLog, ...prev.slice(0, 9)]);
        }

      } catch (err) {
        console.error("Error fetching live backend sync data:", err);
      }
    };

    fetchData(); // Initial execution
    const interval = setInterval(fetchData, 5000); // 5-second polling loop
    return () => clearInterval(interval);
  }, [deployedBots, assets]);

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

  // Deploys high-end compiled strategy bots from StrategyLab
  const handleDeployNewBot = (newBot: TradingBotStrategy) => {
    setDeployedBots((prev) => [...prev, newBot]);
    setActiveBotsCount((prev) => prev + 1);

    // Instant confirmation execution notification log
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const triggerLog: ExecutionLog = {
      id: `deploy_${Math.random().toString()}`,
      asset: newBot.asset,
      type: "Long",
      time: timeStr,
      price: `$${(newBot.asset === "BTC/USDT" ? 64281 : newBot.asset === "ETH/USDT" ? 3450 : 142).toLocaleString()}`,
      agentName: newBot.botName,
      status: "Entered"
    };

    setExecutionFeed((prev) => [triggerLog, ...prev.slice(0, 9)]);
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
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4RsG9_HsNm9Bh0_XroibuYNQ4iidMzuEtRnqQM76AbpsCrt2R2TRPOhpn3Y0BlcVRT-Ri1b1Ku2iOGzokZJgje-9WqHzMcHmO6JkxsMpYb5iAy8gm71kfliiUheDGNm1y6jN0oZ6ogi1oqchFvG3f_8T-ZMe6pzwacMiP0FvkbQVZiqNH1swsQiijn2PaW9E4PawtC0WTDDPovyCmgWOeWFK_JJ331bezIcQFjYREgbQ3NpO451dqFD61nwtL3eSvkyXQaMHZoS8"
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
