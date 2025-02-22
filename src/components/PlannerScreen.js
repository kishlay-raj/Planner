import React, { useState, useEffect } from 'react';
import { Grid, Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
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

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('allTasks', JSON.stringify(allTasks));
  }, [allTasks]);

  useEffect(() => {
    localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  const handleReset = () => {
    localStorage.removeItem('allTasks');
    localStorage.removeItem('scheduledTasks');
    setAllTasks([]);
    setScheduledTasks([]);
    setResetDialogOpen(false);
  };

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
        // If task is new, add it to scheduledTasks but keep it in allTasks
        const updatedScheduledTasks = [...scheduledTasks, updatedTask];
        setScheduledTasks(updatedScheduledTasks);
        // Update the task in allTasks to reflect its scheduled status
        const updatedAllTasks = allTasks.map(t => 
          t.id === taskId ? { ...t, scheduledTime: timeSlot } : t
        );
        setAllTasks(updatedAllTasks);
      }
    }
  };

  return (
    <div className="planner-screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <TaskCreationButton onTaskCreate={handleTaskCreate} />
        <Tooltip title="Reset All Tasks">
          <IconButton 
            onClick={() => setResetDialogOpen(true)}
            sx={{ 
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'error.dark'
              }
            }}
          >
            <RestartAltIcon />
          </IconButton>
        </Tooltip>
      </div>

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

      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset All Tasks?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete all tasks? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReset}
            color="error"
            variant="contained"
          >
            Reset All
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default PlannerScreen; 