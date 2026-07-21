import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from '../../components/Navbar';
import TrackSearch from '../../components/TrackSearch';
import SpotifyPlayer from '../../components/SpotifyPlayer';
import { apiURL } from '../../App.config';
import { useAuth } from '../../hooks/AuthContext';
import { getAccessToken } from '../../utils/authApi';
import { useToast } from '../../components/Toast';
import API from '../../utils/API';
import analytics from '../../utils/analytics';
import './style.css';

const Room = () => {
  const { user: accountUser } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [nowPlayingTrack, setNowPlayingTrack] = useState(null);
  const [trackQueue, setTrackQueue] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [roomError, setRoomError] = useState('');
  const roomId = searchParams.get('id');

  const handleHostAction = (actionType) => {
    if (socket && isHost) {
      socket.emit('host action', { type: actionType, roomId });
    }
  };

  const handleAddTrack = async (track) => {
    try {
      await API.addTrack(roomId, track);
      if (socket && roomId) {
        socket.emit('queue_update', { roomId });
      }
      addToast(`"${track.name}" added to queue`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not add track', 'error');
    }
  };

  useEffect(() => {
    let active = true;
    const fetchRoom = async () => {
      try {
        const response = await fetch(`${apiURL}/api/rooms/${roomId}`);
        if (!response.ok) throw new Error('Room not found');
        const data = await response.json();
        if (!active) return;
        setRoom(data);
        setTrackQueue(data.addedTracks || []);
        setNowPlayingTrack(data.addedTracks?.find(track => track.nowPlaying) || null);
        analytics.event('room', 'join', roomId);
      } catch (error) {
        if (active) {
          const msg = error.response?.status === 404 ? 'Room not found.' : error.message || 'Could not load room.';
          setRoomError(msg);
        }
      }
    };

    if (roomId) fetchRoom();

    const newSocket = io(apiURL, {
      withCredentials: true,
      auth: getAccessToken() ? { token: getAccessToken() } : {}
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (roomId) newSocket.emit('join room', roomId, { name: accountUser?.name || 'Guest' });
    });
    newSocket.on('connect_error', error => {
      console.error('Room connection failed:', error.message);
      addToast('Connection lost. Retrying…', 'warning');
    });
    newSocket.on('user role', ({ isHost: hostStatus }) => setIsHost(hostStatus));
    newSocket.on('playback_update', playbackState => {
      setTrackQueue(currentQueue => currentQueue.map(track =>
        track.spotifyId === playbackState.currentTrackId
          ? { ...track, nowPlaying: true, progress: playbackState.progressMs }
          : { ...track, nowPlaying: false }
      ));
    });
    newSocket.on('queue_update', async () => fetchRoom());
    newSocket.on('current users', users => setConnectedUsers(users));
    newSocket.on('user status', ({ text }) => {
      if (text) addToast(text, 'info');
    });
    newSocket.on('kicked', ({ reason }) => {
      addToast(reason || 'You were removed from the room.', 'error');
      setTimeout(() => window.location.assign('/home'), 1000);
    });
    newSocket.on('host transferred', () => {
      analytics.event('room', 'host_transferred', roomId);
    });

    return () => { active = false; newSocket.close(); };
  }, [roomId, accountUser?.name]);

  useEffect(() => {
    setNowPlayingTrack(trackQueue.find(track => track.nowPlaying) || null);
  }, [trackQueue]);

  if (!room) {
    return (
      <>
        <Navbar />
        {roomError ? (
          <div className="room-error-page">
            <h2>Could not load room</h2>
            <p>{roomError}</p>
            <a href="/create" className="home-action-btn" style={{ display: 'inline-flex', marginTop: 16 }}>Create a room</a>
          </div>
        ) : (
          <div className="page-loading">Loading room...</div>
        )}
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="room-page">
        <span className="room-id-badge">Room: {room.room_id}</span>
        <h1>{room.title || 'Untitled Room'}</h1>

        <h2>Now Playing</h2>
        <div className={`now-playing-card ${!nowPlayingTrack ? 'is-empty' : 'has-track'}`}>
          <div className="now-playing-indicator">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
          {nowPlayingTrack ? (
            <div className="now-playing-info">
              <strong>{nowPlayingTrack.metadata?.name || nowPlayingTrack.info}</strong>
              <span>{nowPlayingTrack.metadata?.artists?.[0]?.name || nowPlayingTrack.metadata?.artists?.[0] || 'Unknown Artist'}</span>
            </div>
          ) : (
            <div className="now-playing-info">
              <strong>Nothing playing</strong>
              <span>Add tracks to the queue to get started</span>
            </div>
          )}
        </div>

        <h2>Queue ({trackQueue.length})</h2>
        {trackQueue.length > 0 ? (
          <ul className="queue-list">
            {trackQueue.map((track, index) => (
              <li key={track.spotifyId || index} className={`queue-item ${track.nowPlaying ? 'is-playing' : ''}`}>
                <span className="queue-num">{index + 1}</span>
                <span className="queue-track-name">{track.metadata?.name || track.info}</span>
                <span className="queue-track-artist">{track.metadata?.artists?.[0]?.name || track.metadata?.artists?.[0] || ''}</span>
                {track.nowPlaying && <span className="queue-playing-badge">Now Playing</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>The queue is empty.</p>
        )}

        <div className="room-add-track">
          <TrackSearch onSelect={handleAddTrack} />
        </div>

        <SpotifyPlayer roomId={roomId} socket={socket} isHost={isHost} />

        <h2>Host Controls</h2>
        {isHost ? (
          <div className="host-controls">
            <button className="host-btn play-btn" onClick={() => handleHostAction('PLAY')}>▶ Play</button>
            <button className="host-btn pause-btn" onClick={() => handleHostAction('PAUSE')}>⏸ Pause</button>
            <button className="host-btn next-btn" onClick={() => handleHostAction('NEXT')}>⏭ Next</button>
          </div>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>Only the host can control playback.</p>
        )}

        <h2>Users ({connectedUsers.length})</h2>
        {connectedUsers.length > 0 ? (
          <ul className="users-list">
            {connectedUsers.map((user, index) => (
              <li key={user.id || index} className={`user-chip ${user.isHost ? 'is-host' : ''}`}>
                <span className="user-chip-avatar">{user.name?.charAt(0).toUpperCase() || '?'}</span>
                <span className="user-chip-name">{user.name} {user.isHost && <span className="user-chip-host-tag">Host</span>}</span>
                {isHost && !user.isHost && socket && (
                  <span className="user-chip-actions">
                    <button
                      className="user-chip-btn transfer-btn"
                      title="Transfer host"
                      onClick={() => socket.emit('transfer host', { roomId, targetSocketId: user.socketId })}
                    >👑</button>
                    <button
                      className="user-chip-btn kick-btn"
                      title="Kick user"
                      onClick={() => socket.emit('kick user', { roomId, targetSocketId: user.socketId })}
                    >✕</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>No other users connected.</p>
        )}
      </div>
    </>
  );
};

export default Room;
