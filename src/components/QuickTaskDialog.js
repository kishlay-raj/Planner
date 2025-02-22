import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box
} from '@mui/material';
import { format } from 'date-fns';

function QuickTaskDialog({ open, selectedTime, onClose, onSave }) {
  const [taskData, setTaskData] = useState({
    name: '',
    duration: 30,
    priority: 'P4',
    important: false,
    urgent: false
  });

  const handleSave = () => {
    onSave({
      ...taskData,
      id: Date.now(),
      completed: false,
      isToday: true
    });
    setTaskData({
      name: '',
      duration: 30,
      priority: 'P4',
      important: false,
      urgent: false
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Task for {selectedTime ? format(selectedTime, 'h:mm a') : ''}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            autoFocus
            label="Task Name"
            fullWidth
            value={taskData.name}
            onChange={(e) => setTaskData({ ...taskData, name: e.target.value })}
          />
          <TextField
            label="Duration (minutes)"
            type="number"
            value={taskData.duration}
            onChange={(e) => setTaskData({ ...taskData, duration: Number(e.target.value) })}
          />
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={taskData.priority}
              label="Priority"
              onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
            >
              <MenuItem value="P1">P1 - Urgent</MenuItem>
              <MenuItem value="P2">P2 - High</MenuItem>
              <MenuItem value="P3">P3 - Medium</MenuItem>
              <MenuItem value="P4">P4 - Low</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={taskData.important}
                  onChange={(e) => setTaskData({ ...taskData, important: e.target.checked })}
                />
              }
              label="Important"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={taskData.urgent}
                  onChange={(e) => setTaskData({ ...taskData, urgent: e.target.checked })}
                />
              }
              label="Urgent"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!taskData.name.trim()}
        >
          Add Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default QuickTaskDialog; 