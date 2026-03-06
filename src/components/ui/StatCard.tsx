import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES = {
  default: { card: '', icon: 'bg-gray-100 text-gray-600', value: 'text-gray-900' },
  success: { card: 'border-green-200', icon: 'bg-green-100 text-green-600', value: 'text-green-700' },
  warning: { card: 'border-amber-200', icon: 'bg-amber-100 text-amber-600', value: 'text-amber-700' },
  danger: { card: 'border-red-200', icon: 'bg-red-100 text-red-600', value: 'text-red-700' },
  info: { card: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', value: 'text-blue-700' },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  onClick,
  className,
}: StatCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        'card p-5',
        styles.card,
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className={cn('text-2xl font-bold mt-1 font-mono', styles.value)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-1 text-xs font-medium',
              trend.value >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              <span>{trend.value >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2.5 flex-shrink-0', styles.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
