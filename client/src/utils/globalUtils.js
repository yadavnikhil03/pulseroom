export default {
	addRoomToURL: (homeUrl, token, hex) => {

		homeUrl === `http://localhost:3000/home?access_token=${token}` ||
		homeUrl === `http://localhost:3000/home?access_token=${token}#_=_`
			? window.location.replace(
					`http://localhost:3000/room?access_token=${token}&room_id=${hex}`
			  )
			: homeUrl ===
					`https://pulseroom-io.herokuapp.com/home?access_token=${token}` ||
			  homeUrl ===
					`https://pulseroom-io.herokuapp.com/home?access_token=${token}#_=_`
			? window.location.replace(
					`http://pulseroom-io.herokuapp.com/room?access_token=${accessToken}&room_id=${hex}`
			  )
			: console.log('URL Error');
	},
	configureSlides: (arr, rowLength) => {
		let allSlides = [];
		let numSlides = arr.length / rowLength;

		for (let slideIndex = 0; slideIndex < numSlides; slideIndex++) {
			let currentSlide = [];

			for (let itemIndex = 0; itemIndex < rowLength; itemIndex++) {
				let playlist = arr[itemIndex];
				if (playlist !== undefined) currentSlide.push(playlist);
			}

			arr.splice(0, rowLength);

			allSlides.push(currentSlide);
		}

		return allSlides;
	}
};
