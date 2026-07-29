import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@kuteka/shared';

const alertVariants = cva('rounded-kuteka border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default:
        'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
      success: 'border-green-200 bg-green-50 text-green-900',
      warning: 'border-amber-200 bg-amber-50 text-amber-900',
      danger: 'border-red-200 bg-red-50 text-red-900',
      info: 'border-blue-200 bg-blue-50 text-blue-900',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

/** Toast provider stub — full toast system in a later phase */
export function ToastProviderStub({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
