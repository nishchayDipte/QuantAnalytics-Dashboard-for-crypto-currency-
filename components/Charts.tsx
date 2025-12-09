import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { AnalyticsDataPoint } from '../types';

interface ChartProps {
  data: AnalyticsDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs">
        <p className="text-slate-400 mb-1">{new Date(label).toLocaleTimeString()}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toFixed(4)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PriceChart: React.FC<ChartProps & { symbolA: string; symbolB: string }> = ({ data, symbolA, symbolB }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} 
          stroke="#94a3b8" 
          tick={{fontSize: 10}}
          minTickGap={30}
        />
        <YAxis yAxisId="left" stroke="#38bdf8" tick={{fontSize: 10}} domain={['auto', 'auto']} />
        <YAxis yAxisId="right" orientation="right" stroke="#f472b6" tick={{fontSize: 10}} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="priceA" 
          name={symbolA.toUpperCase()} 
          stroke="#38bdf8" 
          dot={false} 
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="priceB" 
          name={symbolB.toUpperCase()} 
          stroke="#f472b6" 
          dot={false} 
          strokeWidth={2}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const SpreadChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} 
          stroke="#94a3b8" 
          tick={{fontSize: 10}}
          minTickGap={30}
        />
        <YAxis stroke="#e2e8f0" tick={{fontSize: 10}} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
        <Line 
          type="monotone" 
          dataKey="spread" 
          name="Spread" 
          stroke="#e2e8f0" 
          dot={false} 
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const ZScoreChart: React.FC<ChartProps & { threshold: number }> = ({ data, threshold }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} 
          stroke="#94a3b8" 
          tick={{fontSize: 10}}
          minTickGap={30}
        />
        <YAxis 
          stroke="#e2e8f0" 
          tick={{fontSize: 10}} 
          // Dynamically adjust domain to ensure threshold lines are always visible
          domain={[
            (dataMin: number) => Math.min(dataMin, -threshold * 1.2),
            (dataMax: number) => Math.max(dataMax, threshold * 1.2)
          ]}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Threshold Lines */}
        <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Upper', fill: '#ef4444', fontSize: 10 }} />
        <ReferenceLine y={-threshold} stroke="#22c55e" strokeDasharray="3 3" label={{ position: 'right', value: 'Lower', fill: '#22c55e', fontSize: 10 }} />
        <ReferenceLine y={0} stroke="#94a3b8" />

        <Line 
          type="step" 
          dataKey="zScore" 
          name="Z-Score" 
          stroke="#8b5cf6" 
          dot={false} 
          strokeWidth={2}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};