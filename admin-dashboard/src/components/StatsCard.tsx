import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'red';
  trend?: { value: number; label: string };
}

const COLOR_MAP = {
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  blue:   'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  green:  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  red:    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export function StatsCard({ title, value, subtitle, icon: Icon, color = 'orange', trend }: Props) {
  return (
    <div className="card flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white truncate">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        {trend && (
          <p className={clsx('text-xs font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
      <div className={clsx('p-3 rounded-xl flex-shrink-0', COLOR_MAP[color])}>
        <Icon size={22} />
      </div>
    </div>
  );
}

