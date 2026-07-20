import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

const SoundCard = ({ title, description, color, gradient, onChoose }) => (
  <div
    className="sound-card"
    style={{ '--card-accent': color, '--card-gradient': gradient }}
    onClick={onChoose}
  >
    <div className="sound-card-glow" />
    <div className="sound-card-content">
      <div className="sound-card-wave" />
      <h3 className="sound-card-title">{title}</h3>
      <p className="sound-card-desc">{description}</p>
      <button className="sound-card-btn">Create room</button>
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

  const handleCreateRoom = async soundChoice => {
    const { customAlphabet } = await import('nanoid');
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
    const roomId = nanoid();

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          title: soundChoice,
        }),
      });
      if (!response.ok) throw new Error('Failed to create room');
      navigate(`/room?id=${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Could not create room. Please try again.');
    }
  };

  const handleJoinRoom = roomId => {
    navigate(`/room?id=${roomId}`);
  };

  return (
    <div className="create-room-page">
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
              onChoose={() => handleCreateRoom('Electric Current')}
            />
            <SoundCard
              title="Global Frequencies"
              description="World music, indie, and eclectic global sounds."
              color="#C084FC"
              gradient="linear-gradient(135deg, #C084FC 0%, #A855F7 100%)"
              onChoose={() => handleCreateRoom('Global Frequencies')}
            />
            <SoundCard
              title="Ambient Horizons"
              description="Chill lo-fi, ambient, and atmospheric soundscapes."
              color="#38BDF8"
              gradient="linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)"
              onChoose={() => handleCreateRoom('Ambient Horizons')}
            />
          </div>
        </div>

        <div className="create-room-right">
          <JoinRoomForm onJoin={handleJoinRoom} />
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
