import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  TextField,
  Checkbox
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
  getYear
} from 'date-fns';

function WeeklyPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plannerData, setPlannerData] = useState(() => {
    try {
      const saved = localStorage.getItem('weeklyPlannerData');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error loading weekly planner:', e);
      return {};
    }
  });

  const weekId = `${getYear(currentDate)} -${getISOWeek(currentDate)} `;
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Initialize current week data if missing
  const currentWeekData = plannerData[weekId] || {
    focus: '',
    goals: [], // { id, text, completed }
    habit: { name: '', days: [false, false, false, false, false, false, false] },
    journal: { start: '', stop: '', continue: '', grateful: '' },
    days: {} // { 'yyyy-MM-dd': 'notes' }
  };

  useEffect(() => {
    localStorage.setItem('weeklyPlannerData', JSON.stringify(plannerData));
  }, [plannerData]);

  const updateWeekData = (updates) => {
    setPlannerData(prev => ({
      ...prev,
      [weekId]: {
        ...currentWeekData,
        ...updates
      }
    }));
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

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'auto', bgcolor: '#121212', color: 'white' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        <IconButton onClick={() => handleNavigate('prev')} sx={{ color: 'white' }}>
          <NavigateBefore />
        </IconButton>
        <Typography variant="h5" sx={{ mx: 2, fontWeight: 'bold' }}>
          Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </Typography>
        <IconButton onClick={() => handleNavigate('next')} sx={{ color: 'white' }}>
          <NavigateNext />
        </IconButton>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Weekly Focus */}
            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 1, color: '#90caf9' }}>Weekly Focus</Typography>
              <TextField
                fullWidth
                placeholder="What is your main focus this week?"
                value={currentWeekData.focus}
                onChange={handleFocusChange}
                variant="standard"
                InputProps={{
                  style: { color: 'white' },
                  disableUnderline: true
                }}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.05)',
                  p: 1,
                  borderRadius: 1
                }}
              />
            </Paper>

            {/* Weekly Goals */}
            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ color: '#ce93d8' }}>Weekly Goals</Typography>
                <IconButton size="small" onClick={handleGoalAdd} sx={{ color: '#ce93d8' }}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {currentWeekData.goals.map((goal) => (
                  <Box key={goal.id} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={goal.completed}
                      onChange={(e) => handleGoalChange(goal.id, 'completed', e.target.checked)}
                      sx={{ color: 'white', '&.Mui-checked': { color: '#ce93d8' } }}
                    />
                    <TextField
                      fullWidth
                      value={goal.text}
                      onChange={(e) => handleGoalChange(goal.id, 'text', e.target.value)}
                      placeholder="Add a goal..."
                      variant="standard"
                      InputProps={{
                        style: { color: goal.completed ? 'gray' : 'white', textDecoration: goal.completed ? 'line-through' : 'none' },
                        disableUnderline: true
                      }}
                    />
                    <IconButton size="small" onClick={() => handleGoalDelete(goal.id)} sx={{ color: 'gray' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                {currentWeekData.goals.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'gray', fontStyle: 'italic', ml: 1 }}>
                    No goals set (Click + to add)
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* One Habit Tracker */}
            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 1, color: '#a5d6a7' }}>Habit Tracker</Typography>
              <TextField
                fullWidth
                placeholder="Enter one habit to track..."
                value={currentWeekData.habit.name}
                onChange={handleHabitNameChange}
                variant="standard"
                InputProps={{
                  style: { color: 'white', fontSize: '1.1rem' },
                  disableUnderline: true
                }}
                sx={{ mb: 2, borderBottom: '1px solid #444' }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'gray', mb: 0.5 }}>{day}</Typography>
                    <Checkbox
                      checked={currentWeekData.habit.days[idx]}
                      onChange={() => handleHabitToggle(idx)}
                      sx={{
                        color: 'white',
                        '&.Mui-checked': { color: '#a5d6a7' },
                        padding: 0
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Journal */}
            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#ffcc80' }}>Weekly Journal</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: "Start: What is something new I want to try next week?", key: 'start' },
                  { label: "Stop: What distracted me from my aim or wasted my time this week?", key: 'stop' },
                  { label: "Continue: What workflow worked really well this week?", key: 'continue' },
                  { label: "Grateful: What am I grateful for?", key: 'grateful' }
                ].map((item) => (
                  <Box key={item.key}>
                    <Typography variant="caption" sx={{ color: '#ffcc80', opacity: 0.8, display: 'block', mb: 0.5 }}>
                      {item.label}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      value={currentWeekData.journal[item.key]}
                      onChange={(e) => handleJournalChange(item.key, e.target.value)}
                      variant="outlined"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.05)',
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#666' },
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
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
                  p: 2,
                  bgcolor: '#1e1e1e',
                  color: 'white',
                  borderLeft: isToday ? '4px solid #90caf9' : '4px solid transparent'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1, gap: 1 }}>
                    <Typography variant="h6" sx={{ color: isToday ? '#90caf9' : 'white' }}>
                      {format(day, 'EEEE')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'gray' }}>
                      {format(day, 'MMM d')}
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    placeholder="Tasks, events, or notes..."
                    value={currentWeekData.days[dateKey] || ''}
                    onChange={(e) => handleDayNoteChange(dateKey, e.target.value)}
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                      style: { color: 'white', fontSize: '0.95rem', lineHeight: 1.5 }
                    }}
                    sx={{
                      minHeight: '60px',
                      '& .MuiInputBase-root': { alignItems: 'flex-start' }
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