const router = require('express').Router();
const isDemoMode = process.env.DEMO_MODE === 'true';
const roomsController = isDemoMode
  ? require('../../controllers/demoRoomsController')
  : require('../../controllers/roomsController');

// ROUTE: /api/rooms
router.route('/').get(roomsController.findAll).post(roomsController.create);

if (isDemoMode) {
  // Demo-only canonical playback endpoints must be declared before '/:id'.
  router.route('/:id/playback').put(roomsController.updatePlayback);
  router.route('/:id/select').put(roomsController.switchTrack);
  router.route('/:id/advance').put(roomsController.advance);
}

// ROUTE: /api/rooms/:roomId/track/:trackId/:updateType
router
  .route('/:roomId/track/:trackId/:updateType')
  .put(roomsController.updateTrack);

// ROUTE: /api/rooms/:roomId/playing/:trackId
router.route('/:roomId/playing/:trackId').put(roomsController.updateNowPlaying);

// ROUTE: /api/rooms/:roomId/progress/:trackId/:progress
router
  .route('/:roomId/progress/:trackId/:progress')
  .put(roomsController.updateSongProgress);

// ROUTE: /api/rooms/:id
router
  .route('/:id')
  .get(roomsController.findByName)
  .put(roomsController.addTrack)
  .delete(roomsController.remove);

module.exports = router;
