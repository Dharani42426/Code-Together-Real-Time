import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell, FiMoon, FiSun, FiChevronDown, FiX, FiHash, FiCode, FiArrowRight } from 'react-icons/fi';
import { useTheme } from '../services/ThemeContext';
import { useAuth } from '../services/AuthContext';
import { mockProblems } from '../services/mockData';
import { roomAPI } from '../services/api';
import './DashTopbar.css';

export default function DashTopbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.name ? user.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() : 'U';
  const displayName = user?.name || 'User';
  const email = user?.email || 'user@example.com';

  useEffect(() => {
    // Load rooms for instant search
    roomAPI.getMyRooms().then(res => {
      if (res.data?.data?.rooms) {
        setRoomsList(res.data.data.rooms);
      }
    }).catch(() => {});
  }, [location.pathname]);

  // Handle clicking outside of search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/problems?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectRoom = (roomId) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(`/room/${roomId}`);
  };

  const handleSelectProblem = (problemId) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(`/problems/${problemId}`);
  };

  const q = searchQuery.toLowerCase().trim();
  const matchedProblems = q
    ? mockProblems.filter(p => p.title.toLowerCase().includes(q) || p.topics.some(t => t.toLowerCase().includes(q))).slice(0, 4)
    : [];
  const matchedRooms = q
    ? roomsList.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.roomId && r.roomId.toLowerCase().includes(q)) ||
        (r.language && r.language.toLowerCase().includes(q))
      ).slice(0, 4)
    : [];

  const hasResults = matchedRooms.length > 0 || matchedProblems.length > 0;
  const shouldShowSearch = !location.pathname.startsWith('/room/');

  return (
    <header className="dash-topbar">
      <div className="topbar-left">
        <button className="btn btn-ghost" onClick={onMenuClick}><FiMenu size={20} /></button>
        {shouldShowSearch && (
          <div className="search-container" ref={searchContainerRef}>
            <div className="search-box">
              <FiSearch size={15} />
              <input
                placeholder="Search rooms, problems..."
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onKeyDown={handleSearch}
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                  }}
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {showSearchDropdown && searchQuery.trim() && (
              <div className="search-results-dropdown card">
                {matchedRooms.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-header">
                      <FiHash size={13} /> Rooms ({matchedRooms.length})
                    </div>
                    {matchedRooms.map(r => (
                      <div key={r.roomId || r._id} className="search-result-item" onClick={() => handleSelectRoom(r.roomId)}>
                        <div className="search-item-info">
                          <span className="search-item-title">{r.name}</span>
                          <span className="search-item-meta">{r.language} · {r.roomId}</span>
                        </div>
                        <span className="search-item-action">Enter <FiArrowRight size={12} /></span>
                      </div>
                    ))}
                  </div>
                )}

                {matchedProblems.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-header">
                      <FiCode size={13} /> Problems ({matchedProblems.length})
                    </div>
                    {matchedProblems.map(p => (
                      <div key={p.id} className="search-result-item" onClick={() => handleSelectProblem(p.id)}>
                        <div className="search-item-info">
                          <span className="search-item-title">#{p.id} {p.title}</span>
                          <span className="search-item-meta">{p.topics.join(', ')}</span>
                        </div>
                        <span className={`badge badge-${p.difficulty.toLowerCase()}`} style={{ fontSize: 11 }}>
                          {p.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!hasResults && (
                  <div className="search-no-results">
                    No matching rooms or problems found for "{searchQuery}"
                  </div>
                )}

                <div
                  className="search-footer-action"
                  onClick={() => {
                    setShowSearchDropdown(false);
                    navigate(`/problems?search=${encodeURIComponent(searchQuery.trim())}`);
                  }}
                >
                  <span>Search all problems for "{searchQuery}"</span>
                  <FiArrowRight size={13} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="topbar-right">
        <button className="btn btn-ghost icon-btn" onClick={toggleTheme}>
          {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
        <button className="btn btn-ghost icon-btn notif-btn">
          <FiBell size={18} />
          <span className="notif-dot" />
        </button>
        <div className="profile-menu-wrap">
          <button className="profile-trigger" onClick={() => setShowProfile(s => !s)}>
            <div className="avatar" style={{ background: '#3fb950', color: '#fff' }}>{initials}</div>
            <span className="hide-mobile">{displayName}</span>
            <FiChevronDown size={14} />
          </button>
          {showProfile && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="avatar" style={{ background: '#3fb950', color: '#fff', width: 40, height: 40, fontSize: 16 }}>{initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{email}</div>
                </div>
              </div>
              <div className="divider" />
              <button className="dropdown-item" onClick={() => { navigate('/profile'); setShowProfile(false); }}>Profile</button>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); setShowProfile(false); }}>Settings</button>
              <div className="divider" />
              <button className="dropdown-item danger" onClick={() => { logout(); navigate('/'); setShowProfile(false); }}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
