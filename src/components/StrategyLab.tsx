/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  Settings, 
  Cpu, 
  Sparkles, 
  Info, 
  Terminal, 
  Check, 
  AlertTriangle, 
  BookOpen, 
  RefreshCw 
} from "lucide-react";
import { TradingBotStrategy } from "../types";

interface StrategyLabProps {
  onDeployBot: (bot: TradingBotStrategy) => void;
  deployedBots: TradingBotStrategy[];
}

export default function StrategyLab({
  onDeployBot,
  deployedBots
}: StrategyLabProps) {
  // Input Criteria States
  const [botType, setBotType] = useState("Alpha Scalper");
  const [asset, setAsset] = useState("BTC/USDT");
  const [riskProfile, setRiskProfile] = useState("Moderate");
  const [indicators, setIndicators] = useState<string[]>(["RSI", "MACD"]);

  // Compile States
  const [isCompiling, setIsCompiling] = useState(false);
  const [strategyResult, setStrategyResult] = useState<TradingBotStrategy | null>(null);
  const [errorText, setErrorText] = useState("");
  const [deploySuccess, setDeploySuccess] = useState(false);

  const handleToggleIndicator = (indicator: string) => {
    if (indicators.includes(indicator)) {
      setIndicators(indicators.filter((ind) => ind !== indicator));
    } else {
      setIndicators([...indicators, indicator]);
    }
  };

  // Compile full-stack Strategy with Gemini
  const handleCompileStrategy = async () => {
    setIsCompiling(true);
    setErrorText("");
    setDeploySuccess(false);

    try {
      const response = await fetch("/api/strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botType,
          asset,
          riskProfile,
          indicators
        })
      });

      const data = await response.json();
      if (data.success) {
        const compiled = data.strategy;
        // Transform incoming server structures into schema
        const newBot: TradingBotStrategy = {
          id: `bot_${Math.random().toString()}`,
          botName: compiled.botName || `${botType} Builder`,
          logicDescription: compiled.logicDescription || "Dynamic market trigger based on L2 converging indexes.",
          parameters: compiled.parameters || { "Trigger Interval": "400ms", "Profit Threshold": "1.2%" },
          algorithmCode: compiled.algorithmCode || "function automate() { console.log('execute'); }",
          estimatedYield: compiled.estimatedYield || "+2.5% Weekly",
          winRate: compiled.winRate || "65.0%",
          activeRiskFactors: compiled.activeRiskFactors || ["Standard slippage on low volume"],
          asset,
          botType,
          riskProfile,
          status: "Inactive"
        };
        setStrategyResult(newBot);
      } else {
        setErrorText(data.error || "Generation error. Reverting to base compilation.");
      }
    } catch (err: any) {
      setErrorText("Horizon Node is offline. Generating local conservative structure.");
      // Fallback local mock strategy for offline-mode safety code
      const fallbackBot: TradingBotStrategy = {
        id: `bot_${Math.random()}`,
        botName: `Local ${botType} [Offline Target]`,
        logicDescription: `Conservative strategy targeting ${asset} and utilizing ${indicators.join(", ")}, engineered for general high-liquidity situations.`,
        parameters: {
          "EMA Cycle": "200 Periods",
          "RSI Trigger Line": riskProfile === "Aggressive" ? "35/65" : "30/70",
          "Risk Margin": riskProfile === "Conservative" ? "0.5%" : "1.8%"
        },
        algorithmCode: `import { HorizonOS } from "horizon-sdk";\n\nexport async function evaluate(tick: MarketTick) {\n  const rsi = indicators.calculateRSI(tick.history, 14);\n  if (rsi < 30) {\n    await HorizonOS.executeOrder({\n      asset: "${asset}",\n      type: "BUY",\n      amount: "0.25 BTC",\n      profile: "${riskProfile}"\n    });\n  }\n}`,
        estimatedYield: riskProfile === "Conservative" ? "+1.4% Weekly" : "+4.1% Weekly",
        winRate: "72.1%",
        activeRiskFactors: ["Network latency constraints", "Gas fees optimization"],
        asset,
        botType,
        riskProfile,
        status: "Inactive"
      };
      setStrategyResult(fallbackBot);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDeploy = () => {
    if (!strategyResult) return;
    onDeployBot({
      ...strategyResult,
      status: "Active"
    });
    setDeploySuccess(true);
    // Cleanup results visual state slowly
    setTimeout(() => {
      setDeploySuccess(false);
      setStrategyResult(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-on-surface flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            AI Strategy Lab
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1 font-sans">
            Architect custom trading bots. Backtest algorithms, compile setups, and deploy live execution node policies.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-mono">
            Fleet: {deployedBots.length} Bots Deployed
          </span>
        </div>
      </section>

      {/* Main Bento parameters and code compile grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Bot parameters form */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface select-none">
              Bot Parameterization
            </h3>
          </div>

          {/* Bot type */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 pl-0.5">
              Algorithm Type
            </label>
            <select
              value={botType}
              onChange={(e) => setBotType(e.target.value)}
              className="w-full text-xs border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl px-3 py-2 bg-white"
            >
              <option value="Alpha Scalper">Alpha Scalper (High frequency tick scalps)</option>
              <option value="Momentum Grid">Momentum Grid Maker (Buy low/sell high spread)</option>
              <option value="L2 Arbitrage">L2 Cross-Asset Arbitrage (Instant price offsets)</option>
              <option value="Trend Rider">Trend Rider Core (EMA support and MACD shifts)</option>
            </select>
          </div>

          {/* Asset Selection */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 pl-0.5">
              Target Pair
            </label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full text-xs border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl px-3 py-2 bg-white"
            >
              <option value="BTC/USDT">BTC/USDT (Bitcoin Spot)</option>
              <option value="ETH/USDT">ETH/USDT (Ethereum Spot)</option>
              <option value="SOL/USDT">SOL/USDT (Solana Spot)</option>
              <option value="LINK/USDT">LINK/USDT (Chainlink Spot)</option>
              <option value="AVAX/USDT">AVAX/USDT (Avalanche Spot)</option>
              <option value="ARB/USDT">ARB/USDT (Arbitrum Spot)</option>
            </select>
          </div>

          {/* Risk profile selection */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 pl-0.5">
              Risk Profile Constraint
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Conservative", "Moderate", "Aggressive"].map((risk) => (
                <button
                  key={risk}
                  type="button"
                  onClick={() => setRiskProfile(risk)}
                  className={`py-2 text-xs font-semibold rounded-xl text-center border transition-all ${
                    riskProfile === risk
                      ? "bg-primary/10 border-primary text-primary font-bold"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>

          {/* Indicators list checkbox */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 pl-0.5">
              Utilize Indicators
            </label>
            <div className="space-y-2">
              {["RSI (Relative Strength Index)", "MACD (Moving Average Convergence)", "EMA 200 Support Crossing", "Bollinger Bands volatility envelopes"].map((label) => {
                const codeName = label.split(" ")[0];
                const isSelected = indicators.includes(codeName);
                return (
                  <label 
                    key={label}
                    className="flex items-center gap-3 p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                  >
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleIndicator(codeName)}
                      className="rounded text-primary focus:ring-primary/20"
                    />
                    <span className="text-on-surface-variant font-sans font-medium">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Trigger compilation */}
          <button
            type="button"
            onClick={handleCompileStrategy}
            disabled={isCompiling}
            className={`w-full py-3.5 bg-primary hover:bg-opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
              isCompiling ? "opacity-60 cursor-wait" : ""
            }`}
          >
            {isCompiling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Compiling Node Policy with Horizon AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Synthesize customized bot architecture
              </>
            )}
          </button>
          
          {errorText && (
            <p className="text-xs text-amber-600 font-semibold bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-1.5 leading-snug">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              {errorText}
            </p>
          )}

        </div>

        {/* Right Side: Code execution output panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main compilation result board */}
          <div className="glass-card rounded-2xl p-6 min-h-[480px] flex flex-col justify-between relative overflow-hidden bg-slate-950 text-slate-100 dark-glass-card">
            
            {strategyResult ? (
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                    <div>
                      <span className="px-2 py-0.5 bg-primary/20 text-primary-fixed border border-primary/30 text-[9px] font-bold rounded uppercase tracking-widest select-none">
                        SYNTHESIS OK
                      </span>
                      <h3 className="text-lg font-bold font-sans mt-1.5 tracking-tight text-white focus-within:ring-0">
                        {strategyResult.botName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-sans">
                        {strategyResult.logicDescription}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400">Yield Prediction</span>
                      <div className="text-lg font-black font-mono text-secondary mt-0.5 select-all">
                        {strategyResult.estimatedYield}
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
                        Win Rate: {strategyResult.winRate}
                      </span>
                    </div>
                  </div>

                  {/* Active strategy parameters */}
                  <div className="mt-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Live Threshold Parameters
                    </span>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {Object.entries(strategyResult.parameters).map(([key, value]) => (
                        <div key={key} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                          <span className="block text-[10px] text-slate-500 font-semibold select-none">
                            {key}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-200">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* High quality Algorithm code block */}
                  <div className="mt-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      Algorithmic Executable Code
                    </span>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 mt-2 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed max-h-48 custom-scrollbar">
                      <pre className="whitespace-pre-scroll select-all">{strategyResult.algorithmCode}</pre>
                    </div>
                  </div>

                  {/* Risk factor listings */}
                  <div className="mt-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Assigned Risk Factors
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {strategyResult.activeRiskFactors.map((risk, idx) => (
                        <span key={idx} className="bg-slate-900 text-slate-400 text-[10px] px-2.5 py-1 rounded-md border border-slate-800">
                          &middot; {risk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Confirm deploy action bar */}
                <div className="pt-4 border-t border-slate-800/80 mt-4 flex select-none bg-transparent">
                  <button
                    onClick={handleDeploy}
                    className="w-full py-3 bg-secondary hover:bg-secondary-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Deploy Bot to Live Command Center
                  </button>
                </div>
              </div>
            ) : isCompiling ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <div>
                  <p className="text-sm font-bold text-white">Synthesizing Algorithmic Solution...</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Horizon AI is evaluating historical performance, optimal triggers, and parameters for the selected settings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
                <BookOpen className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
                <h4 className="text-sm font-bold text-white">No Strategy Compiled Yet</h4>
                <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                  Choose your indicators, risk limits, and asset targets on the left, then click the <strong>Synthesize</strong> button to build or code a bespoke trading policy.
                </p>
              </div>
            )}

            {/* Deploy success toast overlay */}
            {deploySuccess && (
              <div className="absolute inset-0 bg-secondary/95 flex flex-col items-center justify-center text-center p-6 transition-all duration-300 z-10">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Deploying Node Successful</h3>
                <p className="text-xs text-slate-100 max-w-sm mt-1 leading-relaxed">
                  The bot is now active and generating orders! Incremental bot updates are now fed back to your Command Center.
                </p>
              </div>
            )}

          </div>

          {/* List of currently active/deployed bots overview */}
          <div className="glass-card rounded-2xl p-6 bg-white space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface">
              Active Strategy Fleet
            </h3>
            
            {deployedBots.length === 0 ? (
              <p className="text-xs text-on-surface-variant font-medium text-center py-4">
                No active custom bots deployed yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {deployedBots.map((b) => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-on-surface font-sans">{b.botName}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        Asset: {b.asset} &middot; Risk: {b.riskProfile} &middot; Yield: {b.estimatedYield}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-secondary border border-emerald-100 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping" />
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
