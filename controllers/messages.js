var models = require('../models/models');

exports.load = function (req, res, next, messageId) {

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
            from_node_id: req.app.get('config')['dds_node_id_header']
        },
        resultCallback);
};

exports.delete = function (req, res, next) {

    models.message.remove({
            _id: req.message_id,
            from_node_id: req.app.get('config')['dds_node_id_header']
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

    models.message.remove({from_node_id: req.app.get('config')['dds_node_id_header']},
        function (err, results) {
            if (err) {
                next(err);
            } else {
                res.json(results);
            }
        });
};

exports.update = function (req, res, next) {

    models.message.update({_id: req.message._id, from_node_id: req.app.get('config')['dds_node_id_header']},
        req.body,
        {runValidators: true},
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

exports.index = function (req, res, next) {

    // Todo implement limit, change it to in process and serve.
    var max_config_limit = req.app.get('config')['max_pull_messages_allowed'];
    var node_id_header = req.app.get('config')['dds_node_id_header'];
    var limit = (req.query.limit <= max_config_limit ? req.query.limit : false) || max_config_limit;
    models.message
        .find({to_node_id: req.header(node_id_header), status: "pending"})
        //.select("_id data")
        .sort({create_time: -1})
        .limit(limit)
        .exec(function (err, results) {
            if (err) {
                next(err);                
            } else {
                var ids = [];
                results.forEach(function (item) {
                    ids.push(item._id);
                });

                models.message.update({_id: {$in: ids}, to_node_id: req.header(node_id_header)},
                    {$set: {status: "processing"}}, {multi: true})
                    .exec(function (err, result) {

                        if (err) {
                            next(err)
                        } else {
                            res.json(results);
                        }
                    });
            }
        });
};

exports.create = function (req, res, next) {

    req.body.from_node_id = req.app.get('config')['dds_node_id_header'];
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
    // Todo implement this method. It me ack all messages
    // by id and node id .

};
