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

    models.message.findOne({_id: messageId,
        from_node_id:req.app.get('config')['dds_node_id_header']},
        resultCallback);
};

exports.delete = function (req, res, next) {

    models.message.remove({_id: req.message_id,
    from_node_id:req.app.get('config')['dds_node_id_header']},
        function (err, results) {
            if(err){
                next(err);
            }else{
                res.json(results);
            }
    });
};

exports.deleteAll = function (req, res, next) {

    models.message.remove({from_node_id: req.app.get('config')['dds_node_id_header']},
        function (err, results) {
            if(err){
                next(err);
            }else{
                res.json(results);
            }
    });
};

exports.update = function (req, res, next) {

    models.message.update({_id: req.message._id, from_node_id:req.app.get('config')['dds_node_id_header']},
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

    var resultCallback = function (err, results) {
        if (err) {
            next(err);
        } else {
            res.json(results);
        }
    };

    models.message.find({from_node_id: req.app.get('config')['dds_node_id_header']}, resultCallback);
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

exports.ack = function(req, res, next){
    // Todo implement this method. It me ack all messages
     // by id and node id .
     
};
