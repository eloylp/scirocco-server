var express = require('express');
var router = express.Router();
var messageQueueController = require('../controllers/messageQueue');

router.get('/', messageQueueController.queuePull);
router.post('/', messageQueueController.queuePush);
router.patch('/:message_id([0-9a-f]+)/ack', messageQueueController.ack);
router.patch('/:group_id([0-9a-f-]+)/ack', messageQueueController.ackGroup);

module.exports = router;
