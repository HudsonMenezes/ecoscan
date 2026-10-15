import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renderiza o nome do app', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'EcoScan' })).toBeInTheDocument();
  });
});
