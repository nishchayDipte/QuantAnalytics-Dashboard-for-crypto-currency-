export interface Tick {
  symbol: string;
  price: number;
  quantity: number;
  timestamp: number;
}

export interface OHLC {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AnalyticsDataPoint {
  timestamp: number;
  priceA: number;
  priceB: number;
  spread: number;
  zScore: number;
  hedgeRatio: number;
}

export enum Timeframe {
  ONE_SECOND = 1000,
  ONE_MINUTE = 60000,
  FIVE_MINUTES = 300000,
}

export enum RegressionMethod {
  OLS = 'OLS',
  KALMAN = 'KALMAN'
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  totalPnL: number;
  winRate: number;
  status: 'active' | 'flat';
}

export interface AlertConfig {
  id: string;
  type: 'z-score';
  condition: 'gt' | 'lt';
  value: number;
  active: boolean;
}

export interface AlertLog {
  id: string;
  timestamp: number;
  message: string;
}