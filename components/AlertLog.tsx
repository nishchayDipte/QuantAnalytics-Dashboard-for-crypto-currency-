import React from 'react';
import { AlertLog as AlertLogType } from '../types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface AlertLogProps {
  logs: AlertLogType[];
}

export const AlertLog: React.FC<AlertLogProps> = ({ logs }) => {
  return (
    <div className="h-full overflow-y-auto pr-2 space-y-2">
      {logs.length === 0 && (
        <div className="text-slate-500 text-xs text-center mt-10">No alerts triggered yet.</div>
      )}
      {logs.slice().reverse().map((log) => (
        <div key={log.id} className="flex items-start gap-2 bg-slate-900/50 p-2 rounded border border-slate-700/50">
          <AlertTriangle size={14} className="text-amber-500 mt-1 shrink-0" />
          <div>
            <div className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
            <div className="text-sm text-slate-200">{log.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
};