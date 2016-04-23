var express = require('express');
var router = express.Router();
var jobsController = require('../controllers/jobs');


router.param('jobId', jobsController.load);
router.get('/', jobsController.index);
router.get('/:jobId([0-9a-f]+)', jobsController.show);
router.post('/', jobsController.create);
router.delete('/:jobId([0-9a-f]+)', jobsController.delete);
router.delete('/', jobsController.deleteAll);
router.put('/:jobId([0-9a-f]+)', jobsController.update);


module.exports = router;
