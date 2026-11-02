import { useState, useEffect } from 'react';
import { FiAward, FiZap, FiCheckSquare, FiClock, FiSearch, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../services/AuthContext';
import { userAPI } from '../services/api';
import { mockLeaderboard } from '../services/mockData';
import './Leaderboard.css';

const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

const communityUsers = [
  { id: 'comm-1', name: 'Sarah Chen', initials: 'SC', color: '#58a6ff', score: 9840, problemsSolved: 312, codingStreak: 45, codingHours: 120 },
  { id: 'comm-2', name: 'Mike Torres', initials: 'MT', color: '#bc8cff', score: 8920, problemsSolved: 287, codingStreak: 32, codingHours: 98 },
  { id: 'comm-4', name: 'Priya Sharma', initials: 'PS', color: '#ffa657', score: 6340, problemsSolved: 198, codingStreak: 28, codingHours: 74 },
  { id: 'comm-5', name: 'David Kim', initials: 'DK', color: '#f85149', score: 5670, problemsSolved: 176, codingStreak: 19, codingHours: 62 },
  { id: 'comm-6', name: 'Emma Wilson', initials: 'EW', color: '#d29922', score: 4980, problemsSolved: 154, codingStreak: 11, codingHours: 55 },
  { id: 'comm-7', name: 'Carlos Ruiz', initials: 'CR', color: '#58a6ff', score: 4210, problemsSolved: 133, codingStreak: 8, codingHours: 41 },
  { id: 'comm-8', name: 'Yuki Tanaka', initials: 'YT', color: '#bc8cff', score: 3890, problemsSolved: 121, codingStreak: 22, codingHours: 39 },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'problemsSolved' | 'codingStreak' | 'codingHours'
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getLeaderboard();
      const apiUsers = res.data?.data?.leaderboard || [];

      // Combine real DB users with community users (avoiding duplicates)
      const combined = [...apiUsers];
      const apiIds = new Set(apiUsers.map(u => String(u.id || u._id)));
      const apiEmails = new Set(apiUsers.map(u => (u.email || '').toLowerCase()));

      for (const comm of communityUsers) {
        if (!apiIds.has(comm.id) && !apiEmails.has((comm.email || '').toLowerCase())) {
          combined.push(comm);
        }
      }

      setUsers(combined);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      // Fallback to community list + current user
      const list = [...communityUsers];
      if (user) {
        list.push({
          id: user._id || user.id,
          name: user.name || 'You',
          email: user.email,
          score: user.score || 0,
          problemsSolved: user.problemsSolved || 0,
          codingStreak: user.codingStreak || 0,
          codingHours: user.codingHours || 0,
          color: '#3fb950',
          initials: (user.name || 'U').slice(0, 2).toUpperCase(),
        });
      }
      setUsers(list);
    } finally {
      setLoading(false);
    }
  };

  // Sort and rank
  const sortedUsers = [...users].sort((a, b) => {
    const valA = Number(a[sortBy]) || 0;
    const valB = Number(b[sortBy]) || 0;
    if (valB !== valA) return valB - valA;
    return (Number(b.score) || 0) - (Number(a.score) || 0);
  }).map((u, idx) => {
    const isMe = Boolean(
      user && (
        (u.id && (String(u.id) === String(user._id) || String(u.id) === String(user.id))) ||
        (u.email && u.email.toLowerCase() === (user.email || '').toLowerCase()) ||
        (u.name && u.name.toLowerCase() === (user.name || '').toLowerCase())
      )
    );

    const initials = u.initials || (u.name ? u.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : 'U');
    const color = isMe ? '#3fb950' : (u.color || (idx % 2 === 0 ? '#58a6ff' : '#bc8cff'));

    return {
      ...u,
      rank: idx + 1,
      initials,
      color,
      isCurrentUser: isMe,
    };
  });

  const currentUserStanding = sortedUsers.find(u => u.isCurrentUser);

  const filteredUsers = sortedUsers.filter(u => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (u.name || '').toLowerCase().includes(q) || String(u.rank) === q;
  });

  // Top 3 for podium
  const top1 = sortedUsers[0];
  const top2 = sortedUsers[1];
  const top3 = sortedUsers[2];

  const sortTabs = [
    { key: 'score', label: 'Overall Score', icon: FiAward },
    { key: 'problemsSolved', label: 'Problems Solved', icon: FiCheckSquare },
    { key: 'codingStreak', label: 'Daily Streak', icon: FiZap },
    { key: 'codingHours', label: 'Coding Hours', icon: FiClock },
  ];

  return (
    <div className="leaderboard-page">
      <div className="lb-header">
        <div>
          <h1><FiAward size={24} style={{ color: '#d29922' }} /> Leaderboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Compete, collaborate, and rise through the global developer rankings
          </p>
        </div>
      </div>

      {/* CURRENT USER STANDING BANNER */}
      {currentUserStanding && (
        <div className="lb-standing-banner card">
          <div className="standing-user-info">
            <div className="avatar" style={{ background: '#3fb950', color: '#fff', width: 44, height: 44, fontSize: 16 }}>
              {currentUserStanding.initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{currentUserStanding.name}</span>
                <span className="you-badge">Your Standing</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Rank #{currentUserStanding.rank} of {sortedUsers.length} coders
              </span>
            </div>
          </div>
          <div className="standing-stats-row">
            <div className="standing-stat">
              <span className="stat-num">#{currentUserStanding.rank}</span>
              <span className="stat-lbl">Rank</span>
            </div>
            <div className="standing-stat">
              <span className="stat-num">{Number(currentUserStanding.score || 0).toLocaleString()}</span>
              <span className="stat-lbl">Score</span>
            </div>
            <div className="standing-stat">
              <span className="stat-num">{currentUserStanding.problemsSolved || 0}</span>
              <span className="stat-lbl">Solved</span>
            </div>
            <div className="standing-stat">
              <span className="stat-num">{currentUserStanding.codingStreak || 0}d</span>
              <span className="stat-lbl">Streak</span>
            </div>
          </div>
        </div>
      )}

      {/* PODIUM */}
      {top1 && top2 && top3 && (
        <div className="lb-podium">
          {/* 2nd Place */}
          <div className="podium-item pos-2">
            <div className="podium-avatar" style={{ background: top2.color, color: '#fff' }}>{top2.initials}</div>
            <div className="podium-medal">{medals[2]}</div>
            <div className="podium-name">{top2.name.split(' ')[0]}</div>
            <div className="podium-score">
              {sortBy === 'problemsSolved' ? `${top2.problemsSolved} solved` :
               sortBy === 'codingStreak' ? `${top2.codingStreak}d streak` :
               sortBy === 'codingHours' ? `${top2.codingHours}h` :
               `${Number(top2.score || 0).toLocaleString()} pts`}
            </div>
            <div className="podium-block pos-2-block">2</div>
          </div>

          {/* 1st Place */}
          <div className="podium-item pos-1">
            <div className="podium-avatar" style={{ background: top1.color, color: '#fff' }}>{top1.initials}</div>
            <div className="podium-medal">{medals[1]}</div>
            <div className="podium-name">{top1.name.split(' ')[0]}</div>
            <div className="podium-score">
              {sortBy === 'problemsSolved' ? `${top1.problemsSolved} solved` :
               sortBy === 'codingStreak' ? `${top1.codingStreak}d streak` :
               sortBy === 'codingHours' ? `${top1.codingHours}h` :
               `${Number(top1.score || 0).toLocaleString()} pts`}
            </div>
            <div className="podium-block pos-1-block">1</div>
          </div>

          {/* 3rd Place */}
          <div className="podium-item pos-3">
            <div className="podium-avatar" style={{ background: top3.color, color: '#fff' }}>{top3.initials}</div>
            <div className="podium-medal">{medals[3]}</div>
            <div className="podium-name">{top3.name.split(' ')[0]}</div>
            <div className="podium-score">
              {sortBy === 'problemsSolved' ? `${top3.problemsSolved} solved` :
               sortBy === 'codingStreak' ? `${top3.codingStreak}d streak` :
               sortBy === 'codingHours' ? `${top3.codingHours}h` :
               `${Number(top3.score || 0).toLocaleString()} pts`}
            </div>
            <div className="podium-block pos-3-block">3</div>
          </div>
        </div>
      )}

      {/* CONTROLS BAR: SORT TABS & SEARCH */}
      <div className="lb-controls-card card">
        <div className="lb-sort-tabs">
          {sortTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`lb-tab-btn ${sortBy === key ? 'active' : ''}`}
              onClick={() => setSortBy(key)}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="lb-search-wrap">
          <FiSearch size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search coder or rank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="card lb-table-wrap">
        <table className="lb-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Coder</th>
              <th>Problems</th>
              <th>Hours</th>
              <th>Streak</th>
              <th style={{ textAlign: 'right' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((coder) => (
              <tr key={coder.id || coder._id} className={`lb-row ${coder.isCurrentUser ? 'current-user' : ''}`}>
                <td>
                  <span className="rank-cell">
                    {medals[coder.rank] || <span className="rank-num">#{coder.rank}</span>}
                  </span>
                </td>
                <td>
                  <div className="lb-user">
                    <div className="avatar" style={{ background: coder.color, color: '#fff', width: 34, height: 34, fontSize: 12 }}>
                      {coder.initials}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: coder.isCurrentUser ? 700 : 500 }}>{coder.name}</span>
                        {coder.isCurrentUser && <span className="you-badge">You</span>}
                      </div>
                      {coder.email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{coder.email}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{coder.problemsSolved || 0}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{coder.codingHours || 0}h</td>
                <td>
                  <span className="streak-cell">
                    <FiZap size={13} style={{ color: '#ffa657' }} /> {coder.codingStreak || 0}d
                  </span>
                </td>
                <td style={{ color: 'var(--accent)', fontWeight: 700, textAlign: 'right' }}>
                  {Number(coder.score || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No coders found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
