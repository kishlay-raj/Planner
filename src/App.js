import React from 'react';
import PlannerScreen from './components/PlannerScreen';
import { ThemeProvider, createTheme } from '@mui/material';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <PlannerScreen />
      </div>
    </ThemeProvider>
  );
}

export default App; 