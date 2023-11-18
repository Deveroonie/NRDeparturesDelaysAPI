const express = require('express');

const emojis = require('./emojis');
const departures = require("./departuredelays")
const arrivals = require("./arrivaldelays")
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);
router.use("/departures/", departures)
router.use("/arrivals/", arrivals)
module.exports = router;
