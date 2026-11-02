import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCode, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { authAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ email: form.email, password: form.password });
      const { token, user } = res.data.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <FiCode size={28} />
          <span>CodeTogether</span>
        </div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && (
          <div className="auth-error">
            <FiAlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <div className="input-icon-wrap">
              <FiMail size={16} className="input-icon" />
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrap">
              <FiLock size={16} className="input-icon" />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.remember} onChange={e => setForm({ ...form, remember: e.target.checked })} />
              Remember me
            </label>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ marginTop: 10 }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ width: '100%', justifyContent: 'center', fontSize: 12, border: '1px dashed var(--border)', color: 'var(--accent)' }}
              onClick={() => setForm({ email: 'demo@codetogether.com', password: 'demo123', remember: true })}
            >
              ⚡ Fill Demo Account (demo@codetogether.com / demo123)
            </button>
          </div>
        </form>

        <div className="auth-divider"><span>or continue with</span></div>

        <button className="btn btn-secondary google-btn" onClick={() => navigate('/dashboard')}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
