import React, { useState } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreNew';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  TextField,
  Checkbox,
  Tooltip,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  const quillModules = React.useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
    clipboard: { matchVisual: false }
  }), []);

  return (
    <Box sx={{ 
      p: isMobile ? 2 : 3, 
      pb: isMobile ? 12 : 3, // Extra padding for mobile bottom nav
      height: 'auto', 
      minHeight: '100%',
      bgcolor: 'background.default', 
      color: 'text.primary', 
      transition: 'all 0.3s ease' 
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src="/ganesha_logo.png" alt="Ganesha Logo" style={{ height: isMobile ? '24px' : '36px', width: isMobile ? '24px' : '36px', marginRight: isMobile ? '8px' : '16px', objectFit: 'contain' }} />
          <IconButton onClick={() => handleNavigate('prev')} sx={{ color: 'text.secondary', p: isMobile ? 0.5 : 1 }}>
            <NavigateBefore />
          </IconButton>
          <Typography variant={isMobile ? "subtitle1" : "h5"} sx={{ mx: isMobile ? 1 : 2, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>
            Week of {format(weekStart, 'MMM d')} <br style={{ display: isMobile ? 'block' : 'none' }}/>- {format(weekEnd, 'MMM d, yyyy')}
          </Typography>
          <IconButton onClick={() => handleNavigate('next')} sx={{ color: 'text.secondary', p: isMobile ? 0.5 : 1 }}>
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

      {isMobile ? (
        /* ===== MOBILE: single column, days at the very bottom ===== */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Weekly Focus */}
          <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main', fontWeight: 700, letterSpacing: '0.5px' }}>WEEKLY FOCUS</Typography>
            <TextField fullWidth placeholder="What is your main focus this week?" value={currentWeekData.focus} onChange={handleFocusChange} variant="standard" InputProps={{ style: { color: theme.palette.text.primary, fontSize: '1rem' }, disableUnderline: true }} sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }} />
          </Paper>

          {/* Weekly Goals */}
          <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.5px' }}>GOALS</Typography>
              <IconButton size="small" onClick={handleGoalAdd} sx={{ color: 'secondary.main', bgcolor: 'action.hover' }}><AddIcon /></IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {currentWeekData.goals.map((goal) => (
                <Box key={goal.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox checked={goal.completed} onChange={(e) => handleGoalChange(goal.id, 'completed', e.target.checked)} sx={{ color: 'text.secondary', p: 0.5, '&.Mui-checked': { color: 'secondary.main' } }} />
                  <TextField fullWidth value={goal.text} onChange={(e) => handleGoalChange(goal.id, 'text', e.target.value)} placeholder="Add a goal..." variant="standard" InputProps={{ style: { color: goal.completed ? theme.palette.text.secondary : theme.palette.text.primary, textDecoration: goal.completed ? 'line-through' : 'none' }, disableUnderline: true }} />
                  <IconButton size="small" onClick={() => handleGoalDelete(goal.id)} sx={{ color: 'text.secondary', opacity: 0.6 }}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
              {currentWeekData.goals.length === 0 && <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', ml: 1 }}>No goals set (Click + to add)</Typography>}
            </Box>
          </Paper>

          {/* Habit Tracker */}
          <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 700, letterSpacing: '0.5px' }}>HABIT TRACKER</Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'text.secondary', fontStyle: 'italic' }}>Make it so easy you can't say no.</Typography>
            <TextField fullWidth placeholder="I will [BEHAVIOR] at [TIME] in [LOCATION]." value={currentWeekData.habit.name} onChange={handleHabitNameChange} variant="standard" InputProps={{ style: { color: theme.palette.text.primary, fontSize: '1rem', fontWeight: 500 }, disableUnderline: true }} sx={{ mb: 2, borderBottom: 2, borderColor: 'divider', pb: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{day}</Typography>
                  <Checkbox checked={currentWeekData.habit.days[idx]} onChange={() => handleHabitToggle(idx)} sx={{ color: 'text.secondary', '&.Mui-checked': { color: 'success.main' }, padding: 0, transform: 'scale(1.1)' }} />
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Reflection */}
          <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'warning.main', fontWeight: 700, letterSpacing: '0.5px' }}>REFLECTION</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: "Start: What new do I want to try next week?", key: 'start' },
                { label: "Stop: What wasted my time?", key: 'stop' },
                { label: "Continue: What worked really well?", key: 'continue' },
                { label: "Grateful: What am I grateful for?", key: 'grateful' }
              ].map((item) => (
                <Box key={item.key}>
                  <Typography variant="caption" sx={{ color: 'warning.main', opacity: 0.9, display: 'block', mb: 0.5, fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' }}>{item.label}</Typography>
                  <TextField fullWidth multiline minRows={2} value={currentWeekData.journal[item.key]} onChange={(e) => handleJournalChange(item.key, e.target.value)} variant="outlined" placeholder="Write here..." sx={{ bgcolor: 'action.hover', borderRadius: 1, '& .MuiOutlinedInput-root': { color: 'text.primary', '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: 'divider' }, '&.Mui-focused fieldset': { borderColor: 'warning.main' } } }} />
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Weekly Notes */}
          <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, letterSpacing: -0.5, color: 'text.primary' }}>WEEKLY NOTES</Typography>
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, border: '1px solid transparent', '&:focus-within': { borderColor: 'warning.main' }, '& .quill': { display: 'flex', flexDirection: 'column', minHeight: '120px' }, '& .ql-toolbar': { border: 'none', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', borderTopLeftRadius: 4, borderTopRightRadius: 4, display: 'flex', flexWrap: 'wrap', padding: '4px' }, '& .ql-container': { border: 'none', flexGrow: 1, fontSize: '0.9rem', fontFamily: 'inherit', minHeight: '100px' }, '& .ql-editor': { color: 'text.primary', minHeight: '100px', padding: '12px' }, '& .ql-stroke': { stroke: theme.palette.text.primary }, '& .ql-fill': { fill: theme.palette.text.primary }, '& .ql-picker': { color: 'text.primary' } }}>
              <ReactQuill theme="snow" value={currentWeekData.notes || ''} onChange={handleNotesChange} modules={quillModules} placeholder="Brain dump, reminders, or extra notes..." />
            </Box>
          </Paper>

          {/* Daily Plans — single outer accordion, collapsed by default */}
          <Accordion disableGutters defaultExpanded={false} sx={{ bgcolor: 'background.paper', borderRadius: '8px !important', boxShadow: 1, border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '& .MuiAccordionSummary-content': { my: 1.25 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '0.5px' }}>
                📅 DAILY PLANS
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {daysOfWeek.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const isToday = isSameDay(day, new Date());
                return (
                  <Accordion key={dateKey} disableGutters sx={{ bgcolor: 'background.paper', borderLeft: isToday ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent', borderRadius: '8px !important', boxShadow: 1, border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: '48px', '& .MuiAccordionSummary-content': { my: 0.75 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ color: isToday ? 'primary.main' : 'text.primary', fontWeight: 700 }}>{format(day, 'EEEE')}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{format(day, 'MMM d')}</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
                      <TextField fullWidth multiline placeholder={`Plan for ${format(day, 'EEEE')}...`} value={currentWeekData.days[dateKey] || ''} onChange={(e) => handleDayNoteChange(dateKey, e.target.value)} variant="standard" InputProps={{ disableUnderline: true, style: { color: theme.palette.text.primary, fontSize: '0.95rem', lineHeight: 1.5 } }} sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2, minHeight: '80px', '& .MuiInputBase-root': { alignItems: 'flex-start' } }} />
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </AccordionDetails>
          </Accordion>
        </Box>
      ) : (
        /* ===== DESKTOP: 2-column Grid ===== */
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Weekly Focus */}
            <Paper sx={{
              p: isMobile ? 2 : 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: isMobile ? 2 : 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography variant={isMobile ? "subtitle2" : "h6"} sx={{ mb: isMobile ? 1 : 2, color: 'primary.main', fontWeight: 700, letterSpacing: '0.5px' }}>
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
              p: isMobile ? 2 : 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: isMobile ? 2 : 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant={isMobile ? "subtitle2" : "h6"} sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.5px' }}>
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
              p: isMobile ? 2 : 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: isMobile ? 2 : 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography variant={isMobile ? "subtitle2" : "h6"} sx={{ color: 'success.main', fontWeight: 700, letterSpacing: '0.5px' }}>
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
              p: isMobile ? 2 : 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: isMobile ? 2 : 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography variant={isMobile ? "subtitle2" : "h6"} sx={{ mb: isMobile ? 2 : 3, color: 'warning.main', fontWeight: 700, letterSpacing: '0.5px' }}>
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
              p: isMobile ? 2 : 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: isMobile ? 2 : 3,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                <Typography variant={isMobile ? "subtitle2" : "h6"} sx={{ fontWeight: 700, letterSpacing: -0.5, color: 'text.primary' }}>
                  Weekly Notes
                </Typography>
              </Box>
              <Box sx={{
                bgcolor: 'action.hover',
                borderRadius: 1,
                border: '1px solid transparent',
                '&:hover': { borderColor: 'divider' },
                '&:focus-within': { borderColor: 'warning.main' },
                '& .quill': {
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '150px'
                },
                '& .ql-toolbar': {
                  border: 'none',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  display: 'flex',
                  flexWrap: 'wrap',
                  padding: isMobile ? '4px' : '8px'
                },
                '& .ql-container': {
                  border: 'none',
                  flexGrow: 1,
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontFamily: 'inherit',
                  minHeight: '120px'
                },
                '& .ql-editor': {
                  color: 'text.primary',
                  minHeight: '120px',
                  padding: isMobile ? '12px' : '15px'
                },
                '& .ql-stroke': {
                  stroke: theme.palette.text.primary
                },
                '& .ql-fill': {
                  fill: theme.palette.text.primary
                },
                '& .ql-picker': {
                  color: 'text.primary'
                }
              }}>
                <ReactQuill 
                  theme="snow"
                  value={currentWeekData.notes || ''}
                  onChange={handleNotesChange}
                  modules={quillModules}
                  placeholder="Brain dump, reminders, or extra notes..."
                />
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Right Column (Days) */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, mb: 1, px: 1 }}>
              DAILY PLAN
            </Typography>
            {daysOfWeek.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isToday = isSameDay(day, new Date());

              if (isMobile) {
                return (
                  <Accordion key={dateKey} sx={{ 
                    bgcolor: 'background.paper', 
                    borderLeft: isToday ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                    borderRadius: 2, 
                    boxShadow: 1, 
                    border: 1, 
                    borderColor: 'divider',
                    '&:before': { display: 'none' }
                  }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: '48px', '& .MuiAccordionSummary-content': { my: 1 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ color: isToday ? 'primary.main' : 'text.primary', fontWeight: 700 }}>
                          {format(day, 'EEEE')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>
                          {format(day, 'MMMM d')}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        placeholder={`Plan for ${format(day, 'EEEE')}...`}
                        value={currentWeekData.days[dateKey] || ''}
                        onChange={(e) => handleDayNoteChange(dateKey, e.target.value)}
                        variant="standard"
                        InputProps={{
                          disableUnderline: true,
                          style: { color: theme.palette.text.primary, fontSize: '0.95rem', lineHeight: 1.5 }
                        }}
                        sx={{
                          bgcolor: 'action.hover',
                          p: 1.5,
                          borderRadius: 2,
                          minHeight: '80px',
                          '& .MuiInputBase-root': { alignItems: 'flex-start' }
                        }}
                      />
                    </AccordionDetails>
                  </Accordion>
                );
              }

              // Desktop view
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
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem' }}>
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
      )}
    </Box>
  );
}

export default WeeklyPlanner;