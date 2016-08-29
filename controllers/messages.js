var models = require('../models/models');
var outPutTreatement = require('../models/outputAdapter');


exports.index = function (req, res, next) {

    var node_id_header = req.app.get('config')['from_header'];
    var max_config_limit = req.app.get('config')['max_pull_messages_allowed'];
    var limit = (req.query.limit <= max_config_limit ? req.query.limit : false) || max_config_limit;

    models.message
        .find({$or: [{to_node_id: req.header(node_id_header)}, {from_node_id: req.header(node_id_header)}]})
        .sort({create_time: -1})
        .limit(limit)
        .exec(function (err, result) {
            if (err) {
                next(err);
            }
            if(result.length == 0){
                res.status(204);
                res.end();
            }else{
                res.json(result);
            }
        });
};


exports.update = function (req, res, next) {

    var node_id_header = req.app.get('config')['from_header'];

    models.message.findOneAndUpdate(
        {
            _id: req.params.message_id,
            $or: [{to: req.header(node_id_header)}, {from: req.header(node_id_header)}]
        },
        {data: req.body},
        {runValidators: true, new: true},
        function (err, results) {

            if (err) {
                next(err);
            } else {

                res.status(200);
                outPutTreatement.output(res, results, req.app.get('config')['header_prefix']);
            }
        });
};


exports.show = function (req, res) {

    var node_id_header = req.app.get('config')['from_header'];
    models.message
        .findOne(
            {
                _id: req.params.message_id,
                $or: [{to_node_id: req.header(node_id_header)}, {from_node_id: req.header(node_id_header)}]
            }
        )
        .exec(function (err, result) {
            if (err) {
                next(err);
            }
            if (result != null) {
                res.json(result);
            } else {
                res.status(404);
                res.json({"message": "Resource not found."})
            }
        });
};


exports.delete = function (req, res, next) {

    var node_id_header = req.app.get('config')['from_header'];
    models.message.remove({
            _id: req.params.message_id,
            $or: [{to_node_id: req.header(node_id_header)}, {from_node_id: req.header(node_id_header)}]
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

    var node_id_header = req.app.get('config')['from_header'];
    models.message.remove({$or: [{to_node_id: req.header(node_id_header)}, {from_node_id: req.header(node_id_header)}]},
        function (err, results) {
            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};

