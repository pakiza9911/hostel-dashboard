import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'brand',
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  color?: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet';
  delay?: number;
}) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="card p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', colorMap[color])}>
          <Icon size={20} />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
              trend.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            )}
          >
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-ink-900 tracking-tight">{value}</div>
        <div className="text-sm text-ink-500 mt-0.5">{label}</div>
      </div>
    </motion.div>
  );
}
