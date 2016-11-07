var models = require('../models/models');
var outputAdapter = require('../models/outputAdapter');
var uuid = require('node-uuid');


exports.queuePull = function (req, res, next) {

    var node_id_header = req.app.get('config')['headers']['from'];
    models.message
        .findOneAndUpdate({to: req.get(node_id_header), status: "pending"},
            {status: "processing"},
            {new: true})
        .sort({create_time: -1})
        .exec(function (err, result) {
            if (err) {
                next(err);
            }
            if (!result) {
                res.status(204);
                res.end();
            } else {
                outputAdapter.output(res, result);
            }
        });

};

exports.queuePush = function (req, res, next) {

    var input_data = {};
    var headers = req.app.get('config')['headers'];

    input_data['to'] = req.get(headers['to']) || null;
    input_data['from'] = req.get(headers['from']) || null;
    input_data['status'] = req.get(headers['status']) || null;
    input_data['data_type'] = req.get(headers['data_type']) || req.get('Content-Type');
    input_data['data'] = req.body;

    var message = new models.message(input_data);
    message.save(function (err, result) {
        if (err) {
            next(err);
        } else {
            res.header('Location', '/messages/' + result._id);
            res.status(201);
            outputAdapter.output(res, result)
        }
    });
};


exports.ack = function (req, res, next) {

    var node_id_header = req.app.get('config')['headers']['from'];

    models.message.findOneAndUpdate({
            _id: req.params.message_id, to: req.get(node_id_header), status: "processing"
        },
        {status: "processed", processed_time: new Date()},
        {runValidators: true, multi: false, upsert: false, new: true},
        function (err, result) {

            if (err) {
                next(err);
            } else {
                if (result != null) {
                    outputAdapter.output(res, result);
                } else {
                    res.status(404);
                    res.json({"message": "Resource not found."})
                }
            }
        });
};

