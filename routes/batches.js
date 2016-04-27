var express = require('express');
var router = express.Router();
var batchController = require('../controllers/batches');

router.post('/', batchController.create);
router.get('/', batchController.obtain);
router.get('/:batch_id([0-9a-f-]+)', batchController.show);
router.patch('/ack/:batch_id([0-9a-f-]+)', batchController.ack);

module.exports = router;