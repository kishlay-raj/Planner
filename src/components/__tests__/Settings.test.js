import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from '../Settings';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as FirestoreHook from '../../hooks/useFirestore';

// Mock dependencies
jest.mock('../../hooks/useFirestore');

const mockTheme = createTheme();

describe('Settings Component', () => {
    const mockOnUpdate = jest.fn();
    const mockSetTasks = jest.fn();

    // Default nav config
    const defaultNavConfig = [
        { id: 'planner', label: 'Daily', iconKey: 'dashboard', visible: true },
        { id: 'daily-journal', label: 'Journal', iconKey: 'menuBook', visible: false }
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup useFirestore mock
        FirestoreHook.useFirestore.mockImplementation((path) => {
            if (path === 'allTasks') {
                return [['Task 1', 'Task 2'], mockSetTasks];
            }
            return [[], jest.fn()];
        });
    });

    const renderSettings = () => {
        return render(
            <ThemeProvider theme={mockTheme}>
                <Settings navConfig={defaultNavConfig} onUpdate={mockOnUpdate} />
            </ThemeProvider>
        );
    };

    it('renders navigation settings correctly', () => {
        renderSettings();

        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Sidebar Navigation')).toBeInTheDocument();

        // Check list items
        expect(screen.getByText('Daily')).toBeInTheDocument();
        expect(screen.getByText('Journal')).toBeInTheDocument();
    });

    it('opens confirmation dialog when Reset All is clicked', () => {
        renderSettings();

        // Find Danger Zone button
        const resetBtn = screen.getByRole('button', { name: /Reset All/i });
        fireEvent.click(resetBtn);

        // Check dialog
        expect(screen.getByText('Reset All Tasks?')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete all tasks/i)).toBeInTheDocument();
    });

    it('clears tasks when Reset All is confirmed', () => {
        renderSettings();

        // Open dialog
        fireEvent.click(screen.getByRole('button', { name: /Reset All/i }));

        // Confirm
        // There might be two 'Reset All' buttons now (one trigger, one in dialog)
        // Dialog button usually at the end
        const dialogButtons = screen.getAllByText('Reset All');
        fireEvent.click(dialogButtons[dialogButtons.length - 1]);

        expect(mockSetTasks).toHaveBeenCalledWith([]);
    });

    it('closes dialog on cancel', async () => {
        renderSettings();

        fireEvent.click(screen.getByRole('button', { name: /Reset All/i }));
        fireEvent.click(screen.getByText('Cancel'));

        // Dialog should disappear
        await waitFor(() => {
            expect(screen.queryByText('Reset All Tasks?')).not.toBeInTheDocument();
        });
        expect(mockSetTasks).not.toHaveBeenCalled();
    });
});
