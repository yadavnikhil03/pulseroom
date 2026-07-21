const addRoomToURL = roomId => {
  const normalizedRoomId = String(roomId || '').trim();
  if (!normalizedRoomId) return;
  window.location.assign(`/room?id=${encodeURIComponent(normalizedRoomId)}`);
};

const configureSlides = (items, rowLength) => {
  const size = Math.max(1, Number(rowLength) || 1);
  const slides = [];

  for (let index = 0; index < items.length; index += size) {
    slides.push(items.slice(index, index + size));
  }

  return slides;
};

export default { addRoomToURL, configureSlides };
