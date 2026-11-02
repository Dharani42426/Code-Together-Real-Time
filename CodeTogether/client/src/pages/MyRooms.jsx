import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiArrowRight, FiUsers, FiLock, FiGlobe, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { roomAPI } from '../services/api';
import './MyRooms.css';

export default function MyRooms() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('my'); // 'my' | 'public'
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      if (tab === 'my') {
        const res = await roomAPI.getMyRooms();
        setRooms(res.data?.data?.rooms || []);
      } else {
        const res = await roomAPI.getPublicRooms();
        setRooms(res.data?.data?.rooms || []);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [tab]);

  const filteredRooms = rooms.filter((r) => {
    const q = search.toLowerCase().trim();
    const nameMatch = (r.name || '').toLowerCase().includes(q);
    const idMatch = (r.roomId || r.id || '').toLowerCase().includes(q);
    const langMatch = (r.language || '').toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || idMatch || langMatch;
    const matchesLang = langFilter === 'All' || (r.language || '').toLowerCase() === langFilter.toLowerCase();
    return matchesSearch && matchesLang;
  });

  const availableLangs = ['All', ...new Set(rooms.map(r => r.language ? (r.language.charAt(0).toUpperCase() + r.language.slice(1)) : 'JavaScript'))];

  return (
    <div className="my-rooms-page">
      <div className="page-header">
        <div>
          <h1>Coding Rooms</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {tab === 'my' ? `${rooms.length} rooms joined or created` : 'Discover open collaborative sessions'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchRooms} title="Refresh">
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/create-room')}>
            <FiPlus size={16} /> Create Room
          </button>
        </div>
      </div>

      <div className="rooms-controls-bar">
        <div className="rooms-tabs">
          <button className={`rooms-tab-btn ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>
            My Rooms ({tab === 'my' ? rooms.length : '...'})
          </button>
          <button className={`rooms-tab-btn ${tab === 'public' ? 'active' : ''}`} onClick={() => setTab('public')}>
            Explore Public Rooms
          </button>
        </div>

        <div className="rooms-search-row">
          <div className="rooms-search-wrap">
            <FiSearch size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search by name, ID or language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="rooms-lang-select" value={langFilter} onChange={(e) => setLangFilter(e.target.value)}>
            {availableLangs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Loading rooms...
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="empty-rooms card">
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
          <h3>{search ? 'No rooms match your search' : tab === 'my' ? 'No rooms yet' : 'No public rooms active'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6, marginBottom: 20 }}>
            {search
              ? 'Try searching with a different term or clear the filter.'
              : tab === 'my'
              ? 'Create your first collaborative room or join one using a Room ID!'
              : 'Be the first to create a public room for developers to join!'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/create-room')}>
            <FiPlus size={16} /> Create a Room
          </button>
        </div>
      ) : (
        <div className="rooms-grid">
          {filteredRooms.map((room) => {
            const id = room.roomId || room.id;
            const participantCount = Array.isArray(room.participants) ? room.participants.length : (room.participants || 1);
            const max = room.maxParticipants || 10;
            const lang = room.language ? (room.language.charAt(0).toUpperCase() + room.language.slice(1)) : 'Code';
            const langShort = lang.slice(0, 2).toUpperCase();
            const isPublic = !room.isPrivate;
            const timeAgo = room.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'Active';

            return (
              <div key={id} className="room-card card" onClick={() => navigate(`/room/${id}`)}>
                <div className="room-card-header">
                  <div className="room-lang-icon">{langShort}</div>
                  <span className={`badge ${room.isActive !== false ? 'badge-easy' : 'badge-medium'}`}>
                    {room.isActive !== false ? 'active' : 'idle'}
                  </span>
                </div>
                <h3 className="room-card-name">{room.name || 'Untitled Room'}</h3>
                {room.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {room.description}
                  </p>
                )}
                <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, marginBottom: 12 }}>{lang}</p>
                <div className="room-card-meta">
                  <span><FiUsers size={13} /> {participantCount}/{max}</span>
                  <span>{isPublic ? <><FiGlobe size={13} /> Public</> : <><FiLock size={13} /> Private</>}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{timeAgo}</span>
                </div>
                <div className="room-card-footer">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{id}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 13, fontWeight: 500 }}>
                    Enter <FiArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
