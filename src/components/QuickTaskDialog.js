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
  Switch,
  Box,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    padding: theme.spacing(2)
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
  }
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
  }
}));

function QuickTaskDialog({ open, onClose, onSave, startTime }) {
  const [task, setTask] = useState({
    name: '',
    duration: 30,
    priority: 'P3',
    urgent: false,
    important: false,
    isToday: true
  });

  const handleSave = () => {
    if (task.name.trim()) {
      onSave({
        ...task,
        scheduledTime: startTime
      });
      setTask({
        name: '',
        duration: 30,
        priority: 'P3',
        urgent: false,
        important: false,
        isToday: true
      });
      onClose();
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={600}>Add New Task</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent>
        <StyledTextField
          autoFocus
          margin="dense"
          label="Task Name"
          fullWidth
          value={task.name}
          onChange={(e) => setTask({ ...task, name: e.target.value })}
          placeholder="What needs to be done?"
        />
        <StyledTextField
          type="number"
          margin="dense"
          label="Duration (minutes)"
          fullWidth
          value={task.duration}
          onChange={(e) => setTask({ ...task, duration: Number(e.target.value) })}
          placeholder="30"
        />
        <StyledFormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select
            value={task.priority}
            onChange={(e) => setTask({ ...task, priority: e.target.value })}
          >
            <MenuItem value="P1" sx={{ color: '#ff5252' }}>P1 - Urgent</MenuItem>
            <MenuItem value="P2" sx={{ color: '#ff9100' }}>P2 - High</MenuItem>
            <MenuItem value="P3" sx={{ color: '#00bcd4' }}>P3 - Medium</MenuItem>
            <MenuItem value="P4" sx={{ color: '#78909c' }}>P4 - Low</MenuItem>
          </Select>
        </StyledFormControl>
        <Box sx={{ 
          display: 'flex', 
          gap: 3,
          mb: 2,
          '& .MuiFormControlLabel-root': {
            marginRight: 0
          }
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={task.urgent}
                onChange={(e) => setTask({ ...task, urgent: e.target.checked })}
                color="error"
              />
            }
            label="Urgent"
          />
          <FormControlLabel
            control={
              <Switch
                checked={task.important}
                onChange={(e) => setTask({ ...task, important: e.target.checked })}
                color="warning"
              />
            }
            label="Important"
          />
          <FormControlLabel
            control={
              <Switch
                checked={task.isToday}
                onChange={(e) => setTask({ ...task, isToday: e.target.checked })}
                color="primary"
              />
            }
            label="Today"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            mr: 1
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            px: 3
          }}
        >
          Add Task
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

export default QuickTaskDialog; 