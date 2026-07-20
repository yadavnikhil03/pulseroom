const router = require('express').Router();
const spotifyRoutes = require('./spotify');
const roomRoutes = require('./rooms');

const jamendoRoutes = require('./jamendo');

router.use('/spotify', spotifyRoutes);
router.use('/rooms', roomRoutes);
router.use('/jamendo', jamendoRoutes);

module.exports = router;
