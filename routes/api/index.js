const router = require('express').Router();
const spotifyRoutes = require('./spotify');
const roomRoutes = require('./rooms');
const jamendoRoutes = require('./jamendo');
const audiusRoutes = require('./audius');

router.use('/spotify', spotifyRoutes);
router.use('/rooms', roomRoutes);
router.use('/jamendo', jamendoRoutes);
router.use('/audius', audiusRoutes);

module.exports = router;
