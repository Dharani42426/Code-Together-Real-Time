import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './services/ThemeContext';
import { AuthProvider, useAuth } from './services/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import CodingRoom from './pages/CodingRoom';
import Problems from './pages/Problems';
import ProblemSolve from './pages/ProblemSolve';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import MyRooms from './pages/MyRooms';
import Projects from './pages/Projects';
import { Component } from 'react';
import History from './pages/History';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0d1117',
          color: '#e6edf3',
          padding: 24,
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: 12, color: '#f85149' }}>Something went wrong</h2>
          <p style={{ color: '#8b949e', marginBottom: 20, maxWidth: 500 }}>
            {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="btn btn-primary"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            >
              Reload Page
            </button>
            <a 
              href="/dashboard"
              className="btn btn-secondary"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected route — redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>;
  return isLoggedIn ? <ErrorBoundary>{children}</ErrorBoundary> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Full-screen IDE routes */}
      <Route path="/room/:roomId" element={<ProtectedRoute><CodingRoom /></ProtectedRoute>} />
      <Route path="/problems/:id" element={<ProtectedRoute><ProblemSolve /></ProtectedRoute>} />

      {/* Dashboard routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-rooms" element={<MyRooms />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/history" element={<History />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
