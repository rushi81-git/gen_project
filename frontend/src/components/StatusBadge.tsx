import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toLowerCase();

  // Subdued architectural palette
  let bg = 'bg-[#1c1c1c] text-[#A5A19C] border-[#303030]';
  let dot = 'bg-[#A5A19C]';

  if (['ready', 'healthy', 'success', 'resolved', 'running'].includes(norm)) {
    bg = 'bg-[#152319] text-[#78c291] border-[#223d2b]';
    dot = 'bg-[#78c291]';
  } else if (['loading', 'configured', 'acknowledged'].includes(norm)) {
    bg = 'bg-[#261f17] text-[#C6915A] border-[#423322]';
    dot = 'bg-[#C6915A] animate-pulse';
  } else if (['degraded', 'warning'].includes(norm)) {
    bg = 'bg-[#2a2216] text-[#dfaa70] border-[#4a3a24]';
    dot = 'bg-[#dfaa70]';
  } else if (['failed', 'unhealthy', 'unavailable', 'critical', 'stopped'].includes(norm)) {
    bg = 'bg-[#281818] text-[#e07d7d] border-[#472626]';
    dot = 'bg-[#e07d7d]';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border tracking-wide font-medium ${bg} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};
