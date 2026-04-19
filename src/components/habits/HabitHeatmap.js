import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { format, subDays } from 'date-fns';
import '../habits/AntiGravity.css';

/**
 * GitHub-style contribution heatmap for a single habit.
 * Shows the last `totalDays` days of completion data.
 */
export default function HabitHeatmap({ completionDates = [], totalDays = 90, habitName }) {
  const today = new Date();
  const dateSet = new Set(completionDates);

  // Build array of days from (totalDays ago) to today
  const days = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const key = format(d, 'yyyy-MM-dd');
    days.push({
      date: d,
      key,
      completed: dateSet.has(key)
    });
  }

  // Group by week for proper grid alignment
  const weeks = [];
  let currentWeek = [];
  
  days.forEach((day, i) => {
    const dayOfWeek = day.date.getDay(); // 0=Sun, 6=Sat
    if (i === 0) {
      // Pad the first week with empty cells
      for (let pad = 0; pad < dayOfWeek; pad++) {
        currentWeek.push(null);
      }
    }
    currentWeek.push(day);
    if (dayOfWeek === 6 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <Box>
      {habitName && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
          {habitName}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: '3px', overflowX: 'auto', pb: 1 }}>
        {weeks.map((week, wi) => (
          <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {week.map((day, di) => {
              if (!day) {
                return <Box key={`empty-${di}`} sx={{ width: 14, height: 14 }} />;
              }
              return (
                <Tooltip 
                  key={day.key} 
                  title={`${format(day.date, 'MMM d, yyyy')} — ${day.completed ? '✅ Completed' : '⬜ Missed'}`}
                  arrow
                  placement="top"
                >
                  <Box 
                    className={`heatmap-cell ${day.completed ? 'heatmap-level-3' : 'heatmap-level-0'}`}
                  />
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
