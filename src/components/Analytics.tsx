/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Share2, 
  Coins, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { TransactionItem } from "../types";

interface AnalyticsProps {
  transactions: TransactionItem[];
}

export default function Analytics({ transactions }: AnalyticsProps) {
  // Navigation filters state
  const [filterTab, setFilterTab] = useState<"All" | "Trades" | "Transfers">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [stats, setStats] = useState<any>({
    total_trades: 0,
    winning_trades: 0,
    win_rate: 0.0,
    total_realized_pnl: 0.0,
    skills_confidence: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [transactions]);

  // Handler for dynamic Excel sheet download
  const handleExport = () => {
    setToastMessage("Generating dynamic Excel Ledger...");
    setShowToast(true);
    setTimeout(() => {
      window.open("/api/export", "_blank");
      setShowToast(false);
    }, 1500);
  };

  const handleShowMore = () => {
    setToastMessage("All current ledger entries loaded successfully.");
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Filter transaction rows depending on active selectors
  const filteredTransactions = transactions.filter((tx) => {
    // Search query constraint
    const matchesSearch = tx.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab category constraint
    if (!matchesSearch) return false;
    if (filterTab === "All") return true;
    if (filterTab === "Trades") {
      return tx.type.toLowerCase().includes("buy") || tx.type.toLowerCase().includes("sell");
    }
    if (filterTab === "Transfers") {
      return tx.type.toLowerCase().includes("withdraw") || tx.type.toLowerCase().includes("claim") || tx.type.toLowerCase().includes("deposit");
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-on-surface">
            Portfolio Analytics
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant font-sans mt-0.5">
            Comprehensive analysis of your vault performance, automated holdings, and ledger allocations.
          </p>
        </div>
        
        {/* Export Report Action */}
        <div className="flex items-center gap-2 select-none">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-slate-50 transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4 text-primary" />
            Export Report
          </button>
        </div>
      </div>

      {/* 2. Portfolio Asset Distribution & P/L Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col span-2: Donut allocation chart */}
        <div className="glass-card md:col-span-2 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-10">
          
          {/* Custom SVG Donut allocation wheel */}
          <div className="relative w-44 h-44 flex-shrink-0 select-none">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Stablecoins slice: 60.0% */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="transparent" 
                stroke="#0058be" 
                strokeWidth="11" 
                strokeDasharray="251.2" 
                strokeDashoffset="100.48" // offset for 60% remaining
                className="transition-all duration-1000"
              />
              {/* Majors slice: 30.0% */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="transparent" 
                stroke="#6ffbbe" 
                strokeWidth="11" 
                strokeDasharray="251.2" 
                strokeDashoffset="188.4" // offset
                className="transition-all duration-1000 accent-glow"
              />
              {/* Alts slice: 10.0% */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="transparent" 
                stroke="#ffdadb" 
                strokeWidth="11" 
                strokeDasharray="251.2" 
                strokeDashoffset="226.08" // offset
                className="transition-all duration-1000"
              />
            </svg>
            
            {/* Absolute Center total assets */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold font-sans">
                TOTAL VALUE
              </span>
              <span className="text-xl md:text-2xl font-black text-on-surface select-all font-sans">
                $1.2M
              </span>
            </div>
          </div>

          {/* Allocation Legends right span */}
          <div className="flex-1 space-y-4 w-full">
            <h3 className="text-md font-bold text-on-surface font-sans">
              Asset Distribution
            </h3>
            
            {/* List entries */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-semibold text-on-surface">Stablecoins (USDC/USDT)</span>
                </div>
                <span className="font-mono font-bold text-on-surface">60.0%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-secondary-fixed bg-aquamarine bg-emerald-300" />
                  <span className="font-semibold text-on-surface">Majors (BTC/ETH)</span>
                </div>
                <span className="font-mono font-bold text-on-surface">30.0%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#ffdadb]" />
                  <span className="font-semibold text-on-surface">Alts (Solana/Others)</span>
                </div>
                <span className="font-mono font-bold text-on-surface">10.0%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col 1: Realized Performance indicators */}
        <div className="glass-card p-8 rounded-2xl flex flex-col justify-between">
          <h3 className="text-md font-bold text-on-surface font-sans mb-4">
            Vault Performance
          </h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mb-0.5">
                Total Realized P&L
              </p>
              <div className={`flex items-baseline gap-2 ${stats.total_realized_pnl >= 0 ? "text-secondary" : "text-rose-500"}`}>
                <span className="text-xl md:text-2xl font-black font-mono">
                  {stats.total_realized_pnl >= 0 ? "+" : ""}${stats.total_realized_pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">USD</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mb-0.5">
                Machine Win Rate
              </p>
              <div className="flex items-baseline gap-2 text-primary">
                <span className="text-xl md:text-2xl font-black font-mono">{stats.win_rate}%</span>
                <span className="text-xs font-semibold text-on-surface-variant">Accuracy</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mb-0.5">
                Closed Execution Nodes
              </p>
              <div className="flex items-baseline gap-2 text-slate-800">
                <span className="text-xl md:text-2xl font-black font-mono">{stats.total_trades}</span>
                <span className="text-xs font-semibold text-on-surface-variant">Completed Trades</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI Algorithmic Strategy Confidence Metrics */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-md font-bold text-on-surface font-sans mb-4 flex items-center gap-2 select-none">
          <TrendingUp className="w-5 h-5 text-primary" />
          AI Algorithmic Strategy Performance & Confidence logs
        </h3>
        {stats.skills_confidence && stats.skills_confidence.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.skills_confidence.map((skill: any, idx: number) => {
              return (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white/50 hover:bg-slate-50 transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-on-surface">{skill.skill}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Weight: {skill.weight} &middot; {skill.trades} Trades</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      skill.accuracy >= 75 ? "bg-emerald-50 text-secondary border border-emerald-100" : "bg-blue-50 text-primary border border-blue-100"
                    }`}>
                      {skill.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 select-none">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${skill.accuracy >= 75 ? "bg-secondary" : "bg-primary"}`}
                        style={{ width: `${skill.accuracy}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-on-surface">{skill.accuracy}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No strategy analytics metrics found.</p>
        )}
      </div>

      {/* 3. Recent Activity list ledger and filtering */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        
        {/* Table header selection controllers */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-md font-bold text-on-surface font-sans">
            Recent Activity
          </h3>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input bar */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search index asset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl bg-white w-full sm:w-44"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100/60 p-0.5 rounded-lg border border-slate-100 font-sans text-xs font-semibold">
              {(["All", "Trades", "Transfers"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    filterTab === tab
                      ? "bg-white text-primary font-bold shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledgers transaction rendering table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-slate-100 select-none">
                <th className="px-6 py-4">Asset Name</th>
                <th className="px-6 py-4">Transaction Type</th>
                <th className="px-6 py-4">Delta Amount</th>
                <th className="px-6 py-4">Node Status</th>
                <th className="px-6 py-4 text-right pr-6">Executed Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-on-surface relative">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-on-surface-variant font-medium select-none">
                    No matching ledger entries found for your query.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCompleted = tx.status === "COMPLETED";
                  const isProcessing = tx.status === "PROCESSING";
                  const isFailed = tx.status === "FAILED";

                  return (
                    <tr 
                      key={tx.id}
                      className="hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="px-6 py-4.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-105 transition-transform select-none">
                          <Coins className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface flex items-center gap-1.5">
                            {tx.asset}
                            <span className="text-[10px] font-bold opacity-60 font-mono">({tx.symbol})</span>
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4.5 font-semibold text-on-surface">
                        {tx.type}
                      </td>

                      <td className="px-6 py-4.5 font-mono font-bold text-on-surface">
                        {tx.amount}
                      </td>

                      <td className="px-6 py-4.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1.5 w-fit ${
                          isCompleted
                            ? "bg-secondary-container/20 text-on-secondary-container text-secondary"
                            : isProcessing
                            ? "bg-slate-100 text-slate-500 border border-slate-200"
                            : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}>
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />}
                          {isProcessing && <Clock className="w-3.5 h-3.5 text-slate-400" />}
                          {isFailed && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                          {tx.status}
                        </span>
                      </td>

                      <td className="px-6 py-4.5 text-right pr-6 text-on-surface-variant font-mono">
                        {tx.time}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* View All actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-50 flex justify-center">
          <button 
            type="button"
            onClick={handleShowMore}
            className="text-primary hover:text-primary-800 text-xs font-bold leading-none hover:underline underline-offset-4 flex items-center gap-1.5 py-1 decoration-2"
          >
            View All Transactions
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Floating alert/success message container */}
      {showToast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xl z-50 text-xs flex items-center gap-2 animate-bounce">
          <Info className="w-4 h-4 text-primary" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
