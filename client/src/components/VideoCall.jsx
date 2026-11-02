import { useState, useRef, useEffect } from 'react';
import { 
  FiVideo, 
  FiVideoOff, 
  FiMic, 
  FiMicOff, 
  FiPhoneOff, 
  FiMonitor, 
  FiMaximize2, 
  FiMinimize2,
  FiUsers,
  FiVolume2
} from 'react-icons/fi';
import { 
  getSocket, 
  joinVideoCall, 
  leaveVideoCall, 
  sendVideoSignal, 
  sendMediaToggle 
} from '../services/socket';
import './VideoCall.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

// Subcomponent for remote peer video
function RemotePeerTile({ peer }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream, peer.isCameraOff]);

  const hasVideoStream = Boolean(peer.stream && !peer.isCameraOff);

  return (
    <div className="vc-tile remote-tile">
      {hasVideoStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="vc-video"
        />
      ) : (
        <div
          className="vc-avatar-tile"
          style={{ background: peer.user?.color || '#bc8cff' }}
        >
          {(peer.user?.name || 'U').slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="vc-tile-badge">
        <span>{peer.user?.name || 'Peer'}</span>
        <div className="vc-badges-right">
          {peer.isMuted ? (
            <FiMicOff size={11} style={{ color: 'var(--accent-red)' }} />
          ) : (
            <span className="vc-audio-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function VideoCall({ roomId, user, participants = [], onClose }) {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnections = useRef({}); // socketId -> RTCPeerConnection

  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]); // array of { socketId, user, stream, isMuted, isCameraOff }
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mediaNotice, setMediaNotice] = useState('');

  // 1. Initialize local camera/mic stream
  useEffect(() => {
    let mounted = true;

    async function startMedia() {
      // Check if mediaDevices API exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsCameraOff(true);
        setMediaNotice('Camera preview not supported in this browser context. Avatar mode active.');
        joinVideoCall(roomId, {
          _id: user?._id || user?.id,
          name: user?.name || 'You',
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Notify room via socket
        joinVideoCall(roomId, {
          _id: user?._id || user?.id,
          name: user?.name || 'You',
        });
      } catch (err) {
        console.warn('Camera/mic access error, attempting audio-only fallback:', err);
        // Try audio-only fallback
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!mounted) {
            audioStream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          setIsCameraOff(true);
          setMediaNotice('Camera unavailable, joined with microphone audio.');
        } catch (audioErr) {
          console.warn('Audio fallback also unavailable:', audioErr);
          setIsCameraOff(true);
          setIsMuted(true);
          setMediaNotice('Joined in listening / standby avatar mode.');
        }

        joinVideoCall(roomId, {
          _id: user?._id || user?.id,
          name: user?.name || 'You',
        });
      }
    }

    startMedia();

    return () => {
      mounted = false;
      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      // Close peer connections
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      leaveVideoCall(roomId);
    };
  }, [roomId, user]);

  // Bind local video stream to <video> ref whenever stream or camera state changes
  useEffect(() => {
    if (localVideoRef.current && localStream && !isCameraOff) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOff]);

  // Helper: Create RTCPeerConnection
  const createPeerConnection = (socketId, remoteUser, isInitiator) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[socketId] = pc;

    // Add local tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendVideoSignal(socketId, { candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const remoteStream = e.streams[0];
      setPeers((prev) => {
        const exists = prev.find((p) => p.socketId === socketId);
        if (exists) {
          return prev.map((p) => (p.socketId === socketId ? { ...p, stream: remoteStream } : p));
        }
        return [
          ...prev,
          {
            socketId,
            user: remoteUser,
            stream: remoteStream,
            isMuted: false,
            isCameraOff: false,
          },
        ];
      });
    };

    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendVideoSignal(socketId, offer);
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      };
    }

    return pc;
  };

  // 2. Setup socket listeners for WebRTC signaling
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // A new user joined the call -> initiate WebRTC offer
    const handleUserJoined = async ({ socketId, user: remoteUser }) => {
      console.log('User joined call:', remoteUser?.name, socketId);
      createPeerConnection(socketId, remoteUser, true);
    };

    // User left the call
    const handleUserLeft = ({ socketId }) => {
      if (peerConnections.current[socketId]) {
        peerConnections.current[socketId].close();
        delete peerConnections.current[socketId];
      }
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    // WebRTC signaling exchange
    const handleSignal = async ({ from, user: sender, signal }) => {
      let pc = peerConnections.current[from];

      if (!pc) {
        pc = createPeerConnection(from, sender, false);
      }

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendVideoSignal(from, answer);
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      }
    };

    // Peer media toggle update
    const handlePeerMedia = ({ socketId, isMuted: peerMuted, isCameraOff: peerCamOff }) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.socketId === socketId
            ? { ...p, isMuted: peerMuted ?? p.isMuted, isCameraOff: peerCamOff ?? p.isCameraOff }
            : p
        )
      );
    };

    socket.on('user-joined-call', handleUserJoined);
    socket.on('user-left-call', handleUserLeft);
    socket.on('video-signal', handleSignal);
    socket.on('peer-media-toggle', handlePeerMedia);

    return () => {
      socket.off('user-joined-call', handleUserJoined);
      socket.off('user-left-call', handleUserLeft);
      socket.off('video-signal', handleSignal);
      socket.off('peer-media-toggle', handlePeerMedia);
    };
  }, [roomId]);

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = isMuted));
    }
    const nextState = !isMuted;
    setIsMuted(nextState);
    sendMediaToggle(roomId, { isMuted: nextState, isCameraOff, isScreenSharing });
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = isCameraOff));
    }
    const nextState = !isCameraOff;
    setIsCameraOff(nextState);
    sendMediaToggle(roomId, { isMuted, isCameraOff: nextState, isScreenSharing });
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
      sendMediaToggle(roomId, { isMuted, isCameraOff, isScreenSharing: false });
    } else {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setMediaNotice('Screen sharing not supported in this browser.');
        return;
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
        sendMediaToggle(roomId, { isMuted, isCameraOff, isScreenSharing: true });
      } catch (err) {
        console.warn('Screen share canceled or denied:', err);
      }
    }
  };

  const initials = (user?.name || 'You').slice(0, 2).toUpperCase();

  // Simulated peers for solo/demo pair coding
  const displayPeers = peers.length > 0 ? peers : participants
    .filter(p => (p.name || '').toLowerCase() !== (user?.name || '').toLowerCase())
    .slice(0, 2)
    .map(p => ({
      socketId: p.id,
      user: { name: p.name, color: p.color || '#bc8cff' },
      stream: null,
      isMuted: false,
      isCameraOff: true,
    }));

  return (
    <div className={`video-call-dock ${isMinimized ? 'minimized' : ''}`}>
      {/* DOCK HEADER */}
      <div className="vc-header">
        <div className="vc-header-left">
          <span className="vc-pulse-indicator" />
          <span className="vc-title">Room Call</span>
          <span className="vc-count">
            <FiUsers size={12} /> {1 + displayPeers.length}
          </span>
        </div>
        <div className="vc-header-actions">
          <button
            className="vc-btn-icon"
            onClick={() => setIsMinimized((m) => !m)}
            title={isMinimized ? 'Expand Video' : 'Minimize Video'}
          >
            {isMinimized ? <FiMaximize2 size={13} /> : <FiMinimize2 size={13} />}
          </button>
          <button className="vc-btn-icon vc-close" onClick={onClose} title="End Call">
            <FiPhoneOff size={13} />
          </button>
        </div>
      </div>

      {/* VIDEO TILES CONTAINER */}
      {!isMinimized && (
        <div className="vc-tiles-grid">
          {/* LOCAL USER TILE */}
          <div className="vc-tile local-tile">
            {!isCameraOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="vc-video"
              />
            ) : (
              <div className="vc-avatar-tile" style={{ background: '#238636' }}>
                {initials}
              </div>
            )}
            <div className="vc-tile-badge">
              <span>{user?.name ? `${user.name} (You)` : 'You'}</span>
              <div className="vc-badges-right">
                {isMuted ? (
                  <FiMicOff size={11} style={{ color: 'var(--accent-red)' }} />
                ) : (
                  <FiVolume2 size={11} style={{ color: 'var(--accent-green)' }} />
                )}
              </div>
            </div>
          </div>

          {/* REMOTE PEER TILES */}
          {displayPeers.map((peer) => (
            <RemotePeerTile key={peer.socketId} peer={peer} />
          ))}
        </div>
      )}

      {/* MEDIA CONTROLS BAR */}
      <div className="vc-controls">
        <button
          className={`vc-ctrl-btn ${isMuted ? 'danger' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FiMicOff size={15} /> : <FiMic size={15} />}
        </button>

        <button
          className={`vc-ctrl-btn ${isCameraOff ? 'danger' : ''}`}
          onClick={toggleCamera}
          title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isCameraOff ? <FiVideoOff size={15} /> : <FiVideo size={15} />}
        </button>

        <button
          className={`vc-ctrl-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          <FiMonitor size={15} />
        </button>

        <button className="vc-ctrl-btn hangup" onClick={onClose} title="Leave Call">
          <FiPhoneOff size={15} />
        </button>
      </div>

      {mediaNotice && !isMinimized && (
        <div className="vc-notice">
          {mediaNotice}
        </div>
      )}
    </div>
  );
}
