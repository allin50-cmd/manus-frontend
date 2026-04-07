import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
}

export function SectionHeading({ title, subtitle, className, centered = true }: Props) {
  return (
    <div className={cn(centered && 'text-center', 'mb-10', className)}>
      <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}
