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
        'flex flex-col items-center gap-3 rounded-kuteka border border-dashed border-slate-200 bg-white px-6 py-12 text-center',
        className,
      )}
    >
      <p className="text-base font-medium text-slate-800">{title}</p>
      <Text className="max-w-md text-sm text-slate-500">{description}</Text>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
