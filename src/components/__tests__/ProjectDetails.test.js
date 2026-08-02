import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectDetails from '../ProjectDetails';
import { useFirestore } from '../../hooks/useFirestore';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock useFirestore hook
jest.mock('../../hooks/useFirestore');

// Mock NotesPanel component to isolate testing
jest.mock('../NotesPanel', () => {
    return function DummyNotesPanel({ customPath, title }) {
        return <div data-testid="mock-notes-panel">{title} - {customPath}</div>;
    };
});

const mockTheme = createTheme();

describe('ProjectDetails Component', () => {
    let mockProjects;
    let mockTasks;
    let mockFeedbacks;
    let mockSetProjects;
    let mockSetTasks;
    let mockSetFeedbacks;
    let mockOnBack;

    beforeEach(() => {
        jest.clearAllMocks();

        mockProjects = [
            {
                id: 'project1',
                name: 'E-Commerce Redesign',
                description: 'Overhaul the shopping experience and checkout funnel.',
                priority: true,
                archived: false,
                createdAt: new Date('2026-01-01').toISOString()
            }
        ];

        mockTasks = [
            {
                id: 'task1',
                name: 'Design high-fidelity wireframes',
                priority: 'P1',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 'task2',
                name: 'Integrate checkout gateway',
                priority: 'P2',
                completed: true,
                createdAt: new Date().toISOString()
            }
        ];

        mockFeedbacks = [
            {
                id: 'feedback1',
                name: 'Slow checkout loading times on mobile',
                content: 'Checkout takes more than 5 seconds to load on LTE networks.',
                priority: 'high',
                highMonetaryImpact: true,
                createdAt: new Date().toISOString()
            }
        ];

        mockSetProjects = jest.fn();
        mockSetTasks = jest.fn();
        mockSetFeedbacks = jest.fn();
        mockOnBack = jest.fn();

        useFirestore.mockImplementation((key, defaultValue) => {
            if (key === 'projects') {
                return [mockProjects, mockSetProjects, false, false];
            }
            if (key === 'project_project1_tasks') {
                return [mockTasks, mockSetTasks, false, false];
            }
            if (key === 'project_project1_feedbacks') {
                return [mockFeedbacks, mockSetFeedbacks, false, false];
            }
            return [defaultValue, jest.fn(), false, false];
        });
    });

    const renderDetails = () => {
        return render(
            <ThemeProvider theme={mockTheme}>
                <ProjectDetails projectId="project1" onBack={mockOnBack} />
            </ThemeProvider>
        );
    };

    it('renders project metadata, headers, back button and initial stats', () => {
        renderDetails();

        // Check metadata & title
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
        expect(screen.getByText('E-Commerce Redesign')).toBeInTheDocument();
        expect(screen.getByText('Overhaul the shopping experience and checkout funnel.')).toBeInTheDocument();

        // Check stats values (Tasks percent, Feedbacks logged, High impact counter)
        expect(screen.getByText('1/2')).toBeInTheDocument(); // completed tasks/total
        expect(screen.getByText('Tasks (50%)')).toBeInTheDocument();

        const feedbackStatBox = screen.getByText('Feedbacks').closest('div');
        expect(within(feedbackStatBox).getByText('1')).toBeInTheDocument();

        const highImpactStatBox = screen.getByText('High Impact').closest('div');
        expect(within(highImpactStatBox).getByText('1')).toBeInTheDocument();
    });

    it('triggers onBack when Back to Projects is clicked', () => {
        renderDetails();

        const backBtn = screen.getByRole('button', { name: /back to projects/i });
        fireEvent.click(backBtn);

        expect(mockOnBack).toHaveBeenCalled();
    });

    it('renders all sections simultaneously (Tasks, Feedback, and Notes)', () => {
        renderDetails();

        // Verify Priority Tasks section header
        expect(screen.getByText('Priority Tasks')).toBeInTheDocument();
        expect(screen.getByText('P1 - Critical')).toBeInTheDocument();

        // Verify User Feedback section header
        expect(screen.getByText('User Feedback')).toBeInTheDocument();
        expect(screen.getByText('Log User Feedback')).toBeInTheDocument();

        // Verify Notes section header & mock notes panel mounting
        expect(screen.getByText('Project Notes')).toBeInTheDocument();
        expect(screen.getByTestId('mock-notes-panel')).toBeInTheDocument();
        expect(screen.getByText('Notes - projects/project1/notes')).toBeInTheDocument();
    });

    it('adds a new task with specified priority', () => {
        renderDetails();

        // Target task input by placeholder
        const input = screen.getByPlaceholderText(/add to critical/i);
        fireEvent.change(input, { target: { value: 'Refactor state actions' } });

        // Hit Enter
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });

        expect(mockSetTasks).toHaveBeenCalled();
        const updater = mockSetTasks.mock.calls[0][0];
        const updatedTasks = typeof updater === 'function' ? updater(mockTasks) : updater;
        expect(updatedTasks).toHaveLength(3);
        expect(updatedTasks[2].name).toBe('Refactor state actions');
        expect(updatedTasks[2].priority).toBe('P1'); // P1 since we typed in Critical
    });

    it('toggles task completed status', () => {
        renderDetails();

        // Task 1 is active (Checkbox unchecked)
        const activeTaskPaper = screen.getByText('Design high-fidelity wireframes').closest('.MuiPaper-root');
        const checkbox = within(activeTaskPaper).getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(mockSetTasks).toHaveBeenCalled();
        const updater = mockSetTasks.mock.calls[0][0];
        const updated = typeof updater === 'function' ? updater(mockTasks) : updater;
        expect(updated.find(t => t.id === 'task1').completed).toBe(true);
    });

    it('deletes a task', () => {
        renderDetails();

        const activeTaskPaper = screen.getByText('Design high-fidelity wireframes').closest('.MuiPaper-root');
        const deleteBtn = within(activeTaskPaper).getByRole('button', { name: /delete task/i });
        fireEvent.click(deleteBtn);

        expect(mockSetTasks).toHaveBeenCalled();
        const updater = mockSetTasks.mock.calls[0][0];
        const updated = typeof updater === 'function' ? updater(mockTasks) : updater;
        expect(updated).toHaveLength(1);
        expect(updated.find(t => t.id === 'task1')).toBeUndefined();
    });

    it('changes task priority via inline selector', () => {
        renderDetails();

        const activeTaskPaper = screen.getByText('Design high-fidelity wireframes').closest('.MuiPaper-root');
        const priorityChip = within(activeTaskPaper).getByLabelText(/change priority, currently p1/i);
        fireEvent.click(priorityChip);
        fireEvent.click(screen.getByRole('menuitem', { name: /P3 - Medium/i }));

        expect(mockSetTasks).toHaveBeenCalled();
        const updater = mockSetTasks.mock.calls[0][0];
        const updated = typeof updater === 'function' ? updater(mockTasks) : updater;
        expect(updated.find(t => t.id === 'task1').priority).toBe('P3');
    });

    it('opens edit dialog and saves task changes', () => {
        renderDetails();

        const activeTaskPaper = screen.getByText('Design high-fidelity wireframes').closest('.MuiPaper-root');
        const editBtn = within(activeTaskPaper).getByRole('button', { name: /edit task/i });
        fireEvent.click(editBtn);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText(/task name/i)).toHaveValue('Design high-fidelity wireframes');

        const nameInput = screen.getByLabelText(/task name/i);
        fireEvent.change(nameInput, { target: { value: 'Updated wireframe designs' } });

        const saveBtn = screen.getByRole('button', { name: /^save$/i });
        fireEvent.click(saveBtn);

        expect(mockSetTasks).toHaveBeenCalled();
        const updater = mockSetTasks.mock.calls[0][0];
        const updated = typeof updater === 'function' ? updater(mockTasks) : updater;
        expect(updated.find(t => t.id === 'task1').name).toBe('Updated wireframe designs');
    });

    it('opens edit dialog when clicking task name', () => {
        renderDetails();

        fireEvent.click(screen.getByText('Design high-fidelity wireframes'));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText(/task name/i)).toHaveValue('Design high-fidelity wireframes');
    });

    it('adds a user feedback with monetary impact', () => {
        renderDetails();

        // Fill feedback form
        const input = screen.getByLabelText(/feedback \/ feature request/i);
        fireEvent.change(input, { target: { value: 'Users are dropping off at payment step due to API error.' } });

        const checkbox = screen.getByRole('checkbox', { name: /monetary impact/i });
        fireEvent.click(checkbox);

        // Click Add Feedback
        const addBtn = screen.getByRole('button', { name: /log/i });
        fireEvent.click(addBtn);

        expect(mockSetFeedbacks).toHaveBeenCalled();
        const updater = mockSetFeedbacks.mock.calls[0][0];
        const updatedFeedbacks = typeof updater === 'function' ? updater(mockFeedbacks) : updater;
        expect(updatedFeedbacks).toHaveLength(2);
        expect(updatedFeedbacks[1].content).toBe('Users are dropping off at payment step due to API error.');
        expect(updatedFeedbacks[1].highMonetaryImpact).toBe(true);
    });

    it('adds notes and subtasks to a task in edit dialog', () => {
        renderDetails();

        // Open edit dialog
        const activeTaskPaper = screen.getByText('Design high-fidelity wireframes').closest('.MuiPaper-root');
        const editBtn = within(activeTaskPaper).getByRole('button', { name: /edit task/i });
        fireEvent.click(editBtn);

        // Add Notes
        const notesInput = screen.getByPlaceholderText(/add notes, details, or context/i);
        fireEvent.change(notesInput, { target: { value: 'Ensure responsive design for tablet view.' } });

        // Add Subtask
        const subtaskInput = screen.getByPlaceholderText(/add a new subtask/i);
        fireEvent.change(subtaskInput, { target: { value: 'Mobile navigation mockups' } });

        const addSubtaskBtn = screen.getByRole('button', { name: /^add$/i });
        fireEvent.click(addSubtaskBtn);

        // Verify subtask shows up in dialog list
        expect(screen.getByText('Mobile navigation mockups')).toBeInTheDocument();

        // Save task
        const saveBtn = screen.getByRole('button', { name: /^save$/i });
        fireEvent.click(saveBtn);

        expect(mockSetTasks).toHaveBeenCalled();
        const updater = mockSetTasks.mock.calls[0][0];
        const updated = typeof updater === 'function' ? updater(mockTasks) : updater;
        const target = updated.find(t => t.id === 'task1');
        expect(target.notes).toBe('Ensure responsive design for tablet view.');
        expect(target.subtasks).toHaveLength(1);
        expect(target.subtasks[0].text).toBe('Mobile navigation mockups');
    });
});
