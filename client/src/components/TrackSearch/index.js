import React, { useState } from 'react';

import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';

import './style.css';

import SpotifyAPI from '../../utils/SpotifyAPI';
import API from '../../utils/API';

const TrackSearch = props => {
	const [input, setInput] = useState('');
	const [tracks, setTracks] = useState([]);
	const [display, setDisplay] = useState(false);
	const [searchIcon, setSearchIcon] = useState(true);

	const handleTrackSelection = async track => {
		await API.addTrack(
			props.roomId,
			track.id,
			`${track.name} - ${track.artist}`
		);
		await SpotifyAPI.addTrackToQueue(props.token, track.id);
		props.setQueueTrigger(props.queueTrigger ? false : true);
		searchBtnHandler.close();
	};

	const searchBtnHandler = {
		search: async e => {
			e.preventDefault();

			try {
				if (input) {
					const { data } = await SpotifyAPI.trackSearch(props.token, input);
					const tracksArr = [...data.tracks.items].map(track => {
						return {
							artist: track.artists[0].name,
							id: track.id,
							name: track.name
						};
					});

					setTracks(tracksArr);
					setInput('');
					setDisplay(true);
					setSearchIcon(false);
				}
			} catch (err) {
				console.log(err);
			}
		},
		close: e => {
			if (e) e.preventDefault();
			setDisplay(false);
			setTracks([]);
			setSearchIcon(true);
		}
	};

	return (
		<div>
			<Form>
				<InputGroup>
					<button
						className="rounded-right track-search-btn"
						onClick={e =>
							searchIcon || input
								? searchBtnHandler.search(e)
								: searchBtnHandler.close(e)
						}>
						{searchIcon || input ? (
							<i className="fa fa-search" aria-hidden="true"></i>
						) : (
							<i className="fa fa-chevron-down" aria-hidden="true"></i>
						)}
					</button>

					<FormControl
						className="rounded-right track-input"
						onChange={e => setInput(e.target.value)}
						value={input}
						placeholder="Add a Track"
						aria-describedby="basic-addon1"
					/>
				</InputGroup>
			</Form>
			{display ? (
				<div>
					<ListGroup className="track-dropdown" variant="flush">
						{tracks[0]
							? tracks.map(track => (
									<ListGroup.Item
										className="track-dropdown-item"
										key={track.id}
										id={track.id}
										onClick={() => handleTrackSelection(track)}>
										{`${track.name} - ${track.artist}`}
									</ListGroup.Item>
							  ))
							: null}
					</ListGroup>
				</div>
			) : null}
		</div>
	);
};

export default TrackSearch;
