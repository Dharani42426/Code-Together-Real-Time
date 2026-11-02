import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiLogIn, FiUsers, FiCheckSquare, FiClock, FiZap, FiArrowRight, FiCircle } from 'react-icons/fi';
import { useAuth } from '../services/AuthContext';
import { roomAPI } from '../services/api';
import { mockRooms, activityData } from '../services/mockData';
import './Dashboard.css';



export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    roomAPI.getMyRooms()
      .then(res => {
        const fetched = res.data?.data?.rooms;
        if (fetched && fetched.length > 0) {
          setRooms(fetched);
        } else {
          setRooms(mockRooms);
        }
      })
      .catch(() => {
        setRooms(mockRooms);
      })
      .finally(() => {
        setLoadingRooms(false);
      });
  }, []);

  const maxActivity = Math.max(...activityData);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Developer';
  const problemsSolved = user?.problemsSolved ?? 0;
  const codingHours = user?.codingHours ?? 0;
  const streak = user?.codingStreak ?? 0;

  const stats = [
    { label: 'Coding Rooms', value: rooms.length, icon: FiUsers, color: '#58a6ff' },
    { label: 'Problems Solved', value: problemsSolved, icon: FiCheckSquare, color: '#3fb950' },
    { label: 'Coding Hours', value: codingHours, icon: FiClock, color: '#bc8cff' },
    { label: 'Current Streak', value: `${streak}d`, icon: FiZap, color: '#ffa657' },
  ];

  return (
    <div className="dashboard">
      <div className="dash-welcome">
        <div>
          <h1>Welcome back, {firstName} 👋</h1>
          <p>Ready to code? You have {rooms.length} active room{rooms.length === 1 ? '' : 's'}.</p>
        </div>
        <div className="dash-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/join-room')}>
            <FiLogIn size={16} /> Join Room
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/create-room')}>
            <FiPlus size={16} /> Create Room
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card card">
            <div className="stat-icon" style={{ background: `${color}18`, color }}>
              <Icon size={20} />
            </div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-col-main">
          <div className="section-title-row">
            <h2>Recent Coding Rooms</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-rooms')}>View all <FiArrowRight size={14} /></button>
          </div>
          <div className="rooms-list">
            {rooms.slice(0, 4).map(room => {
              const id = room.roomId || room.id;
              const lang = room.language ? (room.language.charAt(0).toUpperCase() + room.language.slice(1)) : 'JavaScript';
              const pCount = Array.isArray(room.participants) ? room.participants.length : (room.participants || 1);
              const max = room.maxParticipants || 10;
              const dateStr = room.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'Recently';

              return (
                <div key={id} className="room-item card" onClick={() => navigate(`/room/${id}`)}>
                  <div className="room-item-left">
                    <div className="room-lang-badge">{lang.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="room-name">{room.name || 'Coding Room'}</div>
                      <div className="room-meta">{lang} · {pCount}/{max} participants · {dateStr}</div>
                    </div>
                  </div>
                  <div className="room-item-right">
                    <span className={`badge ${room.isActive !== false ? 'badge-easy' : 'badge-medium'}`}>
                      {room.isActive !== false ? 'active' : 'idle'}
                    </span>
                    <FiArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="section-title-row" style={{ marginTop: 28 }}>
            <h2>Coding Activity</h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last 30 days</span>
          </div>
          <div className="card activity-chart">
            <div className="activity-bars">
              {activityData.map((val, i) => (
                <div key={i} className="activity-bar-wrap" title={`${val} hours`}>
                  <div className="activity-bar" style={{ height: `${(val / maxActivity) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="activity-labels">
              <span>30 days ago</span><span>Today</span>
            </div>
          </div>
        </div>

        <div className="dash-col-side">
          <div className="section-title-row">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions card">
            {[
              { label: 'Solve a Problem', sub: 'Practice algorithms', action: () => navigate('/problems'), color: '#58a6ff' },
              { label: 'View Leaderboard', sub: 'See your ranking', action: () => navigate('/leaderboard'), color: '#bc8cff' },
              { label: 'Edit Profile', sub: 'Update your info', action: () => navigate('/profile'), color: '#3fb950' },
            ].map(({ label, sub, action, color }) => (
              <button key={label} className="quick-action-item" onClick={action}>
                <FiCircle size={8} style={{ color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
                </div>
                <FiArrowRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
