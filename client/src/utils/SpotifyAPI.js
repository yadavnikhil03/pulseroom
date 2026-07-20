import axios from 'axios';
import localAudio from './localAudio';

const mockResponse = data => Promise.resolve({ data });
const catalogue = localAudio.getCatalogue();

const toTrackResult = track => ({
	...track,
	album: {
		images: [{ url: localAudio.imageFor(track.id) }],
		artists: track.artists.map(name => ({ name })),
	}
});

export default {
	getUserData: token => {
		if (token !== 'dev_mock_token') {
			return axios({
				method: 'GET',
				url: 'https://api.spotify.com/v1/me',
				headers: { Authorization: `Bearer ${token}` }
			});
		}
		return mockResponse({
			id: 'dev123',
			display_name: 'Admin User',
			external_urls: { spotify: '' },
			images: [{ url: '/images/icons/pulseroom-logo.svg' }]
		});
	},

	getUserPlaylists: (token, limit = 4) => {
		if (token !== 'dev_mock_token') {
			return axios({
				method: 'GET',
				url: `https://api.spotify.com/v1/me/playlists?limit=${limit}`,
				headers: { Authorization: `Bearer ${token}` }
			});
		}
		return mockResponse({
			items: [
				{ id: 'synthwave', name: 'Synthwave Hits', images: [{ url: localAudio.imageFor() }] },
				{ id: 'electronic', name: 'Electronic Anthems', images: [{ url: localAudio.imageFor() }] },
				{ id: 'ambient', name: 'Ambient Flow', images: [{ url: localAudio.imageFor() }] },
				{ id: 'chillstep', name: 'Chillstep Mix', images: [{ url: localAudio.imageFor() }] }
			]
		});
	},

	getUserQueueData: token => {
		if (token !== 'dev_mock_token') {
			return axios({
				method: 'GET',
				url: 'https://api.spotify.com/v1/me/player',
				headers: { Authorization: `Bearer ${token}` }
			});
		}
		const track = catalogue[0];
		return mockResponse({
			is_playing: true,
			item: toTrackResult(track),
			progress_ms: 60_000,
		});
	},

	addTrackToQueue: (token, trackId) => {
		if (token !== 'dev_mock_token') {
			return axios({
				method: 'POST',
				url: `https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${trackId}`,
				headers: { Authorization: `Bearer ${token}` }
			});
		}
		return mockResponse({ success: true });
	},

	playPausePlayback: (action, token) => {
		if (token !== 'dev_mock_token') {
			return axios({
				method: 'PUT',
				url: `https://api.spotify.com/v1/me/player/${action}`,
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			});
		}
		return mockResponse({ success: true });
	},

	nextPlaybackTrack: token => {
		if (token !== 'dev_mock_token') {
			return axios({
				method: 'POST',
				url: 'https://api.spotify.com/v1/me/player/next',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			});
		}
		return mockResponse({ success: true });
	},

	trackSearch: (token, query) => {
		if (token !== 'dev_mock_token') {
			return axios({
				method: 'GET',
				url: `https://api.spotify.com/v1/search?q=${query}&type=track&limit=20`,
				headers: { Authorization: `Bearer ${token}` }
			});
		}
		const results = catalogue.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
		return mockResponse({
			tracks: { items: results.map(toTrackResult) }
		});
	},

	getPlaylistTracks: (token, playlistId) => {
		if (token !== 'dev_mock_token') {
			return axios({
				method: 'GET',
				url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
				headers: { Authorization: `Bearer ${token}` }
			});
		}
		const tracks = catalogue.filter(t => t.genre === playlistId);
		return mockResponse({
			items: tracks.map(track => ({ track: toTrackResult(track) }))
		});
	}
};
