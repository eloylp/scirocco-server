var models = require('../models/models');


exports.queuePull = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    models.batch
        .findOneAndUpdate({to_node_id: req.header(node_id_header), status: "pending"},
            {status: "processing"},
            {new: true})
        .sort({create_time: -1})
        .exec(function (err, result) {
            if (err) {
                next(err);
            }
            if(!result){
                res.status(204);
                res.end()
            }else {
                res.json(result);
            }
        });
};

exports.queuePush = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    req.body.from_node_id = req.header(node_id_header);
    var message = new models.batch(req.body);
    message.save(function (err, result) {
        if (err) {
            next(err);
        } else {
            res.header('Location', '/batches/' + result._id);
            res.status(201).json(result);
        }
    });
};


exports.ack = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];

    models.batch.findOneAndUpdate({
            _id: req.params.batch_id, to_node_id: req.header(node_id_header), status: "processing"
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