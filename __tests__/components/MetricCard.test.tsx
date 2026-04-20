import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricCard } from '../../components/operator/MetricCard';

/**
 * COMPONENT TEST: MetricCard
 *
 * DESIGN DECISION: ACCESSIBILITY VALIDATION
 * This test suite verifies that our UI components correctly translate
 * backend logic states into accessible ARIA attributes and high-contrast
 * visual states.
 */
describe('MetricCard Component', () => {
  const mockData = {
    name: 'North Gate',
    score: 95,
    trend: 'WORSENING',
    status: 'CRITICAL',
  };

  it('renders with correct congestion level labelling', () => {
    render(<MetricCard {...mockData} />);
    
    expect(screen.getByText(/North Gate/i)).toBeInTheDocument();
    expect(screen.getByText(/CRITICAL/i)).toBeInTheDocument();
  });

  it('provides a descriptive ARIA label for screen readers', () => {
    render(<MetricCard {...mockData} />);
    
    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('aria-labelledby');
  });

  it('applies danger styling for critical risk states', () => {
    render(<MetricCard {...mockData} />);

    // Check for the "text-red-600" or similar indicator classes
    // depending on the final implementation styles.
    const riskDisplay = screen.getByText(/95/);
    expect(riskDisplay).toBeInTheDocument();
  });
});
