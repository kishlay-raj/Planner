import React, { useState } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreNew';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  TextField,
  Checkbox,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  getISOWeek,
  getYear,
  getMonth
} from 'date-fns';

// Default week data structure
const defaultWeekData = {
  focus: '',
  goals: [],
  habit: { name: '', days: [false, false, false, false, false, false, false] },
  journal: { start: '', stop: '', continue: '', grateful: '' },
  days: {},
  notes: ''
};

function WeeklyPlanner() {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekId = `${getYear(currentDate)}-${getISOWeek(currentDate)}`;
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Use week-specific document path
  const [rawWeekData, setWeekData] = useFirestoreDoc(`planner/weekly/${weekId}`, defaultWeekData);

  // Ensure all nested properties have safe defaults (merge with defaults)
  const currentWeekData = {
    focus: rawWeekData?.focus ?? '',
    goals: rawWeekData?.goals ?? [],
    habit: {
      name: rawWeekData?.habit?.name ?? '',
      days: rawWeekData?.habit?.days ?? [false, false, false, false, false, false, false]
    },
    journal: {
      start: rawWeekData?.journal?.start ?? '',
      stop: rawWeekData?.journal?.stop ?? '',
      continue: rawWeekData?.journal?.continue ?? '',
      grateful: rawWeekData?.journal?.grateful ?? ''
    },
    days: rawWeekData?.days ?? {},
    notes: rawWeekData?.notes ?? ''
  };

  // Get monthly focus from current month
  const currentMonthKey = `${getYear(currentDate)}-${getMonth(currentDate) + 1}`;
  const [monthlyData] = useFirestoreDoc(`planner/monthly/${currentMonthKey}`, {});
  const monthlyFocus = monthlyData?.monthlyFocus || '';

  const updateWeekData = (updates) => {
    setWeekData({
      ...currentWeekData,
      ...updates
    });
  };

  const handleNavigate = (direction) => {
    setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  // --- Handlers ---
  const handleFocusChange = (e) => {
    updateWeekData({ focus: e.target.value });
  };

  const handleGoalAdd = () => {
    const newGoal = { id: Date.now(), text: '', completed: false };
    updateWeekData({ goals: [...currentWeekData.goals, newGoal] });

    import("../firebase").then(({ logAnalyticsEvent }) => {
      logAnalyticsEvent('weekly_goal_added');
    });
  };

  const handleGoalChange = (id, field, value) => {
    const newGoals = currentWeekData.goals.map(g =>
      g.id === id ? { ...g, [field]: value } : g
    );
    updateWeekData({ goals: newGoals });
  };

  const handleGoalDelete = (id) => {
    updateWeekData({ goals: currentWeekData.goals.filter(g => g.id !== id) });
  };

  const handleHabitNameChange = (e) => {
    updateWeekData({ habit: { ...currentWeekData.habit, name: e.target.value } });
  };

  const handleHabitToggle = (index) => {
    const newDays = [...currentWeekData.habit.days];
    newDays[index] = !newDays[index];
    updateWeekData({ habit: { ...currentWeekData.habit, days: newDays } });

    // Only log positive tracking
    if (newDays[index]) {
      import("../firebase").then(({ logAnalyticsEvent }) => {
        logAnalyticsEvent('weekly_habit_tracked', {
          habit_name: currentWeekData.habit.name
        });
      });
    }
  };

  const handleJournalChange = (field, value) => {
    updateWeekData({
      journal: { ...currentWeekData.journal, [field]: value }
    });
  };

  const handleDayNoteChange = (dateKey, value) => {
    updateWeekData({
      days: { ...currentWeekData.days, [dateKey]: value }
    });
  };

  const handleNotesChange = (val) => updateWeekData({ notes: val });

  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'auto', bgcolor: 'background.default', color: 'text.primary', transition: 'all 0.3s ease' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => handleNavigate('prev')} sx={{ color: 'text.secondary' }}>
            <NavigateBefore />
          </IconButton>
          <Typography variant="h5" sx={{ mx: 2, fontWeight: 'bold' }}>
            Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </Typography>
          <IconButton onClick={() => handleNavigate('next')} sx={{ color: 'text.secondary' }}>
            <NavigateNext />
          </IconButton>
        </Box>
      </Box>

      {/* MONTHLY FOCUS (Cascading) */}
      {monthlyFocus && (
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(56, 178, 172, 0.08)', borderRadius: 2, border: `1px solid ${theme.palette.primary.main}` }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
            MONTHLY FOCUS ({format(currentDate, 'MMMM')})
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.9rem' }}>
            {monthlyFocus}
          </Typography>
        </Paper>
      )}

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Weekly Focus */}
            <Paper sx={{
              p: 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 700, letterSpacing: '0.5px' }}>
                WEEKLY FOCUS
              </Typography>
              <TextField
                fullWidth
                placeholder="What is your main focus this week?"
                value={currentWeekData.focus}
                onChange={handleFocusChange}
                variant="standard"
                InputProps={{
                  style: { color: theme.palette.text.primary, fontSize: '1.1rem' },
                  disableUnderline: true
                }}
                sx={{
                  bgcolor: 'action.hover',
                  p: 2,
                  borderRadius: 2
                }}
              />
            </Paper>

            {/* Weekly Goals */}
            <Paper sx={{
              p: 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.5px' }}>
                  GOALS
                </Typography>
                <IconButton size="small" onClick={handleGoalAdd} sx={{ color: 'secondary.main', bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {currentWeekData.goals.map((goal) => (
                  <Box key={goal.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Checkbox
                      checked={goal.completed}
                      onChange={(e) => handleGoalChange(goal.id, 'completed', e.target.checked)}
                      sx={{
                        color: 'text.secondary',
                        p: 0.5,
                        '&.Mui-checked': { color: 'secondary.main' }
                      }}
                    />
                    <TextField
                      fullWidth
                      value={goal.text}
                      onChange={(e) => handleGoalChange(goal.id, 'text', e.target.value)}
                      placeholder="Add a goal..."
                      variant="standard"
                      InputProps={{
                        style: { color: goal.completed ? theme.palette.text.secondary : theme.palette.text.primary, textDecoration: goal.completed ? 'line-through' : 'none' },
                        disableUnderline: true
                      }}
                    />
                    <IconButton size="small" onClick={() => handleGoalDelete(goal.id)} sx={{ color: 'text.secondary', opacity: 0.6, '&:hover': { opacity: 1, color: '#ef5350' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                {currentWeekData.goals.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', ml: 1 }}>
                    No goals set (Click + to add)
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* One Habit Tracker */}
            <Paper sx={{
              p: 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700, letterSpacing: '0.5px' }}>
                HABIT TRACKER
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                Make it so easy you can't say no.
              </Typography>
              <TextField
                fullWidth
                placeholder="I will [BEHAVIOR] at [TIME] in [LOCATION]."
                value={currentWeekData.habit.name}
                onChange={handleHabitNameChange}
                variant="standard"
                InputProps={{
                  style: { color: theme.palette.text.primary, fontSize: '1.1rem', fontWeight: 500 },
                  disableUnderline: true
                }}
                sx={{ mb: 3, borderBottom: 2, borderColor: 'divider', pb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{day}</Typography>
                    <Checkbox
                      checked={currentWeekData.habit.days[idx]}
                      onChange={() => handleHabitToggle(idx)}
                      sx={{
                        color: 'text.secondary',
                        '&.Mui-checked': { color: 'success.main' },
                        padding: 0,
                        transform: 'scale(1.2)'
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Journal */}
            <Paper sx={{
              p: 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="h6" sx={{ mb: 3, color: 'warning.main', fontWeight: 700, letterSpacing: '0.5px' }}>
                REFLECTION
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { label: "Start: What is something new I want to try next week?", key: 'start' },
                  { label: "Stop: What distracted me from my aim or wasted my time?", key: 'stop' },
                  { label: "Continue: What workflow worked really well this week?", key: 'continue' },
                  { label: "Grateful: What am I grateful for?", key: 'grateful' }
                ].map((item) => (
                  <Box key={item.key}>
                    <Typography variant="caption" sx={{ color: 'warning.main', opacity: 0.9, display: 'block', mb: 1, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      {item.label}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      value={currentWeekData.journal[item.key]}
                      onChange={(e) => handleJournalChange(item.key, e.target.value)}
                      variant="outlined"
                      placeholder="Write here..."
                      sx={{
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                          color: 'text.primary',
                          '& fieldset': { borderColor: 'transparent' },
                          '&:hover fieldset': { borderColor: 'divider' },
                          '&.Mui-focused fieldset': { borderColor: 'warning.main' },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'text.secondary',
                          opacity: 0.5
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* NOTES SECTION */}
            <Paper sx={{
              p: 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5, color: 'text.primary' }}>
                  Weekly Notes
                </Typography>
              </Box>
              <TextField
                fullWidth multiline minRows={5}
                placeholder="Brain dump, reminders, or extra notes..."
                value={currentWeekData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                sx={{
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: 'divider' },
                    '&.Mui-focused fieldset': { borderColor: 'warning.main' },
                  }
                }}
              />
            </Paper>
          </Box>
        </Grid>

        {/* Right Column (Days) */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {daysOfWeek.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isToday = isSameDay(day, new Date());

              return (
                <Paper key={dateKey} sx={{
                  p: 2.5,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  borderLeft: isToday ? `6px solid ${theme.palette.primary.main}` : '6px solid transparent',
                  borderRadius: 3,
                  boxShadow: 1,
                  border: 1,
                  borderColor: 'divider',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDarkMode ? 4 : 2
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1.5, gap: 1.5, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                    <Typography variant="h6" sx={{ color: isToday ? 'primary.main' : 'text.primary', fontWeight: 700 }}>
                      {format(day, 'EEEE')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {format(day, 'MMMM d')}
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    placeholder={`Plan for ${format(day, 'EEEE')}...`}
                    value={currentWeekData.days[dateKey] || ''}
                    onChange={(e) => handleDayNoteChange(dateKey, e.target.value)}
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                      style: { color: theme.palette.text.primary, fontSize: '1rem', lineHeight: 1.6 }
                    }}
                    sx={{
                      minHeight: '80px',
                      '& .MuiInputBase-root': { alignItems: 'flex-start' },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'text.secondary',
                        opacity: 0.5
                      }
                    }}
                  />
                </Paper>
              );
            })}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default WeeklyPlanner;