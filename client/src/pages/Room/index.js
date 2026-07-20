import React, { useEffect, useMemo, useRef, useState } from 'react';
import queryString from 'query-string';
import { io } from 'socket.io-client';
import { ArrowLeft, Copy, Heart, Music2, Pause, Play, Radio, SkipForward, Users, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { apiURL } from '../../App.config';
import API from '../../utils/API';
import localAudio from '../../utils/localAudio';
import TrackSearch from '../../components/TrackSearch';
import './style.css';

const formatTime = ms => {
  const s = Math.max(0, Math.floor((ms || 0) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const getDemoUser = () => {
  let id = window.sessionStorage.getItem('pulseroom-demo-user');
  if (!id) {
    id = `listener-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem('pulseroom-demo-user', id);
  }
  return { id, name: `Listener ${id.slice(-4).toUpperCase()}`, image: '/images/icons/pulseroom-logo.svg' };
};

const Room = () => {
  const parsedUrl = queryString.parse(window.location.search);
  const roomId = parsedUrl.room_id;
  const token = parsedUrl.access_token;
  const isDemo = token === 'dev_mock_token';
  const user = useMemo(getDemoUser, []);
  const [room, setRoom] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [volume, setVolume] = useState(1);
  const [seeking, setSeeking] = useState(false);
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const progressRef = useRef(null);

  const currentQueueTrack = room?.addedTracks.find(item => item.spotifyId === room.currentTrackId);
  const currentTrack = room?.addedTracks.find(item => item.spotifyId === room.currentTrackId)?.metadata;
  const currentUserPresence = roomUsers.find(roomUser => roomUser.id === user.id);
  const isHost = Boolean(currentUserPresence?.isHost);
  const liked = Boolean(currentQueueTrack?.likes.includes(user.id));


  const loadRoom = async (quiet = false) => {
    if (!roomId) { setNotFound(true); setLoading(false); return; }
    try {
      const { data } = await API.getTracks(roomId);
      setRoom(data);
      setProgress(data.playback?.positionMs || 0);
      setNotFound(false);
    } catch (_) { setNotFound(true);
    } finally { if (!quiet) setLoading(false); }
  };

  useEffect(() => { loadRoom(); }, [roomId]);

  useEffect(() => {
    if (!roomId || !isDemo) return undefined;
    const connection = io(apiURL);
    setSocket(connection);
    setConnectionState('connecting');

    const joinRoom = () => {
      setConnectionState('connected');
      connection.emit('join room', roomId, user);
    };
    const refresh = () => loadRoom(true);
    const updateUsers = users => setRoomUsers(users);
    const status = ({ text }) => setMessage(text);
    const markDisconnected = () => setConnectionState('disconnected');
    const markReconnecting = () => setConnectionState('connecting');

    connection.on('connect', joinRoom);
    connection.on('disconnect', markDisconnected);
    connection.io.on('reconnect_attempt', markReconnecting);
    connection.on('current users', updateUsers);
    connection.on('playback_update', refresh);
    connection.on('queue_update', refresh);
    connection.on('room song', refresh);
    connection.on('user status', status);
    return () => {
      connection.off('connect', joinRoom);
      connection.off('disconnect', markDisconnected);
      connection.io.off('reconnect_attempt', markReconnecting);
      connection.off('current users', updateUsers);
      connection.off('playback_update', refresh);
      connection.off('queue_update', refresh);
      connection.off('room song', refresh);
      connection.off('user status', status);
      connection.disconnect();
    };
  }, [roomId, isDemo, user]);

  // Keep local audio aligned with shared room state after remote play, pause, seek, or skip.
  useEffect(() => {
    let cancelled = false;
    const synchronizeAudio = async () => {
      try {
        const audioState = localAudio.getState();
        if (soundEnabled && room?.playback?.isPlaying && currentTrack) {
          if (audioState.trackId !== currentTrack.id) {
            await localAudio.play(currentTrack, room.playback.positionMs);
          } else if (Math.abs(audioState.positionMs - room.playback.positionMs) > 1500) {
            await localAudio.seek(room.playback.positionMs);
            await localAudio.resume();
          } else if (!audioState.isPlaying) {
            await localAudio.resume();
          }
        } else {
          localAudio.pause();
        }
      } catch (error) {
        if (!cancelled) setMessage(error.message || 'Audio playback was blocked. Press Audio on and try again.');
      }
    };
    synchronizeAudio();
    return () => { cancelled = true; };
  }, [soundEnabled, room?.playback?.isPlaying, room?.playback?.updatedAt, currentTrack?.id]);

  useEffect(() => { localAudio.setVolume(volume); }, [volume]);

  useEffect(() => {
    localAudio.onTimeUpdate(ms => { if (!seeking) setProgress(ms); });
    localAudio.onError(error => setMessage(error.message));
    return () => {
      localAudio.onTimeUpdate(null);
      localAudio.onError(null);
    };
  }, [seeking]);

  useEffect(() => {
    if (!soundEnabled || !isHost || !room?.playback?.isPlaying) return undefined;
    localAudio.onEnded(() => skipTrack());
    return () => { localAudio.onEnded(null); };
  }, [soundEnabled, isHost, room?.playback?.isPlaying, currentTrack?.id]);

  const handleKeyDown = event => {
    const isSafe = !/input|textarea|select/i.test(event.target.tagName) && !event.target.isContentEditable;
    if (!isSafe) return;

    let handled = false;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const newProgress = (localAudio.getState().positionMs || progress) + (event.key === 'ArrowLeft' ? -10000 : 10000);
      handleSeek(newProgress, true);
      handled = true;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const newVolume = volume + (event.key === 'ArrowUp' ? 0.05 : -0.05);
      setVolume(Math.max(0, Math.min(1, newVolume)));
      setMessage(`Volume ${Math.round(Math.max(0, Math.min(1, newVolume)) * 100)}%`);
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHost, room, progress, volume, soundEnabled, currentTrack]);

  const announce = eventName => socket?.emit(eventName, { roomId });
  const errorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

  const togglePlayback = async () => {
    if (!isHost || !room || !currentTrack) return;
    const shouldPlay = !room.playback.isPlaying;
    try {
      if (shouldPlay) await localAudio.play(currentTrack, progress);
      else localAudio.pause();
      setSoundEnabled(true);
      const { data } = await API.updatePlayback(roomId, shouldPlay, progress);
      setRoom(data);
      announce('playback_update');
      setMessage(shouldPlay ? 'Playback started.' : 'Playback paused.');
    } catch (error) {
      setMessage(errorMessage(error, 'Could not change playback.'));
    }
  };

  const skipTrack = async () => {
    if (!isHost) return;
    try {
      const { data } = await API.advanceTrack(roomId);
      setRoom(data);
      setProgress(data.playback.positionMs || 0);
      announce('playback_update');
      announce('queue_update');
    } catch (error) {
      setMessage(errorMessage(error, 'Could not advance the queue.'));
    }
  };

  const toggleLike = async () => {
    if (!currentTrack) return;
    try {
      const { data } = await API.updateTrack(roomId, currentTrack.id, liked ? 'unlike' : 'like', user.id);
      setRoom(data);
      announce('queue_update');
    } catch (error) {
      setMessage(errorMessage(error, 'Could not update the like.'));
    }
  };

  const selectTrack = async trackId => {
    try {
      const { data: selectedRoom } = await API.updateNowPlaying(roomId, trackId);
      const selectedTrack = selectedRoom.addedTracks.find(track => track.spotifyId === selectedRoom.currentTrackId)?.metadata;
      if (!selectedTrack) throw new Error('The selected track is unavailable.');

      const { data } = await API.updatePlayback(roomId, true, 0);
      setRoom(data);
      setProgress(0);
      setSoundEnabled(true);
      await localAudio.play(selectedTrack, 0);
      announce('playback_update');
      announce('queue_update');
      setMessage(`Now playing ${selectedTrack.name}.`);
    } catch (error) {
      setMessage(errorMessage(error, 'Could not select the track.'));
    }
  };

  const addTrack = async track => {
    if (!track || !track.id) return;
    try {
      const { data } = await API.addTrack(roomId, track);
      setRoom(data);
      setMessage(`${track.name} added to the shared queue.`);
      announce('queue_update');
    } catch (error) {
      setMessage(errorMessage(error, `${track.name} could not be added.`));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage('Room link copied. Open it in a second tab.');
    } catch (_) {
      setMessage('Copy was blocked. Select the URL from your browser address bar.');
    }
  };

  const toggleSound = async () => {
    try {
      if (soundEnabled) {
        localAudio.pause();
        setSoundEnabled(false);
      } else {
        if (room.playback.isPlaying && currentTrack) await localAudio.play(currentTrack, progress);
        setSoundEnabled(true);
      }
    } catch (error) {
      setMessage(errorMessage(error, 'Audio could not be enabled.'));
    }
  };

  const handleSeek = async (newProgress, fromShortcut = false) => {
    if (!isHost || !currentTrack) {
      if (fromShortcut) setMessage('Only the host can seek the track for the room.');
      return;
    }
    setSeeking(true);
    setProgress(newProgress);
    try {
      await localAudio.seek(newProgress);
      const { data } = await API.updatePlayback(roomId, room.playback.isPlaying, newProgress);
      setRoom(data);
      setProgress(data.playback.positionMs || 0);
      announce('playback_update');
    } catch (error) {
      setMessage(errorMessage(error, 'Could not seek this track.'));
    } finally {
      setSeeking(false);
    }
  };

  const handleVolumeChange = e => setVolume(Number(e.target.value));

  if (!isDemo) return <div className='room-state'><h1>Spotify room</h1><p>This build is configured for Local Demo.</p><a href='/'>Return home</a></div>;
  if (loading) return <div className='room-state'><div className='room-loader' /><h1>Opening room…</h1></div>;
  if (notFound) return <div className='room-state'><Radio size={42} /><h1>Room not found</h1><p>Invalid ID or server restarted.</p><a id='room-not-found-home' href='/home?access_token=dev_mock_token'>Return to Local Demo</a></div>;

  const duration = currentTrack?.duration_ms || 1;

  return (
    <main className='demo-room-page'>
      <nav className='room-nav'>
        <a id='room-back-to-lobby' href='/home?access_token=dev_mock_token' className='room-back'><ArrowLeft size={17} /> Lobby</a>
        <div className='room-brand'><Radio size={18} /> Pulseroom <span>Local Demo</span></div>
        <div className={`room-live is-${connectionState}`}>
          {connectionState === 'disconnected' ? <WifiOff size={15} /> : <span />}
          {connectionState === 'connected' ? `Room ${roomId}` : connectionState === 'connecting' ? 'Connecting…' : 'Disconnected'}
        </div>
      </nav>
      <header className='room-header'>
        <div><p className='room-kicker'>Shared listening session</p><h1>{room.title}</h1><span className={`room-role is-${isHost ? 'host' : 'listener'}`}>{isHost ? 'You are the host' : 'Listening with host controls'}</span></div>
        <div className='room-header-actions'>
          <div className='listener-chip'><Users size={17} /> {roomUsers.length || 1} listening</div>
          <button id='copy-room-link' type='button' onClick={copyLink}><Copy size={17} /> Copy link</button>
        </div>
      </header>
      {connectionState === 'disconnected' && <div className='room-message is-warning' role='alert'><WifiOff size={17} /> Live sync is offline. Check the server or your connection; Pulseroom will retry automatically.</div>}
      {message && <div className='room-message' role='status'>{message}</div>}
      <section className='room-layout'>
        <article className='now-playing-panel'>
          <div className={`album-visual ${room.playback.isPlaying ? 'is-playing' : ''}`}>
            <div className='album-orbit' /><Music2 size={70} />
            <span>{currentTrack ? currentTrack.genre : 'queue complete'}</span>
          </div>
          <div className='player-copy'>
            <div className='playback-label'><span /> {room.playback.isPlaying ? 'Now playing' : 'Ready to play'}</div>
            <h2>{currentTrack?.name || 'End of queue'}</h2>
            <p>{currentTrack?.artists[0] || 'Create another room to restart'}</p>
          </div>
          {currentTrack && <>
            <input
              ref={progressRef}
              type='range'
              className='room-progress'
              min='0'
              max={duration}
              value={Math.min(progress, duration)}
              disabled={!isHost}
              onChange={event => { setSeeking(true); setProgress(Number(event.target.value)); }}
              onMouseUp={event => handleSeek(Number(event.currentTarget.value))}
              onTouchEnd={event => handleSeek(Number(event.currentTarget.value))}
              onKeyUp={event => handleSeek(Number(event.currentTarget.value))}
              aria-label='Track progress'
            />
            <div className='room-times'><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
            <div className='room-player-controls'>
              <button id='like-current-track' type='button' className={liked ? 'liked' : ''} onClick={toggleLike} aria-label={liked ? 'Unlike track' : 'Like track'}><Heart size={20} fill={liked ? 'currentColor' : 'none'} /></button>
              <button id='toggle-room-playback' type='button' className='primary-play' onClick={togglePlayback} disabled={!isHost} aria-label={room.playback.isPlaying ? 'Pause' : 'Play'}>{room.playback.isPlaying ? <Pause size={25} fill='currentColor' /> : <Play size={25} fill='currentColor' />}</button>
              <button id='skip-room-track' type='button' onClick={skipTrack} disabled={!isHost} aria-label='Next track'><SkipForward size={21} /></button>
            </div>
          </>}
          <div className='audio-note'>
            <button id='enable-local-sound' type='button' onClick={toggleSound}>{soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}<span>{soundEnabled ? 'Audio on' : 'Audio off'}</span></button>
            <div className='volume-wrap'>
              <Volume2 size={16} />
              <input id='volume-slider' type='range' min='0' max='1' step='0.05' value={volume} onChange={handleVolumeChange} aria-label='Volume' />
            </div>
            <span className='host-hint'>{isHost ? 'Host · ←/→ seek 10s · ↑/↓ volume 5%' : 'Listener · ↑/↓ volume 5% · host controls seeking'}</span>
          </div>
        </article>
        <aside className='queue-panel'>
          <div className='queue-heading'><div><p className='room-kicker'>Add music</p><h2>Shared queue</h2></div><span>{room.addedTracks.length} tracks</span></div>
          <TrackSearch onSelect={addTrack} />
          <ol className='queue-list'>
            {room.addedTracks.map((item, index) => (
              <li key={item._id} className={`${item.nowPlaying ? 'current' : ''} ${item.played ? 'played' : ''}`}>
                <button type='button' className='queue-item-button' onClick={() => selectTrack(item.spotifyId)} disabled={item.nowPlaying} aria-label={`Play ${item.metadata?.name}`}>
                  <span className='queue-index'>{String(index + 1).padStart(2, '0')}</span>
                  <span className='queue-track'><strong>{item.metadata?.name || item.info.split(' - ')[0]}</strong><small>{item.metadata?.artists[0] || item.info.split(' - ')[1]}</small></span>
                  <span className='queue-state'>{item.nowPlaying ? <Radio size={16} /> : item.played ? 'Played' : formatTime(item.metadata?.duration_ms)}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
};

export default Room;
