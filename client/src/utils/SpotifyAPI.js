import axios from 'axios';

const mockResponse = (data) => Promise.resolve({ data });

export default {
	getUserData: token => {
		if (token === 'dev_mock_token') {
			return mockResponse({
				id: 'dev123',
				display_name: 'Admin User',
				external_urls: { spotify: '' },
				images: [{ url: '/images/icons/pulseroom-logo.svg' }]
			});
		}
		return axios({
			method: 'GET',
			url: 'https://api.spotify.com/v1/me',
			headers: {
				Authorization: 'Bearer ' + token
			}
		});
	},
	getUserPlaylists: (token, limit) => {
		if (token === 'dev_mock_token') {
			return mockResponse({
				items: [
					{ id: 'mock1', name: 'Chill Vibes (Mock)', images: [{ url: '/images/icons/pulseroom-logo.svg' }] },
					{ id: 'mock2', name: 'Workout Mix (Mock)', images: [{ url: '/images/icons/pulseroom-logo.svg' }] },
					{ id: 'mock3', name: 'Late Night (Mock)', images: [{ url: '/images/icons/pulseroom-logo.svg' }] },
					{ id: 'mock4', name: 'Top 50 (Mock)', images: [{ url: '/images/icons/pulseroom-logo.svg' }] }
				]
			});
		}
		return axios({
			method: 'GET',
			url: `https://api.spotify.com/v1/me/playlists?limit=${limit}`,
			headers: {
				Authorization: 'Bearer ' + token
			}
		})
	},
	getUserQueueData: token => {
		if (token === 'dev_mock_token') {
			return mockResponse({
				is_playing: true,
				item: {
					name: 'Mock Track',
					album: { 
						images: [{ url: '/images/icons/pulseroom-logo.svg' }],
						artists: [{ name: 'Mock Artist' }]
					},
					duration_ms: 180000
				},
				progress_ms: 60000
			});
		}
		return axios({
			method: 'GET',
			url: 'https://api.spotify.com/v1/me/player',
			headers: {
				Authorization: 'Bearer ' + token
			}
		});
	},
	addTrackToQueue: (token, trackId) => {
		if (token === 'dev_mock_token') return mockResponse({ success: true });
		return axios({
			method: 'POST',
			url: `https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${trackId}`,
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
	},
	playPausePlayback: (action, token) => {
		if (token === 'dev_mock_token') return mockResponse({ success: true });
		return axios({
			method: 'PUT',
			url: `https://api.spotify.com/v1/me/player/${action}`,
			headers: {
				Authorization: 'Bearer ' + token,
				'Content-Type': 'application/json'
			}
		});
	},
	nextPlaybackTrack: token => {
		if (token === 'dev_mock_token') return mockResponse({ success: true });
		return axios({
			method: 'POST',
			url: 'https://api.spotify.com/v1/me/player/next',
			headers: {
				Authorization: 'Bearer ' + token,
				'Content-Type': 'application/json'
			}
		});
	},
	trackSearch: (token, track) => {
		if (token === 'dev_mock_token') {
			return mockResponse({
				tracks: {
					items: [
						{
							id: 'mock_t1',
							name: 'Search Result 1',
							album: { images: [{ url: '/images/icons/pulseroom-logo.svg' }] },
							artists: [{ name: 'Artist 1' }],
							duration_ms: 200000
						},
						{
							id: 'mock_t2',
							name: 'Search Result 2',
							album: { images: [{ url: '/images/icons/pulseroom-logo.svg' }] },
							artists: [{ name: 'Artist 2' }],
							duration_ms: 210000
						}
					]
				}
			});
		}
		return axios({
			method: 'GET',
			url: `https://api.spotify.com/v1/search?q=${track}&type=track&limit=20`,
			headers: {
				Authorization: 'Bearer ' + token
			}
		});
	},
	getPlaylistTracks: (token, playlistId) => {
		if (token === 'dev_mock_token') {
			return mockResponse({
				items: [
					{
						track: {
							id: 'mock_pt1',
							name: 'Mock Playlist Track 1',
							album: { images: [{ url: '/images/icons/pulseroom-logo.svg' }] },
							artists: [{ name: 'Artist 1' }],
							duration_ms: 200000
						}
					},
					{
						track: {
							id: 'mock_pt2',
							name: 'Mock Playlist Track 2',
							album: { images: [{ url: '/images/icons/pulseroom-logo.svg' }] },
							artists: [{ name: 'Artist 2' }],
							duration_ms: 180000
						}
					}
				]
			});
		}
		return axios({
			method: 'GET',
			url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
			headers: {
				Authorization: 'Bearer ' + token
			}
		});
	}
};
