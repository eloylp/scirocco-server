var models = require('../models/models');

exports.load = function (req, res, next, jobId) {

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

    models.message.findById(jobId, resultCallback);
};

exports.delete = function (req, res, next) {

    models.message.remove(req.message, function (err, results) {
        if(err){
            next(err);
        }else{
            res.json(results);
        }
    });
};

exports.deleteAll = function (req, res, next) {

    models.message.remove({}, function (err, results) {
        if(err){
            next(err);
        }else{
            res.json(results);
        }
    });
};

exports.update = function (req, res, next) {

    models.message.update({_id: req.message._id}, req.body, {runValidators: true}, function (err, results) {

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

    var resultCallback = function (err, results) {
        if (err) {
            next(err);
        } else {
            res.json(results);
        }
    };

    models.message.find({}, resultCallback);
};

exports.create = function (req, res, next) {

    var admUser = new models.message(req.body);
    admUser.save(function (err, result) {
        if (err) {
            next(err);
        } else {
            res.header('Location', '/jobs/' + result._id);
            res.status(201).json(result);
        }
    });
};
