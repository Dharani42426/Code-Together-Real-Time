import { useState } from 'react';
import { FiUser, FiLock, FiCode, FiBell, FiSun, FiCheck } from 'react-icons/fi';
import { useTheme } from '../services/ThemeContext';
import { useAuth } from '../services/AuthContext';
import { userAPI } from '../services/api';
import './Settings.css';

const sections = [
  { id: 'account', icon: FiUser, label: 'Account' },
  { id: 'security', icon: FiLock, label: 'Security' },
  { id: 'editor', icon: FiCode, label: 'Editor Settings' },
  { id: 'notifications', icon: FiBell, label: 'Notifications' },
  { id: 'theme', icon: FiSun, label: 'Theme' },
];

export default function Settings() {
  const [active, setActive] = useState('account');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || 'Full-stack developer passionate about algorithms and open source.',
  });
  const initials = user?.name ? user.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() : 'U';
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14, tabSize: 2, wordWrap: true, minimap: false, lineNumbers: true,
  });
  const [notifications, setNotifications] = useState({
    roomInvites: true, problemSolved: true, leaderboard: false, newsletter: false,
  });

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        name: profileForm.name || user.name,
        email: profileForm.email || user.email,
        bio: profileForm.bio !== undefined ? profileForm.bio : (user.bio || ''),
      };
      const res = await userAPI.updateProfile(payload);

      if (res.data?.data?.user) {
        updateUser(res.data.data.user);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Profile update failed', error);
      alert('Failed to save changes: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleProfileField = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const accountName = profileForm.name;
  const accountEmail = profileForm.email;
  const accountBio = profileForm.bio;

  return (
    <div className="settings-page">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Settings</h1>

      <div className="settings-layout">
        <nav className="settings-nav card">
          {sections.map(({ id, icon: Icon, label }) => (
            <button key={id} className={`settings-nav-item ${active === id ? 'active' : ''}`}
              onClick={() => setActive(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <div className="settings-content card">
          {active === 'account' && (
            <div>
              <h2>Account Settings</h2>
              <div className="settings-avatar-row">
                <div className="avatar" style={{ background: '#3fb950', color: '#fff', width: 64, height: 64, fontSize: 22 }}>{initials}</div>
                <button className="btn btn-secondary btn-sm">Change Photo</button>
              </div>
              <div className="form-group"><label>Full Name</label><input value={accountName} onChange={(e) => handleProfileField('name', e.target.value)} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={accountEmail} onChange={(e) => handleProfileField('email', e.target.value)} /></div>
              <div className="form-group"><label>Username</label><input value={user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'user'} readOnly /></div>
              <div className="form-group"><label>Bio</label><textarea rows={3} value={accountBio} onChange={(e) => handleProfileField('bio', e.target.value)} placeholder="Tell others about yourself..." /></div>
            </div>
          )}

          {active === 'security' && (
            <div>
              <h2>Security</h2>
              <div className="form-group"><label>Current Password</label><input type="password" placeholder="••••••••" /></div>
              <div className="form-group"><label>New Password</label><input type="password" placeholder="••••••••" /></div>
              <div className="form-group"><label>Confirm New Password</label><input type="password" placeholder="••••••••" /></div>
              <div className="divider" />
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Two-Factor Authentication</h3>
              <div className="settings-toggle-row">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Enable 2FA</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Add an extra layer of security</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          )}

          {active === 'editor' && (
            <div>
              <h2>Editor Settings</h2>
              {[
                { key: 'fontSize', label: 'Font Size', type: 'number', min: 10, max: 24 },
                { key: 'tabSize', label: 'Tab Size', type: 'number', min: 2, max: 8 },
              ].map(({ key, label, type, min, max }) => (
                <div key={key} className="form-group">
                  <label>{label}</label>
                  <input type={type} min={min} max={max} value={editorSettings[key]}
                    onChange={e => setEditorSettings({ ...editorSettings, [key]: e.target.value })} />
                </div>
              ))}
              {[
                { key: 'wordWrap', label: 'Word Wrap', desc: 'Wrap long lines in the editor' },
                { key: 'minimap', label: 'Show Minimap', desc: 'Display code minimap on the right' },
                { key: 'lineNumbers', label: 'Line Numbers', desc: 'Show line numbers in the gutter' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="settings-toggle-row">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={editorSettings[key]}
                      onChange={() => setEditorSettings({ ...editorSettings, [key]: !editorSettings[key] })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {active === 'notifications' && (
            <div>
              <h2>Notifications</h2>
              {[
                { key: 'roomInvites', label: 'Room Invites', desc: 'Get notified when someone invites you to a room' },
                { key: 'problemSolved', label: 'Problem Milestones', desc: 'Celebrate when you hit solving milestones' },
                { key: 'leaderboard', label: 'Leaderboard Updates', desc: 'Weekly leaderboard ranking updates' },
                { key: 'newsletter', label: 'Newsletter', desc: 'Product updates and coding tips' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="settings-toggle-row">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={notifications[key]}
                      onChange={() => setNotifications({ ...notifications, [key]: !notifications[key] })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {active === 'theme' && (
            <div>
              <h2>Theme</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Choose your preferred appearance</p>
              <div className="theme-options">
                {['dark', 'light'].map(t => (
                  <button key={t} className={`theme-option ${theme === t ? 'active' : ''}`} onClick={() => theme !== t && toggleTheme()}>
                    <div className={`theme-preview ${t}`}>
                      <div className="tp-sidebar" />
                      <div className="tp-content">
                        <div className="tp-line" /><div className="tp-line short" />
                      </div>
                    </div>
                    <div className="theme-option-label">
                      {t.charAt(0).toUpperCase() + t.slice(1)} Mode
                      {theme === t && <FiCheck size={14} style={{ color: 'var(--accent)' }} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="settings-footer">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? <><FiCheck size={15} /> Saved!</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
