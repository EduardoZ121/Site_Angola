import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@kuteka/shared';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('text-sm font-semibold text-stone-900', className)} {...props} />
));

Label.displayName = 'Label';
