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
  Tooltip
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Add as AddIcon,
  Delete as DeleteIcon,
  Brightness4,
  Brightness7
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDark, setIsDark] = useState(false);

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

  // --- Theme ---
  const theme = {
    // Base Colors
    bg: isDark ? '#121212' : '#f0f2f5',
    paper: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#e0e0e0' : '#2d3748',
    textSecondary: isDark ? '#a0a0a0' : '#718096',

    // UI Elements
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : '#f7fafc',
    divider: isDark ? '#333333' : '#e2e8f0',
    checkbox: isDark ? '#e0e0e0' : '#4a5568',
    icon: isDark ? '#e0e0e0' : '#4a5568',

    // Accents (Enhanced for better contrast and harmony)
    primary: isDark ? '#90caf9' : '#3182ce', // Blue
    accent1: isDark ? '#ce93d8' : '#9f7aea', // Purple
    accent2: isDark ? '#a5d6a7' : '#38a169', // Green
    accent3: isDark ? '#ffcc80' : '#dd6b20', // Orange

    // Borders & shadows
    border: isDark ? '1px solid #333' : '1px solid #e2e8f0',
    shadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  };

  // --- Handlers ---
  const handleFocusChange = (e) => {
    updateWeekData({ focus: e.target.value });
  };

  const handleGoalAdd = () => {
    const newGoal = { id: Date.now(), text: '', completed: false };
    updateWeekData({ goals: [...currentWeekData.goals, newGoal] });
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

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'auto', bgcolor: theme.bg, color: theme.text, transition: 'all 0.3s ease' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ width: 40 }} /> {/* Spacer for balance */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => handleNavigate('prev')} sx={{ color: theme.icon }}>
            <NavigateBefore />
          </IconButton>
          <Typography variant="h5" sx={{ mx: 2, fontWeight: 'bold' }}>
            Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </Typography>
          <IconButton onClick={() => handleNavigate('next')} sx={{ color: theme.icon }}>
            <NavigateNext />
          </IconButton>
        </Box>
        <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <IconButton onClick={() => setIsDark(!isDark)} sx={{ color: theme.text }}>
            {isDark ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* MONTHLY FOCUS (Cascading) */}
      {monthlyFocus && (
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(56, 178, 172, 0.08)', borderRadius: 2, border: `1px solid ${theme.primary}` }}>
          <Typography variant="caption" sx={{ color: theme.primary, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
            MONTHLY FOCUS ({format(currentDate, 'MMMM')})
          </Typography>
          <Typography variant="body2" sx={{ color: theme.text, fontSize: '0.9rem' }}>
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
              bgcolor: theme.paper,
              color: theme.text,
              borderRadius: 3,
              boxShadow: theme.shadow,
              border: theme.border
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: theme.primary, fontWeight: 700, letterSpacing: '0.5px' }}>
                WEEKLY FOCUS
              </Typography>
              <TextField
                fullWidth
                placeholder="What is your main focus this week?"
                value={currentWeekData.focus}
                onChange={handleFocusChange}
                variant="standard"
                InputProps={{
                  style: { color: theme.text, fontSize: '1.1rem' },
                  disableUnderline: true
                }}
                sx={{
                  bgcolor: theme.inputBg,
                  p: 2,
                  borderRadius: 2
                }}
              />
            </Paper>

            {/* Weekly Goals */}
            <Paper sx={{
              p: 3,
              bgcolor: theme.paper,
              color: theme.text,
              borderRadius: 3,
              boxShadow: theme.shadow,
              border: theme.border
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: theme.accent1, fontWeight: 700, letterSpacing: '0.5px' }}>
                  GOALS
                </Typography>
                <IconButton size="small" onClick={handleGoalAdd} sx={{ color: theme.accent1, bgcolor: theme.inputBg, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' } }}>
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
                        color: theme.checkbox,
                        p: 0.5,
                        '&.Mui-checked': { color: theme.accent1 }
                      }}
                    />
                    <TextField
                      fullWidth
                      value={goal.text}
                      onChange={(e) => handleGoalChange(goal.id, 'text', e.target.value)}
                      placeholder="Add a goal..."
                      variant="standard"
                      InputProps={{
                        style: { color: goal.completed ? theme.textSecondary : theme.text, textDecoration: goal.completed ? 'line-through' : 'none' },
                        disableUnderline: true
                      }}
                    />
                    <IconButton size="small" onClick={() => handleGoalDelete(goal.id)} sx={{ color: theme.textSecondary, opacity: 0.6, '&:hover': { opacity: 1, color: '#ef5350' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                {currentWeekData.goals.length === 0 && (
                  <Typography variant="body2" sx={{ color: theme.textSecondary, fontStyle: 'italic', ml: 1 }}>
                    No goals set (Click + to add)
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* One Habit Tracker */}
            <Paper sx={{
              p: 3,
              bgcolor: theme.paper,
              color: theme.text,
              borderRadius: 3,
              boxShadow: theme.shadow,
              border: theme.border
            }}>
              <Typography variant="h6" sx={{ color: theme.accent2, fontWeight: 700, letterSpacing: '0.5px' }}>
                HABIT TRACKER
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 2, color: theme.textSecondary, fontStyle: 'italic' }}>
                Make it so easy you can't say no.
              </Typography>
              <TextField
                fullWidth
                placeholder="I will [BEHAVIOR] at [TIME] in [LOCATION]."
                value={currentWeekData.habit.name}
                onChange={handleHabitNameChange}
                variant="standard"
                InputProps={{
                  style: { color: theme.text, fontSize: '1.1rem', fontWeight: 500 },
                  disableUnderline: true
                }}
                sx={{ mb: 3, borderBottom: `2px solid ${theme.divider}`, pb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: theme.textSecondary, fontWeight: 600 }}>{day}</Typography>
                    <Checkbox
                      checked={currentWeekData.habit.days[idx]}
                      onChange={() => handleHabitToggle(idx)}
                      sx={{
                        color: theme.checkbox,
                        '&.Mui-checked': { color: theme.accent2 },
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
              bgcolor: theme.paper,
              color: theme.text,
              borderRadius: 3,
              boxShadow: theme.shadow,
              border: theme.border
            }}>
              <Typography variant="h6" sx={{ mb: 3, color: theme.accent3, fontWeight: 700, letterSpacing: '0.5px' }}>
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
                    <Typography variant="caption" sx={{ color: theme.accent3, opacity: 0.9, display: 'block', mb: 1, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
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
                        bgcolor: theme.inputBg,
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                          color: theme.text,
                          '& fieldset': { borderColor: 'transparent' },
                          '&:hover fieldset': { borderColor: theme.divider },
                          '&.Mui-focused fieldset': { borderColor: theme.accent3 },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: theme.textSecondary,
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
              bgcolor: theme.paper,
              color: theme.text,
              borderRadius: 3,
              boxShadow: theme.shadow,
              border: theme.border
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5, color: theme.text }}>
                  Weekly Notes
                </Typography>
              </Box>
              <TextField
                fullWidth multiline minRows={5}
                placeholder="Brain dump, reminders, or extra notes..."
                value={currentWeekData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                sx={{
                  bgcolor: theme.inputBg,
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    color: theme.text,
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: theme.divider },
                    '&.Mui-focused fieldset': { borderColor: theme.accent3 },
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
              // Note: date-fns isSameDay(dateLeft, dateRight)
              // We'll trust the import is correct from context

              return (
                <Paper key={dateKey} sx={{
                  p: 2.5,
                  bgcolor: theme.paper,
                  color: theme.text,
                  borderLeft: isToday ? `6px solid ${theme.primary}` : '6px solid transparent',
                  borderRadius: 3,
                  boxShadow: theme.shadow,
                  border: theme.border,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDark ? '0 6px 12px rgba(0,0,0,0.5)' : '0 4px 6px rgba(0,0,0,0.05)'
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1.5, gap: 1.5, borderBottom: `1px solid ${theme.divider}`, pb: 1 }}>
                    <Typography variant="h6" sx={{ color: isToday ? theme.primary : theme.text, fontWeight: 700 }}>
                      {format(day, 'EEEE')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, fontWeight: 500 }}>
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
                      style: { color: theme.text, fontSize: '1rem', lineHeight: 1.6 }
                    }}
                    sx={{
                      minHeight: '80px',
                      '& .MuiInputBase-root': { alignItems: 'flex-start' },
                      '& .MuiInputBase-input::placeholder': {
                        color: theme.textSecondary,
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