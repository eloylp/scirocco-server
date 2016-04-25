var express = require('express');
var router = express.Router();
var messagesController = require('../controllers/messages');


router.param('messageId', messagesController.load);
router.get('/', messagesController.obtain);
router.get('/:messageId([0-9a-f]+)', messagesController.show);
router.post('/', messagesController.create);
router.delete('/:messageId([0-9a-f]+)', messagesController.delete);
router.delete('/', messagesController.deleteAll);

// Todo fix this. update can be full or partial and to one document or many.
router.put('/:messageId([0-9a-f]+)', messagesController.update);
router.patch('/:messageId([0-9a-f]+)', messagesController.updatePartial);



module.exports = router;
