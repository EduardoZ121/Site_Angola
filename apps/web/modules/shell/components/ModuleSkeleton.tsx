import { cn } from '@kuteka/shared';

type ModuleSkeletonProps = {
  rows?: number;
  className?: string;
};

/** Transient loading placeholder — avoids permanent "A carregar…" copy. */
export function ModuleSkeleton({ rows = 3, className }: ModuleSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-kuteka border border-slate-100 bg-slate-100/80"
        />
      ))}
    </div>
  );
}
