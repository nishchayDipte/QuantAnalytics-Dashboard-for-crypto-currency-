import React from 'react';
import { AnalyticsDataPoint } from '../types';

interface StatsProps {
  lastPoint: AnalyticsDataPoint | undefined;
  dataCount: number;
}

const StatItem = ({ label, value, color = "text-slate-200" }: { label: string, value: string, color?: string }) => (
  <div className="flex flex-col">
    <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{label}</span>
    <span className={`text-xl font-mono font-medium ${color}`}>{value}</span>
  </div>
);

export const StatsPanel: React.FC<StatsProps> = ({ lastPoint, dataCount }) => {
  if (!lastPoint) return <div className="p-4 text-slate-500 text-sm">Waiting for data...</div>;

  const zScoreColor = Math.abs(lastPoint.zScore) > 2 
    ? (lastPoint.zScore > 0 ? "text-red-400" : "text-green-400") 
    : "text-slate-200";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatItem label="Price A" value={lastPoint.priceA.toFixed(2)} />
      <StatItem label="Price B" value={lastPoint.priceB.toFixed(2)} />
      <StatItem label="Spread" value={lastPoint.spread.toFixed(4)} />
      <StatItem label="Hedge Ratio" value={lastPoint.hedgeRatio.toFixed(4)} />
      <StatItem label="Z-Score" value={lastPoint.zScore.toFixed(3)} color={zScoreColor} />
      <StatItem label="Buffered Ticks" value={dataCount.toString()} />
    </div>
  );
};