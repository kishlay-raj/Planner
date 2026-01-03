import React, { useState, useEffect } from 'react';
import { Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Divider, Box, Typography, Avatar, Menu, MenuItem } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import { getYear, getISOWeek } from 'date-fns';
import CalendarView from './CalendarView';
import TaskList from './TaskList';
// import TaskCreationButton from './TaskCreationButton'; // Removed as per request
import NotesPanel from './NotesPanel';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCollection, useFirestoreDoc } from '../hooks/useFirestoreNew';
import { migrateUserData, needsMigration } from '../hooks/dataMigration';
import GoogleIcon from '@mui/icons-material/Google';
import './PlannerScreen.css';

const emptyObject = {};

function PlannerScreen() {
  const { currentUser, loginWithGoogle, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [migrating, setMigrating] = useState(false);

  // Check and run migration on login
  useEffect(() => {
    async function checkMigration() {
      if (currentUser) {
        const needs = await needsMigration(currentUser.uid);
        if (needs) {
          setMigrating(true);
          await migrateUserData(currentUser.uid);
          setMigrating(false);
        }
      }
    }
    checkMigration();
  }, [currentUser]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Failed to log in", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Use new collection-based hooks for tasks
  const [tasks, addTask, updateTask, deleteTask, tasksLoading] = useFirestoreCollection('tasks/active', 'createdAt');

  // Weekly planner data for focus display
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get weekly focus from planner
  const weekId = `${getYear(selectedDate)}-${getISOWeek(selectedDate)}`;
  // Use stable empty object for initial value to prevent re-subscriptions
  const [weeklyData] = useFirestoreDoc(`planner/weekly/${weekId}`, emptyObject);
  const weeklyFocus = weeklyData?.focus || '';


  // Task handlers using new collection-based approach
  const handleReset = async () => {
    // Delete all tasks
    for (const task of tasks) {
      await deleteTask(task.id);
    }
    setResetDialogOpen(false);
  };

  const handleTaskCreate = async (task) => {
    await addTask({
      ...task,
      completed: false,
      createdAt: Date.now()
    });
  };

  const handleTaskUpdate = async (updatedTasks) => {
    // Convert single task to array if needed
    const tasksToUpdate = Array.isArray(updatedTasks) ? updatedTasks : [updatedTasks];

    for (const taskUpdate of tasksToUpdate) {
      if (taskUpdate.id) {
        await updateTask(taskUpdate.id.toString(), taskUpdate);
      }
    }
  };

  const handleTaskSchedule = async (taskId, timeSlot, newDuration) => {
    const task = tasks.find(t => t.id === taskId || t.id === taskId.toString());

    if (task) {
      await updateTask(taskId.toString(), {
        scheduledTime: timeSlot,
        duration: newDuration || task.duration
      });
    }
  };

  // Get scheduled tasks (tasks with scheduledTime)
  const scheduledTasks = tasks.filter(t => t.scheduledTime);

  return (
    <div className="planner-screen">
      <div className="planner-header">
        <div className="planner-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TimelineIcon sx={{ color: '#1976d2', fontSize: '32px' }} />
          <span className="planner-title">Flow Planner</span>
        </div>
        <div className="planner-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentUser ? (
            <>
              <Tooltip title="Account Settings">
                <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0 }}>
                  <Avatar alt={currentUser.displayName} src={currentUser.photoURL} sx={{ width: 32, height: 32 }} />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleLogout}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={handleLogin}
              sx={{
                textTransform: 'none',
                backgroundColor: '#fff',
                color: '#757575',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
              }}
            >
              Sign in with Google
            </Button>
          )}

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
              tasks={tasks}
              onTaskCreate={handleTaskCreate}
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