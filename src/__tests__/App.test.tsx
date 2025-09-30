// Mock Location page to avoid import.meta.env issues in Jest
jest.mock('@/pages/Location', () => () => <div>Mocked Location Page</div>);
import { render, screen } from '@testing-library/react';
import App from '../App';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('@/config/firebase', () => ({
  auth: {},
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // This is a placeholder. Adjust the text to match something always present in your App.
    expect(screen.getByText(/safeguard|login|sign in|dashboard/i)).toBeInTheDocument();
  });
});
