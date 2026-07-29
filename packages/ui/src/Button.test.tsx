import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './components/Button';
import { Input } from './components/Input';

afterEach(() => {
  cleanup();
});

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Continuar</Button>);
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
  });

  it('supports loading state', () => {
    render(<Button loading>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });
});

describe('Input', () => {
  it('marks invalid', () => {
    render(<Input aria-label="email" invalid />);
    expect(screen.getByLabelText('email')).toHaveAttribute('aria-invalid', 'true');
  });
});
