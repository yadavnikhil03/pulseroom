import React, { useState } from 'react';
import hexGen from 'hex-generator';
import { Link } from 'react-router-dom';

import API from '../../utils/API';
import SpotifyAPI from '../../utils/SpotifyAPI';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Alert from 'react-bootstrap/Alert';

import globalUtils from '../../utils/globalUtils';
import utils from './utils';
import './style.css';

const RoomButtons = props => {
	const [input, setInput] = useState('');
	const [showAlert, setShowAlert] = useState(false);

	const syncQueueWithRoomAndJoin = async tracks => {
		try {
			props.renderCenterAlert(props.centerAlertConfig.joinRoom);

			if (tracks && tracks[0]) {
				for await (const track of tracks) {
					await SpotifyAPI.addTrackToQueue(props.token, track.spotifyId);
				}
			}
			props.renderCenterAlert(props.centerAlertConfig.clear);
			globalUtils.addRoomToURL(window.location.href, props.token, input);
		} catch (err) {
			console.log(err);
			props.renderCenterAlert(props.centerAlertConfig.somethingWentWrong);
		}
	};

	const handleJoinRoom = async e => {
		e.preventDefault();

		if (input) {
			const unplayedTracks = await utils.getUnplayedTracks(input);
			unplayedTracks
				? await syncQueueWithRoomAndJoin(unplayedTracks)
				: props.renderCenterAlert(props.centerAlertConfig.noRoomData);
		} else {
			setShowAlert(true);
			setTimeout(() => setShowAlert(false), 3000);
		}
	};

	const handleCreateRoom = async () => {
		try {
			props.renderCenterAlert(props.centerAlertConfig.createRoom);

			const { data } = await API.createRoom(hexGen(16));

			props.renderCenterAlert(props.centerAlertConfig.clear);
			globalUtils.addRoomToURL(window.location.href, props.token, data.room_id);
		} catch (err) {
			console.log(err);
			props.renderCenterAlert(props.centerAlertConfig.somethingWentWrong);
		}
	};

	return (
		<div className="room-command-card">
			<div className="command-header">
				<h3 className="command-title">Collaborative Room Studio ✦</h3>
				<p className="command-desc">Start a fresh listening session instantly or enter a friend's secret code to sync playback.</p>
			</div>

			<div className="command-actions-grid">
				<div className="command-create-col">
					<button
						className="create-room-pill-btn"
						onClick={() => handleCreateRoom()}>
						<span>✦ Create Instant Room</span>
					</button>
					<span className="command-helper">Starts a brand new live broadcast room</span>
				</div>

				<div className="command-divider">
					<span>OR</span>
				</div>

				<div className="command-join-col">
					{props.token ? (
						<Form onSubmit={e => handleJoinRoom(e)} className="join-form-wrapper">
							<div className="join-input-group">
								<input
									className="room-code-input"
									onChange={e => setInput(e.target.value)}
									value={input}
									placeholder="Enter 16-character Room Code..."
								/>
								<button
									type="submit"
									className="join-room-pill-btn">
									Join Room →
								</button>
							</div>
						</Form>
					) : null}
					{showAlert && (
						<div className="room-code-alert">
							⚠️ Please enter a valid 16-character Room Code
						</div>
					)}
					<span className="command-helper">Enter code shared by room host</span>
				</div>
			</div>
		</div>
	);
};

export default RoomButtons;
