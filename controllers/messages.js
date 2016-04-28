var models = require('../models/models');


exports.delete = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    models.message.remove({
            _id: req.params.message_id,
            to_node_id: req.header(node_id_header)
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

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    models.message.remove({to_node_id: req.header(node_id_header)},
        function (err, results) {
            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};


/// todo test it.
exports.update = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];

    models.message.update({_id: req.params.message_id, to_node_id: req.header(node_id_header)},
        req.body,
        {runValidators: true, multi: false, upsert: true},
        function (err, results) {

            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};

/// todo test it.
exports.updateMany = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];

    models.message.update({to_node_id: req.header(node_id_header)},
        req.body,
        {runValidators: true, multi: true, upsert: true},
        function (err, results) {

            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};

exports.show = function (req, res) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    models.message
        .findOne({to_node_id: req.header(node_id_header), _id: req.params.message_id})
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

exports.obtain = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
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
};

/// TODO test it
exports.create = function (req, res, next) {

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
                if(result != null){
                    res.json(result);
                }else{
                    res.status(404);
                    res.json({"message": "Resource not found."})
                }
            }
        });
};