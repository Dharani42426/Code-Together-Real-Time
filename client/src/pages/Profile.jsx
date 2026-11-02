import { useState } from 'react';
import { FiEdit2, FiCheckSquare, FiClock, FiZap, FiAward, FiX, FiPlus, FiCheck } from 'react-icons/fi';
import { useAuth } from '../services/AuthContext';
import { userAPI } from '../services/api';
import { activityData } from '../services/mockData';
import './Profile.css';

const recentActivity = [
  { action: 'Solved', item: 'Two Sum', time: '2 hours ago', color: '#3fb950' },
  { action: 'Created room', item: 'Algorithm Study Group', time: '5 hours ago', color: '#58a6ff' },
  { action: 'Solved', item: 'Maximum Subarray', time: '1 day ago', color: '#3fb950' },
  { action: 'Joined room', item: 'React Interview Prep', time: '2 days ago', color: '#bc8cff' },
  { action: 'Solved', item: 'Binary Search', time: '3 days ago', color: '#3fb950' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skills: user?.skills || ['React', 'Node.js', 'JavaScript'],
    languages: user?.languages || ['JavaScript', 'TypeScript'],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newLang, setNewLang] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const maxActivity = Math.max(...activityData);
  const initials = user?.name ? user.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() : 'U';
  const skills = user?.skills?.length ? user.skills : ['React', 'Node.js', 'JavaScript'];
  const languages = user?.languages?.length ? user.languages : ['JavaScript', 'TypeScript'];
  const bio = user?.bio || 'Full-stack developer passionate about algorithms and open source.';

  const handleOpenEdit = () => {
    setEditForm({
      name: user?.name || '',
      bio: user?.bio || bio,
      skills: user?.skills?.length ? [...user.skills] : ['React', 'Node.js', 'JavaScript'],
      languages: user?.languages?.length ? [...user.languages] : ['JavaScript', 'TypeScript'],
    });
    setIsEditing(true);
  };

  const handleAddSkill = (e) => {
    e?.preventDefault();
    const s = newSkill.trim();
    if (s && !editForm.skills.includes(s)) {
      setEditForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  const handleAddLang = (e) => {
    e?.preventDefault();
    const l = newLang.trim();
    if (l && !editForm.languages.includes(l)) {
      setEditForm(prev => ({ ...prev, languages: [...prev.languages, l] }));
      setNewLang('');
    }
  };

  const handleRemoveLang = (langToRemove) => {
    setEditForm(prev => ({ ...prev, languages: prev.languages.filter(l => l !== langToRemove) }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: editForm.name.trim() || user.name,
        bio: editForm.bio.trim(),
        skills: editForm.skills,
        languages: editForm.languages,
      };

      const res = await userAPI.updateProfile(payload);
      if (res.data?.data?.user) {
        updateUser(res.data.data.user);
      } else {
        updateUser(payload);
      }

      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      {savedSuccess && (
        <div style={{ background: 'rgba(63,185,80,0.15)', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '10px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <FiCheck size={16} /> Profile updated successfully!
        </div>
      )}

      <div className="profile-header card">
        <div className="profile-avatar-section">
          <div className="profile-avatar" style={{ background: '#3fb950', color: '#fff' }}>
            {initials}
          </div>
          <div>
            <h1 className="profile-name">{user?.name || 'User'}</h1>
            <p className="profile-email">{user?.email || 'user@example.com'}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</p>
            {bio && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 500 }}>{bio}</p>}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleOpenEdit}>
          <FiEdit2 size={14} /> Edit Profile
        </button>
      </div>

      <div className="profile-stats-row">
        {[
          { icon: FiCheckSquare, label: 'Problems Solved', value: user?.problemsSolved ?? 0, color: '#3fb950' },
          { icon: FiClock, label: 'Coding Hours', value: user?.codingHours ?? 0, color: '#58a6ff' },
          { icon: FiZap, label: 'Current Streak', value: `${user?.codingStreak ?? 0} days`, color: '#ffa657' },
          { icon: FiAward, label: 'Global Rank', value: `#${user?.score ? Math.max(1, Math.round(user.score / 100)) : 1}`, color: '#bc8cff' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="profile-stat-card card">
            <div className="profile-stat-icon" style={{ background: `${color}18`, color }}>
              <Icon size={18} />
            </div>
            <div className="profile-stat-value">{value}</div>
            <div className="profile-stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="profile-grid">
        <div>
          <div className="card profile-section">
            <h3>Skills</h3>
            <div className="tag-list">
              {skills.map(s => <span key={s} className="profile-tag">{s}</span>)}
            </div>
          </div>

          <div className="card profile-section" style={{ marginTop: 16 }}>
            <h3>Languages</h3>
            <div className="tag-list">
              {languages.map(l => <span key={l} className="profile-tag lang-tag">{l}</span>)}
            </div>
          </div>

          <div className="card profile-section" style={{ marginTop: 16 }}>
            <h3>Coding Activity</h3>
            <div className="profile-activity-bars">
              {activityData.map((val, i) => (
                <div key={i} className="profile-bar-wrap" title={`${val} hours`}>
                  <div className="profile-bar" style={{ height: `${(val / maxActivity) * 100}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card profile-section">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.map((a, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" style={{ background: a.color }} />
                <div>
                  <span style={{ fontSize: 14 }}>{a.action} </span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{a.item}</span>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setIsEditing(false)}>
          <div className="modal-card card">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="btn btn-ghost icon-btn" onClick={() => setIsEditing(false)}>
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell others about yourself..."
                />
              </div>

              <div className="form-group">
                <label>Skills</label>
                <div className="tag-edit-wrap">
                  <div className="tag-list" style={{ marginBottom: 8 }}>
                    {editForm.skills.map((s) => (
                      <span key={s} className="profile-tag editable-tag">
                        {s}
                        <button type="button" className="tag-del-btn" onClick={() => handleRemoveSkill(s)}>
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="tag-add-row">
                    <input
                      placeholder="Add a skill (e.g. React, Docker)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddSkill}>
                      <FiPlus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Languages</label>
                <div className="tag-edit-wrap">
                  <div className="tag-list" style={{ marginBottom: 8 }}>
                    {editForm.languages.map((l) => (
                      <span key={l} className="profile-tag lang-tag editable-tag">
                        {l}
                        <button type="button" className="tag-del-btn" onClick={() => handleRemoveLang(l)}>
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="tag-add-row">
                    <input
                      placeholder="Add a language (e.g. Python, Go)"
                      value={newLang}
                      onChange={(e) => setNewLang(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLang();
                        }
                      }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddLang}>
                      <FiPlus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
