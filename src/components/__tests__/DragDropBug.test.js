import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskList from '../TaskList';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DragDropContext } from 'react-beautiful-dnd';

// Mock react-beautiful-dnd to properly execute drag end
jest.mock('react-beautiful-dnd', () => ({
    Droppable: ({ children }) => children({
        draggableProps: {
            style: {},
        },
        innerRef: jest.fn(),
        placeholder: null,
    }, {}),
    Draggable: ({ children }) => children({
        draggableProps: {
            style: {},
        },
        innerRef: jest.fn(),
        dragHandleProps: {},
        placement: {},
    }, {
        isDragging: false,
    }),
    DragDropContext: ({ children, onDragEnd }) => {
        return (
            <div data-testid="drag-drop-context">
                <button
                    data-testid="simulate-drag"
                    onClick={() => {
                        // Simulate dragging task "abc-123" from P1 to P2
                        onDragEnd({
                            draggableId: "abc-123",
                            source: { droppableId: "P1-priority-list", index: 0 },
                            destination: { droppableId: "P2-priority-list", index: 0 }
                        });
                    }}
                >
                    Simulate Drag
                </button>
                {children}
            </div>
        );
    }
}));

const theme = createTheme({
    palette: {
        priority: { p1: '#ff0000', p2: '#ff9900', p3: '#ffff00', p4: '#00ff00' },
        tag: { work: '#0000ff', personal: '#00ff00', study: '#ff00ff', health: '#00ffff' }
    }
});

test('onTaskUpdate is called correctly when dragging a task with alphanumeric ID', () => {
    const handleTaskUpdate = jest.fn();
    const selectedDate = new Date('2024-01-01');
    const tasks = [
        {
            id: 'abc-123', // Alphanumeric string ID
            name: 'Test Task',
            priority: 'P1',
            completed: false,
            date: '2024-01-01',
            duration: 30
        }
    ];

    render(
        <ThemeProvider theme={theme}>
            <TaskList
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
                selectedDate={selectedDate}
            />
        </ThemeProvider>
    );

    // Click the simulation button
    fireEvent.click(screen.getByTestId('simulate-drag'));

    // Expect the update function to be called with the updated task
    // The task should now be P2
    expect(handleTaskUpdate).toHaveBeenCalled();
    const updatedTasks = handleTaskUpdate.mock.calls[0][0];

    // Check if it's the single task array as per my optimization
    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].id).toBe('abc-123');
    expect(updatedTasks[0].priority).toBe('P2');
});
