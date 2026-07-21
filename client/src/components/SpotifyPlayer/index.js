import { useEffect, useState, useRef } from 'react';
import spotifyAuth from '../../utils/spotifyAuth';
import './style.css';

let sdkLoaded = false;
const sdkPromise = new Promise(resolve => {
  if (window.Spotify) { sdkLoaded = true; resolve(window.Spotify); return; }
  const script = document.createElement('script');
  script.src = 'https://sdk.scdn.co/spotify-player.js';
  script.async = true;
  document.body.appendChild(script);
  window.onSpotifyWebPlaybackSDKReady = () => {
    sdkLoaded = true;
    resolve(window.Spotify);
  };
});

const SpotifyPlayer = ({ roomId, socket, isHost }) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  const playerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const Spotify = await sdkPromise;
        const token = await spotifyAuth.getAccessToken();
        if (!token || cancelled) return;

        const p = new Spotify.Player({
          name: `PulseRoom (${roomId})`,
          getOAuthToken: cb => {
            spotifyAuth.getAccessToken().then(cb).catch(() => {});
          },
          volume: 0.5,
        });

        p.addListener('ready', ({ device_id }) => {
          if (cancelled) return;
          setDeviceId(device_id);
          setIsActive(true);
          setError('');
        });

        p.addListener('not_ready', ({ device_id }) => {
          if (cancelled) return;
          setIsActive(false);
        });

        p.addListener('initialization_error', ({ message }) => {
          if (!cancelled) setError('Spotify SDK init error: ' + message);
        });
        p.addListener('authentication_error', ({ message }) => {
          if (!cancelled) setError('Spotify auth error: ' + message);
        });
        p.addListener('account_error', ({ message }) => {
          if (!cancelled) setError('Spotify account error: ' + message);
        });

        await p.connect();
        if (!cancelled) {
          setPlayer(p);
          playerRef.current = p;
        }
      } catch (err) {
        if (!cancelled) setError('Could not start Spotify player.');
      }
    };

    init();
    return () => { cancelled = true; };
  }, [roomId]);

  return (
    <div className={`spotify-player-bar ${isActive ? 'is-active' : ''}`}>
      {error ? (
        <span className="spotify-player-error">{error}</span>
      ) : !deviceId ? (
        <span className="spotify-player-loading">Connecting Spotify player...</span>
      ) : (
        <>
          <span className={`spotify-player-dot ${isActive ? 'live' : ''}`} />
          <span className="spotify-player-label">
            {isActive ? 'Spotify player ready' : 'Spotify player not active'}
          </span>
          {deviceId && (
            <span className="spotify-player-device-id" title={deviceId}>
              Device: {deviceId.slice(0, 8)}…
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default SpotifyPlayer;
