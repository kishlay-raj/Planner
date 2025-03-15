import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

function Calendar({ selectedDate, onDateSelect }) {
  const events = []; // You can populate this with your events

  return (
    <Paper sx={{ 
      height: 'calc(100vh - 80px)', 
      p: 2,
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Calendar
      </Typography>
      <Box sx={{ flex: 1 }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          date={selectedDate}
          onNavigate={date => onDateSelect(date)}
          onSelectSlot={({ start }) => onDateSelect(start)}
          selectable
          views={['month', 'week', 'day']}
        />
      </Box>
    </Paper>
  );
}

export default Calendar; 