import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskList from '../TaskList';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DragDropContext } from 'react-beautiful-dnd';

// Mock firebase
jest.mock('../../firebase', () => ({
  logAnalyticsEvent: jest.fn()
}));

// Mock theme
const theme = createTheme({
  palette: {
    priority: {
      p1: '#d32f2f',
      p2: '#ed6c02',
      p3: '#0288d1',
      p4: '#546e7a'
    },
    tag: {
      work: '#2e7d32',
      personal: '#7b1fa2',
      study: '#e65100',
      health: '#0097a7'
    }
  }
});

const mockTasks = [
  {
    id: 1,
    name: 'Critical Task',
    priority: 'P1',
    duration: 30,
    date: '2026-01-01',
    completed: false
  },
  {
    id: 2,
    name: 'Low Priority Task',
    priority: 'P4',
    duration: 15,
    date: '2026-01-01',
    completed: false
  }
];

describe('TaskList Component', () => {
  const mockOnTaskUpdate = jest.fn();
  const mockOnTaskCreate = jest.fn();
  const mockOnTaskSchedule = jest.fn();
  const selectedDate = new Date('2026-01-01T12:00:00');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView for all tests since it's not implemented in jsdom
    Element.prototype.scrollIntoView = jest.fn();
  });

  const renderTaskList = () => {
    return render(
      <ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={() => { }}>
          <TaskList
            tasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskCreate={mockOnTaskCreate}
            onTaskSchedule={mockOnTaskSchedule}
            selectedDate={selectedDate}
          />
        </DragDropContext>
      </ThemeProvider>
    );
  };

  it('renders priority sections correctly', () => {
    renderTaskList();
    expect(screen.getByText('P1 - Critical')).toBeInTheDocument();
    expect(screen.getByText('P4 - Low (To-Do Later)')).toBeInTheDocument();
  });

  it('renders filtered tasks for the selected date', () => {
    renderTaskList();
    expect(screen.getByText('Critical Task')).toBeInTheDocument();
    expect(screen.getByText('Low Priority Task')).toBeInTheDocument();
  });

  it('does not render tasks for other dates', () => {
    render(
      <ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={() => { }}>
          <TaskList
            tasks={mockTasks}
            // Different date
            selectedDate={new Date('2026-01-02T12:00:00')}
            onTaskUpdate={mockOnTaskUpdate}
          />
        </DragDropContext>
      </ThemeProvider>
    );
    expect(screen.queryByText('Critical Task')).not.toBeInTheDocument();
  });

  it('shows empty state when no tasks exist', () => {
    render(
      <ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={() => { }}>
          <TaskList
            tasks={[]}
            selectedDate={selectedDate}
            onTaskUpdate={mockOnTaskUpdate}
          />
        </DragDropContext>
      </ThemeProvider>
    );
    // "No tasks" should appear for each priority section (4 times)
    const emptyStateMessages = screen.getAllByText('No tasks');
    expect(emptyStateMessages.length).toBeGreaterThanOrEqual(4);
  });

  it('can toggle task completion', async () => {
    const { logAnalyticsEvent } = require('../../firebase');

    renderTaskList();
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnTaskUpdate).toHaveBeenCalled();
    });

    // Verify analytics event
    await waitFor(() => {
      expect(logAnalyticsEvent).toHaveBeenCalledWith('task_completed', {
        priority: 'P1'
      });
    });

    // Check if the update function was called with modified task list
    const updatedTasks = mockOnTaskUpdate.mock.calls[0][0];
    expect(updatedTasks.find(t => t.id === 1).completed).toBe(true);
  });

  it('logs task_uncompleted analytics event when unchecking task', async () => {
    const { logAnalyticsEvent } = require('../../firebase');

    // Create a completed task with proper structure
    const completedTasks = [
      {
        id: 3,
        name: 'Completed Task',
        priority: 'P2',
        duration: 30,
        date: '2026-01-01',
        completed: true
      }
    ];

    render(
      <ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={() => { }}>
          <TaskList
            tasks={completedTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskCreate={mockOnTaskCreate}
            onTaskSchedule={mockOnTaskSchedule}
            selectedDate={selectedDate}
          />
        </DragDropContext>
      </ThemeProvider>
    );

    // Expand the completed section to reveal the checkbox
    const completedHeader = screen.getByText('Completed');
    fireEvent.click(completedHeader);

    // Wait for the section to expand and find the checkbox
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    // Now click the checkbox
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(logAnalyticsEvent).toHaveBeenCalledWith('task_uncompleted', {
        priority: 'P2'
      });
    });
  });

  it('can quick add a task', () => {
    renderTaskList();

    // Find input for P1 section (first one)
    const inputs = screen.getAllByPlaceholderText('Add a task...');
    const p1Input = inputs[0];

    fireEvent.change(p1Input, { target: { value: 'New P1 Task' } });
    fireEvent.keyPress(p1Input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockOnTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New P1 Task',
      priority: 'P1'
    }));
  });

  it('scrolls to completed section when expanded', () => {
    jest.useFakeTimers();
    // Mock scrollIntoView
    const scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    renderTaskList();

    // Find the Completed accordion summary
    const completedHeader = screen.getByText('Completed');
    // Click to expand
    fireEvent.click(completedHeader);

    // Fast-forward time for the 100ms delay in TaskList.js
    jest.advanceTimersByTime(110);

    // Check if scrollIntoView was called
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    });

    jest.useRealTimers();
  });
});