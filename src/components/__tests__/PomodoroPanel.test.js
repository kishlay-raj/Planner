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
    const mockSetStats = jest.fn();
    const mockHandleSettingChange = jest.fn();

    const defaultSettings = {
        pomodoro: 30,
        shortBreak: 5,
        longBreak: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        longBreakInterval: 4,
        alarmVolume: 50,
        alarmSound: 'Kitchen',
        alarmRepeat: 1,
        tickingVolume: 50,
        tickingSound: 'Ticking Slow',
        hourFormat: '24-hour',
        darkMode: false,
        enableInactivityAlert: true,
        inactivityAlertInterval: 15
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        FirestoreHook.useFirestore.mockImplementation((path) => {
            if (path === 'pomodoroStats') {
                return [{ total: 0, today: 0 }, mockSetStats];
            }
            return [[], jest.fn()];
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // Stateful wrapper so mode-switches and timer ticks work as real parent would do
    const renderPanel = (overrideProps = {}) => {
        const Wrapper = () => {
            const [currentMode, setCurrentMode] = React.useState(overrideProps.mode || 'pomodoro');
            const [currentTimeLeft, setCurrentTimeLeft] = React.useState(overrideProps.timeLeft ?? defaultSettings.pomodoro * 60);
            const [currentIsActive, setCurrentIsActive] = React.useState(overrideProps.isActive || false);

            // Simulate the countdown that lives in the real parent
            React.useEffect(() => {
                if (!currentIsActive) return;
                const id = setInterval(() => setCurrentTimeLeft(t => Math.max(0, t - 1)), 1000);
                return () => clearInterval(id);
            }, [currentIsActive]);

            const handleSetMode = (newMode) => {
                mockOnModeChange(newMode);
                setCurrentMode(newMode);
                const durations = {
                    pomodoro: defaultSettings.pomodoro * 60,
                    shortBreak: defaultSettings.shortBreak * 60,
                    longBreak: defaultSettings.longBreak * 60,
                };
                setCurrentTimeLeft(durations[newMode] || defaultSettings.pomodoro * 60);
                setCurrentIsActive(false);
            };

            return (
                <PomodoroPanel
                    timeLeft={currentTimeLeft}
                    isActive={currentIsActive}
                    mode={currentMode}
                    setMode={handleSetMode}
                    cycles={0}
                    toggleTimer={() => setCurrentIsActive(a => !a)}
                    resetTimer={() => {
                        // Simulate parent next-mode logic (pomodoro → shortBreak → pomodoro)
                        const next = currentMode === 'pomodoro' ? 'shortBreak' : 'pomodoro';
                        handleSetMode(next);
                    }}
                    settings={defaultSettings}
                    handleSettingChange={mockHandleSettingChange}
                    workType="deep"
                    onWorkTypeToggle={jest.fn()}
                    sessionHistory={[]}
                    {...overrideProps}
                />
            );
        };
        return render(<Wrapper />);
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
        // Check that the Focus timer setting is rendered
        expect(screen.getByText('🍅 Focus')).toBeInTheDocument();
        // Check that Automation settings are rendered
        expect(screen.getByText('Auto-start Breaks')).toBeInTheDocument();
    });

    it('uses step quanta for Short Break duration adjustment', () => {
        renderPanel({ mode: 'shortBreak', timeLeft: 300 }); // 05:00

        // Click increment ▲
        const upBtn = screen.getByText('▲');
        fireEvent.click(upBtn);

        // In shortBreak, adding 5 mins changes setting to 10 mins
        expect(mockHandleSettingChange).toHaveBeenCalledWith('shortBreak', 10);
    });

    it('saves pomodoro text/notes when Enter is pressed without needing Save button', () => {
        const mockSetPrimaryTask = jest.fn();
        const mockSetPomodoroNotes = jest.fn();

        renderPanel({
            primaryTask: '',
            pomodoroNotes: '',
            setPrimaryTask: mockSetPrimaryTask,
            setPomodoroNotes: mockSetPomodoroNotes
        });

        // Click to enter task/notes editing mode
        const editTrigger = screen.getByText('+ Set focus tasks and notes for this session');
        fireEvent.click(editTrigger);

        expect(screen.getByText('Save')).toBeInTheDocument();

        // Edit session notes
        const notesInput = screen.getByPlaceholderText(/Any specific thoughts or goals/i);
        fireEvent.change(notesInput, { target: { value: 'Deep focus on algorithm' } });

        // Press Enter (without shift)
        fireEvent.keyDown(notesInput, { key: 'Enter', shiftKey: false });

        // Verify it saved without having to click the Save button
        expect(mockSetPomodoroNotes).toHaveBeenCalledWith('Deep focus on algorithm');
        // Edit mode should be closed
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
});

