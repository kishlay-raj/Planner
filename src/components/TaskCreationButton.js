import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';

function TaskCreationButton({ onTaskCreate, selectedDate }) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState({
    name: '',
    duration: 30,
    tag: '',
    priority: 'P3',
    urgent: false,
    important: false,
    isToday: true
  });

  const handleSubmit = () => {
    if (task.name.trim()) {
      // Create task with the selected date
      const taskWithDate = {
        ...task,
        date: format(selectedDate, 'yyyy-MM-dd'),
        createdAt: new Date().toISOString()
      };
      onTaskCreate(taskWithDate);
      setTask({
        name: '',
        duration: 30,
        tag: '',
        priority: 'P3',
        urgent: false,
        important: false,
        isToday: true
      });
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon fontSize="small" />}
        onClick={() => setOpen(true)}
        sx={{ 
          backgroundColor: 'transparent',
          color: 'text.secondary',
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          textTransform: 'none',
          padding: '4px 12px',
          minHeight: '32px',
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            boxShadow: 'none'
          }
        }}
      >
        New Task
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            fullWidth
            value={task.name}
            onChange={(e) => setTask({ ...task, name: e.target.value })}
          />
          <TextField
            type="number"
            margin="dense"
            label="Duration (minutes)"
            fullWidth
            value={task.duration}
            onChange={(e) => setTask({ ...task, duration: Number(e.target.value) })}
          />
          <TextField
            margin="dense"
            label="Tag"
            fullWidth
            value={task.tag}
            onChange={(e) => setTask({ ...task, tag: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Priority</InputLabel>
            <Select
              value={task.priority}
              onChange={(e) => setTask({ ...task, priority: e.target.value })}
            >
              <MenuItem value="P1">P1</MenuItem>
              <MenuItem value="P2">P2</MenuItem>
              <MenuItem value="P3">P3</MenuItem>
              <MenuItem value="P4">P4</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={task.urgent}
                onChange={(e) => setTask({ ...task, urgent: e.target.checked })}
              />
            }
            label="Urgent"
          />
          <FormControlLabel
            control={
              <Switch
                checked={task.important}
                onChange={(e) => setTask({ ...task, important: e.target.checked })}
              />
            }
            label="Important"
          />
          <FormControlLabel
            control={
              <Switch
                checked={task.isToday}
                onChange={(e) => setTask({ ...task, isToday: e.target.checked })}
              />
            }
            label={task.isToday ? "Today" : "Dump"}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default TaskCreationButton; 