var express = require('express');
var router = express.Router();
var batchController = require('../controllers/batches');

router.param('batchId', batchController.load);
router.post('/', batchController.create);
router.get('/', batchController.obtain);
router.get('/:batchId([0-9a-f-]+)', batchController.show);
router.patch('/ack/:batchId([0-9a-f-]+)', batchController.ack);

module.exports = router;