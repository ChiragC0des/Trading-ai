import { 
  MarketAsset, 
  SecuritySignal, 
  ExecutionLog, 
  NewsFlashItem, 
  TransactionItem,
  TechnicalIndicatorSet
} from "./types";

export const INITIAL_ASSETS: MarketAsset[] = [
  {
    symbol: "BTC/USDT",
    name: "Bitcoin",
    category: "Spot",
    price: 64281.42,
    change24h: 4.21,
    aiSentiment: "Bullish",
    sentimentScore: 78,
    volume24h: "38.2B",
    activeBots: 4,
    totalProfit: "$84.2k",
    dailyYield: 3.1,
    icon: "currency_bitcoin"
  },
  {
    symbol: "ETH/USDT",
    name: "Ethereum",
    category: "Spot",
    price: 3450.15,
    change24h: 1.24,
    aiSentiment: "Neutral",
    sentimentScore: 55,
    volume24h: "18.9B",
    activeBots: 3,
    totalProfit: "$38.6k",
    dailyYield: 2.2,
    icon: "token"
  },
  {
    symbol: "SOL/USDT",
    name: "Solana",
    category: "Spot",
    price: 142.10,
    change24h: 6.85,
    aiSentiment: "Strong Bullish",
    sentimentScore: 89,
    volume24h: "9.4B",
    activeBots: 3,
    totalProfit: "$18.2k",
    dailyYield: 4.8,
    icon: "currency_exchange"
  },
  {
    symbol: "LINK/USDT",
    name: "Chainlink",
    category: "Spot",
    price: 18.45,
    change24h: -0.82,
    aiSentiment: "Neutral",
    sentimentScore: 49,
    volume24h: "1.2B",
    activeBots: 1,
    totalProfit: "$1.40k",
    dailyYield: 0.8,
    icon: "link"
  },
  {
    symbol: "AVAX/USDT",
    name: "Avalanche",
    category: "Spot",
    price: 34.10,
    change24h: -3.15,
    aiSentiment: "Bearish",
    sentimentScore: 32,
    volume24h: "850M",
    activeBots: 1,
    totalProfit: "-$230",
    dailyYield: -1.2,
    icon: "polygon"
  },
  {
    symbol: "ARB/USDT",
    name: "Arbitrum",
    category: "Spot",
    price: 0.92,
    change24h: 5.12,
    aiSentiment: "Bullish",
    sentimentScore: 68,
    volume24h: "420M",
    activeBots: 0,
    totalProfit: "$0.00",
    dailyYield: 1.8,
    icon: "layers"
  }
];

export const INITIAL_SIGNALS: SecuritySignal[] = [
  {
    id: "sig_1",
    asset: "LINK/USDT",
    type: "BUY",
    probability: 88,
    target: "$18.45",
    eta: "~12m"
  },
  {
    id: "sig_2",
    asset: "AVAX/USDT",
    type: "SELL",
    probability: 72,
    target: "$34.10",
    eta: "~45m"
  },
  {
    id: "sig_3",
    asset: "ARB/USDT",
    type: "BUY",
    probability: 64,
    target: "$0.92",
    eta: "~1h 04m"
  }
];

export const INITIAL_EXECUTION_FEED: ExecutionLog[] = [
  {
    id: "feed_1",
    asset: "BTC/USDT",
    type: "Long",
    time: "14:22:01",
    price: "$64,200",
    agentName: "AlphaBot v2.4",
    status: "Entered"
  },
  {
    id: "feed_2",
    asset: "ETH/USDT",
    type: "Short",
    time: "14:18:45",
    price: "$3,450",
    agentName: "ScalperCore",
    status: "Exit",
    changeDirection: "positive",
    changeValue: "+1.2%"
  },
  {
    id: "feed_3",
    asset: "SOL/USDT",
    type: "Long",
    time: "14:05:12",
    price: "$142.10",
    agentName: "MomentumEngine",
    status: "Modified"
  }
];

export const INITIAL_NEWS_FLASHES: NewsFlashItem[] = [
  {
    id: "news_1",
    category: "News Flash",
    title: "Institutional inflow for BTC Spot ETFs reaches 6-month high.",
    time: "2 minutes ago",
    sentiment: "89% Bullish Sentiment",
    color: "primary"
  },
  {
    id: "news_2",
    category: "Technical Warning",
    title: "Overbought levels detected on the 1D RSI chart (Value: 74).",
    time: "15 minutes ago",
    sentiment: "Caution Advised",
    color: "tertiary"
  },
  {
    id: "news_3",
    category: "On-Chain Alert",
    title: "Whale wallet moved 1,200 BTC to cold storage from exchange.",
    time: "1 hour ago",
    sentiment: "Supply Shock Potential",
    color: "secondary"
  }
];

export const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: "tx_1",
    asset: "Bitcoin",
    symbol: "BTC",
    type: "Buy Order",
    amount: "0.42 BTC",
    status: "COMPLETED",
    time: "2 mins ago",
    iconName: "currency_bitcoin"
  },
  {
    id: "tx_2",
    asset: "USD Coin",
    symbol: "USDC",
    type: "Withdrawal",
    amount: "- 50,000.00 USDC",
    status: "PROCESSING",
    time: "1 hour ago",
    iconName: "monetization_on"
  },
  {
    id: "tx_3",
    asset: "Ethereum",
    symbol: "ETH",
    type: "Yield Claim",
    amount: "1.28 ETH",
    status: "COMPLETED",
    time: "5 hours ago",
    iconName: "token"
  },
  {
    id: "tx_4",
    asset: "Solana",
    symbol: "SOL",
    type: "Market Sell",
    amount: "- 120.00 SOL",
    status: "FAILED",
    time: "Yesterday",
    iconName: "currency_exchange"
  }
];

export const INDICATORS_DATA: Record<string, TechnicalIndicatorSet> = {
  "BTC/USDT": {
    rsiValue: 58.42,
    rsiStatus: "Neutral",
    macdValue: "Bullish",
    macdStatus: "Divergence",
    emaCross: "Support",
    emaStatus: "Confirmed"
  },
  "ETH/USDT": {
    rsiValue: 45.18,
    rsiStatus: "Neutral",
    macdValue: "Bearish",
    macdStatus: "Crossover",
    emaCross: "Overhead",
    emaStatus: "Resistance"
  },
  "SOL/USDT": {
    rsiValue: 71.30,
    rsiStatus: "Overbought",
    macdValue: "Strong Bullish",
    macdStatus: "Acceleration",
    emaCross: "Golden Cross",
    emaStatus: "Strong Bullish"
  },
  "LINK/USDT": {
    rsiValue: 52.12,
    rsiStatus: "Neutral",
    macdValue: "Neutral",
    macdStatus: "Consolidation",
    emaCross: "Baseline",
    emaStatus: "Support"
  },
  "AVAX/USDT": {
    rsiValue: 31.42,
    rsiStatus: "Oversold",
    macdValue: "Bearish",
    macdStatus: "Convergence",
    emaCross: "Death Cross",
    emaStatus: "Confirmed"
  },
  "ARB/USDT": {
    rsiValue: 62.45,
    rsiStatus: "Bullish",
    macdValue: "Bullish",
    macdStatus: "Golden Setup",
    emaCross: "Support",
    emaStatus: "Holding"
  }
};
