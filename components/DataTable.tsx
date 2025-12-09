import React from 'react';
import { AnalyticsDataPoint } from '../types';
import { Download } from 'lucide-react';

interface DataTableProps {
  data: AnalyticsDataPoint[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const handleExport = () => {
    if (data.length === 0) return;
    const headers = ['Timestamp', 'PriceA', 'PriceB', 'Spread', 'ZScore', 'HedgeRatio'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        [new Date(row.timestamp).toISOString(), row.priceA, row.priceB, row.spread, row.zScore, row.hedgeRatio].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics_full_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show last 100 points reversed
  const displayData = [...data].reverse().slice(0, 100);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900/50 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-200">Historical Data (Last 100 sampled points)</h3>
        <button 
          onClick={handleExport}
          disabled={data.length === 0}
          className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <Download size={14} /> CSV
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 font-medium text-slate-400">Time</th>
              <th className="px-4 py-2 font-medium text-slate-400">Price A</th>
              <th className="px-4 py-2 font-medium text-slate-400">Price B</th>
              <th className="px-4 py-2 font-medium text-slate-400">Spread</th>
              <th className="px-4 py-2 font-medium text-slate-400">Z-Score</th>
              <th className="px-4 py-2 font-medium text-slate-400">Hedge Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {displayData.map((row) => (
              <tr key={row.timestamp} className="hover:bg-slate-800/50">
                <td className="px-4 py-1.5 font-mono text-slate-500">{new Date(row.timestamp).toLocaleTimeString()}</td>
                <td className="px-4 py-1.5 font-mono">{row.priceA.toFixed(2)}</td>
                <td className="px-4 py-1.5 font-mono">{row.priceB.toFixed(2)}</td>
                <td className="px-4 py-1.5 font-mono">{row.spread.toFixed(4)}</td>
                <td className={`px-4 py-1.5 font-mono font-medium ${Math.abs(row.zScore) > 2 ? (row.zScore > 0 ? 'text-red-400' : 'text-green-400') : ''}`}>
                  {row.zScore.toFixed(3)}
                </td>
                <td className="px-4 py-1.5 font-mono text-slate-500">{row.hedgeRatio.toFixed(4)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};