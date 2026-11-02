import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiHash, FiLogIn, FiPlusSquare, FiList, FiFolderPlus, FiClock, FiAward, FiUser, FiSettings, FiLogOut, FiCode } from 'react-icons/fi';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/my-rooms', icon: FiHash, label: 'My Rooms' },
  { to: '/join-room', icon: FiLogIn, label: 'Join Room' },
  { to: '/create-room', icon: FiPlusSquare, label: 'Create Room' },
  { to: '/problems', icon: FiList, label: 'Problems' },
  { to: '/projects', icon: FiFolderPlus, label: 'Projects' },
  { to: '/history', icon: FiClock, label: 'History' },
  { to: '/leaderboard', icon: FiAward, label: 'Leaderboard' },
];

const bottomItems = [
  { to: '/profile', icon: FiUser, label: 'Profile' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
        <FiCode size={20} />
        {!collapsed && <span>CodeTogether</span>}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        <button className="sidebar-item logout-btn" onClick={() => navigate('/')}>
          <FiLogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
