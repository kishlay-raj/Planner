import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PomodoroPanel from '../PomodoroPanel';
import * as FirestoreHook from '../../hooks/useFirestore';

// Mock Firestore
jest.mock('../../hooks/useFirestore');

// Mock AudioContext
const mockAudioContext = {
    createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { setValueAtTime: jest.fn() },
        type: 'sine'
    })),
    createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
    })),
    currentTime: 0,
    destination: {}
};
window.AudioContext = jest.fn(() => mockAudioContext);

describe('PomodoroPanel Component', () => {
    const mockOnModeChange = jest.fn();
    const mockSetSettings = jest.fn();
    const mockSetStats = jest.fn();

    const defaultSettings = {
        pomodoro: 30,
        shortBreak: 5,
        longBreak: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        longBreakInterval: 4,
        alarmVolume: 50,
        tickingVolume: 50
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        FirestoreHook.useFirestore.mockImplementation((path) => {
            if (path === 'pomodoroSettings') {
                return [defaultSettings, mockSetSettings];
            }
            if (path === 'pomodoroStats') {
                return [{ total: 0, today: 0 }, mockSetStats];
            }
            return [[], jest.fn()];
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const renderPanel = () => {
        return render(<PomodoroPanel onModeChange={mockOnModeChange} />);
    };

    it('renders with default pomodoro state', () => {
        renderPanel();
        expect(screen.getByText('30:00')).toBeInTheDocument();
        expect(screen.getByText('START')).toBeInTheDocument();
        // Use heading role to be specific and avoid conflict with toggle button
        expect(screen.getByRole('heading', { name: /pomodoro/i })).toBeInTheDocument();
    });

    it('switches modes and updates timer', () => {
        renderPanel();

        // Switch to Short Break
        const shortBreakBtn = screen.getByRole('button', { name: /Short Break/i });
        fireEvent.click(shortBreakBtn);

        expect(screen.getByText('05:00')).toBeInTheDocument();
        expect(mockOnModeChange).toHaveBeenCalledWith('shortBreak');
    });

    it('starts and pauses the timer', () => {
        renderPanel();
        const startBtn = screen.getByText('START');

        // Start
        fireEvent.click(startBtn);
        expect(screen.getByText('PAUSE')).toBeInTheDocument();

        // Advance time by 1 second
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(screen.getByText('29:59')).toBeInTheDocument();

        // Pause
        fireEvent.click(screen.getByText('PAUSE'));
        expect(screen.getByText('START')).toBeInTheDocument();
    });

    it('skips/resets timer correctly', () => {
        renderPanel();

        // Assuming Skip button resets/advances mode
        const skipBtn = screen.getByText('SKIP');
        fireEvent.click(skipBtn);

        // Should go to Short Break (default flow)
        expect(screen.getByText('05:00')).toBeInTheDocument();
        expect(mockOnModeChange).toHaveBeenCalledWith('shortBreak');
    });

    it('opens settings and renders inputs', () => {
        renderPanel();

        // Use the aria-label we added
        const settingsButton = screen.getByLabelText('Settings');
        fireEvent.click(settingsButton);

        expect(screen.getByText('Timer Settings')).toBeInTheDocument();
        // Check for specific input
        expect(screen.getByRole('spinbutton', { name: /Pomodoro/i })).toBeInTheDocument();
    });
});
