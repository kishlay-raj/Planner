import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ScheduleIcon from '@mui/icons-material/Schedule';
import './TaskList.css';

function TaskList({ tasks, onTaskUpdate, onTaskSchedule }) {
  const [currentTab, setCurrentTab] = useState(0);

  const priorityTasks = tasks.filter(task => task.important || task.isToday);
  const regularTasks = tasks;

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceList = result.source.droppableId === 'priority-list' ? priorityTasks : regularTasks;
    const items = Array.from(sourceList);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedTasks = tasks.map(task => {
      if (sourceList.find(t => t.id === task.id)) {
        return items.find(t => t.id === task.id) || task;
      }
      return task;
    });

    onTaskUpdate(updatedTasks);
  };

  const handleDragStart = (event, task) => {
    event.dataTransfer.setData('task', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const TaskListContent = ({ listId, items }) => (
    <Droppable droppableId={listId}>
      {(provided) => (
        <List
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="task-list-items"
        >
          {items.map((task, index) => (
            <Draggable
              key={task.id}
              draggableId={String(task.id)}
              index={index}
            >
              {(provided) => (
                <ListItem
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className="task-item"
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <div {...provided.dragHandleProps} className="drag-handle">
                    <DragIndicatorIcon />
                  </div>
                  <ListItemText
                    primary={task.name}
                    secondary={
                      <div className="task-details">
                        <Chip 
                          label={`${task.duration}min`} 
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={task.priority} 
                          size="small" 
                          color={getPriorityColor(task.priority)}
                        />
                        {task.tag && (
                          <Chip 
                            label={task.tag} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </div>
                    }
                  />
                  <IconButton 
                    onClick={() => onTaskSchedule(task.id, new Date())}
                    className="schedule-button"
                  >
                    <ScheduleIcon />
                  </IconButton>
                </ListItem>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </List>
      )}
    </Droppable>
  );

  return (
    <Paper className="task-list">
      <Tabs
        value={currentTab}
        onChange={(_, newValue) => setCurrentTab(newValue)}
        variant="fullWidth"
      >
        <Tab label={`Important & Today (${priorityTasks.length})`} />
        <Tab label={`All Tasks (${tasks.length})`} />
      </Tabs>
      <div className="task-list-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          {currentTab === 0 ? (
            <TaskListContent listId="priority-list" items={priorityTasks} />
          ) : (
            <TaskListContent listId="regular-list" items={regularTasks} />
          )}
        </DragDropContext>
      </div>
    </Paper>
  );
}

export default TaskList; 