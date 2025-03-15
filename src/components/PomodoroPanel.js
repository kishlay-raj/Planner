import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Chip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Refresh
} from '@mui/icons-material';

function PomodoroPanel() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycles, setCycles] = useState(0);

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
      
      if (isBreak) {
        // End of break
        setTimeLeft(25 * 60);
        setIsBreak(false);
      } else {
        // End of work session
        setCycles(c => c + 1);
        setTimeLeft(5 * 60);
        setIsBreak(true);
      }
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / (isBreak ? 5 * 60 : 25 * 60)) * 100;

  return (
    <Paper sx={{ height: 'calc(100vh - 80px)', p: 3 }}>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom align="center">
          Pomodoro Timer
        </Typography>
        
        <Card sx={{ mb: 3, bgcolor: isBreak ? 'success.light' : 'primary.light' }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>
              {isBreak ? 'Break Time!' : 'Focus Time'}
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
              <CircularProgress
                variant="determinate"
                value={progress}
                size={200}
                thickness={2}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h2" component="div">
                  {`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={isActive ? <Pause /> : <PlayArrow />}
            onClick={toggleTimer}
          >
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Stop />}
            onClick={resetTimer}
          >
            Reset
          </Button>
        </Stack>

        <Box sx={{ textAlign: 'center' }}>
          <Chip 
            label={`Completed Cycles: ${cycles}`}
            color="primary"
            sx={{ fontSize: '1.1rem', py: 1 }}
          />
        </Box>
      </Box>
    </Paper>
  );
}

export default PomodoroPanel; 