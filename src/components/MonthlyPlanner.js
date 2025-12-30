import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  TextField,
  Tooltip,
  Divider
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Brightness4,
  Brightness7,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getYear,
  getMonth,
  getDay
} from 'date-fns';

function MonthlyPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDark, setIsDark] = useState(false);
  const [plannerData, setPlannerData] = useState(() => {
    try {
      const saved = localStorage.getItem('monthlyPlannerData');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error loading monthly planner:', e);
      return {};
    }
  });

  const monthId = `${getYear(currentDate)}-${getMonth(currentDate) + 1}`;
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array(startDayOfWeek).fill(null);

  const currentMonthData = plannerData[monthId] || {
    rules: '',
    monthlyFocus: '',
    habits: [{ id: 1, name: '', days: {} }],
    journal: {
      comfortZone: '', topPriority: '', boundary: '',
      start: '', stop: '', continue: '',
      inputs: '', outputs: '', rule8020: '',
      distractions: '', skillGap: '', goalCheck: '', oneThing: ''
    },
    days: {},
    notes: ''
  };

  useEffect(() => {
    localStorage.setItem('monthlyPlannerData', JSON.stringify(plannerData));
  }, [plannerData]);

  const updateMonthData = (updates) => {
    setPlannerData(prev => ({
      ...prev,
      [monthId]: { ...currentMonthData, ...updates }
    }));
  };

  const handleNavigate = (direction) => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const handleMonthlyFocusChange = (val) => updateMonthData({ monthlyFocus: val });

  const handleNotesChange = (val) => updateMonthData({ notes: val });

  const handleRulesChange = (val) => updateMonthData({ rules: val });

  const handleHabitNameChange = (id, val) => {
    const newHabits = currentMonthData.habits.map(h => h.id === id ? { ...h, name: val } : h);
    updateMonthData({ habits: newHabits });
  };

  const handleHabitToggle = (habitId, dayNum) => {
    const newHabits = currentMonthData.habits.map(h => {
      if (h.id === habitId) {
        const currentStatus = h.days[dayNum] || false;
        return { ...h, days: { ...h.days, [dayNum]: !currentStatus } };
      }
      return h;
    });
    updateMonthData({ habits: newHabits });
  };

  const addHabit = () => {
    const newId = (currentMonthData.habits.length > 0 ? Math.max(...currentMonthData.habits.map(h => h.id)) : 0) + 1;
    updateMonthData({ habits: [...currentMonthData.habits, { id: newId, name: '', days: {} }] });
  };

  const deleteHabit = (id) => {
    updateMonthData({ habits: currentMonthData.habits.filter(h => h.id !== id) });
  };

  const handleJournalChange = (key, val) => {
    updateMonthData({ journal: { ...currentMonthData.journal, [key]: val } });
  };

  const handleDayNoteChange = (dateKey, val) => {
    updateMonthData({ days: { ...currentMonthData.days, [dateKey]: val } });
  };

  const theme = {
    bg: isDark ? '#121212' : '#f0f2f5',
    paper: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#e0e0e0' : '#2d3748',
    textSecondary: isDark ? '#a0a0a0' : '#718096',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : '#f7fafc',
    divider: isDark ? '#333333' : '#e2e8f0',
    border: isDark ? '1px solid #333' : '1px solid #e2e8f0',
    shadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    primary: isDark ? '#90caf9' : '#3182ce',
    accent1: isDark ? '#ce93d8' : '#9f7aea',
    accent2: isDark ? '#a5d6a7' : '#38a169',
    accent3: isDark ? '#ffcc80' : '#dd6b20',
  };

  const planningPrompts = [
    { label: "Comfort Zone Challenge: What scares me but helps me grow?", key: 'comfortZone', color: theme.accent1 },
    { label: "Top Priority: The one major goal for this month.", key: 'topPriority', color: theme.primary },
    { label: "The Boundary: What must I say 'no' to?", key: 'boundary', color: theme.accent3 },
  ];

  const sscPrompts = [
    { label: "Start", key: 'start', placeholder: "New things to begin..." },
    { label: "Stop", key: 'stop', placeholder: "Habits to drop..." },
    { label: "Continue", key: 'continue', placeholder: "What's working well..." },
  ];

  const reflectionPrompts = [
    { label: "Inputs: What did I consume? (Books, media, food)", key: 'inputs' },
    { label: "Outputs: What did I create or give out?", key: 'outputs' },
    { label: "The 80/20 Rule: 20% of activities -> 80% results", key: 'rule8020' },
    { label: "Distraction Trap: Biggest time waster?", key: 'distractions' },
    { label: "Skill Gap: What skill was missing?", key: 'skillGap' },
    { label: "1-Year Goal Check: Am I closer?", key: 'goalCheck' },
    { label: "The ONE Thing: Makes everything else easier?", key: 'oneThing' },
  ];

  // Retrieve Year Focus from YearlyPlanner
  const [yearFocus, setYearFocus] = useState('');

  useEffect(() => {
    try {
      const savedYearly = localStorage.getItem('yearlyPlannerData');
      if (savedYearly) {
        const yearlyData = JSON.parse(savedYearly);
        const currentYearKey = String(getYear(currentDate));
        if (yearlyData[currentYearKey]) {
          setYearFocus(yearlyData[currentYearKey].yearFocus || '');
        } else {
          setYearFocus('');
        }
      }
    } catch (e) {
      console.error("Error loading year focus", e);
    }
  }, [currentDate]);

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'auto', bgcolor: theme.bg, color: theme.text }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ width: 40 }} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => handleNavigate('prev')}>
            <NavigateBefore />
          </IconButton>
          <Typography variant="h4" sx={{ mx: 3, fontWeight: 'bold' }}>
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={() => handleNavigate('next')}>
            <NavigateNext />
          </IconButton>
        </Box>
        <Tooltip title={isDark ? "Light Mode" : "Dark Mode"}>
          <IconButton onClick={() => setIsDark(!isDark)}>
            {isDark ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* YEAR FOCUS (From Yearly Planner) */}
      {yearFocus && (
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(49, 130, 206, 0.08)', borderRadius: 2, border: `1px solid ${theme.primary}` }}>
          <Typography variant="caption" sx={{ color: theme.primary, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
            Year Focus ({getYear(currentDate)})
          </Typography>
          <Typography variant="body2" sx={{ color: theme.text, fontSize: '0.9rem' }}>
            {yearFocus}
          </Typography>
        </Paper>
      )}

      {/* MONTHLY FOCUS */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
        <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Monthly Focus</Typography>
        <TextField
          fullWidth multiline minRows={2}
          placeholder="Enter your main focus for the month..."
          value={currentMonthData.monthlyFocus}
          onChange={(e) => handleMonthlyFocusChange(e.target.value)}
          sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
        />
      </Paper>
      {/* JOURNALING SECTION (TOP) */}
      <Box sx={{ mb: 5 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Paper sx={{ p: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                <Typography variant="h6" sx={{ mb: 2, color: theme.primary, fontWeight: 700 }}>
                  Month's Rules & System
                </Typography>
                <TextField
                  fullWidth multiline minRows={4}
                  placeholder="Define the rules and system for this month..."
                  value={currentMonthData.rules}
                  onChange={(e) => handleRulesChange(e.target.value)}
                  sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                />
              </Paper>

              <Paper sx={{ p: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Intention Setting</Typography>
                {planningPrompts.map(prompt => (
                  <Box key={prompt.key} sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: prompt.color, mb: 1 }}>{prompt.label}</Typography>
                    <TextField
                      fullWidth multiline minRows={3} variant="standard"
                      value={currentMonthData.journal[prompt.key]}
                      onChange={(e) => handleJournalChange(prompt.key, e.target.value)}
                      InputProps={{ disableUnderline: true }}
                      sx={{ bgcolor: theme.inputBg, p: 1.5, borderRadius: 1 }}
                    />
                  </Box>
                ))}

                {sscPrompts.map(p => (
                  <Box key={p.key} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: theme.textSecondary, mb: 0.5 }}>{p.label}</Typography>
                    <TextField
                      fullWidth multiline minRows={2}
                      placeholder={p.placeholder}
                      value={currentMonthData.journal[p.key]}
                      onChange={(e) => handleJournalChange(p.key, e.target.value)}
                      sx={{ bgcolor: theme.inputBg, '& fieldset': { border: 'none' }, borderRadius: 1 }}
                    />
                  </Box>
                ))}
              </Paper>
            </Box>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Deep Reflection</Typography>
              {reflectionPrompts.map(p => (
                <Box key={p.key} sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: theme.textSecondary, fontWeight: 600, display: 'block', mb: 0.5 }}>
                    {p.label}
                  </Typography>
                  <TextField
                    fullWidth multiline minRows={3}
                    value={currentMonthData.journal[p.key]}
                    onChange={(e) => handleJournalChange(p.key, e.target.value)}
                    size="small"
                    sx={{ bgcolor: theme.inputBg, '& fieldset': { borderColor: theme.divider } }}
                  />
                </Box>
              ))}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2, color: theme.text, fontWeight: 700 }}>Notes & Brain Dump</Typography>
              <TextField
                fullWidth multiline minRows={6}
                placeholder="Capture thoughts, ideas, or reminders for this month..."
                value={currentMonthData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
              />

            </Paper>
          </Grid>
        </Grid>
      </Box>



      <Divider sx={{ my: 5, borderColor: theme.divider, borderWidth: 2 }} />

      {/* BOTTOM SECTION: Habit Tracker then Calendar */}
      <Box>
        <Grid container spacing={3} direction="column">
          {/* Habit Tracker */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow, overflowX: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: theme.accent2, fontWeight: 700 }}>Habit Tracker</Typography>
                <IconButton size="small" onClick={addHabit}><AddIcon /></IconButton>
              </Box>
              <Box sx={{ minWidth: 600 }}>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ width: 150, flexShrink: 0, fontWeight: 'bold', fontSize: '0.8rem' }}>Habit</Box>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <Box key={d} sx={{ width: 32, textAlign: 'center', fontSize: '0.7rem', color: theme.textSecondary }}>{d}</Box>
                  ))}
                </Box>
                {currentMonthData.habits.map(habit => (
                  <Box key={habit.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ width: 150, flexShrink: 0, mr: 1, display: 'flex', alignItems: 'center' }}>
                      <IconButton size="small" onClick={() => deleteHabit(habit.id)} sx={{ p: 0.5, mr: 0.5 }}>
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                      <TextField
                        variant="standard" value={habit.name}
                        onChange={(e) => handleHabitNameChange(habit.id, e.target.value)}
                        placeholder="Habit Name"
                        InputProps={{ disableUnderline: true, style: { fontSize: '0.85rem' } }}
                      />
                    </Box>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <Box key={d}
                        onClick={() => handleHabitToggle(habit.id, d)}
                        sx={{
                          width: 28, height: 28, mx: '2px',
                          bgcolor: habit.days[d] ? theme.accent2 : theme.inputBg,
                          borderRadius: '4px', cursor: 'pointer',
                          '&:hover': { opacity: 0.7 }
                        }}
                      />
                    ))}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
          <Divider sx={{ my: 3, borderColor: theme.divider }} />

          {/* Monthly Calendar */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Monthly Calendar</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 2 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Typography key={day} variant="subtitle2" align="center" sx={{ color: theme.textSecondary, fontWeight: 'bold' }}>
                    {day}
                  </Typography>
                ))}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {paddingDays.map((_, i) => <Box key={`pad-${i}`} />)}
                {daysInMonth.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const isToday = isSameDay(day, new Date());
                  return (
                    <Box key={dateKey} sx={{
                      bgcolor: theme.bg, borderRadius: 1, p: 1,
                      display: 'flex', flexDirection: 'column',
                      border: isToday ? `2px solid ${theme.primary}` : `1px solid ${theme.divider}`,
                      minHeight: 90, overflow: 'hidden'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: isToday ? theme.primary : theme.textSecondary, mb: 0.5 }}>
                        {format(day, 'd')}
                      </Typography>
                      <TextField
                        fullWidth multiline variant="standard" placeholder="+"
                        value={currentMonthData.days[dateKey] || ''}
                        onChange={(e) => handleDayNoteChange(dateKey, e.target.value)}
                        InputProps={{ disableUnderline: true, style: { fontSize: '0.75rem' } }}
                        sx={{ flexGrow: 1 }}
                      />
                    </Box>
                  )
                })}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default MonthlyPlanner;