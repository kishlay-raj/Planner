import React, { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import { Paper } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './CalendarView.css';

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

function CalendarView({ scheduledTasks, onTaskSchedule }) {
  const [draggedEvent, setDraggedEvent] = useState(null);

  const events = scheduledTasks.map(task => ({
    id: task.id,
    title: `${task.name} (${task.duration}min) - ${format(new Date(task.scheduledTime), 'HH:mm')} to ${format(new Date(new Date(task.scheduledTime).getTime() + task.duration * 60000), 'HH:mm')}`,
    start: new Date(task.scheduledTime),
    end: new Date(new Date(task.scheduledTime).getTime() + task.duration * 60000),
    resource: task
  }));

  const handleSelectSlot = useCallback(({ start }) => {
    if (draggedEvent) {
      onTaskSchedule(draggedEvent.id, start);
      setDraggedEvent(null);
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
    const dropTime = new Date();
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
    const duration = (end - start) / (1000 * 60); // Convert to minutes
    onTaskSchedule(event.id, start, duration);
  }, [onTaskSchedule]);

  const components = {
    toolbar: (props) => (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => props.onNavigate('PREV')}>
            <NavigateBeforeIcon />
          </button>
          <button type="button" onClick={() => props.onNavigate('TODAY')}>
            Today
          </button>
          <button type="button" onClick={() => props.onNavigate('NEXT')}>
            <NavigateNextIcon />
          </button>
        </span>
        <span className="rbc-toolbar-label">{props.label}</span>
        <span className="rbc-btn-group">
          {props.views.map(view => (
            <button
              key={view}
              type="button"
              className={view === props.view ? 'rbc-active' : ''}
              onClick={() => props.onView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </span>
      </div>
    )
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
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        selectable
        resizable
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        onSelectSlot={handleSelectSlot}
        defaultView="day"
        views={['day', 'week']}
        step={15}
        timeslots={4}
        components={components}
        eventPropGetter={(event) => ({
          className: 'calendar-event',
          style: {
            backgroundColor: event.resource?.completed 
              ? '#66bb6a'  // Green for completed tasks
              : event.resource?.urgent && event.resource?.important 
                ? '#f44336' 
                : '#1976d2',
            textDecoration: event.resource?.completed ? 'line-through' : 'none',
            opacity: event.resource?.completed ? 0.7 : 1
          }
        })}
      />
    </div>
  );
}

export default CalendarView; 