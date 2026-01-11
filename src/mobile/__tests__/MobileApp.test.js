import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileApp from '../MobileApp';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestoreCollection, useFirestoreDoc } from '../../hooks/useFirestoreNew';
import { useFirestore } from '../../hooks/useFirestore';

// Mock Hooks
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useFirestoreNew');
jest.mock('../../hooks/useFirestore');
jest.mock('../../../package.json', () => ({ version: '1.0.0' }));

describe('MobileApp Component', () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    const mockLogout = jest.fn();
    const mockAddTask = jest.fn();
    const mockUpdateTask = jest.fn();
    const mockDeleteTask = jest.fn();
    const mockSetWeekData = jest.fn();
    const mockSetMonthData = jest.fn();
    const mockSetJournalData = jest.fn();
    const mockSetYearData = jest.fn(); // Though we don't spy on context setters usually

    beforeEach(() => {
        // Auth Mock
        useAuth.mockReturnValue({
            currentUser: mockUser,
            logout: mockLogout,
            loginWithGoogle: jest.fn(),
            authError: null
        });

        // Tasks Mock (useFirestoreCollection)
        useFirestoreCollection.mockReturnValue([
            [
                { id: 't1', name: 'Task 1', completed: false, date: new Date().toISOString() },
                { id: 't2', name: 'Task 2', completed: true, date: new Date().toISOString() }
            ],
            mockAddTask,
            mockUpdateTask,
            mockDeleteTask,
            false // loading
        ]);

        // Doc Mocks (useFirestoreDoc)
        // We need to differentiate based on path to return correct data
        useFirestoreDoc.mockImplementation((path) => {
            if (path.includes('planner/weekly')) {
                // Return Weekly Data or Today's Context (Weekly Focus)
                return [{
                    focus: 'Test Weekly Focus',
                    habit: { name: 'Test Habit', days: [false, true, false, false, false, false, false] },
                    journal: { start: '', stop: '', continue: '', grateful: '' },
                    days: {}
                }, mockSetWeekData];
            }
            if (path.includes('planner/monthly')) {
                // Return Monthly Data or Weekly's Context (Monthly Focus)
                return [{
                    monthlyFocus: 'Test Monthly Focus',
                    notes: 'Test Monthly Notes'
                }, mockSetMonthData];
            }
            if (path.includes('planner/yearly')) {
                // Return Year Data (Monthly's Context)
                return [{ yearFocus: 'Test Year Focus' }, mockSetYearData];
            }
            return [{}, jest.fn()];
        });

        // Journal Mock (useFirestore - legacy)
        useFirestore.mockImplementation((key) => {
            if (key === 'journalPrompts') {
                return [[{ id: 'p1', section: 'Morning', text: 'Morning Prompt?' }], jest.fn()];
            }
            if (key === 'dailyJournalData') {
                return [{
                    '2026-01-10': { responses: { 'p1': 'My Answer' }, notes: 'Daily Note' }
                }, mockSetJournalData];
            }
            return [{}, jest.fn()];
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders Today view by default with tasks', () => {
        render(<MobileApp />);
        const todayLabels = screen.getAllByText('Today');
        expect(todayLabels.length).toBeGreaterThan(0);
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Task 2')).toBeInTheDocument();
        const weeklyFocusLabels = screen.getAllByText('Weekly Focus');
        expect(weeklyFocusLabels.length).toBeGreaterThan(0); // Context Card
        expect(screen.getByText('Test Weekly Focus')).toBeInTheDocument(); // Context Value
    });

    test('can toggle task completion', () => {
        render(<MobileApp />);
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]); // Toggle Task 1
        expect(mockUpdateTask).toHaveBeenCalledWith('t1', { completed: true });
    });

    test('can add a new task', async () => {
        render(<MobileApp />);
        fireEvent.click(screen.getByLabelText('add')); // FAB

        const input = screen.getByLabelText('Task Name');
        fireEvent.change(input, { target: { value: 'New Mobile Task' } });
        fireEvent.click(screen.getByText('Add'));

        await waitFor(() => {
            expect(mockAddTask).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New Mobile Task',
                isToday: true
            }));
        });
    });

    test('navigates to Weekly view and shows Monthly Focus', () => {
        render(<MobileApp />);
        fireEvent.click(screen.getByText('Weekly'));

        expect(screen.getByText(/^Week \d+$/)).toBeInTheDocument(); // Header
        const monthlyFocusHeaders = screen.getAllByText('Monthly Focus');
        expect(monthlyFocusHeaders.length).toBeGreaterThan(0);
        const monthlyFocusValues = screen.getAllByText('Test Monthly Focus');
        expect(monthlyFocusValues.length).toBeGreaterThan(0); // Context Value
        expect(screen.getByPlaceholderText('Habit to build...')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Habit')).toBeInTheDocument();
    });

    test('navigates to Monthly view and shows Year Focus', () => {
        render(<MobileApp />);
        fireEvent.click(screen.getByText('Monthly'));

        expect(screen.getByText(/20/)).toBeInTheDocument(); // Header (Year)
        const yearFocusHeaders = screen.getAllByText('Year Focus');
        expect(yearFocusHeaders.length).toBeGreaterThan(0);
        expect(screen.getByText('Test Year Focus')).toBeInTheDocument(); // Context Value
        expect(screen.getByPlaceholderText('One major goal for this month...')).toBeInTheDocument();
    });

    test('navigates to Journal view and renders prompts', () => {
        render(<MobileApp />);
        fireEvent.click(screen.getByText('Journal'));

        expect(screen.getByText('Morning')).toBeInTheDocument(); // Section Header
        expect(screen.getByText('Morning Prompt?')).toBeInTheDocument();
    });

    test('logout button works', async () => {
        render(<MobileApp />);
        const logoutBtn = screen.getByLabelText('Logout');
        fireEvent.click(logoutBtn);
        expect(mockLogout).toHaveBeenCalled();
    });
});
