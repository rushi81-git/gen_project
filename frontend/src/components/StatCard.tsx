import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: 'bronze' | 'emerald' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'bronze'
}) => {
  const badgeClasses = {
    bronze: 'bg-[#2a1d13] text-[#C6915A] border-[#442f1f]',
    emerald: 'bg-[#152319] text-[#78c291] border-[#223d2b]',
    amber: 'bg-[#261f17] text-[#C6915A] border-[#423322]',
    rose: 'bg-[#281818] text-[#e07d7d] border-[#472626]',
  }[badgeColor];

  return (
    <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 transition duration-200 hover:border-[#444444] shadow-lumen flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[#A5A19C]">
            {title}
          </span>
          {Icon && (
            <div className="p-1.5 rounded bg-[#111111] border border-[#2b2b2b] text-[#C6915A]">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-light tracking-tight text-[#F1D7AE]">
            {value}
          </div>
          {badge && (
            <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 rounded border uppercase ${badgeClasses}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
      {subtitle && (
        <p className="text-[11px] text-[#A5A19C] mt-3 font-normal leading-relaxed border-t border-[#242424] pt-2.5">
          {subtitle}
        </p>
      )}
    </div>
  );
};
