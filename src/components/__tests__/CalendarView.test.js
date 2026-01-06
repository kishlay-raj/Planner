import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from '../CalendarView';

// Mock dependencies
jest.mock('react-big-calendar', () => {
  return {
    Calendar: ({ events, onSelectSlot, onDoubleClickEvent }) => {
      return (
        <div data-testid="mock-calendar">
          {events.map(event => (
            <div
              key={event.id}
              data-testid={`event-${event.id}`}
              onDoubleClick={() => onDoubleClickEvent && onDoubleClickEvent(event)}
            >
              {event.title}
            </div>
          ))}
          <button
            data-testid="slot-trigger"
            onClick={() => onSelectSlot && onSelectSlot({ start: new Date('2026-01-01T10:00:00') })}
          >
            Click Slot
          </button>
        </div>
      );
    },
    dateFnsLocalizer: () => ({})
  };
});

jest.mock('react-big-calendar/lib/addons/dragAndDrop', () => {
  return (CalendarComponent) => (props) => <CalendarComponent {...props} />;
});

// Mock QuickTaskDialog and TaskEditDialog
jest.mock('../QuickTaskDialog', () => ({ open, onSave }) => (
  open ? (
    <div data-testid="quick-task-dialog">
      <button onClick={() => onSave({ name: 'New Quick Task', duration: 30 })}>Save</button>
    </div>
  ) : null
));

jest.mock('../TaskEditDialog', () => ({ open, task, onSave }) => (
  open ? (
    <div data-testid="task-edit-dialog">
      Editing: {task?.name}
      <button onClick={() => onSave({ ...task, name: 'Updated Task' })}>Save</button>
    </div>
  ) : null
));

describe('CalendarView Component', () => {
  const mockOnTaskSchedule = jest.fn();
  const mockOnTaskCreate = jest.fn();
  const mockOnTaskUpdate = jest.fn();
  const mockOnDateChange = jest.fn();
  const selectedDate = new Date('2026-01-01');

  const scheduledTasks = [
    {
      id: 1,
      name: 'Meeting',
      duration: 60,
      scheduledTime: '2026-01-01T09:00:00',
      completed: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderCalendar = (tasks = scheduledTasks) => {
    return render(
      <CalendarView
        scheduledTasks={tasks}
        onTaskSchedule={mockOnTaskSchedule}
        onTaskCreate={mockOnTaskCreate}
        onTaskUpdate={mockOnTaskUpdate}
        selectedDate={selectedDate}
        onDateChange={mockOnDateChange}
      />
    );
  };

  it('renders scheduled tasks as events', () => {
    renderCalendar();
    expect(screen.getByTestId('event-1')).toBeInTheDocument();
    expect(screen.getByText(/Meeting/)).toBeInTheDocument();
  });

  it('filters out tasks with invalid scheduledTime', () => {
    const tasksWithInvalid = [
      ...scheduledTasks,
      { id: 2, name: 'Invalid Task', duration: 30, scheduledTime: null }
    ];
    renderCalendar(tasksWithInvalid);
    expect(screen.getByTestId('event-1')).toBeInTheDocument();
    expect(screen.queryByTestId('event-2')).not.toBeInTheDocument();
  });

  it('opens QuickTaskDialog when clicking a slot', () => {
    renderCalendar();
    fireEvent.click(screen.getByTestId('slot-trigger'));
    expect(screen.getByTestId('quick-task-dialog')).toBeInTheDocument();
  });

  it('creates a new task via QuickTaskDialog', () => {
    renderCalendar();
    fireEvent.click(screen.getByTestId('slot-trigger'));

    fireEvent.click(within(screen.getByTestId('quick-task-dialog')).getByText('Save'));

    expect(mockOnTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Quick Task',
      date: '2026-01-01'
    }));
  });

  it('opens TaskEditDialog when double clicking an event', () => {
    renderCalendar();
    fireEvent.doubleClick(screen.getByTestId('event-1'));
    expect(screen.getByTestId('task-edit-dialog')).toBeInTheDocument();
    expect(screen.getByText('Editing: Meeting')).toBeInTheDocument();
  });

  it('saves updated task from TaskEditDialog', () => {
    renderCalendar();
    fireEvent.doubleClick(screen.getByTestId('event-1'));

    fireEvent.click(within(screen.getByTestId('task-edit-dialog')).getByText('Save'));

    expect(mockOnTaskUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      name: 'Updated Task'
    }));
  });
});

import { within } from '@testing-library/react';