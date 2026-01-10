import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuickTaskDialog from '../QuickTaskDialog';

describe('QuickTaskDialog Component', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  const selectedTime = new Date('2026-01-01T10:00:00');
  const selectedDate = new Date('2026-01-01');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDialog = (open = true) => {
    return render(
      <QuickTaskDialog
        open={open}
        selectedTime={selectedTime}
        selectedDate={selectedDate}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
  };

  it('renders dialog when open', () => {
    renderDialog();
    expect(screen.getByText(/Add Task for/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Task Name/i)).toBeInTheDocument();
  });

  it('can create task', () => {
    renderDialog();

    // Use Label Text to be specific
    const nameInput = screen.getByLabelText(/Task Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Quick Task' } });

    // Find button
    const addButton = screen.getByRole('button', { name: /Add Task/i });

    // Check if enabled (it should be after typing)
    expect(addButton).not.toBeDisabled();

    fireEvent.click(addButton);

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Quick Task',
      priority: 'P1', // Default changed to P1
      duration: 30
    }));
  });

  it('closes on cancel', () => {
    renderDialog();
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});