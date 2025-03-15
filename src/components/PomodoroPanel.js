import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  Settings,
  Assessment
} from '@mui/icons-material';

function PomodoroPanel() {
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'
  const [cycles, setCycles] = useState(0);

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
      setIsActive(false);
      switch (newMode) {
        case 'pomodoro':
          setTimeLeft(25 * 60);
          break;
        case 'shortBreak':
          setTimeLeft(5 * 60);
          break;
        case 'longBreak':
          setTimeLeft(15 * 60);
          break;
      }
    }
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Play sound
      const audio = new Audio('/notification.mp3');
      audio.play();
      
      setCycles(c => c + 1);
      setTimeLeft(5 * 60);
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(35 * 60);
  };

  return (
    <Box 
      sx={{ 
        height: '100vh',
        bgcolor: '#b74b4b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box sx={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between',
        p: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Pomodoro
        </Typography>
        <Box>
          <IconButton color="inherit" size="small">
            <Assessment />
          </IconButton>
          <IconButton color="inherit" size="small">
            <Settings />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiToggleButton-root': {
              color: 'white',
              border: 'none',
              px: 3,
              py: 1,
              '&.Mui-selected': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                }
              }
            }
          }}
        >
          <ToggleButton value="pomodoro">
            Pomodoro
          </ToggleButton>
          <ToggleButton value="shortBreak">
            Short Break
          </ToggleButton>
          <ToggleButton value="longBreak">
            Long Break
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Typography 
        variant="h1" 
        sx={{ 
          fontSize: '120px', 
          fontWeight: 'bold',
          my: 4,
          fontFamily: 'monospace'
        }}
      >
        {`${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={toggleTimer}
          sx={{
            bgcolor: 'white',
            color: '#b74b4b',
            px: 6,
            py: 2,
            fontSize: '1.25rem',
            fontWeight: 'bold',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            }
          }}
        >
          {isActive ? 'PAUSE' : 'START'}
        </Button>
        <IconButton 
          color="inherit"
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
          }}
        >
          <SkipNext />
        </IconButton>
      </Box>

      <Typography sx={{ mt: 4, opacity: 0.9 }}>
        #{cycles + 1}
      </Typography>
      <Typography sx={{ opacity: 0.9 }}>
        Time to focus!
      </Typography>
    </Box>
  );
}

export default PomodoroPanel; 