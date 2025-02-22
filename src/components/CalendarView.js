import React, { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import { Paper } from '@mui/material';
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

  const handleDrop = useCallback((event) => {
    const taskData = JSON.parse(event.dataTransfer.getData('task'));
    const calendarElement = document.querySelector('.rbc-calendar');
    const calendarRect = calendarElement.getBoundingClientRect();
    const dropTime = getTimeFromPosition(event.clientY - calendarRect.top);
    
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

  const getTimeFromPosition = (y) => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const minutesPerPixel = (24 * 60) / document.querySelector('.rbc-time-content').offsetHeight;
    const minutes = y * minutesPerPixel;
    return addMinutes(startOfDay, minutes);
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
        eventPropGetter={(event) => ({
          className: 'calendar-event',
          style: {
            backgroundColor: event.resource?.urgent && event.resource?.important ? '#f44336' : '#1976d2'
          }
        })}
      />
    </div>
  );
}

export default CalendarView; 