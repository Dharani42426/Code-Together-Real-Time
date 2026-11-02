import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FiEdit2, 
  FiSquare, 
  FiCircle, 
  FiMinus, 
  FiType, 
  FiRotateCcw, 
  FiTrash2, 
  FiDownload,
  FiCheck
} from 'react-icons/fi';
import { BsEraser } from 'react-icons/bs';
import { getSocket, sendWhiteboardDraw, sendWhiteboardClear } from '../services/socket';
import './Whiteboard.css';

const COLORS = [
  '#ffffff', // White
  '#58a6ff', // CodeTogether Blue
  '#3fb950', // Green
  '#ffa657', // Orange
  '#bc8cff', // Purple
  '#f85149', // Red
  '#d29922', // Yellow
];

const STROKE_SIZES = [
  { label: 'S', size: 2 },
  { label: 'M', size: 4 },
  { label: 'L', size: 8 },
  { label: 'XL', size: 16 },
];

export default function Whiteboard({ roomId, user }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const snapshot = useRef(null);
  const history = useRef([]); // ImageData history stack for Undo

  const [tool, setTool] = useState('pen'); // 'pen' | 'line' | 'rect' | 'circle' | 'eraser' | 'text'
  const [color, setColor] = useState('#58a6ff');
  const [strokeSize, setStrokeSize] = useState(4);
  const [downloadToast, setDownloadToast] = useState(false);

  // Save current canvas state to history
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const ctx = canvas.getContext('2d');
    try {
      if (history.current.length >= 25) {
        history.current.shift();
      }
      history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    } catch (e) {
      console.warn('Canvas saveState error:', e);
    }
  }, []);

  // Initialize or resize canvas cleanly without losing content
  const resizeCanvas = useCallback((width, height) => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    // Check if resize is needed
    if (canvas.width === Math.floor(width) && canvas.height === Math.floor(height)) return;

    const ctx = canvas.getContext('2d');
    let prevData = null;

    if (canvas.width > 0 && canvas.height > 0) {
      try {
        prevData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {}
    }

    canvas.width = Math.floor(width);
    canvas.height = Math.floor(height);

    // Fill dark background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (prevData) {
      try {
        ctx.putImageData(prevData, 0, 0);
      } catch (e) {}
    } else {
      saveState();
    }
  }, [saveState]);

  // Robust ResizeObserver for automatic dimension tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        resizeCanvas(rect.width, rect.height);
      }
    };

    updateSize();

    // Use ResizeObserver for accurate sizing after DOM layout
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          resizeCanvas(width, height);
        }
      }
    });

    observer.observe(container);

    // Fallback timer for layout transitions
    const timer = setTimeout(updateSize, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [resizeCanvas]);

  const undo = () => {
    if (history.current.length <= 1) return;
    history.current.pop(); // Remove current
    const prev = history.current[history.current.length - 1];
    const canvas = canvasRef.current;
    if (canvas && prev) {
      const ctx = canvas.getContext('2d');
      ctx.putImageData(prev, 0, 0);
    }
  };

  const clearCanvas = (broadcast = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();

    if (broadcast) {
      sendWhiteboardClear(roomId);
    }
  };

  // Remote stroke renderer
  const executeRemoteDraw = useCallback((stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#0d1117' : stroke.color;
    ctx.fillStyle = stroke.tool === 'eraser' ? '#0d1117' : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(stroke.fromX, stroke.fromY);
      ctx.lineTo(stroke.toX, stroke.toY);
      ctx.stroke();
    } else if (stroke.tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(stroke.fromX, stroke.fromY);
      ctx.lineTo(stroke.toX, stroke.toY);
      ctx.stroke();
    } else if (stroke.tool === 'rect') {
      ctx.strokeRect(stroke.fromX, stroke.fromY, stroke.toX - stroke.fromX, stroke.toY - stroke.fromY);
    } else if (stroke.tool === 'circle') {
      const rx = Math.abs(stroke.toX - stroke.fromX) / 2;
      const ry = Math.abs(stroke.toY - stroke.fromY) / 2;
      const cx = Math.min(stroke.fromX, stroke.toX) + rx;
      const cy = Math.min(stroke.fromY, stroke.toY) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (stroke.tool === 'text') {
      ctx.font = `${Math.max(16, stroke.size * 4)}px sans-serif`;
      ctx.fillText(stroke.text, stroke.fromX, stroke.fromY);
    }

    ctx.restore();
  }, []);

  // Socket listener for real-time collaboration
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDraw = ({ stroke }) => {
      if (stroke) executeRemoteDraw(stroke);
    };

    const handleClear = () => {
      clearCanvas(false);
    };

    socket.on('whiteboard-draw', handleDraw);
    socket.on('whiteboard-clear', handleClear);

    return () => {
      socket.off('whiteboard-draw', handleDraw);
      socket.off('whiteboard-clear', handleClear);
    };
  }, [executeRemoteDraw]);

  // Compute pointer coordinates relative to canvas
  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Unified HTML5 PointerDown (works for Mouse and Touch)
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    // Text tool
    if (tool === 'text') {
      const userText = window.prompt('Enter label text:');
      if (userText && userText.trim()) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `${Math.max(16, strokeSize * 4)}px sans-serif`;
        ctx.fillText(userText.trim(), pos.x, pos.y);
        ctx.restore();
        saveState();

        sendWhiteboardDraw(roomId, {
          tool: 'text',
          text: userText.trim(),
          fromX: pos.x,
          fromY: pos.y,
          color,
          size: strokeSize,
        });
      }
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    isDrawing.current = true;
    startPos.current = pos;

    // Save snapshot for shapes preview
    try {
      snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (err) {}

    // Draw single point immediately for pen or eraser
    if (tool === 'pen' || tool === 'eraser') {
      ctx.save();
      ctx.fillStyle = tool === 'eraser' ? '#0d1117' : color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, strokeSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      sendWhiteboardDraw(roomId, {
        tool,
        fromX: pos.x,
        fromY: pos.y,
        toX: pos.x + 0.1,
        toY: pos.y + 0.1,
        color: tool === 'eraser' ? '#0d1117' : color,
        size: strokeSize,
      });
    }
  };

  // Unified HTML5 PointerMove
  const handlePointerMove = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    ctx.strokeStyle = tool === 'eraser' ? '#0d1117' : color;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(startPos.current.x, startPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      sendWhiteboardDraw(roomId, {
        tool,
        fromX: startPos.current.x,
        fromY: startPos.current.y,
        toX: pos.x,
        toY: pos.y,
        color: tool === 'eraser' ? '#0d1117' : color,
        size: strokeSize,
      });

      startPos.current = pos;
    } else {
      // Shape preview using snapshot
      if (snapshot.current) {
        ctx.putImageData(snapshot.current, 0, 0);
      }

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.current.x, startPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(
          startPos.current.x,
          startPos.current.y,
          pos.x - startPos.current.x,
          pos.y - startPos.current.y
        );
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - startPos.current.x) / 2;
        const ry = Math.abs(pos.y - startPos.current.y) / 2;
        const cx = Math.min(startPos.current.x, pos.x) + rx;
        const cy = Math.min(startPos.current.y, pos.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  // Unified HTML5 PointerUp
  const handlePointerUp = (e) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // Broadcast completed shape
    if (['line', 'rect', 'circle'].includes(tool)) {
      sendWhiteboardDraw(roomId, {
        tool,
        fromX: startPos.current.x,
        fromY: startPos.current.y,
        toX: pos.x,
        toY: pos.y,
        color,
        size: strokeSize,
      });
    }

    saveState();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2000);
  };

  return (
    <div className="whiteboard-container" ref={containerRef}>
      {/* FLOATING WHITEBOARD TOOLBAR */}
      <div className="wb-toolbar">
        {/* TOOLS */}
        <div className="wb-tool-group">
          <button
            className={`wb-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen Tool"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            className={`wb-btn ${tool === 'line' ? 'active' : ''}`}
            onClick={() => setTool('line')}
            title="Line Tool"
          >
            <FiMinus size={16} />
          </button>
          <button
            className={`wb-btn ${tool === 'rect' ? 'active' : ''}`}
            onClick={() => setTool('rect')}
            title="Rectangle"
          >
            <FiSquare size={16} />
          </button>
          <button
            className={`wb-btn ${tool === 'circle' ? 'active' : ''}`}
            onClick={() => setTool('circle')}
            title="Circle"
          >
            <FiCircle size={16} />
          </button>
          <button
            className={`wb-btn ${tool === 'text' ? 'active' : ''}`}
            onClick={() => setTool('text')}
            title="Text Label"
          >
            <FiType size={16} />
          </button>
          <button
            className={`wb-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <BsEraser size={16} />
          </button>
        </div>

        <div className="wb-divider" />

        {/* COLOR PALETTE */}
        <div className="wb-colors">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`wb-color-dot ${color === c && tool !== 'eraser' ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => {
                setColor(c);
                if (tool === 'eraser') setTool('pen');
              }}
            />
          ))}
        </div>

        <div className="wb-divider" />

        {/* STROKE SIZES */}
        <div className="wb-sizes">
          {STROKE_SIZES.map((s) => (
            <button
              key={s.label}
              className={`wb-size-btn ${strokeSize === s.size ? 'selected' : ''}`}
              onClick={() => setStrokeSize(s.size)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="wb-divider" />

        {/* ACTIONS */}
        <div className="wb-actions">
          <button className="wb-btn" onClick={undo} title="Undo">
            <FiRotateCcw size={15} />
          </button>
          <button className="wb-btn btn-danger-hover" onClick={() => clearCanvas(true)} title="Clear Board">
            <FiTrash2 size={15} />
          </button>
          <button className="wb-btn" onClick={downloadCanvas} title="Export PNG">
            {downloadToast ? <FiCheck size={15} style={{ color: 'var(--accent-green)' }} /> : <FiDownload size={15} />}
          </button>
        </div>
      </div>

      {/* DRAWING CANVAS */}
      <canvas
        ref={canvasRef}
        className="wb-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}
