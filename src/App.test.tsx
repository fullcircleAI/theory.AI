import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

test('renders app without crashing', () => {
  // Mock localStorage values to avoid splash screen
  localStorageMock.getItem.mockImplementation((key) => {
    if (key === 'hasSeenSplash') return 'true';
    if (key === 'userAuthenticated') return 'true';
    if (key === 'examDate') return new Date(Date.now() + 86400000).toISOString();
    return null;
  });
  
  render(<App />);
  // Just check that the app renders without throwing
  expect(document.body).toBeInTheDocument();
});
