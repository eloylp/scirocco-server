var models = require('../models/models');

exports.load = function (req, res, next, messageId) {
    var node_id_header = req.app.get('config')['dds_node_id_header'];

    var resultCallback = function (err, results) {

        if (results) {
            req.message = results;
            next();
        } else if (err) {
            next(err);
        } else {
            err = new Error("resource not found");
            err.status = 404;
            next(err);
        }
    };

    models.message.findOne({
            _id: messageId,
            from_node_id: req.header(node_id_header)
        },
        resultCallback);
};

exports.delete = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    models.message.remove({
            _id: req.message._id,
            from_node_id: req.header(node_id_header)
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
    models.message.remove({from_node_id: req.header(node_id_header)},
        function (err, results) {
            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};

exports.updatePartial = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];

    models.message.update({_id: req.message._id, from_node_id: req.header(node_id_header)},
        req.body,
        {runValidators: true, upsert: false, multi: false},
        function (err, results) {

            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};

exports.updatePartialMany = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];

    models.message.update({from_node_id: req.header(node_id_header)},
        req.body,
        {runValidators: true, upsert: false, multi: true},
        function (err, results) {

            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};

exports.update = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];

    models.message.update({_id: req.message._id, from_node_id: req.header(node_id_header)},
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

exports.updateMany = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];

    models.message.update({from_node_id: req.header(node_id_header)},
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
    res.json(req.message);
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

    models.message.update({_id: req.message._id, from_node_id: req.header(node_id_header)},
        {status: "processed", processed_time: new Date()},
        {runValidators: true, multi: false, upsert: false},
        function (err, results) {

            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};