var models = require('../models/models');
var uuid = require('node-uuid');


exports.queuePull = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header']

    var quantity = parseInt(req.query.quantity);

    if (quantity && quantity > 1) {
        var max_config_limit = req.app.get('config')['max_pull_messages_allowed'];
        var limit = (quantity <= max_config_limit ? quantity : false) || max_config_limit;

        models.message
            .find({to_node_id: req.header(node_id_header), status: "pending"})
            .sort({create_time: -1})
            .limit(limit)
            .exec(function (err, results) {

                if (err) {
                    next(err);
                } else {

                    var ids = [];
                    var group_id = uuid.v4();
                    results.forEach(function (item, index, array) {
                        ids.push(item._id);
                        array[index].status = 'processing';
                        array[index].group_id = group_id;
                    });

                    models.message.update({_id: {$in: ids}, to_node_id: req.header(node_id_header)},
                        {$set: {status: "processing", group_id: group_id}}, {multi: true})
                        .exec(function (err, result) {

                            if (err) {
                                next(err)
                            } else {
                                res.json(results);
                            }
                        });
                }
            });

    } else {

        models.message
            .findOneAndUpdate({to_node_id: req.header(node_id_header), status: "pending"},
                {status: "processing"},
                {new: true})
            .sort({create_time: -1})
            .exec(function (err, result) {
                if (err) {
                    next(err);
                }
                res.json(result);
            });
    }
};

exports.queuePush = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    req.body.from_node_id = req.header(node_id_header);
    var message = new models.message(req.body);
    message.save(function (err, result) {
        if (err) {
            next(err);
        } else {
            res.header('Location', '/messages/' + result._id);
            res.status(201).json(result);
        }
    });
};


exports.ack = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];

    models.message.findOneAndUpdate({
            _id: req.params.message_id, to_node_id: req.header(node_id_header), status: "processing"
        },
        {status: "processed", processed_time: new Date()},
        {runValidators: true, multi: false, upsert: false, new: true},
        function (err, result) {

            if (err) {
                next(err);
            } else {
                if (result != null) {
                    res.json(result);
                } else {
                    res.status(404);
                    res.json({"message": "Resource not found."})
                }
            }
        });
};


exports.ackGroup = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    models.message.update({group_id: req.params.group_id, to_node_id: req.header(node_id_header)},
        {$set: {status: "processing"}}, {multi: true})
        .exec(function (err, result) {

            if (err) {
                next(err)
            } else {
                res.json(result);
            }
        });
};