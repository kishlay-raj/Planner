import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  ArrowForward,
  Flag as FlagIcon
} from '@mui/icons-material';

function TaskDump() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('taskDump');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('taskDump', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (event) => {
    event.preventDefault();
    if (newTask.trim()) {
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          text: newTask,
          priority: 'Medium',
          category: 'Uncategorized',
          created: new Date().toISOString()
        }
      ]);
      setNewTask('');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleUpdateTask = () => {
    setTasks(tasks.map(task => 
      task.id === editingTask.id ? editingTask : task
    ));
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleMoveToTasks = (task) => {
    // Get existing tasks
    const mainTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    // Add task to main tasks
    const newMainTask = {
      ...task,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    
    localStorage.setItem('tasks', JSON.stringify([...mainTasks, newMainTask]));
    
    // Remove from task dump
    handleDeleteTask(task.id);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ height: 'calc(100vh - 80px)', p: 2, overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Task Dump
      </Typography>

      <Box component="form" onSubmit={handleAddTask} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Quick capture your task..."
          sx={{ mb: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          type="submit"
          disabled={!newTask.trim()}
        >
          Add Task
        </Button>
      </Box>

      <List>
        {tasks.map(task => (
          <ListItem
            key={task.id}
            sx={{
              mb: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1
            }}
          >
            <ListItemText
              primary={task.text}
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    icon={<FlagIcon />}
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    size="small"
                    label={task.category}
                  />
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleEditTask(task)}
                sx={{ mr: 1 }}
              >
                <Edit />
              </IconButton>
              <IconButton
                edge="end"
                onClick={() => handleMoveToTasks(task)}
                sx={{ mr: 1 }}
              >
                <ArrowForward />
              </IconButton>
              <IconButton
                edge="end"
                onClick={() => handleDeleteTask(task.id)}
                color="error"
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            value={editingTask?.text || ''}
            onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={editingTask?.priority || 'Medium'}
              label="Priority"
              onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={editingTask?.category || 'Uncategorized'}
              label="Category"
              onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
            >
              <MenuItem value="Uncategorized">Uncategorized</MenuItem>
              <MenuItem value="Work">Work</MenuItem>
              <MenuItem value="Personal">Personal</MenuItem>
              <MenuItem value="Shopping">Shopping</MenuItem>
              <MenuItem value="Ideas">Ideas</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateTask} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default TaskDump; 