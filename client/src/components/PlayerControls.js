import React from 'react';
import { Heart, Pause, Play, SkipForward } from 'lucide-react';
import './PlayerControls.css';

const PlayerControls = ({
  isHost,
  isPlaying,
  liked,
  onTogglePlayback,
  onSkipTrack,
  onToggleLike,
}) => {
  return (
    <div className='room-player-controls'>
      <button
        id='like-current-track'
        type='button'
        className={liked ? 'liked' : ''}
        onClick={onToggleLike}
        aria-label={liked ? 'Unlike track' : 'Like track'}
      >
        <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
      </button>
      <button
        id='toggle-room-playback'
        type='button'
        className='primary-play'
        onClick={onTogglePlayback}
        disabled={!isHost}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause size={25} fill='currentColor' />
        ) : (
          <Play size={25} fill='currentColor' />
        )}
      </button>
      <button
        id='skip-room-track'
        type='button'
        onClick={onSkipTrack}
        disabled={!isHost}
        aria-label='Next track'
      >
        <SkipForward size={21} />
      </button>
    </div>
  );
};

export default PlayerControls;
