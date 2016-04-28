var express = require('express');
var router = express.Router();
var messagesController = require('../controllers/messages');


router.get('/', messagesController.obtain);
router.get('/:message_id([0-9a-f]+)', messagesController.show);
router.post('/', messagesController.create);
router.delete('/:message_id([0-9a-f]+)', messagesController.delete);
router.delete('/', messagesController.deleteAll);
router.patch('/:messageId([0-9a-f]+)', messagesController.update);
router.patch('/', messagesController.updateMany);

/// Todo think about this, is an action it can be unnecesary. patch for a specifed doc may cover it:
router.patch('/ack/:messageId([0-9a-f]+)', messagesController.ack);


module.exports = router;
