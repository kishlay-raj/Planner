import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlannerScreen from '../PlannerScreen';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import { DragDropContext } from 'react-beautiful-dnd';

jest.mock('../TaskCreationButton', () => ({
  __esModule: true,
  default: () => <button aria-label="Add Task">Add Task</button>
}));

describe('PlannerScreen Component', () => {
  const renderPlannerScreen = () => {
    return render(
      <ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={() => {}}>
          <PlannerScreen />
        </DragDropContext>
      </ThemeProvider>
    );
  };

  beforeAll(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  beforeEach(() => {
    localStorage.clear();
  });

  test('renders main components', () => {
    renderPlannerScreen();
    expect(screen.getByText('Planner')).toBeInTheDocument();
    expect(screen.getByTitle('Reset All Tasks')).toBeInTheDocument();
  });

  test('can create new task', () => {
    renderPlannerScreen();
    const addButton = screen.getByLabelText('Add Task');
    fireEvent.click(addButton);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Task' } });
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    expect(localStorage.getItem('allTasks')).toContain('New Task');
  });

  test('can reset all tasks', () => {
    renderPlannerScreen();
    const resetButton = screen.getByTitle('Reset All Tasks');
    fireEvent.click(resetButton);
    const confirmButton = screen.getByText('Reset All');
    fireEvent.click(confirmButton);
    expect(localStorage.getItem('allTasks')).toBe('[]');
  });
}); 