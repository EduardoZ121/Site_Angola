'use client';

import { Button, type ButtonProps } from '@kuteka/ui';

export type SubmitState = 'idle' | 'disabled' | 'loading' | 'success' | 'error';

interface SubmitButtonProps extends Omit<ButtonProps, 'loading'> {
  state: SubmitState;
  idleLabel: string;
  loadingLabel: string;
  successLabel?: string;
}

/** R10 — five CTA states via disabled / loading / labels */
export function SubmitButton({
  state,
  idleLabel,
  loadingLabel,
  successLabel,
  disabled: _disabled,
  ...props
}: SubmitButtonProps) {
  const loading = state === 'loading';
  const disabled = state === 'disabled' || state === 'loading' || state === 'success';
  const label =
    state === 'loading'
      ? loadingLabel
      : state === 'success' && successLabel
        ? successLabel
        : idleLabel;

  return (
    <Button type="submit" loading={loading} disabled={disabled} {...props}>
      {label}
    </Button>
  );
}
