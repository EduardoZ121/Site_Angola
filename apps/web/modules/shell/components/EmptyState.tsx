import type { ReactNode } from 'react';
import { Text } from '@kuteka/ui';
import { cn } from '@kuteka/shared';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

/** Informative empty state for module lists and hubs. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'kuteka-glass flex flex-col items-center gap-3 border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <p className="text-base font-medium text-slate-900">{title}</p>
      <Text className="max-w-md text-sm text-slate-600">{description}</Text>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
