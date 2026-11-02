import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FiUsers, FiGlobe, FiMessageSquare, FiCpu, FiPlay, FiBriefcase, FiArrowRight, FiCheck } from 'react-icons/fi';
import './Landing.css';

const features = [
  { icon: FiUsers, title: 'Real-Time Collaboration', desc: 'Code together with your team in real-time. See every keystroke as it happens.', color: '#58a6ff' },
  { icon: FiGlobe, title: 'Multi-Language Support', desc: 'Support for 20+ programming languages including Python, Java, C++, and more.', color: '#3fb950' },
  { icon: FiMessageSquare, title: 'Live Chat', desc: 'Communicate with your team without leaving the editor. Built-in chat panel.', color: '#bc8cff' },
  { icon: FiCpu, title: 'AI Code Assistant', desc: 'Get instant code explanations, debugging help, and optimization suggestions.', color: '#ffa657' },
  { icon: FiPlay, title: 'Code Execution', desc: 'Run your code directly in the browser and see output instantly.', color: '#f85149' },
  { icon: FiBriefcase, title: 'Coding Interviews', desc: 'Conduct technical interviews with a shared coding environment and video.', color: '#d29922' },
];

const steps = [
  { num: '01', title: 'Create a Room', desc: 'Set up a coding room in seconds. Choose language, privacy settings, and invite your team.' },
  { num: '02', title: 'Invite Collaborators', desc: 'Share the room link or ID. Collaborators join instantly — no account required for guests.' },
  { num: '03', title: 'Code Together', desc: 'Write, run, and debug code in real-time. Chat, review, and ship faster together.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <Navbar />

      <section className="hero">
        <div className="hero-badge"><span className="online-dot" /> Live collaboration active</div>
        <h1 className="hero-title">
          Code Together.<br />
          <span className="gradient-text">Build Together.</span>
        </h1>
        <p className="hero-subtitle">
          A real-time collaborative coding platform for students, developers and interviewers.
          Write, run, and review code — all in one place.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
            Start Coding <FiArrowRight />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/create-room')}>
            Create Room
          </button>
        </div>
        <div className="hero-stats">
          {[['10K+', 'Developers'], ['500+', 'Daily Rooms'], ['50+', 'Languages'], ['99.9%', 'Uptime']].map(([val, label]) => (
            <div key={label} className="hero-stat">
              <span className="stat-val">{val}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="hero-editor-preview">
          <div className="editor-preview-bar">
            <div className="editor-dots">
              <span style={{background:'#f85149'}} /><span style={{background:'#d29922'}} /><span style={{background:'#3fb950'}} />
            </div>
            <span className="editor-preview-title">main.js — CodeTogether</span>
            <div style={{display:'flex',gap:8}}>
              <span className="preview-badge">JavaScript</span>
              <span className="preview-badge online">● 3 online</span>
            </div>
          </div>
          <div className="editor-preview-code">
            <div className="code-line"><span className="ln">1</span><span className="kw">function</span> <span className="fn">twoSum</span>(<span className="param">nums, target</span>) {'{'}</div>
            <div className="code-line"><span className="ln">2</span>  <span className="kw">const</span> map = <span className="kw">new</span> <span className="fn">Map</span>();</div>
            <div className="code-line"><span className="ln">3</span>  <span className="kw">for</span> (<span className="kw">let</span> i = <span className="num">0</span>; i &lt; nums.length; i++) {'{'}</div>
            <div className="code-line"><span className="ln">4</span>    <span className="kw">const</span> comp = target - nums[i];</div>
            <div className="code-line active-line"><span className="ln">5</span>    <span className="kw">if</span> (map.<span className="fn">has</span>(comp)) <span className="kw">return</span> [map.<span className="fn">get</span>(comp), i];<span className="cursor-blink">|</span></div>
            <div className="code-line"><span className="ln">6</span>    map.<span className="fn">set</span>(nums[i], i);</div>
            <div className="code-line"><span className="ln">7</span>  {'}'}</div>
            <div className="code-line"><span className="ln">8</span>{'}'}</div>
          </div>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-inner">
          <div className="section-header">
            <h2>Everything you need to <span className="gradient-text">code together</span></h2>
            <p>Powerful features built for modern development workflows</p>
          </div>
          <div className="features-grid">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="feature-card card">
                <div className="feature-icon" style={{ background: `${color}18`, color }}>
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-inner">
          <div className="section-header">
            <h2>How It <span className="gradient-text">Works</span></h2>
            <p>Get started in under a minute</p>
          </div>
          <div className="steps-grid">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="step-card card">
                <div className="step-num">{num}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-inner card">
          <h2>Ready to code together?</h2>
          <p>Join thousands of developers already using CodeTogether</p>
          <div className="cta-checks">
            {['Free to start', 'No credit card required', 'Instant setup'].map(t => (
              <span key={t}><FiCheck size={14} /> {t}</span>
            ))}
          </div>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Get Started Free</button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>Sign In</button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>© 2024 CodeTogether. Built for developers.</span>
          <div className="footer-links">
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Docs</a><a href="#">Blog</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
