# Unit Testing Reference - Flow Planner

## Quick Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test ComponentName.test.js

# Watch mode (re-run on changes)
npm run test:watch

# Check coverage
npm test -- --coverage
```

---

## Test File Template

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from '../ComponentName';

// Mock Firebase if needed
jest.mock('../hooks/useFirestoreNew', () => ({
  useFirestoreCollection: jest.fn(() => [[], false, jest.fn(), jest.fn(), jest.fn()])
}));

describe('ComponentName', () => {
  it('renders without crashing', () => {
    render(<ComponentName />);
    expect(screen.getByText(/expected/i)).toBeInTheDocument();
  });

  it('handles user action', () => {
    render(<ComponentName />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    // Assert expected result
  });
});
```

---

## Common Test Patterns

### 1. Render Check
```javascript
it('renders correctly', () => {
  render(<Component />);
  expect(screen.getByText('Text')).toBeInTheDocument();
});
```

### 2. Button Click
```javascript
it('handles click', () => {
  const mockFn = jest.fn();
  render(<Component onClick={mockFn} />);
  fireEvent.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalled();
});
```

### 3. Form Input
```javascript
it('updates input', () => {
  render(<Component />);
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'test' } });
  expect(input.value).toBe('test');
});
```

---

## Mocking Guide

### Mock Firebase Hook
```javascript
jest.mock('../hooks/useFirestoreNew', () => ({
  useFirestoreCollection: jest.fn(() => [
    [{ id: '1', name: 'Item' }], // data
    false, // loading
    jest.fn(), // addItem
    jest.fn(), // updateItem
    jest.fn()  // deleteItem
  ])
}));
```

### Mock Auth
```javascript
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-user' },
    loading: false
  })
}));
```

### Mock Child Component
```javascript
jest.mock('../components/ChildComponent', () => {
  return function ChildComponent() {
    return <div data-testid="child">Child</div>;
  };
});
```

---

## Testing Checklist

For each component test:
- [ ] Component renders
- [ ] Props work correctly
- [ ] User interactions work
- [ ] Callbacks are called
- [ ] Error handling works
- [ ] Loading states display

---

## When to Add Tests

✅ **Do add tests when:**
- Fixing a bug
- Adding new feature
- Refactoring code
- Component is critical to app

❌ **Don't add tests when:**
- Code will change soon
- Component is trivial
- Time-constrained

---

## Coverage Goals

Current: ~21%
Target: 50% (good enough)
Ideal: 80% (if time permits)

**Focus on:** User-facing features, not 100% coverage

---

## Test Organization

```
src/
├── components/
│   └── __tests__/
│       ├── ComponentA.test.js
│       └── ComponentB.test.js
├── hooks/
│   └── __tests__/
│       └── hookName.test.js
└── contexts/
    └── __tests__/
        └── ContextName.test.js
```

---

## Troubleshooting

### Test fails with "TypeError: X is not a function"
→ Check mocks are set up correctly

### Test fails with "Cannot find module"
→ Verify import paths

### Test fails with Firebase errors
→ Add Firebase mocks (see above)

### Tests pass locally but fail in CI
→ Check for timing issues, add `waitFor`

---

**Remember:** Test incrementally, not all at once!
