import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Providers } from './Providers';

describe('Providers', () => {
  it('renders children without crashing', () => {
    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <Providers>
        <span data-testid="a">A</span>
        <span data-testid="b">B</span>
      </Providers>,
    );
    expect(screen.getByTestId('a')).toBeInTheDocument();
    expect(screen.getByTestId('b')).toBeInTheDocument();
  });
});
