import { useEffect, useRef } from 'react';

const useTaskNotifications = (tasks, fireDesktopNotification, showAppNotification) => {
  const notifiedTasks = useRef({});

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const checkTasks = () => {
      const now = new Date().getTime();
      
      tasks.forEach(task => {
        if (!task.scheduledTime || task.completed) return;
        
        const scheduledTime = new Date(task.scheduledTime).getTime();
        const diffMs = scheduledTime - now;
        const diffMinutes = diffMs / (1000 * 60);

        if (!notifiedTasks.current[task.id]) {
          notifiedTasks.current[task.id] = { 15: false, 5: false };
        }

        const state = notifiedTasks.current[task.id];

        // 15-minute alert (between 15 and 5 minutes)
        if (diffMinutes <= 15 && diffMinutes > 5 && !state[15]) {
          state[15] = true;
          const msg = `Task "${task.name}" is starting in 15 minutes`;
          if (fireDesktopNotification) fireDesktopNotification('Upcoming Task', msg, `task-${task.id}-15`);
          if (showAppNotification) showAppNotification(msg);
        }
        
        // 5-minute alert (between 5 and 0 minutes)
        if (diffMinutes <= 5 && diffMinutes > 0 && !state[5]) {
          state[5] = true;
          const msg = `Task "${task.name}" is starting in 5 minutes`;
          if (fireDesktopNotification) fireDesktopNotification('Upcoming Task', msg, `task-${task.id}-5`);
          if (showAppNotification) showAppNotification(msg);
        }
      });
    };

    // Check immediately on mount/update
    checkTasks();
    
    // Check every 30 seconds
    const interval = setInterval(checkTasks, 30000);
    return () => clearInterval(interval);
  }, [tasks, fireDesktopNotification, showAppNotification]);

  return null;
};

export default useTaskNotifications;
