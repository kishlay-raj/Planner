import React, { useState } from 'react';
import { Grid, Paper } from '@mui/material';
import CalendarView from './CalendarView';
import TaskList from './TaskList';
import TaskCreationButton from './TaskCreationButton';
import './PlannerScreen.css';

function PlannerScreen() {
  const [tasks, setTasks] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);

  const handleTaskCreate = (newTask) => {
    setTasks([...tasks, { ...newTask, id: Date.now() }]);
  };

  const handleTaskSchedule = (taskId, timeSlot) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = { ...task, scheduledTime: timeSlot };
      setScheduledTasks([
        ...scheduledTasks.filter(t => t.id !== taskId),
        updatedTask
      ]);
      setTasks(tasks.filter(t => t.id !== taskId));
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
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper className="task-list-container">
            <TaskList 
              tasks={tasks}
              onTaskUpdate={setTasks}
              onTaskSchedule={handleTaskSchedule}
            />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

export default PlannerScreen; 