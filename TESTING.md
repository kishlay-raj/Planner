# Testing Commands Reference

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- src/components/__tests__/TaskList.test.js
```

### Run tests in watch mode
```bash
npm test -- --watch
```

## Debugging Test Failures

### View test summary
```bash
npm test 2>&1 | tail -n 30
```

### See which test suites pass/fail
```bash
npm test 2>&1 | grep -E "(FAIL|PASS|●)" | head -n 50
```

### View detailed failure information
```bash
npm test 2>&1 | grep -B 2 -A 10 "●"
```

### Verbose output with failures only
```bash
npm test -- --verbose 2>&1 | grep -E "(FAIL src|● )" -A 3
```

### Run specific test suite and see failures
```bash
npm test -- src/components/__tests__/TaskList.test.js 2>&1 | grep -A 10 "●"
```

## Test Structure

### Current Test Suites
- `TaskList.test.js` - Task management and analytics
- `PlannerScreen.test.js` - Main planner screen
- `NotesPanel.test.js` - Notes functionality and mass deletion safeguard
- `AuthContext.test.js` - Authentication and analytics
- `PomodoroPanel.test.js` - Pomodoro timer
- `CalendarView.test.js` - Calendar interactions
- `QuickTaskDialog.test.js` - Quick task creation
- `Settings.test.js` - Settings panel
- `DragDropBug.test.js` - Drag and drop functionality
- `useFirestoreNew.test.js` - Firestore hooks

## Analytics Testing

All analytics tests use Jest mocks:
```javascript
jest.mock('../../firebase', () => ({
  logAnalyticsEvent: jest.fn()
}));
```

To verify analytics events:
```javascript
const { logAnalyticsEvent } = require('../../firebase');

await waitFor(() => {
  expect(logAnalyticsEvent).toHaveBeenCalledWith('event_name', {
    param: 'value'
  });
});
```

## Known Issues

### Firebase/Firestore Warnings
Console warnings about IndexedDB are expected in test environment and don't affect test results.

### Coverage Thresholds
Current coverage is below the 80% threshold. This is expected during development and doesn't indicate test failures.

## CI/CD

For continuous integration, use:
```bash
npm test -- --watchAll=false --coverage
```
