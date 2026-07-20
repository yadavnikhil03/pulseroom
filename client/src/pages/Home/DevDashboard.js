import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, Headphones, Link2, LogIn, Music2, Radio, RefreshCw, Users } from 'lucide-react';
import API from '../../utils/API';
import './dev-style.css';

const collections = [
  { id: 'electronic', name: 'Electric Current', count: 3, accent: '#edff73', description: 'Driving rhythms and after-dark momentum.' },
  { id: 'ambient', name: 'Ambient Horizons', count: 3, accent: '#8ea1ff', description: 'Spacious textures for a slower shared pulse.' },
  { id: 'world', name: 'Global Frequencies', count: 3, accent: '#ff8a67', description: 'A cross-city mix built for discovery.' }
];

const normalizeRoomId = value => value.trim().toUpperCase();
const roomUrl = roomId => `${window.location.origin}/room?access_token=dev_mock_token&room_id=${roomId}`;
const makeRoomId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const DevDashboard = ({ user }) => {
  const [roomInput, setRoomInput] = useState('');
  const [rooms, setRooms] = useState([]);
  const [createdRoom, setCreatedRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [busyAction, setBusyAction] = useState('');

  const refreshRooms = async (showConfirmation = false) => {
    try {
      const { data } = await API.getRooms();
      setRooms(Array.isArray(data) ? data : []);
      if (showConfirmation) {
        setMessageType('success');
        setMessage('Room list refreshed.');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('The local server is unavailable. Make sure npm start is running.');
    }
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  const createRoom = async collectionId => {
    setBusyAction(`create-${collectionId}`);
    setMessage('');
    try {
      const roomId = makeRoomId();
      await API.createRoom(roomId, collectionId, {
        title: collections.find(item => item.id === collectionId)?.name
      });
      setCreatedRoom(roomId);
      setRoomInput(roomId);
      setMessageType('success');
      setMessage(`Room ${roomId} is ready. Copy the link or enter the room now.`);
      await refreshRooms();
    } catch (error) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Could not create the room. Please retry.');
    } finally {
      setBusyAction('');
    }
  };

  const joinRoom = async event => {
    event.preventDefault();
    const roomId = normalizeRoomId(roomInput);
    if (!roomId) {
      setMessageType('error');
      setMessage('Enter a room ID first.');
      return;
    }
    setBusyAction('join');
    setMessage('');
    try {
      await API.getTracks(roomId);
      window.location.assign(roomUrl(roomId));
    } catch (error) {
      setMessageType('error');
      setMessage(`Room ${roomId} was not found. Rooms reset when the server restarts.`);
      setBusyAction('');
    }
  };

  const copyRoom = async () => {
    const url = roomUrl(createdRoom);
    try {
      await navigator.clipboard.writeText(url);
      setMessageType('success');
      setMessage('Room link copied. Open it in a second tab to demonstrate live sync.');
    } catch (error) {
      window.prompt('Copy this room link:', url);
    }
  };

  return (
    <main className='demo-lobby'>
      <div className='demo-lobby-ambient' aria-hidden='true' />
      <nav className='demo-nav'>
        <a id='lobby-brand' className='demo-brand' href='/' aria-label='Pulseroom home'>
          <span className='demo-brand-mark'><Radio size={20} /></span>
          Pulseroom
        </a>
        <a id='lobby-about-link' href='/about' className='demo-nav-link'>How it works</a>
      </nav>

      <section className='demo-lobby-hero' aria-labelledby='lobby-heading'>
        <div>
          <p className='demo-eyebrow'>Local listening room</p>
          <h1 id='lobby-heading'>Start a room.<br /><span>Share the pulse.</span></h1>
          <p className='demo-intro'>Pick a sound to create a room, or join one using its ID. Everything you need is right here.</p>
        </div>
        <div className='demo-lobby-summary' aria-label='Lobby summary'>
          <div><strong>{rooms.length}</strong><span>Active {rooms.length === 1 ? 'room' : 'rooms'}</span></div>
          <div><strong>09</strong><span>Local tracks</span></div>
          <div><strong>Live</strong><span>Socket sync</span></div>
        </div>
      </section>

      {message && <div id='demo-lobby-message' className={`demo-message is-${messageType}`} role='status'>{messageType === 'success' && <Check size={17} />}{message}</div>}

      <section className='demo-workspace' aria-label='Create or join a room'>
        <div className='create-workspace'>
          <div className='workspace-heading'>
            <div><p className='panel-kicker'>01 · Create a room</p><h2 id='collections-heading'>Choose your sound</h2></div>
            <p>Three tracks are queued automatically.</p>
          </div>
          <div className='demo-lobby-grid' aria-labelledby='collections-heading'>
            {collections.map((collection, index) => (
              <article className='collection-card' key={collection.id} style={{ '--collection-accent': collection.accent }}>
                <div className='collection-card-top'><span>0{index + 1}</span><Music2 size={18} /></div>
                <div className='collection-art' aria-hidden='true'>{[24, 48, 72, 38, 88, 56, 31].map((height, barIndex) => <i key={barIndex} style={{ height: `${height}%` }} />)}</div>
                <div className='collection-copy'><h3>{collection.name}</h3><p>{collection.description}</p><small>{collection.count} generated tracks</small></div>
                <button id={`create-${collection.id}-room`} type='button' onClick={() => createRoom(collection.id)} disabled={Boolean(busyAction)}>
                  <Headphones size={16} /> {busyAction === `create-${collection.id}` ? 'Creating…' : 'Create room'}
                </button>
              </article>
            ))}
          </div>
        </div>

        <aside className='room-action-stack' aria-label='Join and share actions'>
          <article className='join-panel'>
            <div><p className='panel-kicker'>02 · Join a room</p><h2>Have a room ID?</h2><p>Paste the ID shared by another listener.</p></div>
            <form onSubmit={joinRoom}>
              <label className='sr-only' htmlFor='room-id-input'>Room ID</label>
              <input id='room-id-input' value={roomInput} onChange={event => setRoomInput(event.target.value.toUpperCase())} placeholder='ROOM ID' maxLength='20' autoComplete='off' />
              <button id='join-demo-room' type='submit' disabled={Boolean(busyAction)}><LogIn size={17} /> {busyAction === 'join' ? 'Checking…' : 'Join room'}</button>
            </form>
          </article>

          <article className={`share-panel ${createdRoom ? 'is-ready' : ''}`}>
            <div><p className='panel-kicker'>03 · Invite a listener</p><h2>{createdRoom ? `Room ${createdRoom}` : 'Your invite appears here'}</h2><p>{createdRoom ? 'Copy the invite for another tab, or enter now.' : 'Create a room and this panel becomes your sharing shortcut.'}</p></div>
            {createdRoom && <div className='share-actions'>
              <button id='copy-room-link' className='icon-action' type='button' onClick={copyRoom} aria-label='Copy room link'><Copy size={18} /></button>
              <a id='open-created-room' href={roomUrl(createdRoom)}>Enter room <ArrowRight size={17} /></a>
            </div>}
          </article>
        </aside>
      </section>

      <section className='active-rooms' aria-labelledby='active-rooms-heading'>
        <div className='active-rooms-head'><div><p className='panel-kicker'>Live in this session</p><h2 id='active-rooms-heading'>Active rooms</h2></div><button id='refresh-active-rooms' type='button' onClick={() => refreshRooms(true)}><RefreshCw size={16} /> Refresh</button></div>
        {rooms.length ? <div className='room-list'>{rooms.map(room => <a key={room.room_id} href={roomUrl(room.room_id)} className='room-list-item'><span className='room-live-dot' /><div><strong>{room.title || room.room_id}</strong><small>{room.room_id} · {room.addedTracks?.length || 0} tracks</small></div><Users size={17} /><ArrowRight size={17} /></a>)}</div> : <div className='rooms-empty'><Link2 size={22} /><p>No active rooms yet. Choose a collection above to create the first one.</p></div>}
      </section>

      <footer className='demo-lobby-footer'><span>Signed in locally as {user?.name || 'Demo listener'}</span><span>Rooms reset when the server stops.</span></footer>
    </main>
  );
};

export default DevDashboard;
