import { renderHook } from '@testing-library/react';
import useTaskNotifications from '../useTaskNotifications';

describe('useTaskNotifications', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-03T15:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should not fire notifications if there are no tasks', () => {
    const fireDesktopNotification = jest.fn();
    const showAppNotification = jest.fn();
    
    renderHook(() => useTaskNotifications([], fireDesktopNotification, showAppNotification));
    
    expect(fireDesktopNotification).not.toHaveBeenCalled();
    expect(showAppNotification).not.toHaveBeenCalled();
  });

  it('should fire 15-minute notification when task is 15 mins away', () => {
    const fireDesktopNotification = jest.fn();
    const showAppNotification = jest.fn();
    
    const tasks = [
      { id: '1', name: 'Meeting', scheduledTime: '2026-08-03T15:15:00Z', completed: false }
    ];

    renderHook(() => useTaskNotifications(tasks, fireDesktopNotification, showAppNotification));

    expect(fireDesktopNotification).toHaveBeenCalledWith(
      'Upcoming Task',
      'Task "Meeting" is starting in 15 minutes',
      'task-1-15'
    );
    expect(showAppNotification).toHaveBeenCalledWith('Task "Meeting" is starting in 15 minutes');
  });

  it('should fire 5-minute notification when task is 5 mins away', () => {
    const fireDesktopNotification = jest.fn();
    const showAppNotification = jest.fn();
    
    const tasks = [
      { id: '2', name: 'Call', scheduledTime: '2026-08-03T15:05:00Z', completed: false }
    ];

    renderHook(() => useTaskNotifications(tasks, fireDesktopNotification, showAppNotification));

    expect(fireDesktopNotification).toHaveBeenCalledWith(
      'Upcoming Task',
      'Task "Call" is starting in 5 minutes',
      'task-2-5'
    );
    expect(showAppNotification).toHaveBeenCalledWith('Task "Call" is starting in 5 minutes');
  });

  it('should not fire notifications for completed tasks', () => {
    const fireDesktopNotification = jest.fn();
    const showAppNotification = jest.fn();
    
    const tasks = [
      { id: '3', name: 'Done Task', scheduledTime: '2026-08-03T15:05:00Z', completed: true }
    ];

    renderHook(() => useTaskNotifications(tasks, fireDesktopNotification, showAppNotification));

    expect(fireDesktopNotification).not.toHaveBeenCalled();
  });

  it('should not refire the same notification if state is updated', () => {
    const fireDesktopNotification = jest.fn();
    const showAppNotification = jest.fn();
    
    const tasks = [
      { id: '4', name: 'Wait', scheduledTime: '2026-08-03T15:10:00Z', completed: false }
    ]; // 10 minutes away, so 15 min notification should trigger

    const { rerender } = renderHook(({ t }) => useTaskNotifications(t, fireDesktopNotification, showAppNotification), {
      initialProps: { t: tasks }
    });

    expect(fireDesktopNotification).toHaveBeenCalledTimes(1);
    
    // Trigger rerender with same tasks
    rerender({ t: tasks });
    
    // Should still be 1, because it tracks internally that it already fired
    expect(fireDesktopNotification).toHaveBeenCalledTimes(1);
  });
});
