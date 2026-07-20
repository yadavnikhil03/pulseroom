import React from 'react';
import './style.css';

const Playlist = ({ playlistId, image, name, onSelect }) => (
  <button
    id={`playlist-${playlistId}`}
    className="user-playlist"
    type="button"
    onClick={() => onSelect(playlistId)}
    aria-label={`Start a room with ${name}`}
  >
    <span className="playlist-artwork-wrap">
      <img
        className="playlist-artwork"
        src={image || '/images/icons/pulseroom-logo.svg'}
        alt=""
        loading="lazy"
      />
      <span className="playlist-launch-icon" aria-hidden="true">↗</span>
    </span>
    <span className="playlist-name" title={name}>{name}</span>
    <span className="playlist-action-copy">Start listening room</span>
  </button>
);

export default Playlist;
