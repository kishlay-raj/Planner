import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskList from '../TaskList';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import { DragDropContext } from 'react-beautiful-dnd';

const mockTasks = [
  {
    id: 1,
    name: 'Test Task 1',
    priority: 'P1',
    duration: 30,
    isToday: true,
    completed: false,
    important: true,
    urgent: true
  },
  {
    id: 2,
    name: 'Test Task 2',
    priority: 'P2',
    duration: 45,
    isToday: false,
    completed: false,
    important: false,
    urgent: false
  }
];

describe('TaskList Component', () => {
  const mockTaskUpdate = jest.fn();
  const mockTaskSchedule = jest.fn();

  const renderTaskList = () => {
    return render(
      <ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={() => {}}>
          <TaskList
            tasks={mockTasks}
            onTaskUpdate={mockTaskUpdate}
            onTaskSchedule={mockTaskSchedule}
          />
        </DragDropContext>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all priority sections', () => {
    renderTaskList();
    expect(screen.getByText('P1 - Critical')).toBeInTheDocument();
    expect(screen.getByText('P2 - High')).toBeInTheDocument();
    expect(screen.getByText('P3 - Medium')).toBeInTheDocument();
    expect(screen.getByText('P4 - Low')).toBeInTheDocument();
  });

  test('can add new task', () => {
    renderTaskList();
    const input = screen.getAllByPlaceholderText('Add a task...')[0];
    fireEvent.change(input, { target: { value: 'New Task' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(mockTaskUpdate).toHaveBeenCalled();
  });

  test('can mark task as complete', () => {
    renderTaskList();
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    expect(mockTaskUpdate).toHaveBeenCalled();
  });

  test('switches between Priorities and Tasks tabs', () => {
    renderTaskList();
    const tasksTab = screen.getByText('Tasks');
    fireEvent.click(tasksTab);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Dump')).toBeInTheDocument();
  });

  beforeAll(() => {
    // Mock the scrollIntoView function
    Element.prototype.scrollIntoView = jest.fn();
  });
}); 