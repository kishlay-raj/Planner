import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    priority: {
      p1: '#f44336', // Red
      p2: '#ff9800', // Orange
      p3: '#2196f3', // Blue
      p4: '#4caf50', // Green
    },
    tag: {
      work: '#e91e63',    // Pink
      personal: '#9c27b0', // Purple
      study: '#3f51b5',   // Indigo
      health: '#009688',  // Teal
    },
    success: {
      main: '#66bb6a',
    },
  },
});

export default theme; 