const router = require('express').Router();
const authRoutes = require('./auth');
const spotifyRoutes = require('./spotify').router;
const roomRoutes = require('./rooms');
const jamendoRoutes = require('./jamendo');
const audiusRoutes = require('./audius');
const googleRoutes = require('./google');
router.use('/auth', authRoutes);
router.use('/spotify', spotifyRoutes);
router.use('/spotify/proxy', require('./spotifyProxy'));
router.use('/rooms', roomRoutes);
router.use('/jamendo', jamendoRoutes);
router.use('/audius', audiusRoutes);
router.use('/auth/google', googleRoutes);

module.exports = router;
