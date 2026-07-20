import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import './style.css';
import API from '../../utils/API';
import localAudio from '../../utils/localAudio';

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const TrackSearch = props => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  const searchTracks = useCallback(async () => {
    const normalized = debouncedQuery.trim().toLowerCase();
    if (normalized.length < 2) {
      setResults([]);
      setMessage('');
      return;
    }
    const localResults = localAudio.getCatalogue().filter(track => (
      `${track.name} ${track.artists.join(' ')} ${track.genre}`.toLowerCase().includes(normalized)
    ));
    setResults(localResults);
    setMessage(localResults.length ? 'Local library results' : 'Searching the optional online library…');
    setBusy(true);
    try {
      const { data } = await API.searchTracks(debouncedQuery);
      const remoteResults = (data.results || []).filter(remote => !localResults.some(local => local.id === remote.id));
      setResults([...localResults, ...remoteResults]);
      if (data.message) setMessage(data.message);
      else if (remoteResults.length) setMessage(`${localResults.length} local · ${remoteResults.length} online`);
    } catch (error) {
      setResults(localResults);
      setMessage(localResults.length ? 'Online search unavailable · showing local library' : 'Online search unavailable.');
    } finally {
      setBusy(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    searchTracks();
  }, [searchTracks]);

  const handleTrackSelection = async track => {
    try {
      await props.onSelect(track);
      setQuery('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not add this track.');
    }
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setMessage('');
  };

  return (
    <div>
      <Form onSubmit={e => e.preventDefault()}>
        <InputGroup>
          <div className='queue-search-wrap'>
            <Search size={17} />
            <FormControl
              className="track-input"
              onChange={e => setQuery(e.target.value)}
              value={query}
              placeholder="Search for music to add"
              aria-describedby="track-search-input"
              autoComplete='off'
            />
            {query && <button type='button' className='clear-search' onClick={clear}><X size={16} /></button>}
          </div>
        </InputGroup>
      </Form>
      {query && (
        <ListGroup className="track-dropdown" variant="flush">
          {busy && <ListGroup.Item className="search-status">Searching…</ListGroup.Item>}
          {message && <ListGroup.Item className="search-status error-message">{message}</ListGroup.Item>}
          {!busy && !results.length && debouncedQuery.length > 1 && <ListGroup.Item className="search-status">No tracks found for “{debouncedQuery}”.</ListGroup.Item>}
          {results.map(track => (
            <ListGroup.Item
              action
              className="track-dropdown-item"
              key={track.id}
              onClick={() => handleTrackSelection(track)}>
              <img src={track.image} alt={track.name} className='search-result-art' />
              <span>
                <strong>{track.name}</strong>
                <small>{track.artists[0]}</small>
              </span>
              <Plus size={17} />
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default TrackSearch;
