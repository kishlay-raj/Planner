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

function TaskCreationButton({ onTaskCreate }) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState({
    name: '',
    duration: 30,
    tag: '',
    priority: 'medium',
    urgent: false,
    important: false
  });

  const handleSubmit = () => {
    if (task.name.trim()) {
      onTaskCreate(task);
      setTask({
        name: '',
        duration: 30,
        tag: '',
        priority: 'medium',
        urgent: false,
        important: false
      });
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{ marginBottom: 2 }}
      >
        Add Task
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
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
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