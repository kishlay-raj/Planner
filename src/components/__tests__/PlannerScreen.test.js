import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlannerScreen from '../PlannerScreen';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import { DragDropContext } from 'react-beautiful-dnd';
import * as AuthContext from '../../contexts/AuthContext';
import * as FirestoreHooks from '../../hooks/useFirestoreNew';

// --- Mocks ---
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useFirestoreNew');
jest.mock('../CalendarView', () => () => <div data-testid="calendar-view">Calendar View</div>);
jest.mock('../TaskList', () => ({ onTaskCreate }) => (
  <div data-testid="task-list">
    Task List
    <button onClick={() => onTaskCreate({ name: 'New Task' })}>Add Mock Task</button>
  </div>
));
jest.mock('../NotesPanel', () => () => <div data-testid="notes-panel">Notes Panel</div>);

describe('PlannerScreen Component', () => {
  // Shared mock functions
  const mockAddTask = jest.fn();
  const mockUpdateTask = jest.fn();
  const mockDeleteTask = jest.fn();
  const mockSetWeeklyData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Auth Mock
    AuthContext.useAuth.mockReturnValue({
      currentUser: { uid: 'test-user', displayName: 'Test User' },
      loginWithGoogle: jest.fn(),
      logout: jest.fn(),
      authError: null,
    });

    // Setup Firestore Collection Mock
    FirestoreHooks.useFirestoreCollection.mockReturnValue([
      [
        { id: '1', name: 'Task 1', completed: false, createdAt: 123 },
        { id: '2', name: 'Task 2', completed: true, createdAt: 124 }
      ],
      mockAddTask,
      mockUpdateTask,
      mockDeleteTask,
      false // loading
    ]);

    // Setup Firestore Doc Mock
    FirestoreHooks.useFirestoreDoc.mockReturnValue([
      { focus: 'Test Focus' }, // weeklyData
      mockSetWeeklyData, // setWeeklyData
      false // loading
    ]);
  });

  const renderPlannerScreen = () => {
    return render(
      <ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={() => { }}>
          <PlannerScreen />
        </DragDropContext>
      </ThemeProvider>
    );
  };

  beforeAll(() => {
    // Mock window.matchMedia not implemented in JSDOM
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

  it('renders main layout components', () => {
    renderPlannerScreen();

    expect(screen.getByText('Flow Planner')).toBeInTheDocument();
    expect(screen.getByText('WEEKLY FOCUS')).toBeInTheDocument();
    expect(screen.getByText('Test Focus')).toBeInTheDocument();

    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
    expect(screen.getByTestId('notes-panel')).toBeInTheDocument();
  });

  it('does NOT show the Reset All Tasks button (moved to Settings)', () => {
    renderPlannerScreen();
    // The reset button was removed, so we verify it's not present
    const resetButton = screen.queryByTitle('Reset All Tasks');
    expect(resetButton).not.toBeInTheDocument();
  });

  it('can create a task via interaction', async () => {
    renderPlannerScreen();

    // Find our mock task list button
    const addMockBtn = screen.getByText('Add Mock Task');
    fireEvent.click(addMockBtn);

    await waitFor(() => {
      // We expect addTask to be called with name and some defaults
      expect(mockAddTask).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Task',
        completed: false
      }));
    });
  });
});