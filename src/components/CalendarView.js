import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { Paper, IconButton, Popover, TextField } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './CalendarView.css';
import QuickTaskDialog from './QuickTaskDialog';
import TaskEditDialog from './TaskEditDialog';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate } from 'date-fns';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

function CalendarView({ scheduledTasks, onTaskSchedule, onTaskCreate, onTaskUpdate, selectedDate, onDateChange }) {
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [quickTaskDialog, setQuickTaskDialog] = useState({
    open: false,
    selectedTime: null
  });
  const [editDialog, setEditDialog] = useState({
    open: false,
    task: null
  });
  const [datePickerAnchor, setDatePickerAnchor] = useState(null);

  // Get current time for initial scroll
  const now = new Date();
  const scrollTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0);

  const events = scheduledTasks.map(task => ({
    id: task.id,
    title: `${task.name} (${task.duration}min) - ${format(new Date(task.scheduledTime), 'HH:mm')} to ${format(new Date(new Date(task.scheduledTime).getTime() + task.duration * 60000), 'HH:mm')}`,
    start: new Date(task.scheduledTime),
    end: new Date(new Date(task.scheduledTime).getTime() + task.duration * 60000),
    resource: task,
    completed: task.completed
  })).sort((a, b) => {
    // Sort by start time
    if (a.start < b.start) return -1;
    if (a.start > b.start) return 1;

    // Then by duration (longer events first usually looks better)
    const durationA = a.end - a.start;
    const durationB = b.end - b.start;
    if (durationA > durationB) return -1;
    if (durationA < durationB) return 1;

    // Finally by ID for deterministic stability
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;

    return 0;
  });

  const handleSelectSlot = useCallback(({ start }) => {
    if (draggedEvent) {
      onTaskSchedule(draggedEvent.id, start);
      setDraggedEvent(null);
    } else {
      // Open quick task dialog with selected time
      setQuickTaskDialog({
        open: true,
        selectedTime: start
      });
    }
  }, [draggedEvent, onTaskSchedule]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const getTimeFromPosition = (y) => {
    // Get the time content element and its dimensions
    const timeContent = document.querySelector('.rbc-time-content');
    const timeSlot = document.querySelector('.rbc-timeslot-group');

    // Calculate time based on position
    const slotHeight = timeSlot.offsetHeight;
    const minutesPerSlot = 15; // Each slot is 15 minutes
    const slotsFromTop = y / (slotHeight / 4); // Divide by 4 as each hour has 4 slots

    // Calculate hours and minutes
    const totalMinutes = slotsFromTop * minutesPerSlot;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round((totalMinutes % 60) / 15) * 15; // Round to nearest 15 minutes

    // Create new date at the calculated time
    const dropTime = new Date(selectedDate);
    dropTime.setHours(hours, minutes, 0, 0);

    return dropTime;
  };

  const handleDrop = useCallback((event) => {
    const taskData = JSON.parse(event.dataTransfer.getData('task'));
    const calendarElement = document.querySelector('.rbc-calendar');
    const calendarRect = calendarElement.getBoundingClientRect();
    const timeContent = document.querySelector('.rbc-time-content');
    const timeContentRect = timeContent.getBoundingClientRect();

    // Calculate position relative to time content
    const relativeY = event.clientY - timeContentRect.top + timeContent.scrollTop;

    const dropTime = getTimeFromPosition(relativeY);

    onTaskSchedule(taskData.id, dropTime);
  }, [onTaskSchedule]);

  const handleEventDrop = useCallback(({ event, start, end }) => {
    // Calculate new duration based on the drop
    const duration = (end - start) / (1000 * 60); // Convert to minutes
    onTaskSchedule(event.id, start, duration);
  }, [onTaskSchedule]);

  const handleEventResize = useCallback(({ event, start, end }) => {
    // Calculate new duration based on the resize
    const duration = (end - start) / (1000 * 60); // Convert to minutes
    onTaskSchedule(event.id, start, duration);
  }, [onTaskSchedule]);

  const components = {
    toolbar: props => (
      <div className='rbc-toolbar'>
        <span className='rbc-btn-group'>
          <button type='button' onClick={() => props.onNavigate('PREV')}>
            <NavigateBeforeIcon fontSize="small" />
          </button>
          <button
            type='button'
            onClick={(e) => setDatePickerAnchor(e.currentTarget)}
          >
            <TodayIcon fontSize="small" />
          </button>
          <button type='button' onClick={() => props.onNavigate('NEXT')}>
            <NavigateNextIcon fontSize="small" />
          </button>
        </span>
        <span className='rbc-toolbar-label'>{props.label}</span>
        <span className='rbc-btn-group'></span>
      </div>
    )
  };

  const handleQuickTaskCreate = (taskData) => {
    // Create and schedule the task immediately
    const task = {
      ...taskData,
      scheduledTime: quickTaskDialog.selectedTime,
      date: format(selectedDate, 'yyyy-MM-dd'),
      createdAt: new Date().toISOString()
    };
    onTaskCreate(task);
    setQuickTaskDialog({ open: false, selectedTime: null });
  };

  const handleEventDoubleClick = (event) => {
    setEditDialog({
      open: true,
      task: event.resource
    });
  };

  const handleTaskSave = (editedTask) => {
    onTaskUpdate(editedTask);
    setEditDialog({ open: false, task: null });
  };

  const handleDateSelect = (newDate) => {
    onDateChange(newDate);
    setDatePickerAnchor(null);
  };

  return (
    <div
      className="calendar-view"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <DnDCalendar
        localizer={localizer}
        events={events}
        defaultView="day"
        views={['day']}
        min={new Date(0, 0, 0, 0, 0, 0)}
        max={new Date(0, 0, 0, 23, 59, 59)}
        step={15}
        timeslots={4}
        date={selectedDate}
        onNavigate={date => onDateChange(date)}
        scrollToTime={scrollTime}
        onSelectSlot={handleSelectSlot}
        selectable
        resizable
        components={components}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        onDoubleClickEvent={handleEventDoubleClick}
        eventPropGetter={(event) => ({
          className: 'calendar-event',
          style: {
            backgroundColor: event.completed ? '#66bb6a' : '#1976d2',
            opacity: event.completed ? 0.7 : 1,
            textDecoration: event.completed ? 'line-through' : 'none'
          }
        })}
      />
      <Popover
        open={Boolean(datePickerAnchor)}
        anchorEl={datePickerAnchor}
        onClose={() => setDatePickerAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateCalendar
            value={selectedDate}
            onChange={handleDateSelect}
            sx={{
              width: 320,
              '& .MuiDayCalendar-header': {
                backgroundColor: 'background.paper',
              },
              '& .MuiPickersDay-root': {
                fontSize: '0.875rem',
                width: 36,
                height: 36,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              },
              '& .MuiPickersCalendarHeader-root': {
                padding: '8px 16px',
                '& .MuiPickersArrowSwitcher-button': {
                  width: 28,
                  height: 28,
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  padding: '4px',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '& svg': {
                    width: 20,
                    height: 20,
                  }
                }
              },
              '& .MuiDayCalendar-weekContainer': {
                margin: '2px 0',
              }
            }}
          />
        </LocalizationProvider>
      </Popover>
      <QuickTaskDialog
        open={quickTaskDialog.open}
        selectedTime={quickTaskDialog.selectedTime}
        onClose={() => setQuickTaskDialog({ open: false, selectedTime: null })}
        onSave={handleQuickTaskCreate}
        selectedDate={selectedDate}
      />
      <TaskEditDialog
        open={editDialog.open}
        task={editDialog.task}
        onClose={() => setEditDialog({ open: false, task: null })}
        onSave={handleTaskSave}
      />
    </div>
  );
}

export default CalendarView; 