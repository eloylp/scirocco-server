var express = require('express');
var router = express.Router();
var batchController = require('../controllers/batches');

router.get('/', batchController.index);
router.get('/:batch_id([0-9a-f]+)', batchController.show);
router.delete('/:batch_id([0-9a-f]+)', batchController.delete);
router.delete('/', batchController.deleteAll);
router.patch('/:batch_id([0-9a-f]+)', batchController.update);

module.exports = router;