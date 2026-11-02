import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogIn, FiHash } from 'react-icons/fi';
import { roomAPI } from '../services/api';
import './RoomForms.css';

export default function JoinRoom() {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomId.trim()) { setError('Please enter a Room ID'); return; }
    setError('');
    setLoading(true);
    try {
      await roomAPI.joinRoom({ roomId: roomId.trim().toUpperCase(), password });
      navigate(`/room/${roomId.trim().toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="room-form-page">
      <div className="room-form-card card">
        <h2>Join a Room</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
          Enter a Room ID to join a collaborative session
        </p>

        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label>Room ID *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FiHash size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input style={{ paddingLeft: 36 }} placeholder="e.g. CT-ABC123"
                value={roomId} onChange={e => { setRoomId(e.target.value); setError(''); }} />
            </div>
            {error && <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>{error}</span>}
          </div>

          <div className="form-group">
            <label>Password (if required)</label>
            <input type="password" placeholder="Leave blank if public room"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            <FiLogIn size={16} /> {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
