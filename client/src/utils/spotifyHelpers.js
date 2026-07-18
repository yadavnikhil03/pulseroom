import SpotifyAPI from './SpotifyAPI';

export default {
	user: async token => {
		try {
			const { data } = await SpotifyAPI.getUserData(token);
			if (data && data.id) {
				const currentUser = {
					name: data.display_name || data.id || 'Pulseroom User',
					id: data.id,
					url: data.external_urls ? data.external_urls.spotify : '',
					image:
						data.images && data.images[0]
							? data.images[0].url
							: '/images/icons/pulseroom-logo.svg'
				};

				return currentUser;
			} else return { error: true, message: 'No user ID received from Spotify API' };
		} catch (err) {
			console.error('Spotify getUserData error:', err);
			const status = err?.response?.status;
			const spotifyErr = err?.response?.data?.error;
			const detailedMsg = typeof spotifyErr === 'object' && spotifyErr !== null && spotifyErr.message
				? spotifyErr.message
				: typeof spotifyErr === 'string'
				? spotifyErr
				: err?.response?.data
				? JSON.stringify(err.response.data)
				: err.message || 'Unknown Spotify API Error';
			return { error: true, status, message: `${status ? `[HTTP ${status}] ` : ''}${detailedMsg}` };
		}
	}
};
