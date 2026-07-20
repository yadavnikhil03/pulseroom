import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import './style.css';

const Room = () => {
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [nowPlayingTrack, setNowPlayingTrack] = useState(null);
  const [trackQueue, setTrackQueue] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const roomId = searchParams.get('id');

  const handleHostAction = (actionType) => {
    if (socket && isHost) {
      socket.emit('host action', { type: actionType, roomId });
    }
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) throw new Error('Room not found');
        const data = await response.json();
        setRoom(data);
        setTrackQueue(data.addedTracks || []);
        const playingTrack = data.addedTracks?.find(t => t.nowPlaying);
        if (playingTrack) setNowPlayingTrack(playingTrack);
      } catch (error) {
        console.error('Error fetching room:', error);
      }
    };

    if (roomId) fetchRoom();

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (roomId) {
        newSocket.emit('join room', roomId, { name: 'Guest' });
      }
    });

    newSocket.on('user role', ({ isHost: hostStatus }) => {
      setIsHost(hostStatus);
    });

    newSocket.on('playback_update', (playbackState) => {
      setTrackQueue(currentQueue =>
        currentQueue.map(track =>
          track.spotifyId === playbackState.currentTrackId
            ? { ...track, nowPlaying: true, progress: playbackState.progressMs }
            : { ...track, nowPlaying: false }
        )
      );
      const playingTrack = trackQueue.find(t => t.nowPlaying);
      if (playingTrack) setNowPlayingTrack(playingTrack);
    });

    newSocket.on('queue_update', (newQueue) => {
      setTrackQueue(newQueue);
    });

    newSocket.on('current users', (users) => {
      setConnectedUsers(users);
    });

    return () => newSocket.close();
  }, [roomId, trackQueue]);

  if (!room) {
    return <div>Loading room...</div>;
  }

  return (
    <div className="room-page">
      <h1>{room.title}</h1>
      <p>Room ID: {room.room_id}</p>

      <h2>Now Playing</h2>
      {nowPlayingTrack ? (
        <div>
          <p>{nowPlayingTrack.metadata.name} by {nowPlayingTrack.metadata.artists[0].name}</p>
        </div>
      ) : <p>Nothing is playing.</p>}

      <h2>Queue</h2>
      <ul>
        {trackQueue.map(track => (
          <li key={track.spotifyId}>
            {track.metadata.name} {track.nowPlaying && '(Now Playing)'}
          </li>
        ))}
      </ul>

      <h2>Host Controls</h2>
      {isHost && (
        <div>
          <button onClick={() => handleHostAction('PLAY')}>Play</button>
          <button onClick={() => handleHostAction('PAUSE')}>Pause</button>
          <button onClick={() => handleHostAction('NEXT')}>Next</button>
        </div>
      )}

      <h2>Users</h2>
      <ul>
        {connectedUsers.map((user, index) => (
          <li key={index}>{user.name} {user.isHost && '(Host)'}</li>
        ))}
      </ul>
    </div>
  );
};

export default Room;
