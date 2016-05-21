var express = require('express');
var router = express.Router();
var messagesController = require('../controllers/messages');


router.get('/', messagesController.index);
router.get('/:message_id([0-9a-f]+)', messagesController.show);
router.post('/', messagesController.create);
router.delete('/:message_id([0-9a-f]+)', messagesController.delete);
router.delete('/', messagesController.deleteAll);
router.patch('/:message_id([0-9a-f]+)', messagesController.update);

module.exports = router;
