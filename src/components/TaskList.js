import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './TaskList.css';

function TaskList({ tasks, onTaskUpdate, onTaskSchedule }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [filters, setFilters] = useState({
    important: false,
    urgent: false,
    priority: 'all'
  });

  const priorityTasks = tasks.filter(task => task.important || task.isToday);
  
  // Group priority tasks by priority level
  const priorityTasksByLevel = {
    P1: priorityTasks.filter(task => task.priority === 'P1'),
    P2: priorityTasks.filter(task => task.priority === 'P2'),
    P3: priorityTasks.filter(task => task.priority === 'P3'),
    P4: priorityTasks.filter(task => task.priority === 'P4')
  };

  // Apply filters to regular tasks
  const filteredTasks = tasks.filter(task => {
    if (filters.important && !task.important) return false;
    if (filters.urgent && !task.urgent) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    return true;
  });

  // Separate tasks into Today and Dump
  const todayTasks = filteredTasks.filter(task => task.isToday);
  const dumpTasks = filteredTasks.filter(task => !task.isToday);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    let sourceList;
    if (result.source.droppableId.startsWith('P')) {
      sourceList = priorityTasksByLevel[result.source.droppableId.split('-')[0]];
    } else if (result.source.droppableId === 'today-list') {
      sourceList = todayTasks;
    } else {
      sourceList = dumpTasks;
    }
    
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

  const renderFilters = () => (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <FormGroup row sx={{ gap: 2, alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.important}
              onChange={(e) => setFilters({ ...filters, important: e.target.checked })}
            />
          }
          label="Important"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.urgent}
              onChange={(e) => setFilters({ ...filters, urgent: e.target.checked })}
            />
          }
          label="Urgent"
        />
        <Select
          size="small"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">All Priorities</MenuItem>
          <MenuItem value="P1">P1</MenuItem>
          <MenuItem value="P2">P2</MenuItem>
          <MenuItem value="P3">P3</MenuItem>
          <MenuItem value="P4">P4</MenuItem>
        </Select>
      </FormGroup>
    </Box>
  );

  const renderTaskSection = (sectionTasks, sectionId, title) => (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}
      >
        <Typography>{`${title} (${sectionTasks.length})`}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
        <TaskListContent listId={sectionId} items={sectionTasks} />
      </AccordionDetails>
    </Accordion>
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
            <>
              {['P1', 'P2', 'P3', 'P4'].map(priority => (
                priorityTasksByLevel[priority].length > 0 && (
                  <Accordion key={priority} defaultExpanded>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                      }}
                    >
                      <Typography>{`${priority} (${priorityTasksByLevel[priority].length})`}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ padding: 0 }}>
                      <TaskListContent 
                        listId={`${priority}-priority-list`} 
                        items={priorityTasksByLevel[priority]} 
                      />
                    </AccordionDetails>
                  </Accordion>
                )
              ))}
            </>
          ) : (
            <>
              {renderFilters()}
              {renderTaskSection(todayTasks, 'today-list', 'Today')}
              {renderTaskSection(dumpTasks, 'dump-list', 'Dump')}
            </>
          )}
        </DragDropContext>
      </div>
    </Paper>
  );
}

export default TaskList; 