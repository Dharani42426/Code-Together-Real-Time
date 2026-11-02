import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlay, FiSend, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { mockProblemDetails, mockProblems, languages } from '../services/mockData';
import './ProblemSolve.css';

export default function ProblemSolve() {
  const { id } = useParams();
  const navigate = useNavigate();
  const problem = mockProblemDetails[id] || mockProblemDetails[1];
  const meta = mockProblems.find(p => p.id === parseInt(id)) || mockProblems[0];

  const [language, setLanguage] = useState('JavaScript');
  const [code, setCode] = useState(problem.starterCode[language] || problem.starterCode.JavaScript);
  const [activeTab, setActiveTab] = useState('testcases');
  const [submitted, setSubmitted] = useState(false);
  const [running, setRunning] = useState(false);

  const handleLangChange = (lang) => {
    setLanguage(lang);
    setCode(problem.starterCode[lang] || problem.starterCode.JavaScript);
  };

  const handleRun = () => {
    setRunning(true);
    setActiveTab('output');
    setTimeout(() => setRunning(false), 800);
  };

  const handleSubmit = () => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setSubmitted(true); setActiveTab('result'); }, 1000);
  };

  return (
    <div className="problem-solve-layout">
      {/* TOP BAR */}
      <header className="solve-topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/problems')}>
          <FiArrowLeft size={15} /> Problems
        </button>
        <span className="solve-title">{problem.title}</span>
        <span className={`badge badge-${meta.difficulty.toLowerCase()}`}>{meta.difficulty}</span>
        <div style={{ flex: 1 }} />
        <select className="lang-select-solve" value={language} onChange={e => handleLangChange(e.target.value)}>
          {Object.keys(problem.starterCode).map(l => <option key={l}>{l}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={handleRun} disabled={running}>
          <FiPlay size={14} /> {running ? 'Running...' : 'Run'}
        </button>
        <button className="btn btn-success btn-sm" onClick={handleSubmit} disabled={running}>
          <FiSend size={14} /> Submit
        </button>
      </header>

      <div className="solve-body">
        {/* LEFT - PROBLEM */}
        <div className="problem-panel scrollbar">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{problem.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20, whiteSpace: 'pre-line' }}>
            {problem.description}
          </p>

          {problem.examples.map((ex, i) => (
            <div key={i} className="example-block">
              <div className="example-title">Example {i + 1}</div>
              <div className="example-content">
                <div><strong>Input:</strong> <code>{ex.input}</code></div>
                <div><strong>Output:</strong> <code>{ex.output}</code></div>
                {ex.explanation && <div><strong>Explanation:</strong> {ex.explanation}</div>}
              </div>
            </div>
          ))}

          <div className="constraints-block">
            <div className="example-title">Constraints</div>
            <ul>
              {problem.constraints.map((c, i) => (
                <li key={i}><code>{c}</code></li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT - EDITOR */}
        <div className="editor-panel">
          <div className="solve-editor-container">
            <div className="solve-line-numbers">
              {code.split('\n').map((_, i) => (
                <div key={i} className="line-num">{i + 1}</div>
              ))}
            </div>
            <textarea
              className="solve-code-editor scrollbar"
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
            />
          </div>

          {/* BOTTOM */}
          <div className="solve-bottom">
            <div className="solve-bottom-tabs">
              {['testcases', 'output', 'result'].map(t => (
                <button key={t} className={`bottom-tab-btn ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="solve-bottom-content scrollbar">
              {activeTab === 'testcases' && (
                <div>
                  {[{ input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
                    { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' }].map((tc, i) => (
                    <div key={i} className="test-case">
                      <div className="tc-label">Case {i + 1}</div>
                      <div className="tc-row"><span>Input:</span><code>{tc.input}</code></div>
                      <div className="tc-row"><span>Expected:</span><code>{tc.expected}</code></div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'output' && (
                <div className="output-block">
                  {running ? <div className="running-msg">Running test cases...</div> : (
                    <>
                      <div className="output-line pass"><FiCheckCircle size={14} /> Case 1: [0,1] ✓</div>
                      <div className="output-line pass"><FiCheckCircle size={14} /> Case 2: [1,2] ✓</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>Runtime: 0.08 sec</div>
                    </>
                  )}
                </div>
              )}
              {activeTab === 'result' && (
                <div className="result-block">
                  {submitted ? (
                    <>
                      <div className="result-accepted"><FiCheckCircle size={20} /> Accepted</div>
                      <div className="result-stats">
                        <div><span>Runtime</span><strong>52 ms</strong><small>Beats 87.3%</small></div>
                        <div><span>Memory</span><strong>42.1 MB</strong><small>Beats 64.2%</small></div>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Submit your solution to see results</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
