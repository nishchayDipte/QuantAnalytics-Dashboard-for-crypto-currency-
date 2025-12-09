import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, action }) => {
  return (
    <div className={clsx("bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col", className)}>
      {(title || action) && (
        <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-4 flex-1 relative min-h-0">
        {children}
      </div>
    </div>
  );
};