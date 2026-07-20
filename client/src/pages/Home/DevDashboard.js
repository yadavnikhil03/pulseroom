import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, Headphones, Link2, LogIn, Music2, Radio, RefreshCw, Users } from 'lucide-react';
import API from '../../utils/API';
import './dev-style.css';

const collections = [
  { id: 'electronic', name: 'Electric Current', count: 7, accent: '#edff73', description: 'Driving rhythms and after-dark momentum.' },
  { id: 'world', name: 'Global Frequencies', count: 4, accent: '#ff8a67', description: 'A cross-city mix built for discovery.' },
  { id: 'ambient', name: 'Ambient Horizons', count: 4, accent: '#8ea1ff', description: 'Spacious textures for a slower shared pulse.' }
];

const ROOM_ID_PATTERN = /^[A-Z0-9_-]{3,20}$/;
const normalizeRoomId = value => String(value || '').trim().toUpperCase();
const sanitizeRoomId = value => normalizeRoomId(value).replace(/[^A-Z0-9_-]/g, '').slice(0, 20);
const roomUrl = roomId => `${window.location.origin}/room?access_token=dev_mock_token&room_id=${roomId}`;
const makeRoomId = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const roomIdFromInvite = value => {
  const input = String(value || '').trim();
  if (!input) return '';
  try {
    const parsed = new URL(input);
    return normalizeRoomId(parsed.searchParams.get('room_id'));
  } catch (error) {
    return normalizeRoomId(input);
  }
};

const copyValue = async (value, successMessage) => {
  try {
    await navigator.clipboard.writeText(value);
    return { copied: true, message: successMessage };
  } catch (error) {
    window.prompt('Copy this value:', value);
    return { copied: false, message: 'Could not copy automatically. See prompt.' };
  }
};

const DevDashboard = ({ user }) => {
  const [roomInput, setRoomInput] = useState('');
  const [rooms, setRooms] = useState([]);
  const [createdRoom, setCreatedRoom] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [roomName, setRoomName] = useState('');
  const [draftRoomId, setDraftRoomId] = useState(makeRoomId());
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

  const openRoomSetup = collectionId => {
    const collection = collections.find(item => item.id === collectionId);
    setSelectedCollection(collectionId);
    setRoomName(collection?.name || 'My Pulseroom');
    setDraftRoomId(makeRoomId());
    setCreatedRoom('');
    setMessage('');
    window.requestAnimationFrame(() => document.getElementById('room-setup-name')?.focus());
  };

  const createRoom = async event => {
    event.preventDefault();
    if (!selectedCollection) return;

    const title = roomName.trim();
    const roomId = normalizeRoomId(draftRoomId);
    if (title.length < 2) {
      setMessageType('error');
      setMessage('Give your room a name with at least 2 characters.');
      return;
    }
    if (!ROOM_ID_PATTERN.test(roomId)) {
      setMessageType('error');
      setMessage('Room ID must be 3–20 letters, numbers, dashes, or underscores.');
      return;
    }

    setBusyAction('create-room');
    setMessage('');
    try {
      const { data } = await API.createRoom(roomId, selectedCollection, { title });
      const finalRoomId = data.room_id;
      setCreatedRoom(finalRoomId);
      const { copied, message: copyMessage } = await copyValue(finalRoomId, 'Room ID copied. Share it with another listener.');
      setMessageType('success');
      setMessage(copied ? `“${title}” is live! ${copyMessage}` : `“${title}” is live! Copy the Room ID below.`);
      await refreshRooms();
    } catch (error) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Could not create the room. Make sure the local server is running.');
    } finally {
      setBusyAction('');
    }
  };

  const joinRoom = async (event, inviteValue = roomInput) => {
    event?.preventDefault();
    const roomId = roomIdFromInvite(inviteValue);
    if (!ROOM_ID_PATTERN.test(roomId)) {
      setMessageType('error');
      setMessage('Enter a valid invite link or Room ID.');
      return;
    }
    setBusyAction('join');
    setMessage('');
    try {
      await API.getTracks(roomId);
      window.location.assign(roomUrl(roomId));
    } catch (error) {
      setMessageType('error');
      setMessage('This Room ID or invite link is invalid, or the room has expired.');
      setBusyAction('');
    }
  };

  const pasteAndJoin = event => {
    const invite = event.clipboardData.getData('text');
    if (!invite) return;
    event.preventDefault();
    setRoomInput(invite);
    joinRoom(null, invite);
  };

  const copyRoom = roomId => copyValue(roomUrl(roomId), 'Invite link copied. Share it with another listener.').then(({ message }) => {
    setMessageType('success');
    setMessage(message);
  });
  const copyRoomId = roomId => copyValue(roomId, 'Room ID copied. Share it with another listener.').then(({ message }) => {
    setMessageType('success');
    setMessage(message);
  });

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
          <div><strong>05</strong><span>Local tracks</span></div>
          <div><strong>Live</strong><span>Socket sync</span></div>
        </div>
      </section>

      {message && <div id='demo-lobby-message' className={`demo-message is-${messageType}`} role='status'>{messageType === 'success' && <Check size={17} />}{message}</div>}

      <section className='demo-workspace' aria-label='Create or join a room'>
        <div className='create-workspace'>
          <div className='workspace-heading'>
            <div><p className='panel-kicker'>01 · Create a room</p><h2 id='collections-heading'>Choose your sound</h2></div>
            <p>Your selected collection is queued automatically.</p>
          </div>
          <div className='demo-lobby-grid' aria-labelledby='collections-heading'>
            {collections.map((collection, index) => (
              <article className={`collection-card ${selectedCollection === collection.id ? 'is-selected' : ''}`} key={collection.id} style={{ '--collection-accent': collection.accent }}>
                <div className='collection-card-top'><span>0{index + 1}</span>{selectedCollection === collection.id ? <Check size={18} /> : <Music2 size={18} />}</div>
                <div className='collection-art' aria-hidden='true'>{[24, 48, 72, 38, 88, 56, 31].map((height, barIndex) => <i key={barIndex} style={{ height: `${height}%` }} />)}</div>
                <div className='collection-copy'><h3>{collection.name}</h3><p>{collection.description}</p><small>{collection.count} generated tracks</small></div>
                <button id={`create-${collection.id}-room`} type='button' onClick={() => openRoomSetup(collection.id)} disabled={Boolean(busyAction)}>
                  <Headphones size={16} /> {selectedCollection === collection.id ? 'Selected · edit setup' : 'Create room'}
                </button>
              </article>
            ))}
          </div>

          {selectedCollection && <form className={`room-setup ${createdRoom ? 'is-created' : ''}`} onSubmit={createRoom} aria-labelledby='room-setup-heading'>
            <div className='room-setup-head'>
              <div><p className='panel-kicker'>Room setup</p><h3 id='room-setup-heading'>{createdRoom ? 'Your room is ready' : 'Make it yours'}</h3></div>
              <span>{collections.find(item => item.id === selectedCollection)?.name}</span>
            </div>
            {!createdRoom ? <>
              <div className='room-setup-fields'>
                <label htmlFor='room-setup-name'><span>Room name</span><input id='room-setup-name' value={roomName} onChange={event => setRoomName(event.target.value)} maxLength='48' placeholder='e.g. Friday Night Mix' /></label>
                <label htmlFor='room-setup-id'><span>Private Room ID</span><div className='room-code-field'><input id='room-setup-id' value={draftRoomId} onChange={event => setDraftRoomId(sanitizeRoomId(event.target.value))} minLength='3' maxLength='20' pattern='[A-Za-z0-9_-]{3,20}' placeholder='e.g. FRIDAY_MIX' autoComplete='off' /><button id='regenerate-room-id' type='button' onClick={() => setDraftRoomId(makeRoomId())} aria-label='Generate a new Room ID' title='Generate another ID'><RefreshCw size={16} /></button></div><small className='room-id-help'>Only you see this during setup. Share it after creation if you want someone to join.</small></label>
              </div>
              <div className='room-setup-footer'><p>Others can join using either your Room ID or the invite link generated after creation.</p><button id='confirm-create-room' type='submit' disabled={busyAction === 'create-room'}>{busyAction === 'create-room' ? <RefreshCw className='is-spinning' size={17} /> : <Radio size={17} />}{busyAction === 'create-room' ? 'Creating room…' : 'Create room'}</button></div>
            </> : <div className='created-room-result'><div className='created-room-details'><strong>{roomName}</strong><div className='created-room-credential'><small>Room ID</small><span>{createdRoom}</span></div><div className='created-room-credential'><small>Invite link</small><span>{roomUrl(createdRoom)}</span></div></div><div className='created-room-actions'><button id='copy-created-room-id' type='button' onClick={() => copyRoomId(createdRoom)}><Copy size={17} /> Copy ID</button><button id='copy-created-room-link' type='button' onClick={() => copyRoom(createdRoom)}><Link2 size={17} /> Copy link</button><a id='enter-created-room-primary' href={roomUrl(createdRoom)}>Enter room <ArrowRight size={17} /></a></div></div>}
          </form>}
        </div>

        <aside className='room-action-stack' aria-label='Join and share actions'>
          <article className='join-panel'>
            <div><p className='panel-kicker'>02 · Join a room</p><h2>Join with ID or link</h2><p>Enter the creator’s Room ID, or paste the full invite link.</p></div>
            <form onSubmit={joinRoom}>
              <label className='sr-only' htmlFor='room-id-input'>Room ID or Pulseroom invite link</label>
              <input id='room-id-input' value={roomInput} onChange={event => setRoomInput(event.target.value)} onPaste={pasteAndJoin} placeholder='ROOM ID OR INVITE LINK' maxLength='240' autoComplete='off' />
              <button id='join-demo-room' type='submit' disabled={Boolean(busyAction)}><LogIn size={17} /> {busyAction === 'join' ? 'Opening…' : 'Join room'}</button>
            </form>
          </article>

          <article className={`share-panel ${createdRoom ? 'is-ready' : ''}`}>
            <div><p className='panel-kicker'>03 · Invite a listener</p><h2>{createdRoom ? `${roomName} is live` : 'Your invite appears here'}</h2><p>{createdRoom ? `Room ID ${createdRoom} · Share the ID or invite link.` : 'Create a room and your private join details will appear here.'}</p></div>
            {createdRoom && <div className='share-actions'>
              <button id='copy-room-link' className='icon-action' type='button' onClick={() => copyRoom(createdRoom)} aria-label='Copy room link'><Copy size={18} /></button>
              <a id='open-created-room' href={roomUrl(createdRoom)}>Enter room <ArrowRight size={17} /></a>
            </div>}
          </article>
        </aside>
      </section>

      <section className='active-rooms' aria-labelledby='active-rooms-heading'>
        <div className='active-rooms-head'><div><p className='panel-kicker'>Live in this session</p><h2 id='active-rooms-heading'>Active rooms</h2></div><button id='refresh-active-rooms' type='button' onClick={() => refreshRooms(true)}><RefreshCw size={16} /> Refresh</button></div>
        {rooms.length ? <div className='room-list'>{rooms.map(room => <a key={room.room_id} href={roomUrl(room.room_id)} className='room-list-item'><span className='room-live-dot' /><div><strong>{room.title || 'Untitled room'}</strong><small>{room.addedTracks?.length || 0} tracks · Open room</small></div><Users size={17} /><ArrowRight size={17} /></a>)}</div> : <div className='rooms-empty'><Link2 size={22} /><p>No active rooms yet. Choose a collection above to create the first one.</p></div>}
      </section>

      <footer className='demo-lobby-footer'><span>Signed in locally as {user?.name || 'Demo listener'}</span><span>Rooms reset when the server stops.</span></footer>
    </main>
  );
};

export default DevDashboard;
