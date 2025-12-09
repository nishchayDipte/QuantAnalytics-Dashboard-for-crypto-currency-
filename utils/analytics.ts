import { Tick, AnalyticsDataPoint, RegressionMethod, BacktestResult } from '../types';

export const calculateMean = (data: number[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, val) => acc + val, 0);
  return sum / data.length;
};

export const calculateStdDev = (data: number[], mean: number): number => {
  if (data.length < 2) return 0;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (data.length - 1);
  return Math.sqrt(variance);
};

// --- Kalman Filter Implementation ---
class KalmanFilter {
  // State x = [beta, alpha]^T (Slope, Intercept)
  private x: [number, number]; 
  // Error Covariance P (2x2)
  private P: [[number, number], [number, number]];
  // Process Noise Covariance Q
  private Q: number;
  // Measurement Noise Covariance R
  private R: number;

  constructor(q = 1e-5, r = 1e-3) {
    this.x = [1, 0]; // Initial guess: Slope=1, Intercept=0
    this.P = [[1, 0], [0, 1]];
    this.Q = q;
    this.R = r;
  }

  // Update step: y = priceA, x_input = priceB
  // Model: priceA = beta * priceB + alpha
  public update(priceA: number, priceB: number): { slope: number; intercept: number } {
    // 1. Prediction (Random Walk assumption for state)
    // x_k|k-1 = x_k-1|k-1
    // P_k|k-1 = P_k-1|k-1 + Q * I
    const P_pred: [[number, number], [number, number]] = [
      [this.P[0][0] + this.Q, this.P[0][1]],
      [this.P[1][0], this.P[1][1] + this.Q]
    ];

    // 2. Measurement Update
    // H = [priceB, 1]
    const H = [priceB, 1];
    
    // Innovation covariance: S = H * P * H^T + R
    const S = (H[0] * P_pred[0][0] + H[1] * P_pred[1][0]) * H[0] + 
              (H[0] * P_pred[0][1] + H[1] * P_pred[1][1]) * H[1] + this.R;

    // Kalman Gain: K = P * H^T * S^-1
    const K = [
      (P_pred[0][0] * H[0] + P_pred[0][1] * H[1]) / S,
      (P_pred[1][0] * H[0] + P_pred[1][1] * H[1]) / S
    ];

    // Innovation: y - H * x
    const y_hat = H[0] * this.x[0] + H[1] * this.x[1];
    const residual = priceA - y_hat;

    // Update State: x = x + K * residual
    this.x = [
      this.x[0] + K[0] * residual,
      this.x[1] + K[1] * residual
    ];

    // Update Covariance: P = (I - K * H) * P
    // Simple 2x2 matrix multiplication logic omitted for brevity, approximating P update
    // For a robust app, use a matrix library. Here we do element-wise approximation for the prototype.
    const KH = [
        [K[0] * H[0], K[0] * H[1]],
        [K[1] * H[0], K[1] * H[1]]
    ];
    
    this.P = [
        [(1 - KH[0][0]) * P_pred[0][0] - KH[0][1] * P_pred[1][0], (1 - KH[0][0]) * P_pred[0][1] - KH[0][1] * P_pred[1][1]],
        [-KH[1][0] * P_pred[0][0] + (1 - KH[1][1]) * P_pred[1][0], -KH[1][0] * P_pred[0][1] + (1 - KH[1][1]) * P_pred[1][1]]
    ];

    return { slope: this.x[0], intercept: this.x[1] };
  }
}

// --- OLS Implementation ---
export const calculateOLS = (x: number[], y: number[]): { slope: number; intercept: number } => {
  const n = x.length;
  if (n === 0 || n !== y.length) return { slope: 1, intercept: 0 };

  const xMean = calculateMean(x);
  const yMean = calculateMean(y);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean);
    denominator += (x[i] - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
};

// --- Backtest Engine ---
export const runBacktest = (
  data: AnalyticsDataPoint[], 
  entryThreshold: number = 2.0, 
  exitThreshold: number = 0.0
): BacktestResult => {
  let position = 0; // 0 = Flat, 1 = Long Spread, -1 = Short Spread
  let entryPrice = 0;
  let totalPnL = 0;
  let trades = 0;
  let wins = 0;

  data.forEach(point => {
    const spread = point.spread;
    const z = point.zScore;

    if (position === 0) {
      // Entry Logic
      if (z > entryThreshold) {
        // Z-Score is high, expect mean reversion (spread to drop). Short Spread.
        position = -1;
        entryPrice = spread;
      } else if (z < -entryThreshold) {
        // Z-Score is low, expect mean reversion (spread to rise). Long Spread.
        position = 1;
        entryPrice = spread;
      }
    } else if (position === -1) {
      // Exit Logic for Short
      if (z <= exitThreshold) {
        // Spread dropped as expected. Profit = Entry - Current
        const pnl = entryPrice - spread;
        totalPnL += pnl;
        trades++;
        if (pnl > 0) wins++;
        position = 0;
      }
    } else if (position === 1) {
      // Exit Logic for Long
      if (z >= -exitThreshold) {
         // Spread rose as expected. Profit = Current - Entry
         const pnl = spread - entryPrice;
         totalPnL += pnl;
         trades++;
         if (pnl > 0) wins++;
         position = 0;
      }
    }
  });

  return {
    totalTrades: trades,
    winningTrades: wins,
    totalPnL,
    winRate: trades > 0 ? (wins / trades) * 100 : 0,
    status: position !== 0 ? 'active' : 'flat'
  };
};

export const processTicksToAnalytics = (
  ticksA: Tick[],
  ticksB: Tick[],
  windowSize: number = 30,
  samplingRate: number = 1000,
  method: RegressionMethod = RegressionMethod.OLS,
  minLiquidity: number = 0
): AnalyticsDataPoint[] => {
  if (ticksA.length === 0 || ticksB.length === 0) return [];

  // Liquidity Filter
  const filteredA = minLiquidity > 0 ? ticksA.filter(t => t.quantity >= minLiquidity) : ticksA;
  const filteredB = minLiquidity > 0 ? ticksB.filter(t => t.quantity >= minLiquidity) : ticksB;

  if (filteredA.length === 0 || filteredB.length === 0) return [];

  // Sort by timestamp
  const sortedA = [...filteredA].sort((a, b) => a.timestamp - b.timestamp);
  const sortedB = [...filteredB].sort((a, b) => a.timestamp - b.timestamp);

  const mergedData: AnalyticsDataPoint[] = [];
  const kf = new KalmanFilter(); // Initialize Kalman Filter
  
  const startTime = Math.min(sortedA[0].timestamp, sortedB[0].timestamp);
  const endTime = Math.max(sortedA[sortedA.length-1].timestamp, sortedB[sortedB.length-1].timestamp);
  
  let currentIdxA = 0;
  let currentIdxB = 0;
  
  let lastPriceA = sortedA[0].price;
  let lastPriceB = sortedB[0].price;

  // Sampling
  for (let t = startTime; t <= endTime; t += samplingRate) {
    while (currentIdxA < sortedA.length && sortedA[currentIdxA].timestamp <= t) {
      lastPriceA = sortedA[currentIdxA].price;
      currentIdxA++;
    }
    while (currentIdxB < sortedB.length && sortedB[currentIdxB].timestamp <= t) {
      lastPriceB = sortedB[currentIdxB].price;
      currentIdxB++;
    }

    mergedData.push({
      timestamp: t,
      priceA: lastPriceA,
      priceB: lastPriceB,
      spread: 0,
      zScore: 0,
      hedgeRatio: 1
    });
  }

  const spreads: number[] = [];
  
  for (let i = 0; i < mergedData.length; i++) {
    let hedgeRatio = 1;

    if (method === RegressionMethod.OLS) {
      const startWindow = Math.max(0, i - windowSize);
      const sliceA = mergedData.slice(startWindow, i + 1).map(d => d.priceA);
      const sliceB = mergedData.slice(startWindow, i + 1).map(d => d.priceB);
      const result = calculateOLS(sliceB, sliceA); 
      hedgeRatio = result.slope;
    } else {
      // Kalman Filter (Recursive)
      const result = kf.update(mergedData[i].priceA, mergedData[i].priceB);
      hedgeRatio = result.slope;
    }

    mergedData[i].hedgeRatio = hedgeRatio || 1;
    const spread = mergedData[i].priceA - (mergedData[i].hedgeRatio * mergedData[i].priceB);
    mergedData[i].spread = spread;
    spreads.push(spread);

    // Z-Score Calculation
    const startWindow = Math.max(0, i - windowSize);
    const spreadSlice = spreads.slice(startWindow, i + 1);
    const meanSpread = calculateMean(spreadSlice);
    const stdSpread = calculateStdDev(spreadSlice, meanSpread);
    
    mergedData[i].zScore = stdSpread === 0 ? 0 : (spread - meanSpread) / stdSpread;
  }

  return mergedData;
};