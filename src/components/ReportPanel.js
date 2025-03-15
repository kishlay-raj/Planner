import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

function ReportPanel() {
  const [timeRange, setTimeRange] = useState('week');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    dailyTasks: [],
    priorityDistribution: []
  });

  useEffect(() => {
    calculateStats();
  }, [timeRange]);

  const calculateStats = () => {
    // Get tasks from localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const weeklyTasks = JSON.parse(localStorage.getItem('weeklyTasks') || '{}');
    const monthlyTasks = JSON.parse(localStorage.getItem('monthlyTasks') || '{}');

    // Calculate basic stats
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    const pending = total - completed;

    // Calculate priority distribution
    const priorities = ['High', 'Medium', 'Low'];
    const priorityDistribution = priorities.map(priority => ({
      name: priority,
      value: tasks.filter(task => task.priority === priority).length
    }));

    // Calculate daily task completion
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const dailyTasks = daysInWeek.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => task.date === dateStr);
      return {
        name: format(date, 'EEE'),
        completed: dayTasks.filter(task => task.completed).length,
        total: dayTasks.length
      };
    });

    setTaskStats({
      total,
      completed,
      pending,
      dailyTasks,
      priorityDistribution
    });
  };

  const COLORS = ['#ff6b6b', '#51cf66', '#339af0'];

  return (
    <Paper sx={{ height: 'calc(100vh - 80px)', p: 2, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Reports & Analytics</Typography>
        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Tasks
              </Typography>
              <Typography variant="h4">{taskStats.total}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={(taskStats.completed / taskStats.total) * 100 || 0} 
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed Tasks
              </Typography>
              <Typography variant="h4" color="success.main">
                {taskStats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Tasks
              </Typography>
              <Typography variant="h4" color="error.main">
                {taskStats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Task Progress
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taskStats.dailyTasks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#4caf50" name="Completed" />
                  <Bar dataKey="total" fill="#2196f3" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Priority Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskStats.priorityDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {taskStats.priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default ReportPanel; 