import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCopy, FiArrowRight, FiCheck } from 'react-icons/fi';
import { roomAPI } from '../services/api';
import { languages } from '../services/mockData';
import './RoomForms.css';

export default function CreateRoom() {
  const [form, setForm] = useState({ name: '', description: '', language: 'JavaScript', isPrivate: false, maxParticipants: 10, password: '' });
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Room name is required');
      return;
    }
    if (form.isPrivate && !form.password.trim()) {
      setError('Please set a password for the private room');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const maxParticipants = Math.min(50, Math.max(2, parseInt(form.maxParticipants, 10) || 10));
      const res = await roomAPI.createRoom({
        name: form.name.trim(),
        description: form.description.trim(),
        language: form.language.toLowerCase(),
        isPrivate: form.isPrivate,
        maxParticipants,
        password: form.isPrivate ? form.password : '',
      });
      const room = res.data.data;
      setCreated({ ...room, inviteLink: `${window.location.origin}/room/${room.roomId}` });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(created.inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (created) {
    return (
      <div className="room-form-page">
        <div className="room-form-card card">
          <div className="success-icon">🎉</div>
          <h2>Room Created!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>Your room is ready. Share the link to invite collaborators.</p>
          <div className="room-id-display">
            <div className="room-id-label">Room ID</div>
            <div className="room-id-value">{created.roomId}</div>
          </div>
          <div className="invite-link-row">
            <input value={created.inviteLink} readOnly />
            <button className="btn btn-secondary" onClick={copyLink}>
              {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="created-details">
            <div><span>Name:</span> {created.name}</div>
            <div><span>Language:</span> {created.language}</div>
            <div><span>Visibility:</span> {created.isPrivate ? 'Private' : 'Public'}</div>
            <div><span>Max Participants:</span> {created.maxParticipants}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => navigate('/my-rooms')}>
              My Rooms
            </button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}
              onClick={() => navigate(`/room/${created.roomId}`)}>
              Enter Room <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-form-page">
      <div className="room-form-card card">
        <h2>Create a Room</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>Set up a collaborative coding environment</p>

        {error && <div style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(248,81,73,0.1)', borderRadius: 6 }}>{error}</div>}

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Room Name *</label>
            <input placeholder="e.g. Algorithm Study Group" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea placeholder="What will you be working on?" rows={3}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Programming Language</label>
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                {languages.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Max Participants</label>
              <input type="number" min={2} max={50} value={form.maxParticipants}
                onChange={e => setForm({ ...form, maxParticipants: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Visibility</label>
            <div className="toggle-group">
              <button type="button" className={`toggle-btn ${!form.isPrivate ? 'active' : ''}`}
                onClick={() => setForm({ ...form, isPrivate: false })}>🌐 Public</button>
              <button type="button" className={`toggle-btn ${form.isPrivate ? 'active' : ''}`}
                onClick={() => setForm({ ...form, isPrivate: true })}>🔒 Private</button>
            </div>
          </div>
          {form.isPrivate && (
            <div className="form-group">
              <label>Room Password</label>
              <input type="password" placeholder="Set a password for the room"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
