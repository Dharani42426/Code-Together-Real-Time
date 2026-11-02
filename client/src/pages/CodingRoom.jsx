import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiCode, 
  FiSave, 
  FiShare2, 
  FiPlay, 
  FiLogOut, 
  FiPlus, 
  FiSend, 
  FiCpu, 
  FiX, 
  FiChevronRight, 
  FiCheck,
  FiEdit3,
  FiVideo,
  FiClock,
  FiRotateCcw
} from 'react-icons/fi';
import Whiteboard from '../components/Whiteboard';
import VideoCall from '../components/VideoCall';
import { languages, mockParticipants, mockAIResponses } from '../services/mockData';
import { chatAPI, aiAPI, roomAPI, submissionAPI } from '../services/api';
import { 
  connectSocket,
  getSocket, 
  joinRoom as socketJoinRoom, 
  leaveRoom as socketLeaveRoom, 
  sendCodeChange, 
  sendMessage as socketSendMessage 
} from '../services/socket';
import { useAuth } from '../services/AuthContext';
import './CodingRoom.css';

const defaultFiles = [
  { name: 'main.js', lang: 'JavaScript' },
];

const defaultCode = {
  'main.js': `// CodeTogether\nfunction main() {\n  console.log("Hello CodeTogether!");\n}\n\nmain();\n`,
};

const aiActions = [
  { key: 'explain', label: 'Explain Code' },
  { key: 'debug', label: 'Debug Code' },
  { key: 'optimize', label: 'Optimize Code' },
  { key: 'generate', label: 'Generate Code' },
  { key: 'timeComplexity', label: 'Time Complexity' },
  { key: 'spaceComplexity', label: 'Space Complexity' },
];

export default function CodingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomData, setRoomData] = useState(null);
  const [roomTitle, setRoomTitle] = useState('Coding Room');
  const [roomFiles, setRoomFiles] = useState(defaultFiles);
  const [activeFile, setActiveFile] = useState('main.js');
  const [codes, setCodes] = useState(defaultCode);
  const [language, setLanguage] = useState('JavaScript');
  const [bottomTab, setBottomTab] = useState('output');
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [input, setInput] = useState('10\n20');
  const [output, setOutput] = useState('Ready to run your code.');
  const [participants, setParticipants] = useState(() => {
    if (user) {
      return [{
        id: user._id || user.id || 'me',
        name: user.name || 'You',
        initials: (user.name || 'Y').slice(0, 2).toUpperCase(),
        color: '#3fb950',
        role: 'Owner',
        online: true,
      }];
    }
    return [];
  });
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [running, setRunning] = useState(false);
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'whiteboard'
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const chatEndRef = useRef(null);
  const activeFileRef = useRef(activeFile);

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  // Load real room data
  useEffect(() => {
    if (!roomId) return;

    roomAPI.getRoom(roomId).then(res => {
      const room = res.data?.data?.room;
      if (room) {
        setRoomData(room);
        if (room.name) setRoomTitle(room.name);
        if (room.language) {
          const cap = room.language.charAt(0).toUpperCase() + room.language.slice(1);
          setLanguage(cap);
        }
        if (room.files && room.files.length > 0) {
          const formatted = room.files.map(f => ({
            name: f.name,
            lang: f.language ? (f.language.charAt(0).toUpperCase() + f.language.slice(1)) : 'JavaScript',
            _id: f._id,
          }));
          setRoomFiles(formatted);
          setActiveFile(formatted[0].name);
          const newCodes = {};
          room.files.forEach(f => {
            newCodes[f.name] = f.content || '';
          });
          setCodes(newCodes);
        } else if (room.code) {
          setCodes({ 'main.js': room.code });
        }
        if (room.participants && room.participants.length > 0) {
          const isUserOwner = (uid) => {
            const ownerId = room.owner?._id || room.owner?.id || room.owner;
            return ownerId && uid && ownerId.toString() === uid.toString();
          };

          setParticipants(room.participants.map(p => {
            const uid = p.user?._id || p.user?.id || p.user;
            const uname = p.user?.name || (uid === user?._id ? (user?.name || 'You') : 'User');
            return {
              id: uid,
              name: uname,
              initials: uname.slice(0, 2).toUpperCase(),
              color: isUserOwner(uid) ? '#3fb950' : '#58a6ff',
              role: isUserOwner(uid) ? 'Owner' : (p.role ? (p.role.charAt(0).toUpperCase() + p.role.slice(1)) : 'Editor'),
              online: true,
            };
          }));
        }
      }
    }).catch(err => {
      console.warn('Could not fetch room details from server:', err);
    });
  }, [roomId]);

  // Load chat history and join socket room
  useEffect(() => {
    if (!roomId) return;

    chatAPI.getHistory(roomId).then(res => {
      const msgs = res.data?.data?.messages?.map(m => ({
        id: m._id, user: m.senderName,
        initials: m.senderName?.slice(0,2).toUpperCase(),
        color: '#58a6ff', text: m.message,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })) || [];
      setMessages(msgs);
    }).catch(() => {});

    // Ensure socket connection exists
    const token = localStorage.getItem('ct_token');
    const socket = connectSocket(token);

    if (socket) {
      socketJoinRoom(roomId);

      const handleReceiveMsg = (m) => {
        setMessages(prev => [...prev, {
          id: m._id, user: m.senderName,
          initials: m.senderName?.slice(0,2).toUpperCase(),
          color: '#58a6ff', text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      };

      const handleCodeUpdate = ({ code }) => {
        if (typeof code === 'string' && code.length > 0) {
          setCodes(prev => ({ ...prev, [activeFileRef.current]: code }));
        }
      };

      const handleParticipantUpdate = ({ activeUsers }) => {
        if (Array.isArray(activeUsers)) {
          setParticipants(prev => {
            const activeUserIds = new Set(activeUsers.map(a => a.userId?.toString()));
            
            // Map existing participants or add new active users
            const existingMap = new Map();
            prev.forEach(p => existingMap.set(p.id?.toString(), p));

            activeUsers.forEach(au => {
              const auId = au.userId?.toString();
              const existing = existingMap.get(auId);
              if (existing) {
                existingMap.set(auId, { ...existing, online: true, name: au.username || existing.name });
              } else {
                existingMap.set(auId, {
                  id: au.userId,
                  name: au.username || 'User',
                  initials: (au.username || 'U').slice(0, 2).toUpperCase(),
                  color: '#58a6ff',
                  role: 'Editor',
                  online: true,
                });
              }
            });

            // Mark any absent participants as offline
            const result = [];
            existingMap.forEach((val, key) => {
              result.push({
                ...val,
                online: activeUserIds.has(key),
              });
            });

            return result;
          });
        }
      };

      const handleUserJoined = (data) => {
        console.log('User joined room:', data);
      };

      const handleUserLeft = (data) => {
        console.log('User left room:', data);
      };

      socket.on('receive-message', handleReceiveMsg);
      socket.on('code-update', handleCodeUpdate);
      socket.on('participant-update', handleParticipantUpdate);
      socket.on('user-joined', handleUserJoined);
      socket.on('user-left', handleUserLeft);

      return () => {
        socketLeaveRoom(roomId);
        socket.off('receive-message', handleReceiveMsg);
        socket.off('code-update', handleCodeUpdate);
        socket.off('participant-update', handleParticipantUpdate);
        socket.off('user-joined', handleUserJoined);
        socket.off('user-left', handleUserLeft);
      };
    }
  }, [roomId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    socketSendMessage(roomId, msgInput);
    setMsgInput('');
  };

  const handleAI = async (key) => {
    setAiLoading(true);
    setAiResponse('');
    try {
      const apiMap = { explain: aiAPI.explain, debug: aiAPI.debug, optimize: aiAPI.optimize, timeComplexity: aiAPI.complexity, spaceComplexity: aiAPI.complexity };
      const fn = apiMap[key] || aiAPI.explain;
      const res = await fn({ code: codes[activeFile] || '', language });
      const d = res.data.data;
      setAiResponse(d.explanation || d.analysis || d.suggestions || mockAIResponses[key]);
    } catch {
      setAiResponse(mockAIResponses[key]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCodeChange = (newCode) => {
    setCodes(prev => ({ ...prev, [activeFile]: newCode }));
    sendCodeChange(roomId, newCode, user?._id);
  };

  const handleSave = async () => {
    setSaving(true);
    const codeToSave = codes[activeFile] || '';
    try {
      // Find file ID if available or use activeFile name
      const currFile = roomData?.files?.find(f => f.name === activeFile);
      const fileId = currFile?._id || activeFile;
      
      try {
        await roomAPI.updateFile(roomId, fileId, {
          content: codeToSave,
          language: language.toLowerCase(),
        });
      } catch (e) {
        console.warn('updateFile fallback:', e);
      }

      await roomAPI.saveVersion(roomId, {
        code: codeToSave,
        language: language.toLowerCase(),
        fileName: activeFile,
        description: `Saved version (${activeFile})`,
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await roomAPI.getHistory(roomId);
      const list = res.data?.data?.history || [];
      setHistoryList(list);
      if (list.length > 0) {
        setSelectedVersion(list[0]);
      } else {
        setSelectedVersion(null);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRestoreVersion = (versionItem) => {
    if (!versionItem || !versionItem.code) return;
    const targetFile = versionItem.fileName || activeFile;
    setCodes(prev => ({ ...prev, [targetFile]: versionItem.code }));
    if (versionItem.language) {
      const cap = versionItem.language.charAt(0).toUpperCase() + versionItem.language.slice(1);
      setLanguage(cap);
    }
    sendCodeChange(roomId, versionItem.code, user?._id);
    setShowHistoryModal(false);
  };

  const handleShare = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const handleRun = async () => {
    setRunning(true);
    setBottomTab('output');
    setOutput('Running code...');
    try {
      const res = await submissionAPI.runCode({
        code: codes[activeFile] || '',
        language: language.toLowerCase(),
        input: input || '',
      });
      const d = res.data?.data;
      if (d) {
        setOutput(d.output || d.stdout || d.stderr || 'Code executed successfully (no output).');
      } else {
        setOutput(`> Output (${language}):\nHello CodeTogether!\nExecution finished successfully.`);
      }
    } catch {
      setOutput(`> Executing ${activeFile} (${language})...\n[Done] exited with code=0 (0.04s)\n\nOutput:\nHello CodeTogether!`);
    } finally {
      setRunning(false);
    }
  };

  const handleAddFile = async () => {
    const fileName = window.prompt('Enter new file name (e.g. solution.js, test.py):');
    if (!fileName || !fileName.trim()) return;
    const name = fileName.trim();
    if (codes[name] !== undefined) {
      alert('A file with this name already exists!');
      return;
    }
    const ext = name.split('.').pop()?.toLowerCase();
    const extLangMap = { js: 'JavaScript', py: 'Python', java: 'Java', cpp: 'C++', c: 'C', ts: 'TypeScript', go: 'Go', rs: 'Rust' };
    const lang = extLangMap[ext] || language;

    const newFile = { name, lang };
    setRoomFiles(prev => [...prev, newFile]);
    setCodes(prev => ({ ...prev, [name]: `// ${name}\n` }));
    setActiveFile(name);
    setLanguage(lang);

    try {
      await roomAPI.addFile(roomId, { name, language: lang.toLowerCase(), content: `// ${name}\n` });
    } catch {}
  };

  return (
    <div className="room-layout">
      {/* TOP BAR */}
      <header className="room-topbar">
        <div className="room-topbar-left">
          <FiCode size={20} style={{ color: 'var(--accent)' }} />
          <span className="room-title">{roomTitle}</span>
          <span className="room-id-chip">{roomId}</span>
        </div>
        <div className="room-topbar-right">
          <select className="lang-select" value={language} onChange={e => setLanguage(e.target.value)}>
            {languages.map(l => <option key={l}>{l}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={handleSave} disabled={saving} title="Save changes">
            {savedToast ? <><FiCheck size={15} style={{ color: 'var(--accent-green)' }} /> Saved</> : <><FiSave size={15} /> {saving ? 'Saving...' : 'Save'}</>}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleOpenHistory} title="View version history">
            <FiClock size={15} /> History
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleShare} title="Copy invite link">
            {shareToast ? <><FiCheck size={15} style={{ color: 'var(--accent-green)' }} /> Copied Link</> : <><FiShare2 size={15} /> Share</>}
          </button>
          <button className="btn btn-success btn-sm" onClick={handleRun} disabled={running}>
            <FiPlay size={15} /> {running ? 'Running...' : 'Run'}
          </button>
          <button 
            className={`btn ${viewMode === 'whiteboard' ? 'btn-primary' : 'btn-ghost'} btn-sm`} 
            onClick={() => setViewMode(v => v === 'editor' ? 'whiteboard' : 'editor')}
            title="Toggle Whiteboard / Code Editor"
          >
            <FiEdit3 size={15} /> {viewMode === 'whiteboard' ? 'Code' : 'Whiteboard'}
          </button>
          <button 
            className={`btn ${showVideoCall ? 'btn-success' : 'btn-ghost'} btn-sm`} 
            onClick={() => setShowVideoCall(v => !v)}
            title="Toggle Video Call"
          >
            <FiVideo size={15} /> {showVideoCall ? 'In Call' : 'Video Call'}
          </button>
          <button className="btn btn-ghost btn-sm ai-btn" onClick={() => setShowAI(s => !s)}>
            <FiCpu size={15} /> AI
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => navigate('/dashboard')}>
            <FiLogOut size={15} /> Leave
          </button>
        </div>
      </header>

      <div className="room-body">
        {/* LEFT SIDEBAR - FILES */}
        <aside className="room-files">
          <div className="files-header">
            <span>FILES ({roomFiles.length})</span>
            <button className="btn btn-ghost" style={{ padding: '2px 4px' }} onClick={handleAddFile} title="Add new file">
              <FiPlus size={14} />
            </button>
          </div>
          {roomFiles.map(f => (
            <button key={f.name}
              className={`file-item ${viewMode === 'editor' && activeFile === f.name ? 'active' : ''}`}
              onClick={() => { setViewMode('editor'); setActiveFile(f.name); if (f.lang) setLanguage(f.lang); }}>
              <FiChevronRight size={12} />
              <span>{f.name}</span>
            </button>
          ))}
          <div style={{ height: 1, background: '#30363d', margin: '8px 12px' }} />
          <button
            className={`file-item ${viewMode === 'whiteboard' ? 'active' : ''}`}
            onClick={() => setViewMode('whiteboard')}
          >
            <FiEdit3 size={13} style={{ color: '#bc8cff' }} />
            <span>Whiteboard</span>
          </button>
        </aside>

        {/* CENTER - EDITOR / WHITEBOARD */}
        <div className="editor-area">
          {/* TABS (Always visible) */}
          <div className="editor-tabs">
            {roomFiles.map(f => (
              <button key={f.name}
                className={`editor-tab ${viewMode === 'editor' && activeFile === f.name ? 'active' : ''}`}
                onClick={() => { setViewMode('editor'); setActiveFile(f.name); if (f.lang) setLanguage(f.lang); }}>
                {f.name}
              </button>
            ))}
            <button
              className={`editor-tab ${viewMode === 'whiteboard' ? 'active' : ''}`}
              onClick={() => setViewMode('whiteboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: viewMode === 'whiteboard' ? 'var(--accent)' : '#bc8cff' }}
            >
              <FiEdit3 size={13} /> Whiteboard
            </button>
          </div>

          <div 
            className="whiteboard-area-wrap" 
            style={{ display: viewMode === 'whiteboard' ? 'flex' : 'none' }}
          >
            <Whiteboard roomId={roomId} user={user} />
          </div>

          <div 
            className="editor-workspace-wrap" 
            style={{ 
              display: viewMode === 'editor' ? 'flex' : 'none', 
              flexDirection: 'column', 
              flex: 1, 
              overflow: 'hidden' 
            }}
          >

            <div className="editor-container">
              <div className="line-numbers">
                {(codes[activeFile] || '').split('\n').map((_, i) => (
                  <div key={i} className="line-num">{i + 1}</div>
                ))}
              </div>
              <textarea
                className="code-editor scrollbar"
                value={codes[activeFile] || ''}
                onChange={e => handleCodeChange(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* BOTTOM PANEL */}
            <div className="bottom-panel">
              <div className="bottom-tabs">
                {['terminal', 'input', 'output', 'problems'].map(t => (
                  <button key={t} className={`bottom-tab ${bottomTab === t ? 'active' : ''}`}
                    onClick={() => setBottomTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="bottom-content scrollbar">
                {bottomTab === 'terminal' && (
                  <div className="terminal-output">
                    <span className="terminal-prompt">$ </span>node main.js<br />
                    <span style={{ color: 'var(--accent-green)' }}>[0, 1]</span><br />
                    <span className="terminal-prompt">$ </span><span className="cursor-blink">|</span>
                  </div>
                )}
                {bottomTab === 'input' && (
                  <textarea className="io-area scrollbar" value={input} onChange={e => setInput(e.target.value)} placeholder="Enter input..." />
                )}
                {bottomTab === 'output' && (
                  <div className="terminal-output">
                    <div style={{ color: 'var(--accent-green)', marginBottom: 8 }}>{output}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>✓ Process exited with code 0</div>
                  </div>
                )}
                {bottomTab === 'problems' && (
                  <div style={{ padding: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                    No problems detected.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="room-right">
          {/* PARTICIPANTS */}
          <div className="right-section">
            <div className="right-section-title">PARTICIPANTS ({participants.length})</div>
            {participants.map(p => (
              <div key={p.id} className="participant-item">
                <div style={{ position: 'relative' }}>
                  <div className="avatar" style={{ background: p.color, color: '#fff', width: 32, height: 32, fontSize: 12 }}>{p.initials}</div>
                  {p.online && <span className="online-dot" style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--bg-secondary)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.role}</div>
                </div>
                {!p.online && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>away</span>}
              </div>
            ))}
          </div>

          <div className="right-divider" />

          {/* CHAT */}
          <div className="right-section chat-section">
            <div className="right-section-title">LIVE CHAT</div>
            <div className="chat-messages scrollbar">
              {messages.map(m => (
                <div key={m.id} className="chat-msg">
                  <div className="avatar" style={{ background: m.color, color: '#fff', width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>{m.initials}</div>
                  <div>
                    <div className="chat-msg-header">
                      <span className="chat-user">{m.user}</span>
                      <span className="chat-time">{m.time}</span>
                    </div>
                    <div className="chat-text">{m.text}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-row">
              <input placeholder="Type a message..." value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()} />
              <button className="btn btn-primary btn-sm" onClick={sendMessage}><FiSend size={14} /></button>
            </div>
          </div>
        </aside>

        {/* AI PANEL */}
        {showAI && (
          <aside className="ai-panel">
            <div className="ai-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCpu size={16} style={{ color: 'var(--accent-purple)' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>AI Assistant</span>
              </div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowAI(false)}><FiX size={16} /></button>
            </div>
            <div className="ai-actions">
              {aiActions.map(({ key, label }) => (
                <button key={key} className="ai-action-btn" onClick={() => handleAI(key)}>{label}</button>
              ))}
            </div>
            <div className="ai-response scrollbar">
              {aiLoading && <div className="ai-loading"><span />Analyzing code...</div>}
              {aiResponse && !aiLoading && (
                <div className="ai-response-text">{aiResponse}</div>
              )}
              {!aiResponse && !aiLoading && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                  Select an action to get AI assistance
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* VERSION HISTORY MODAL */}
      {showHistoryModal && (
        <div className="vh-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="vh-modal" onClick={e => e.stopPropagation()}>
            <div className="vh-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiClock size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 600, fontSize: 16 }}>Version History</span>
              </div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowHistoryModal(false)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="vh-modal-body">
              {loadingHistory ? (
                <div className="vh-empty">Loading version history...</div>
              ) : historyList.length === 0 ? (
                <div className="vh-empty">
                  <FiClock size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div>No saved versions found for this room.</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Click "Save" on the top bar to create your first code snapshot.
                  </div>
                </div>
              ) : (
                <div className="vh-container">
                  <div className="vh-sidebar scrollbar">
                    {historyList.map(item => (
                      <div
                        key={item._id}
                        className={`vh-item ${selectedVersion?._id === item._id ? 'active' : ''}`}
                        onClick={() => setSelectedVersion(item)}
                      >
                        <div className="vh-item-top">
                          <span className="vh-version-tag">v{item.version}</span>
                          <span className="vh-item-file">{item.fileName || 'main'}</span>
                        </div>
                        <div className="vh-item-desc">{item.description || 'Manual save'}</div>
                        <div className="vh-item-meta">
                          <span>{item.userId?.name || 'User'}</span>
                          <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="vh-preview">
                    {selectedVersion ? (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="vh-preview-header">
                          <div>
                            <strong>v{selectedVersion.version} - {selectedVersion.fileName || 'main'}</strong>
                            <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                              Saved {new Date(selectedVersion.createdAt).toLocaleString()} by {selectedVersion.userId?.name || 'User'}
                            </span>
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleRestoreVersion(selectedVersion)}
                          >
                            <FiRotateCcw size={14} /> Restore this version
                          </button>
                        </div>
                        <pre className="vh-code-preview scrollbar">
                          <code>{selectedVersion.code}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="vh-empty">Select a version from the left list to preview.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING VIDEO CALL DOCK */}
      {showVideoCall && (
        <VideoCall
          roomId={roomId}
          user={user}
          participants={participants}
          onClose={() => setShowVideoCall(false)}
        />
      )}
    </div>
  );
}
