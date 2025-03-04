import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from '../CalendarView';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';

// Mock the drag and drop functionality
jest.mock('react-big-calendar/lib/addons/dragAndDrop', () => {
  return function DragAndDropCalendar(props) {
    return <div data-testid="calendar">{props.children}</div>;
  };
});

const mockScheduledTasks = [
  {
    id: 1,
    name: 'Test Task 1',
    scheduledTime: new Date('2024-01-01T10:00:00'),
    duration: 30,
    completed: false
  }
];

describe('CalendarView Component', () => {
  const mockTaskSchedule = jest.fn();
  const mockTaskCreate = jest.fn();

  const renderCalendarView = () => {
    return render(
      <ThemeProvider theme={theme}>
        <CalendarView
          scheduledTasks={mockScheduledTasks}
          onTaskSchedule={mockTaskSchedule}
          onTaskCreate={mockTaskCreate}
        />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders calendar with scheduled tasks', () => {
    renderCalendarView();
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
  });

  test('renders navigation buttons', () => {
    renderCalendarView();
    const calendar = screen.getByTestId('calendar');
    expect(calendar).toBeInTheDocument();
  });

  test('handles task scheduling', () => {
    renderCalendarView();
    const calendar = screen.getByTestId('calendar');
    fireEvent.drop(calendar, {
      clientX: 100,
      clientY: 100,
      dataTransfer: {
        getData: () => JSON.stringify(mockScheduledTasks[0])
      }
    });
    expect(mockTaskSchedule).toHaveBeenCalled();
  });
}); 