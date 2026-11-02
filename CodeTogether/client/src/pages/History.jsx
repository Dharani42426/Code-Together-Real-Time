import { useState, useEffect } from 'react';
import { FiClock, FiCheckSquare, FiHash, FiSave, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { submissionAPI, roomAPI } from '../services/api';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function History() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'submissions' | 'rooms' | 'saves'
  const [loading, setLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAllHistory() {
      setLoading(true);
      const items = [];

      try {
        const userId = user?._id || user?.id;
        // 1. Fetch user submissions
        if (userId) {
          try {
            const subRes = await submissionAPI.getUserSubmissions(userId);
            const subs = subRes.data?.data?.submissions || [];
            subs.forEach(s => {
              const isAccepted = s.status === 'Accepted';
              items.push({
                id: `sub-${s._id}`,
                type: 'submissions',
                icon: FiCheckSquare,
                color: isAccepted ? 'var(--accent-green, #3fb950)' : '#f85149',
                title: `${s.status}: ${s.problemId?.title || 'Problem'}`,
                sub: `${s.language || 'code'} · ${s.runtime || '0ms'} · ${s.testCasesPassed || 0}/${s.totalTestCases || 0} tests passed`,
                timestamp: new Date(s.createdAt).getTime(),
                timeStr: formatRelativeTime(s.createdAt),
                link: s.problemId?._id ? `/problems/${s.problemId._id}` : null,
              });
            });
          } catch (e) {
            console.warn('Submissions load warning:', e);
          }
        }

        // 2. Fetch user code saves
        try {
          const savesRes = await roomAPI.getUserHistory();
          const saves = savesRes.data?.data?.history || [];
          saves.forEach(sv => {
            items.push({
              id: `save-${sv._id}`,
              type: 'saves',
              icon: FiSave,
              color: 'var(--accent, #58a6ff)',
              title: `Saved version v${sv.version} in Room ${sv.roomId}`,
              sub: `File: ${sv.fileName || 'main'} (${sv.language || 'code'}) · ${sv.description || 'Manual save'}`,
              timestamp: new Date(sv.createdAt).getTime(),
              timeStr: formatRelativeTime(sv.createdAt),
              link: `/room/${sv.roomId}`,
            });
          });
        } catch (e) {
          console.warn('Code saves load warning:', e);
        }

        // 3. Fetch user created/active rooms
        try {
          const roomsRes = await roomAPI.getMyRooms();
          const myRooms = roomsRes.data?.data?.rooms || [];
          myRooms.forEach(rm => {
            items.push({
              id: `room-${rm._id}`,
              type: 'rooms',
              icon: FiHash,
              color: 'var(--accent-purple, #bc8cff)',
              title: `Room: ${rm.name || rm.roomId}`,
              sub: `${rm.language || 'Multi-language'} · Code: ${rm.roomId} · ${rm.isPrivate ? 'Private' : 'Public'}`,
              timestamp: new Date(rm.createdAt || rm.updatedAt).getTime(),
              timeStr: formatRelativeTime(rm.createdAt || rm.updatedAt),
              link: `/room/${rm.roomId}`,
            });
          });
        } catch (e) {
          console.warn('Rooms load warning:', e);
        }

        // Sort items descending by timestamp
        items.sort((a, b) => b.timestamp - a.timestamp);

        if (isMounted) {
          setHistoryItems(items);
        }
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAllHistory();
    return () => { isMounted = false; };
  }, [user]);

  const filteredItems = historyItems.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiClock size={22} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Activity History</h1>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {historyItems.length} total events recorded
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: 'All Activity' },
          { key: 'submissions', label: 'Problem Submissions' },
          { key: 'saves', label: 'Code Saves' },
          { key: 'rooms', label: 'Rooms' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ fontSize: 13 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading activity history...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-muted)' }}>
            <FiAlertCircle size={36} style={{ opacity: 0.4, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              No history found
            </div>
            <div style={{ fontSize: 13, maxWidth: 360, margin: '0 auto 16px' }}>
              {activeTab === 'all'
                ? "You haven't solved any problems or saved room code yet. Start coding to build your activity log!"
                : `No activity recorded under ${activeTab}.`}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link to="/problems" className="btn btn-primary btn-sm">Solve Problems</Link>
              <Link to="/rooms" className="btn btn-ghost btn-sm">Explore Rooms</Link>
            </div>
          </div>
        ) : (
          filteredItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id || i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < filteredItems.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: `${item.color}18`,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {item.sub}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {item.timeStr}
                  </div>
                  {item.link && (
                    <Link
                      to={item.link}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', color: 'var(--accent)' }}
                      title="View Details"
                    >
                      <FiArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

