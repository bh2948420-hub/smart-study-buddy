import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashCardProps {
  icon?: React.ElementType;
  iconClass?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

// Shared glass card shell used across the redesigned dashboard.
// Every card keeps the same rounded "cloud glass" look from the reference design.
export function DashCard({ icon: Icon, iconClass, title, action, children, className, bodyClassName }: DashCardProps) {
  return (
    <div className={cn('glass-card rounded-2xl p-4 flex flex-col min-h-0', className)}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className={cn('h-5 w-5 shrink-0', iconClass)} />}
          <h3 className="font-bold text-navy truncate">{title}</h3>
        </div>
        {action}
      </div>
      <div className={cn('flex-1 min-h-0 flex flex-col', bodyClassName)}>{children}</div>
    </div>
  );
}

export function ViewAllButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-bold text-primary hover:text-primary/80 whitespace-nowrap shrink-0 transition-colors"
    >
      {label} →
    </button>
  );
}
