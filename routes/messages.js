var express = require('express');
var router = express.Router();
var jobsController = require('../controllers/messages');


router.param('messageId', jobsController.load);
router.get('/', jobsController.index);
router.get('/:messageId([0-9a-f]+)', jobsController.show);
router.post('/', jobsController.create);
router.delete('/:messageId([0-9a-f]+)', jobsController.delete);
router.delete('/', jobsController.deleteAll);
router.put('/:messageId([0-9a-f]+)', jobsController.update);


module.exports = router;
