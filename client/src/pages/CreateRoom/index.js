import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { apiURL } from '../../App.config';
import { useAuth } from '../../hooks/AuthContext';
import { getAccessToken } from '../../utils/authApi';
import { useToast } from '../../components/Toast';
import './style.css';

const SoundCard = ({ title, description, color, gradient, onChoose, isCreating }) => (
  <div
    className={`sound-card ${isCreating ? 'is-creating' : ''}`}
    style={{ '--card-accent': color, '--card-gradient': gradient }}
    onClick={isCreating ? undefined : onChoose}
  >
    <div className="sound-card-glow" />
    <div className="sound-card-content">
      <div className="sound-card-wave" />
      <h3 className="sound-card-title">{title}</h3>
      <p className="sound-card-desc">{description}</p>
      <button className="sound-card-btn" disabled={isCreating}>
        {isCreating ? 'Creating…' : 'Create room'}
      </button>
    </div>
  </div>
);

const JoinRoomForm = ({ onJoin }) => {
  const [roomId, setRoomId] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin(roomId.trim().toUpperCase());
    }
  };

  return (
    <form className="join-room-form" onSubmit={handleSubmit}>
      <label className="join-room-label" htmlFor="roomIdInput">
        Join a room
      </label>
      <p className="join-room-hint">Enter the room ID or a share link</p>
      <div className="join-room-input-row">
        <input
          id="roomIdInput"
          className="join-room-input"
          type="text"
          placeholder="e.g. ABC123 or https://pulseroom.app/room?id=ABC123"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
        />
        <button className="join-room-btn" type="submit">
          Join room →
        </button>
      </div>
    </form>
  );
};

const StatsDisplay = () => (
  <div className="stats-display">
    <div className="stat-item">
      <div className="stat-value" style={{ color: '#DFFF00' }}>0</div>
      <div className="stat-label">Active rooms</div>
    </div>
    <div className="stat-divider" />
    <div className="stat-item">
      <div className="stat-value" style={{ color: '#00D4FF' }}>0</div>
      <div className="stat-label">Local tracks</div>
    </div>
    <div className="stat-divider" />
    <div className="stat-item">
      <div className="stat-value" style={{ color: '#1DB954' }}>●</div>
      <div className="stat-label">Live Socket Sync</div>
    </div>
  </div>
);

const CreateRoom = ({ user }) => {
  const navigate = useNavigate();
  const { user: accountUser } = useAuth();
  const { addToast } = useToast();
  const [creating, setCreating] = useState(null);
  const [createError, setCreateError] = useState('');

  const handleCreateRoom = async soundChoice => {
    if (creating) return;
    setCreating(soundChoice);
    setCreateError('');
    const { customAlphabet } = await import('nanoid');
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
    const roomId = nanoid();

    try {
      const token = getAccessToken();
      const response = await fetch(`${apiURL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          room_id: roomId,
          title: soundChoice,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to create room');
      addToast(`Room “${soundChoice}” created! Joining now…`, 'success');
      setTimeout(() => navigate(`/room?id=${roomId}`), 400);
    } catch (error) {
      setCreateError(error.message || 'Could not create room. Please try again.');
    } finally {
      setCreating(null);
    }
  };

  const handleJoinRoom = roomId => {
    const extracted = roomId.trim().toUpperCase();
    if (!extracted) return;
    // Extract room ID from full URL if pasted
    const match = extracted.match(/[?&]id=([A-Z0-9_-]+)/i) || extracted.match(/[A-Z0-9_-]{3,20}/);
    const finalId = match ? match[1] || match[0] : extracted;
    if (finalId.length < 3) {
      setCreateError('Room ID must be at least 3 characters.');
      return;
    }
    navigate(`/room?id=${finalId}`);
  };

  return (
    <div className="create-room-page">
      <Navbar />
      <StatsDisplay />

      <div className="create-room-layout">
        <div className="create-room-left">
          <h1 className="create-room-title">
            Start a room.
            <br />
            <span className="create-room-title-accent">Share the pulse.</span>
          </h1>
          <p className="create-room-subtitle">Choose your sound</p>
          <div className="sound-cards-grid">
            <SoundCard
              title="Electric Current"
              description="High-energy EDM & electronic beats. Perfect for dance sessions."
              color="#DFFF00"
              gradient="linear-gradient(135deg, #DFFF00 0%, #B0E000 100%)"
              isCreating={creating === 'Electric Current'}
              onChoose={() => handleCreateRoom('Electric Current')}
            />
            <SoundCard
              title="Global Frequencies"
              description="World music, indie, and eclectic global sounds."
              color="#C084FC"
              gradient="linear-gradient(135deg, #C084FC 0%, #A855F7 100%)"
              isCreating={creating === 'Global Frequencies'}
              onChoose={() => handleCreateRoom('Global Frequencies')}
            />
            <SoundCard
              title="Ambient Horizons"
              description="Chill lo-fi, ambient, and atmospheric soundscapes."
              color="#38BDF8"
              gradient="linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)"
              isCreating={creating === 'Ambient Horizons'}
              onChoose={() => handleCreateRoom('Ambient Horizons')}
            />
          </div>
        </div>

        {createError && <p className="create-room-error" role="alert">{createError}</p>}

        <div className="create-room-right">
          <JoinRoomForm onJoin={handleJoinRoom} />
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
