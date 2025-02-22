import React, { useState, useEffect } from 'react';
import { Grid, Paper } from '@mui/material';
import CalendarView from './CalendarView';
import TaskList from './TaskList';
import TaskCreationButton from './TaskCreationButton';
import './PlannerScreen.css';

function PlannerScreen() {
  // Initialize states with data from localStorage
  const [allTasks, setAllTasks] = useState(() => {
    const savedTasks = localStorage.getItem('allTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [scheduledTasks, setScheduledTasks] = useState(() => {
    const savedScheduled = localStorage.getItem('scheduledTasks');
    return savedScheduled ? JSON.parse(savedScheduled) : [];
  });

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('allTasks', JSON.stringify(allTasks));
  }, [allTasks]);

  useEffect(() => {
    localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  const handleTaskCreate = (newTask) => {
    const updatedTasks = [...allTasks, { 
      ...newTask, 
      id: Date.now(),
      scheduledTime: newTask.scheduledTime || null
    }];
    setAllTasks(updatedTasks);
    
    // If task has scheduledTime, add it to scheduledTasks
    if (newTask.scheduledTime) {
      setScheduledTasks([...scheduledTasks, {
        ...newTask,
        id: Date.now()
      }]);
    }
  };

  const handleTaskUpdate = (updatedTasks) => {
    setAllTasks(updatedTasks);
    // Update scheduled tasks if any of the updated tasks are scheduled
    const updatedScheduled = scheduledTasks.map(scheduledTask => {
      const updatedTask = updatedTasks.find(t => t.id === scheduledTask.id);
      return updatedTask ? { ...scheduledTask, ...updatedTask } : scheduledTask;
    });
    setScheduledTasks(updatedScheduled);
  };

  const handleTaskSchedule = (taskId, timeSlot, newDuration) => {
    const task = allTasks.find(t => t.id === taskId) || 
                scheduledTasks.find(t => t.id === taskId);
    
    if (task) {
      const updatedTask = { 
        ...task, 
        scheduledTime: timeSlot,
        duration: newDuration || task.duration
      };

      // If task is already in scheduledTasks, update it
      if (scheduledTasks.find(t => t.id === taskId)) {
        const updatedScheduledTasks = scheduledTasks.map(t => t.id === taskId ? updatedTask : t);
        setScheduledTasks(updatedScheduledTasks);
      } else {
        // If task is new, add it to scheduledTasks and remove from tasks
        const updatedScheduledTasks = [...scheduledTasks, updatedTask];
        setScheduledTasks(updatedScheduledTasks);
        setAllTasks(allTasks.filter(t => t.id !== taskId));
      }
    }
  };

  return (
    <div className="planner-screen">
      <TaskCreationButton onTaskCreate={handleTaskCreate} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper className="calendar-container">
            <CalendarView 
              scheduledTasks={scheduledTasks}
              onTaskSchedule={handleTaskSchedule}
              onTaskCreate={handleTaskCreate}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper className="task-list-container">
            <TaskList 
              tasks={allTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskSchedule={handleTaskSchedule}
            />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

export default PlannerScreen; 