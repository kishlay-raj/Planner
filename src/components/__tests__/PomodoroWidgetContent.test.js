import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PomodoroWidgetContent from '../PomodoroWidgetContent';

describe('PomodoroWidgetContent Component', () => {
  const defaultProps = {
    pipWindow: { resizeTo: jest.fn() },
    timeLeft: 25 * 60,
    isActive: false,
    mode: 'pomodoro',
    workType: 'deep',
    primaryTask: 'Write report',
    secondaryTask: '',
    pomodoroDuration: 25,
    tasks: [
      { id: '1', name: 'Review pull request', completed: false },
      { id: '2', name: 'Completed task', completed: true }
    ],
    onToggle: jest.fn(),
    onSkip: jest.fn(),
    onStartNewPomodoro: jest.fn(),
    onWorkTypeToggle: jest.fn(),
    onUpdatePrimaryTask: jest.fn(),
    onUpdateSecondaryTask: jest.fn(),
    onUpdateNotes: jest.fn(),
    onUpdateSubtasks: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timer and new pomodoro button', () => {
    render(<PomodoroWidgetContent {...defaultProps} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('Write report')).toBeInTheDocument();
    expect(screen.getByTitle('Start a new Pomodoro')).toBeInTheDocument();
  });

  it('opens new pomodoro creation panel when clicking 🍅+', () => {
    render(<PomodoroWidgetContent {...defaultProps} />);
    const newBtn = screen.getByTitle('Start a new Pomodoro');
    fireEvent.click(newBtn);

    expect(screen.getByText('START NEW POMODORO')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What are you focusing on?')).toBeInTheDocument();
    expect(screen.getByText(/START FOCUS/i)).toBeInTheDocument();
  });

  it('allows filling task name from pending tasks suggestion', () => {
    render(<PomodoroWidgetContent {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Start a new Pomodoro'));

    const taskSuggestion = screen.getByTitle('Use task: Review pull request');
    expect(taskSuggestion).toBeInTheDocument();
    fireEvent.click(taskSuggestion);

    const input = screen.getByPlaceholderText('What are you focusing on?');
    expect(input.value).toBe('Review pull request');
  });

  it('starts a new pomodoro with custom duration and shallow work type', () => {
    render(<PomodoroWidgetContent {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Start a new Pomodoro'));

    // Switch to Shallow Work
    const shallowBtn = screen.getByText(/Shallow Work/i);
    fireEvent.click(shallowBtn);

    // Enter secondary task
    const secondaryInput = screen.getByPlaceholderText('Secondary task (optional)...');
    fireEvent.change(secondaryInput, { target: { value: 'Answer emails' } });

    // Select 45m duration preset
    const duration45Btn = screen.getByText('45m');
    fireEvent.click(duration45Btn);

    // Click START FOCUS
    const startFocusBtn = screen.getByText(/START FOCUS/i);
    fireEvent.click(startFocusBtn);

    expect(defaultProps.onStartNewPomodoro).toHaveBeenCalledWith({
      durationMinutes: 45,
      taskName: 'Write report',
      secondaryTaskName: 'Answer emails',
      newWorkType: 'shallow',
      startImmediately: true
    });
  });

  it('cancels new pomodoro creation when clicking cancel button', () => {
    render(<PomodoroWidgetContent {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Start a new Pomodoro'));
    expect(screen.getByText('START NEW POMODORO')).toBeInTheDocument();

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('START NEW POMODORO')).not.toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('provides quick start focus button when in break mode', () => {
    render(<PomodoroWidgetContent {...defaultProps} mode="shortBreak" timeLeft={5 * 60} />);
    expect(screen.getByText('☕ SHORT BREAK')).toBeInTheDocument();

    const quickStartBtn = screen.getByTitle('Start Pomodoro focus immediately');
    expect(quickStartBtn).toBeInTheDocument();

    fireEvent.click(quickStartBtn);
    expect(defaultProps.onStartNewPomodoro).toHaveBeenCalledWith({
      durationMinutes: 25,
      taskName: 'Write report',
      secondaryTaskName: '',
      newWorkType: 'deep',
      startImmediately: true
    });
  });

  it('toggles work type when clicking badge in header', () => {
    render(<PomodoroWidgetContent {...defaultProps} />);
    const workTypeBadge = screen.getByTitle('Click to toggle Deep/Shallow');
    fireEvent.click(workTypeBadge);
    expect(defaultProps.onWorkTypeToggle).toHaveBeenCalledTimes(1);
  });
});
