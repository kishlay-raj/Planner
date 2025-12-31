import React, { useState, useEffect } from 'react';
import { Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Divider, Box, Typography } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import { getYear, getISOWeek } from 'date-fns';
import CalendarView from './CalendarView';
import TaskList from './TaskList';
import TaskCreationButton from './TaskCreationButton';
import NotesPanel from './NotesPanel';
import './PlannerScreen.css';

function PlannerScreen() {
  // Initialize states with data from localStorage
  const [allTasks, setAllTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem('allTasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  });

  const [scheduledTasks, setScheduledTasks] = useState(() => {
    const savedScheduled = localStorage.getItem('scheduledTasks');
    return savedScheduled ? JSON.parse(savedScheduled) : [];
  });

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Retrieve Weekly Focus for Cascading View
  const [weeklyFocus, setWeeklyFocus] = useState('');

  useEffect(() => {
    try {
      const savedWeekly = localStorage.getItem('weeklyPlannerData');
      const weeklyData = savedWeekly ? JSON.parse(savedWeekly) : {};
      const weekId = `${getYear(selectedDate)}-${getISOWeek(selectedDate)}`;
      setWeeklyFocus(weeklyData[weekId]?.focus || '');
    } catch (e) {
      console.error("Error loading weekly focus", e);
    }
  }, [selectedDate]);

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

  const handleTaskCreate = (task) => {
    const newTask = {
      ...task,
      id: Date.now()
    };
    setAllTasks(prevTasks => Array.isArray(prevTasks) ? [...prevTasks, newTask] : [newTask]);

    // If task has scheduledTime, add it to scheduledTasks
    if (newTask.scheduledTime) {
      setScheduledTasks(prevScheduled => [...prevScheduled, newTask]);
    }
  };

  const handleTaskUpdate = (updatedTasks) => {
    // Convert single task to array if needed
    const tasksToUpdate = Array.isArray(updatedTasks) ? updatedTasks : [updatedTasks];

    // Check if this is a new task being added
    if (tasksToUpdate.length > allTasks.length) {
      setAllTasks(tasksToUpdate);
      return;
    }

    // Update allTasks
    setAllTasks(prevTasks => {
      return prevTasks.map(task => {
        const updatedTask = tasksToUpdate.find(t => t.id === task.id);
        return updatedTask || task;
      });
    });

    // Update scheduledTasks
    setScheduledTasks(prevScheduled => {
      return prevScheduled.map(task => {
        const updatedTask = tasksToUpdate.find(t => t.id === task.id);
        return updatedTask || task;
      });
    });
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
      <div className="planner-header">
        <div className="planner-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TimelineIcon sx={{ color: '#1976d2', fontSize: '32px' }} />
          <span className="planner-title">Flow Planner</span>
        </div>
        <div className="planner-actions">
          <TaskCreationButton onTaskCreate={handleTaskCreate} selectedDate={selectedDate} />
          <Tooltip title="Reset All Tasks">
            <IconButton
              onClick={() => setResetDialogOpen(true)}
              sx={{
                color: 'text.secondary',
                padding: '2px',
                width: '28px',
                height: '28px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <RestartAltIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* WEEKLY FOCUS (Cascading) */}
      {weeklyFocus && (
        <Box sx={{ px: 3, pt: 1, pb: 1 }}>
          <Paper sx={{ p: 1.5, bgcolor: 'rgba(56, 178, 172, 0.08)', borderRadius: 2, border: '1px solid #38B2AC' }}>
            <Typography variant="caption" sx={{ color: '#319795', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
              WEEKLY FOCUS
            </Typography>
            <Typography variant="body2" sx={{ color: '#2C5282', fontSize: '0.9rem' }}>
              {weeklyFocus}
            </Typography>
          </Paper>
        </Box>
      )}

      <Grid container spacing={0} sx={{ display: 'flex', height: weeklyFocus ? 'calc(100vh - 200px)' : 'calc(100vh - 80px)' }}>
        <Grid item xs={12} md={6}>
          <Paper className="calendar-container">
            <CalendarView
              scheduledTasks={scheduledTasks}
              onTaskSchedule={handleTaskSchedule}
              onTaskCreate={handleTaskCreate}
              onTaskUpdate={handleTaskUpdate}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper className="task-list-container">
            <TaskList
              tasks={allTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskSchedule={handleTaskSchedule}
              selectedDate={selectedDate}
            />
          </Paper>
        </Grid>
        <Divider orientation="vertical" flexItem sx={{
          height: '100%',
          backgroundColor: '#e5e5e5'
        }} />
        <Grid item xs={12} md={3}>
          <NotesPanel selectedDate={selectedDate} />
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