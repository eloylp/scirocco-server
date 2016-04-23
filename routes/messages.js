var express = require('express');
var router = express.Router();
var messagesController = require('../controllers/messages');


router.param('messageId', messagesController.load);
router.get('/', messagesController.index);
router.get('/:messageId([0-9a-f]+)', messagesController.show);
router.post('/', messagesController.create);
router.delete('/:messageId([0-9a-f]+)', messagesController.delete);
router.delete('/', messagesController.deleteAll);
router.put('/:messageId([0-9a-f]+)', messagesController.update);


module.exports = router;
