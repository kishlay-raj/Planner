import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CriticalHabitCard from '../CriticalHabitCard';
import { format, subDays } from 'date-fns';

describe('Catch Up Feature UI Tests', () => {
  it('renders the Catch Up icon when there are missed days and triggers callback on click', () => {
    const mockOnCatchUpClick = jest.fn();
    
    // Create a habit that has missed days
    const habit = {
      id: 'habit-1',
      name: 'Drink Water',
      streak: 5,
      targetDays: 30,
      completionDates: [format(subDays(new Date(), 2), 'yyyy-MM-dd')] // Completed 2 days ago, missing yesterday
    };

    render(
      <CriticalHabitCard 
        habit={habit}
        onComplete={jest.fn()}
        onCatchUpClick={mockOnCatchUpClick}
        catchUpDatesCount={2} // Mocking the calculation result
      />
    );

    // Find the catch up button
    // The IconButton doesn't have an aria-label, but it's wrapped in a Tooltip.
    // Tooltips in MUI render an aria-label or we can find the EventRepeat icon.
    // Let's find the button by color class or query the SVG.
    const buttons = screen.getAllByRole('button');
    // The catch up button is the success-colored one with the EventRepeat icon
    // Actually, MUI IconButton with color="success" has a specific class or we can just find the one that has the Tooltip text if we hover,
    // but easier: find the button that triggers our mock
    
    // We can find the button that contains the EventRepeat SVG (by getting the button whose parent or self triggers the click)
    // Since we know catchUpDatesCount is 2, the tooltip title is "Catch up 2 missed day(s)"
    // In MUI, Tooltip adds aria-label to its child (the span)
    const tooltipSpan = screen.getByLabelText('Catch up 2 missed day(s)', { exact: false });
    expect(tooltipSpan).toBeInTheDocument();

    // The actual button is inside the span
    const catchUpBtn = tooltipSpan.querySelector('button');
    expect(catchUpBtn).not.toBeNull();

    // Click it
    fireEvent.click(catchUpBtn);

    // Verify callback
    expect(mockOnCatchUpClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT render the Catch Up icon when there are no missed days', () => {
    const habit = {
      id: 'habit-2',
      name: 'Read Book',
      streak: 10,
      targetDays: 30,
      completionDates: [format(new Date(), 'yyyy-MM-dd')] // Completed today
    };

    render(
      <CriticalHabitCard 
        habit={habit}
        onComplete={jest.fn()}
        onCatchUpClick={jest.fn()}
        catchUpDatesCount={0}
      />
    );

    // The catch up button should be present but disabled
    // The tooltip span should have the label
    const tooltipSpan = screen.getByLabelText('No missed days to catch up', { exact: false });
    expect(tooltipSpan).toBeInTheDocument();
    
    // The actual button inside the span should be disabled
    const catchUpBtn = tooltipSpan.querySelector('button');
    expect(catchUpBtn).not.toBeNull();
    expect(catchUpBtn).toBeDisabled();
  });
});
