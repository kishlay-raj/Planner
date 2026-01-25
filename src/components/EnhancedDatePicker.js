import React from 'react';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { Badge, Box } from '@mui/material';
import { format } from 'date-fns';

/**
 * Enhanced Date Picker with entry indicators
 * Shows visual dots on dates that have journal entries or tasks
 * 
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onDateChange - Callback when date is selected  
 * @param {Object} entriesMap - Map of dates with entries { 'yyyy-MM-dd': { hasJournal, hasTasks } }
 */
const EnhancedDatePicker = ({ selectedDate, onDateChange, entriesMap = {} }) => {
    const ServerDay = (props) => {
        const { day, outsideCurrentMonth, ...other } = props;
        const dateKey = format(day, 'yyyy-MM-dd');
        const entry = entriesMap[dateKey];

        const hasJournal = entry?.hasJournal || false;
        const hasTasks = entry?.hasTasks || false;

        // Determine badge color
        let badgeColor = 'default';
        if (hasJournal && hasTasks) {
            badgeColor = 'warning'; // Yellow - both
        } else if (hasJournal) {
            badgeColor = 'primary'; // Blue - journal only
        } else if (hasTasks) {
            badgeColor = 'success'; // Green - tasks only
        }

        const showBadge = (hasJournal || hasTasks) && !outsideCurrentMonth;

        return (
            <Badge
                key={day.toString()}
                overlap="circular"
                badgeContent={showBadge ? '•' : undefined}
                color={badgeColor}
                sx={{
                    '& .MuiBadge-badge': {
                        fontSize: '1.2rem',
                        height: '6px',
                        minWidth: '6px',
                        padding: 0,
                        top: '32px',
                        right: '12px'
                    }
                }}
            >
                <PickersDay
                    {...other}
                    outsideCurrentMonth={outsideCurrentMonth}
                    day={day}
                />
            </Badge>
        );
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 2 }}>
                <DateCalendar
                    value={selectedDate}
                    onChange={onDateChange}
                    slots={{
                        day: ServerDay
                    }}
                />

                {/* Legend */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1, fontSize: '0.75rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                        <span>Journal</span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                        <span>Tasks</span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                        <span>Both</span>
                    </Box>
                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default EnhancedDatePicker;
