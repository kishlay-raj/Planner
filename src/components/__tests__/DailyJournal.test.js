import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DailyJournal from '../DailyJournal';
import { useFirestore } from '../../hooks/useFirestore';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock dependencies
jest.mock('../../hooks/useFirestore');
jest.mock('../../firebase', () => ({
    db: {}
}));

const mockTheme = createTheme();

describe('DailyJournal Prompts Sync', () => {
    const mockSetPrompts = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderJournal = () => {
        return render(
            <ThemeProvider theme={mockTheme}>
                <DailyJournal />
            </ThemeProvider>
        );
    };

    it('should not call setPrompts while prompts are loading', () => {
        useFirestore.mockImplementation((key, defaultValue) => {
            if (key === 'journalPrompts') {
                return [[], mockSetPrompts, true, false]; // loading is true
            }
            return [defaultValue, jest.fn(), false, false];
        });

        renderJournal();

        expect(mockSetPrompts).not.toHaveBeenCalled();
    });

    it('should merge missing defaults and call setPrompts when loading completes', async () => {
        const storedPrompts = [
            { id: '1', section: 'Morning', text: 'Who is the person I want to become today?' }
        ];

        useFirestore.mockImplementation((key, defaultValue) => {
            if (key === 'journalPrompts') {
                return [storedPrompts, mockSetPrompts, false, false]; // loading is false
            }
            return [defaultValue, jest.fn(), false, false];
        });

        renderJournal();

        await waitFor(() => {
            expect(mockSetPrompts).toHaveBeenCalled();
        });

        // The functional updater parameter is called
        const updater = mockSetPrompts.mock.calls[0][0];
        const result = updater(storedPrompts);

        // It should contain more than just storedPrompts (since defaults are merged)
        expect(result.length).toBeGreaterThan(storedPrompts.length);
        
        // It should contain one of the defaults (e.g. ID '2')
        expect(result.some(p => p.id === '2')).toBe(true);
    });
});
