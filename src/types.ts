/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MarketAsset {
  symbol: string; // e.g. "BTC/USDT"
  name: string; // e.g. "Bitcoin"
  category: "Spot" | "Futures" | "L2";
  price: number;
  change24h: number; // e.g. 4.21
  aiSentiment: "Bullish" | "Strong Bullish" | "Bearish" | "Strong Bearish" | "Neutral";
  sentimentScore: number; // e.g. 82
  volume24h: string;
  activeBots: number;
  totalProfit: string;
  dailyYield: number;
  icon: string;
}

export interface SecuritySignal {
  id: string;
  asset: string;
  type: "BUY" | "SELL";
  probability: number; // 0 to 100
  target: string;
  eta: string;
}

export interface OrderBookItem {
  price: number;
  amount: number;
  total: string;
  barPercent: number; // 0 to 100 representing scale
}

export interface TradeItem {
  id: string;
  price: number;
  amount: number;
  time: string;
  type: "buy" | "sell";
}

export interface ExecutionLog {
  id: string;
  asset: string;
  type: "Long" | "Short" | "Re-leveraged" | "Take Profit" | "Stop Loss";
  time: string;
  price: string;
  agentName: string;
  status: "Entered" | "Exit" | "Modified" | "Triggered";
  changeDirection?: "positive" | "negative";
  changeValue?: string;
}

export interface TechnicalIndicatorSet {
  rsiValue: number;
  rsiStatus: string;
  macdValue: string;
  macdStatus: string;
  emaCross: string;
  emaStatus: string;
}

export interface TradingBotStrategy {
  id: string;
  botName: string;
  logicDescription: string;
  parameters: Record<string, string>;
  algorithmCode: string;
  estimatedYield: string;
  winRate: string;
  activeRiskFactors: string[];
  asset: string;
  botType: string;
  riskProfile: string;
  status: "Active" | "Inactive";
}

export interface NewsFlashItem {
  id: string;
  category: "News Flash" | "Technical Warning" | "On-Chain Alert";
  title: string;
  time: string;
  sentiment: string;
  color: "primary" | "tertiary" | "secondary";
}

export interface TransactionItem {
  id: string;
  asset: string;
  symbol: string;
  type: string;
  amount: string;
  status: "COMPLETED" | "PROCESSING" | "FAILED";
  time: string;
  iconName: string;
}

export interface PositionItem {
  ticker: string;
  name: string;
  qty: number;
  buy_price: number;
  current_price: number;
  highest_price: number;
  initial_stop: number;
  trailing_stop: number;
  target_price: number;
  buy_date: string;
  cost: number;
  value: number;
  pnl: number;
  pnl_percent: number;
}
