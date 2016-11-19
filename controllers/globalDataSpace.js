var models = require('../models/models');

exports.deleteAll = function (req, res, next) {

    models.message.remove({},
        function (err, results) {
            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};