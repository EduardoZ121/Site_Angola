import type { ReactNode } from 'react';
import { cn } from '@kuteka/shared';

type GlassSurfaceProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'form';
};

/** Semi-transparent panel for content over the workspace atmosphere. */
export function GlassSurface({ children, className, as: Tag = 'div' }: GlassSurfaceProps) {
  return <Tag className={cn('kuteka-glass', className)}>{children}</Tag>;
}
