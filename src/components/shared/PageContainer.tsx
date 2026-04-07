import { cn } from '@/lib/utils';

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto max-w-6xl px-4 py-8', className)}>
      {children}
    </div>
  );
}
