import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon
} from '@mui/icons-material';

function PricingPanel() {
  const plans = [
    {
      title: 'Free',
      price: '0',
      period: 'forever',
      features: [
        'Basic task management',
        'Calendar view',
        'Notes taking',
        'Up to 100 tasks',
        'Basic reports'
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outlined',
      highlight: false
    },
    {
      title: 'Pro',
      price: '9.99',
      period: 'per month',
      features: [
        'Everything in Free',
        'Unlimited tasks',
        'Task priorities',
        'Weekly & Monthly planner',
        'Advanced reports',
        'Task categories',
        'Task dump feature',
        'Data export'
      ],
      buttonText: 'Upgrade to Pro',
      buttonVariant: 'contained',
      highlight: true
    },
    {
      title: 'Team',
      price: '29.99',
      period: 'per month',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Shared workspaces',
        'Team analytics',
        'Admin controls',
        'Priority support',
        'Custom branding',
        'API access'
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outlined',
      highlight: false
    }
  ];

  return (
    <Paper sx={{ height: 'calc(100vh - 80px)', p: 2, overflow: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Select the perfect plan for your needs
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item key={plan.title} xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                ...(plan.highlight && {
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: 3
                })
              }}
            >
              {plan.highlight && (
                <Chip
                  icon={<StarIcon />}
                  label="Most Popular"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 12,
                  }}
                />
              )}
              <CardContent sx={{ pt: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h6" component="div">
                    {plan.title}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mt: 2 }}>
                    <Typography variant="h3" component="div">
                      ${plan.price}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
                      /{plan.period}
                    </Typography>
                  </Box>
                </Box>
                <List dense>
                  {plan.features.map((feature) => (
                    <ListItem key={feature}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ mt: 'auto', justifyContent: 'center', pb: 3 }}>
                <Button
                  variant={plan.buttonVariant}
                  color="primary"
                  size="large"
                  fullWidth
                  sx={{ maxWidth: 200 }}
                >
                  {plan.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography variant="subtitle1" gutterBottom>
          All plans include:
        </Typography>
        <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          {['SSL Security', '24/7 Support', 'Regular Updates', '99.9% Uptime'].map((feature) => (
            <Grid item key={feature}>
              <Chip
                icon={<CheckIcon />}
                label={feature}
                variant="outlined"
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
}

export default PricingPanel; 