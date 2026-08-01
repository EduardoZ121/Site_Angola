import { SoftListSlot } from './SoftListSlot';

type ModuleSkeletonProps = {
  rows?: number;
  className?: string;
};

/**
 * @deprecated Prefer SoftListSlot — pulse skeletons caused visible flicker.
 * Kept as a thin alias so call sites fail soft until migrated.
 */
export function ModuleSkeleton({ className }: ModuleSkeletonProps) {
  return <SoftListSlot pending className={className} />;
}
