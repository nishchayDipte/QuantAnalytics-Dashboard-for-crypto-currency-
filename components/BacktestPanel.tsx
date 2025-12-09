import React from 'react';
import { BacktestResult } from '../types';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';

interface BacktestPanelProps {
  result: BacktestResult;
}

const StatBox = ({ label, value, icon: Icon, colorClass }: any) => (
  <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50 flex flex-col items-center justify-center text-center">
    <div className={`mb-1 ${colorClass}`}>
      <Icon size={16} />
    </div>
    <div className="text-xs text-slate-400 uppercase font-semibold">{label}</div>
    <div className="text-lg font-mono font-medium text-slate-200">{value}</div>
  </div>
);

export const BacktestPanel: React.FC<BacktestPanelProps> = ({ result }) => {
  return (
    <div className="grid grid-cols-4 gap-2 h-full">
      <StatBox 
        label="Trades" 
        value={result.totalTrades} 
        icon={Activity} 
        colorClass="text-blue-400" 
      />
      <StatBox 
        label="Win Rate" 
        value={`${result.winRate.toFixed(1)}%`} 
        icon={Target} 
        colorClass={result.winRate >= 50 ? "text-green-400" : "text-amber-400"} 
      />
      <StatBox 
        label="Total PnL" 
        value={result.totalPnL.toFixed(4)} 
        icon={result.totalPnL >= 0 ? TrendingUp : TrendingDown} 
        colorClass={result.totalPnL >= 0 ? "text-green-400" : "text-red-400"} 
      />
      <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50 flex flex-col items-center justify-center text-center">
         <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Status</div>
         <div className={`text-xs font-bold px-2 py-1 rounded ${result.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-slate-800 text-slate-400'}`}>
           {result.status.toUpperCase()}
         </div>
      </div>
    </div>
  );
};