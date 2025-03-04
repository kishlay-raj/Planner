import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuickTaskDialog from '../QuickTaskDialog';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';

jest.mock('@mui/material/Dialog', () => {
  return ({ children, open }) => open ? <div>{children}</div> : null;
});

describe('QuickTaskDialog Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const selectedTime = new Date();

  const renderDialog = (open = true) => {
    return render(
      <ThemeProvider theme={theme}>
        <QuickTaskDialog
          open={open}
          selectedTime={selectedTime}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dialog when open', () => {
    renderDialog();
    expect(screen.getByText('Quick Add Task')).toBeInTheDocument();
  });

  test('can create task', () => {
    renderDialog();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Quick Task' } });
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Quick Task'
    }));
  });

  test('can close dialog', () => {
    renderDialog();
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 