import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiCheckCircle, FiCircle } from 'react-icons/fi';
import { mockProblems } from '../services/mockData';
import './Problems.css';

const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
const topics = ['All', 'Array', 'String', 'DP', 'Stack', 'Linked List', 'Binary Search', 'Hash Table'];

export default function Problems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState('All');
  const [topic, setTopic] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const queryParam = searchParams.get('search') || '';
    setSearch(queryParam);
  }, [searchParams]);

  const handleSearchChange = (value) => {
    setSearch(value);
    if (value.trim()) {
      setSearchParams({ search: value.trim() });
    } else {
      setSearchParams({});
    }
  };

  const filtered = mockProblems.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchDiff = difficulty === 'All' || p.difficulty === difficulty;
    const matchTopic = topic === 'All' || p.topics.includes(topic);
    return matchSearch && matchDiff && matchTopic;
  });

  const solved = mockProblems.filter(p => p.solved).length;

  return (
    <div className="problems-page">
      <div className="problems-header">
        <div>
          <h1>Problems</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {solved}/{mockProblems.length} solved
          </p>
        </div>
      </div>

      <div className="problems-filters">
        <div className="search-wrap">
          <FiSearch size={15} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search problems..." value={search} onChange={e => handleSearchChange(e.target.value)} />
        </div>
        <div className="filter-group">
          {difficulties.map(d => (
            <button key={d} className={`filter-btn ${difficulty === d ? 'active' : ''}`}
              onClick={() => setDifficulty(d)}>{d}</button>
          ))}
        </div>
        <select className="topic-select" value={topic} onChange={e => setTopic(e.target.value)}>
          {topics.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="card problems-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Acceptance</th>
              <th>Topics</th>
              <th style={{ width: 60 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="problem-row" onClick={() => navigate(`/problems/${p.id}`)}>
                <td className="problem-num">{p.id}</td>
                <td className="problem-title">{p.title}</td>
                <td>
                  <span className={`badge badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.acceptance}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.topics.map(t => (
                      <span key={t} className="topic-tag">{t}</span>
                    ))}
                  </div>
                </td>
                <td>
                  {p.solved
                    ? <FiCheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
                    : <FiCircle size={16} style={{ color: 'var(--text-muted)' }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No problems found</div>
        )}
      </div>
    </div>
  );
}
