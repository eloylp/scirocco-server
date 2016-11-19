var express = require('express');
var router = express.Router();
var globalDataSpace = require('../controllers/globalDataSpace');

router.delete('/', globalDataSpace.deleteAll);

module.exports = router;
