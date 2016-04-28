var express = require('express');
var router = express.Router();
var batchController = require('../controllers/batches');

router.post('/', batchController.create);
router.get('/', batchController.obtain);
router.get('/:batch_id([0-9a-f-]+)', batchController.show);

/// Todo think about this, is an action it can be unnecesary. patch for a specifed batch may cover it:
router.patch('/ack/:batch_id([0-9a-f-]+)', batchController.ack);

module.exports = router;