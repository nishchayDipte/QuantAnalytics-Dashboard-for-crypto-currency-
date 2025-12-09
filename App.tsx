import React, { useState, useMemo, useEffect } from 'react';
import { useBinanceStream } from './hooks/useBinanceStream';
import { processTicksToAnalytics, runBacktest } from './utils/analytics';
import { Card } from './components/ui/Card';
import { PriceChart, SpreadChart, ZScoreChart } from './components/Charts';
import { StatsPanel } from './components/Stats';
import { AlertLog } from './components/AlertLog';
import { BacktestPanel } from './components/BacktestPanel';
import { DataTable } from './components/DataTable';
import { AlertLog as AlertLogType, Timeframe, RegressionMethod } from './types';
import { Activity, PlayCircle, StopCircle, Database } from 'lucide-react';

const DEFAULT_SYMBOL_A = 'btcusdt';
const DEFAULT_SYMBOL_B = 'ethusdt';

const App: React.FC = () => {
  const [symbols, setSymbols] = useState<[string, string]>([DEFAULT_SYMBOL_A, DEFAULT_SYMBOL_B]);
  const [activeSymbols, setActiveSymbols] = useState<string[]>([DEFAULT_SYMBOL_A, DEFAULT_SYMBOL_B]);
  const [zScoreThreshold, setZScoreThreshold] = useState(2.0);
  const [windowSize, setWindowSize] = useState(30);
  const [timeframe, setTimeframe] = useState<number>(Timeframe.ONE_SECOND);
  const [regressionMethod, setRegressionMethod] = useState<RegressionMethod>(RegressionMethod.OLS);
  const [minLiquidity, setMinLiquidity] = useState<number>(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [alertLogs, setAlertLogs] = useState<AlertLogType[]>([]);

  // Hook handles connection management
  const { data, isConnected } = useBinanceStream(isCollecting ? activeSymbols : []);

  // Real-time Analytics Calculation
  const analyticsData = useMemo(() => {
    const ticksA = data[activeSymbols[0]] || [];
    const ticksB = data[activeSymbols[1]] || [];
    return processTicksToAnalytics(ticksA, ticksB, windowSize, timeframe, regressionMethod, minLiquidity);
  }, [data, activeSymbols, windowSize, timeframe, regressionMethod, minLiquidity]);

  // Mini-Backtest Calculation
  const backtestResult = useMemo(() => {
    return runBacktest(analyticsData, zScoreThreshold, 0); // Exit at mean (0)
  }, [analyticsData, zScoreThreshold]);

  const lastPoint = analyticsData[analyticsData.length - 1];

  // Alerting System
  useEffect(() => {
    if (lastPoint && Math.abs(lastPoint.zScore) > zScoreThreshold) {
      const type = lastPoint.zScore > 0 ? "Upper" : "Lower";
      const msg = `${type} Bound Breach: Z-Score ${lastPoint.zScore.toFixed(3)}`;
      
      setAlertLogs(prev => {
        // Prevent duplicate spamming of the same alert in short succession (2s debounce visual)
        if (prev.length > 0 && prev[prev.length - 1].message === msg && Date.now() - prev[prev.length - 1].timestamp < 2000) {
            return prev;
        }
        return [...prev, { id: Date.now().toString(), timestamp: Date.now(), message: msg }];
      });
    }
  }, [lastPoint, zScoreThreshold]);

  const handleStart = () => {
    setActiveSymbols(symbols);
    setIsCollecting(true);
  };

  const handleStop = () => {
    setIsCollecting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6 font-sans text-slate-200">
      
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Activity className="text-sky-500" />
            QuantDeveloper Eval
            <span className="text-xs font-normal text-slate-500 border border-slate-700 rounded px-2 py-0.5 ml-2">v0.2.0-beta</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time Pair Trading Analytics & Statistical Arbitrage Monitor</p>
        </div>

        <div className="flex gap-2">
           <button 
             onClick={handleStart}
             disabled={isCollecting}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
               isCollecting ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500 text-white'
             }`}
           >
             <PlayCircle size={16} /> Start
           </button>
           <button 
             onClick={handleStop}
             disabled={!isCollecting}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
               !isCollecting ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-red-900/50 text-red-200 hover:bg-red-900 border border-red-800'
             }`}
           >
             <StopCircle size={16} /> Stop
           </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Configuration Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <Card title="Configuration" className="h-fit">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Asset A (Y)</label>
                <input 
                  type="text" 
                  value={symbols[0]} 
                  onChange={(e) => setSymbols([e.target.value, symbols[1]])}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:border-sky-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Asset B (X)</label>
                <input 
                  type="text" 
                  value={symbols[1]} 
                  onChange={(e) => setSymbols([symbols[0], e.target.value])}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:border-sky-500 outline-none transition-colors"
                />
              </div>
              
              <div className="h-px bg-slate-700 my-2" />
              
              <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Timeframe</label>
                    <select
                      value={timeframe}
                      onChange={(e) => setTimeframe(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs focus:border-sky-500 outline-none"
                    >
                      <option value={Timeframe.ONE_SECOND}>1 Sec</option>
                      <option value={Timeframe.ONE_MINUTE}>1 Min</option>
                      <option value={Timeframe.FIVE_MINUTES}>5 Min</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Regression</label>
                    <select
                      value={regressionMethod}
                      onChange={(e) => setRegressionMethod(e.target.value as RegressionMethod)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs focus:border-sky-500 outline-none"
                    >
                      <option value={RegressionMethod.OLS}>OLS</option>
                      <option value={RegressionMethod.KALMAN}>Kalman</option>
                    </select>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex justify-between">
                  <span>Min Liquidity (Qty)</span>
                  <span className="text-white">{minLiquidity}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.01"
                  value={minLiquidity}
                  onChange={(e) => setMinLiquidity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              <div className="h-px bg-slate-700 my-2" />

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex justify-between">
                  <span>Z-Score Threshold</span>
                  <span className="text-white">{zScoreThreshold}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="0.1"
                  value={zScoreThreshold}
                  onChange={(e) => setZScoreThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex justify-between">
                  <span>Rolling Window (Ticks)</span>
                  <span className="text-white">{windowSize}</span>
                </label>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  step="5"
                  value={windowSize}
                  onChange={(e) => setWindowSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            </div>
          </Card>

          <Card title="System Status">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Connection</span>
                 <span className={`flex items-center gap-1.5 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                   <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                   {isConnected ? 'Active' : 'Disconnected'}
                 </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Data Source</span>
                 <span className="text-slate-200">Binance WebSocket</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Backtest Logic</span>
                 <span className="text-slate-200 font-mono text-xs">Z &gt; {zScoreThreshold} | Z &lt; 0</span>
              </div>
              <div className="mt-2 p-2 bg-sky-900/20 border border-sky-800 rounded text-xs text-sky-200 flex gap-2">
                 <Database size={14} className="shrink-0 mt-0.5" />
                 Backend simulation mode.
              </div>
            </div>
          </Card>

          <Card title="Alert Log" className="h-[200px]">
            <AlertLog logs={alertLogs} />
          </Card>
        </div>

        {/* Main Dashboard */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          
          {/* Stats & Backtest */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
               <StatsPanel lastPoint={lastPoint} dataCount={analyticsData.length} />
            </Card>
            <Card title="Mean Reversion Backtest (Real-time)">
               <BacktestPanel result={backtestResult} />
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[350px]">
             <Card title="Price Action (Normalized)" action={<div className="flex gap-2 text-xs font-mono"><span className="text-sky-400">{activeSymbols[0].toUpperCase()}</span><span className="text-pink-400">{activeSymbols[1].toUpperCase()}</span></div>} className="h-[300px] lg:h-full">
                <PriceChart data={analyticsData} symbolA={activeSymbols[0]} symbolB={activeSymbols[1]} />
             </Card>
             <Card title={`Z-Score (Model: ${regressionMethod})`} className="h-[300px] lg:h-full">
                <ZScoreChart data={analyticsData} threshold={zScoreThreshold} />
             </Card>
          </div>

          {/* Data Table */}
          <Card className="h-[300px]">
             <DataTable data={analyticsData} />
          </Card>

        </div>
      </div>
    </div>
  );
};

export default App;