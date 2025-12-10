# Testing Guide

This document describes the testing setup and how to run tests for the Workout & Supplement Copilot application.

## Test Structure

### Backend Tests (Jest)

Backend tests are located in `backend/src/__tests__/`:

- **Middleware Tests**: `middleware/` - Tests for authentication, rate limiting, error handling
- **Service Tests**: `services/` - Tests for business logic (validation, compliance)
- **Route Tests**: `routes/` - Tests for API endpoints

### Frontend Tests (Vitest)

Frontend tests are located in `frontend/src/__tests__/`:

- **Component Tests**: `components/` - Tests for React components
- **Library Tests**: `lib/` - Tests for utility functions and API client

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

### Backend Coverage

- ✅ Authentication middleware
- ✅ Rate limiting middleware
- ✅ Validation service
- ✅ Compliance service
- ✅ Auth routes

### Frontend Coverage

- ✅ API client
- ✅ Navigation component
- ✅ WorkoutList component

## Writing New Tests

### Backend Test Example

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { functionToTest } from '../path/to/module';

describe('ModuleName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    const result = functionToTest();
    expect(result).toBe(expected);
  });
});
```

### Frontend Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from '../path/to/component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Mocking

### Backend Mocks

- Database queries are mocked using `jest.mock('../db/connection')`
- External services are mocked in test files

### Frontend Mocks

- API client is mocked using `vi.mock('@/lib/api-client')`
- Next.js router is mocked in `src/__tests__/setup.ts`
- localStorage is mocked in test setup

## Continuous Integration

Tests should be run before:
- Creating a pull request
- Merging to main branch
- Deploying to production

## Best Practices

1. **Test isolation**: Each test should be independent
2. **Clear test names**: Use descriptive test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock external dependencies**: Don't make real API calls in tests
5. **Test edge cases**: Include error cases and boundary conditions
6. **Keep tests fast**: Avoid slow operations in tests

