import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCode, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { authAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { languages } from '../services/mockData';
import './Auth.css';

const skillOptions = ['React', 'Node.js', 'Python', 'Machine Learning', 'DevOps', 'Mobile', 'Data Science', 'Algorithms'];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const toggleItem = (arr, setArr, item) =>
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        skills: selectedSkills,
        languages: selectedLangs,
      });
      // Auto login after register
      const loginRes = await authAPI.login({ email: form.email, password: form.password });
      const { token, user } = loginRes.data.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <FiCode size={28} />
          <span>CodeTogether</span>
        </div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join thousands of developers</p>

        {error && (
          <div className="auth-error">
            <FiAlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-icon-wrap">
              <FiUser size={16} className="input-icon" />
              <input placeholder="John Doe" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-icon-wrap">
              <FiMail size={16} className="input-icon" />
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          <div className="form-row">
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
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-icon-wrap">
                <FiLock size={16} className="input-icon" />
                <input type="password" placeholder="••••••••" value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })} required />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Programming Skills</label>
            <div className="tag-selector">
              {skillOptions.map(s => (
                <button key={s} type="button"
                  className={`tag-btn ${selectedSkills.includes(s) ? 'selected' : ''}`}
                  onClick={() => toggleItem(selectedSkills, setSelectedSkills, s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Programming Languages</label>
            <div className="tag-selector">
              {languages.slice(0, 8).map(l => (
                <button key={l} type="button"
                  className={`tag-btn ${selectedLangs.includes(l) ? 'selected' : ''}`}
                  onClick={() => toggleItem(selectedLangs, setSelectedLangs, l)}>{l}</button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
