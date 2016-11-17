var models = require('../models/models');
var outPutTreatement = require('../models/outputAdapter');


exports.index = function (req, res, next) {

    var config = req.app.get('config');
    var node_id_header = config['headers']['node_source'];
    var max_config_limit = config['max_get_all_messages'];
    var limit = parseInt((req.query.limit <= max_config_limit ? req.query.limit : false)) || max_config_limit;

    models.message
        .find({$or: [{node_destination: req.get(node_id_header)}, {node_source: req.get(node_id_header)}]})
        .sort({create_time: -1})
        .limit(limit)
        .exec(function (err, result) {
            if (err) {
                next(err);
            }
            if (result.length == 0) {
                res.status(204);
                res.end();
            } else {
                var resultDump = [];
                var allowedKeys = Object.keys(config.headers);
                allowedKeys.push('payload');

                for (var i = 0, l = result.length; i < l; i++) {
                    msg = result[i].toObject();
                    outPutTreatement.clearUnWantedKeys(msg, allowedKeys);
                    resultDump.push(msg);
                }
                res.json(resultDump);
            }
        });
};


exports.update = function (req, res, next) {

    var node_id_header = req.app.get('config')['headers']['node_source'];

    models.message.findOneAndUpdate(
        {
            _id: req.params.message_id,
            node_source: req.get(node_id_header),
            $or: [{status: 'pending'}, {status: 'scheduled'}]
        },
        {payload: req.body},
        {runValidators: true, new: true},
        function (err, results) {

            if (err) {
                next(err);
            } else {

                res.status(200);
                outPutTreatement.output(res, results);
            }
        });
};


exports.show = function (req, res) {

    var node_id_header = req.app.get('config')['headers']['node_source'];
    models.message
        .findOne(
            {
                _id: req.params.message_id,
                $or: [{node_destination: req.get(node_id_header)}, {node_source: req.get(node_id_header)}]
            }
        )
        .exec(function (err, result) {
            if (err) {
                next(err);
            }
            if (result != null) {
                outPutTreatement.output(res, result);
            } else {
                res.status(404);
                res.json({"message": "Resource not found."})
            }
        });
};


exports.delete = function (req, res, next) {

    var node_id_header = req.app.get('config')['headers']['node_source'];
    models.message.remove({
            _id: req.params.message_id,
            $or: [{node_destination: req.get(node_id_header)}, {node_source: req.get(node_id_header)}]
        },
        function (err, results) {
            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};

exports.deleteAll = function (req, res, next) {

    var node_id_header = req.app.get('config')['headers']['node_source'];
    models.message.remove({$or: [{node_destination: req.get(node_id_header)}, {node_source: req.get(node_id_header)}]},
        function (err, results) {
            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};

