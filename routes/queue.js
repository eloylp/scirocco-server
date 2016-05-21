var express = require('express');
var router = express.Router();
var queueController = require('../controllers/queue');

router.get('/', queueController.queuePull);
router.post('/', queueController.queuePush);
router.patch('/:message_id([0-9a-f]+)/ack', queueController.ack);

module.exports = router;
