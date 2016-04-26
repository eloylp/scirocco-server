var models = require('../models/models');
var uuid = require('node-uuid');


exports.load = function (req, res, next, batchId) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    var resultCallback = function (err, results) {

        if (results) {
            req.batch = results;
            next();
        } else if (err) {
            next(err);
        } else {
            err = new Error("resource not found");
            err.status = 404;
            next(err);
        }
    };

    models.message.find({
            batch_id: batchId,
            from_node_id: req.header(node_id_header)
        }).sort({create_time: -1})
        .exec(resultCallback);

};

exports.create = function(req, res, next){

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    var batch_id = uuid.v4();
    var date = new Date();
    req.body.forEach(function(item, index, array){

        array[index].from_node_id = node_id_header;
        array[index].batch_id = batch_id;
        array[index].status = 'pending';
        array[index].create_time = date;
    });

    models.message.insertMany(req.body, function(err, docs){

        if(err){
            next(err);
        }else{
            res.json({batch_id: batch_id});
        }
    });
};

exports.delete = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    models.message.remove({
            batch_id: req.batch_id,
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

exports.show = function (req, res) {
    res.json(req.batch);
};

exports.obtain = function (req, res, next) {

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
                var batch_id = uuid.v4();
                results.forEach(function (item, index, array) {
                    ids.push(item._id);
                    array[index].status = 'processing';
                    array[index].batch_id = batch_id;
                });

                models.message.update({_id: {$in: ids}, to_node_id: req.header(node_id_header)},
                    {$set: {status: "processing", batch_id: batch_id}}, {multi: true})
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


exports.ack = function (req, res, next) {

    var node_id_header = req.app.get('config')['dds_node_id_header'];
    models.message.update({batch_id: req.body.batch_id, to_node_id: req.header(node_id_header)},
        {$set: {status: "processed", proccesed_time: new Date()}}, {multi: true})
        .exec(function (err, result) {

            if (err) {
                next(err)
            } else {
                res.json(result);
            }
        });
};