import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCode, FiMenu, FiX, FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../services/ThemeContext';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <FiCode size={22} />
          <span>CodeTogether</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
          <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Register</Link>
          <button className="btn btn-ghost btn-sm theme-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>
        </div>

        <button className="menu-toggle btn btn-ghost" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>
    </nav>
  );
}
