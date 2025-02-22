import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
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

function CalendarView({ scheduledTasks, onTaskSchedule }) {
  const events = scheduledTasks.map(task => ({
    id: task.id,
    title: task.name,
    start: new Date(task.scheduledTime),
    end: new Date(new Date(task.scheduledTime).getTime() + task.duration * 60000),
    resource: task
  }));

  const handleSelectSlot = (slotInfo) => {
    // This would typically open a dialog to select from unscheduled tasks
    console.log('Selected slot:', slotInfo);
  };

  const handleEventResize = ({ event, start, end }) => {
    const updatedTasks = scheduledTasks.map(task =>
      task.id === event.id
        ? { ...task, scheduledTime: start, duration: (end - start) / 60000 }
        : task
    );
    onTaskSchedule(event.id, start);
  };

  const handleEventDrop = ({ event, start, end }) => {
    const updatedTasks = scheduledTasks.map(task =>
      task.id === event.id
        ? { ...task, scheduledTime: start }
        : task
    );
    onTaskSchedule(event.id, start);
  };

  return (
    <div className="calendar-view">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        selectable
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        resizable
        defaultView="day"
        views={['day', 'week']}
      />
    </div>
  );
}

export default CalendarView; 