var express = require('express');
var router = express.Router();
var batchQueueController = require('../controllers/batchQueue');

router.get('/', batchQueueController.queuePull);
router.post('/', batchQueueController.queuePush);
router.patch('/:batch_id([0-9a-f]+)/ack', batchQueueController.ack);

module.exports = router;
